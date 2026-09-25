"""Email delivery through SMTP or Resend, configured only through environment variables.

DEBUG VERSION: verbose logging added. Secrets are masked in all output.
Quick test from the backend folder:  py email_service.py you@example.com
"""

from __future__ import annotations

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import smtplib
import socket
import sys
import time

import httpx

from config import get_settings

logger = logging.getLogger("fourthplace.email")

# uvicorn does not configure custom loggers, so DEBUG/INFO lines would be
# silently dropped. Attach our own handler so the output always shows up.
if not logger.handlers:
    _handler = logging.StreamHandler(sys.stdout)
    _handler.setFormatter(logging.Formatter("%(asctime)s [EMAIL %(levelname)s] %(message)s"))
    logger.addHandler(_handler)
logger.setLevel(logging.DEBUG)
logger.propagate = False


def _mask(value: str | None) -> str:
    """Show just enough of a secret to tell whether it is set / a placeholder."""
    value = (value or "").strip()
    if not value:
        return "<EMPTY>"
    if len(value) <= 4:
        return f"{value[0]}*** (len={len(value)})"
    return f"{value[:2]}***{value[-2:]} (len={len(value)})"


def debug_email_config() -> None:
    """Log the effective email configuration (secrets masked)."""
    s = get_settings()
    logger.debug("---- email config ----")
    logger.debug("smtp_host      = %r", getattr(s, "smtp_host", None))
    logger.debug("smtp_port      = %r", getattr(s, "smtp_port", None))
    logger.debug("smtp_user      = %r", getattr(s, "smtp_user", None))
    logger.debug("smtp_password  = %s", _mask(getattr(s, "smtp_password", None)))
    logger.debug("resend_api_key = %s", _mask(getattr(s, "resend_api_key", None)))
    logger.debug("email_from     = %r", getattr(s, "email_from", None))
    logger.debug("smtp usable    = %s", _smtp_credentials_configured(s))
    logger.debug("resend usable  = %s", _resend_credentials_configured(s))
    logger.debug("----------------------")


def _smtp_message(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> MIMEMultipart:
    message = MIMEMultipart("alternative")
    settings = get_settings()
    sender = (settings.email_from or "").strip() or f"Fourth Place <{(settings.smtp_user or '').strip()}>"
    logger.debug("SMTP message: From=%r To=%r Subject=%r html=%s", sender, to_email, subject, bool(html_body))
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = to_email
    message.attach(MIMEText(text_body, "plain", "utf-8"))
    if html_body:
        message.attach(MIMEText(html_body, "html", "utf-8"))
    return message


def _send_smtp(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> tuple[bool, str]:
    settings = get_settings()
    user = (settings.smtp_user or "").strip()
    password = (settings.smtp_password or "").strip().replace(" ", "")
    host = (settings.smtp_host or "").strip()
    port_raw = settings.smtp_port
    try:
        port = int(port_raw) if port_raw not in (None, "") else 587
    except (TypeError, ValueError):
        logger.warning("SMTP: invalid port %r, falling back to 587", port_raw)
        port = 587

    logger.info("SMTP: sending to %s via %s:%s as %r", to_email, host, port, user)
    if not host:
        logger.error("SMTP: smtp_host is EMPTY - set SMTP_HOST in backend/.env")
        return False, "SMTP host is not configured"

    server = None
    try:
        # Create without host, enable protocol tracing, THEN connect,
        # so the connection handshake is included in the trace.
        server = smtplib.SMTP_SSL(timeout=15) if port == 465 else smtplib.SMTP(timeout=15)
        server.set_debuglevel(1)  # raw SMTP conversation is printed to stderr

        logger.debug("SMTP: connecting (%s)...", "implicit SSL" if port == 465 else "plain, will STARTTLS")
        code, banner = server.connect(host, port)
        logger.debug("SMTP: connected, code=%s banner=%r", code, banner)

        if port != 465:
            server.ehlo()
            logger.debug("SMTP: starting TLS...")
            server.starttls()
            server.ehlo()
            logger.debug("SMTP: TLS established")

        if user and password:
            logger.debug("SMTP: logging in as %r (password %s)", user, _mask(password))
            server.login(user, password)
            logger.debug("SMTP: login OK")
        else:
            logger.warning("SMTP: no user/password, sending without authentication")

        result = server.send_message(_smtp_message(to_email, subject, text_body, html_body))
        # send_message returns a dict of refused recipients (empty = all accepted)
        logger.debug("SMTP: send_message returned %r", result)
        if result:
            logger.error("SMTP: some recipients refused: %r", result)
            return False, f"Recipients refused: {result}"

        logger.info("SMTP: message accepted for %s", to_email)
        return True, "sent"

    except smtplib.SMTPAuthenticationError as exc:
        logger.error(
            "SMTP AUTH FAILED (%s %r). For Gmail you need a 16-character APP PASSWORD "
            "(2-Step Verification must be on), not your normal password.",
            exc.smtp_code, exc.smtp_error,
        )
        return False, f"Authentication failed: {exc}"
    except smtplib.SMTPSenderRefused as exc:
        logger.error("SMTP sender refused (%s): %r - check EMAIL_FROM matches SMTP_USER", exc.smtp_code, exc.smtp_error)
        return False, str(exc)
    except smtplib.SMTPRecipientsRefused as exc:
        logger.error("SMTP recipients refused: %r", exc.recipients)
        return False, str(exc)
    except smtplib.SMTPConnectError as exc:
        logger.error("SMTP connect error: %s", exc)
        return False, str(exc)
    except (socket.timeout, TimeoutError):
        logger.error("SMTP TIMEOUT connecting to %s:%s - firewall/antivirus/ISP may be blocking the port", host, port)
        return False, "SMTP connection timed out"
    except socket.gaierror as exc:
        logger.error("SMTP DNS failure for host %r: %s - check SMTP_HOST spelling", host, exc)
        return False, str(exc)
    except ConnectionRefusedError as exc:
        logger.error("SMTP connection refused at %s:%s: %s", host, port, exc)
        return False, str(exc)
    except Exception as exc:
        logger.exception("SMTP send failed to %s: %s (%s)", to_email, exc, type(exc).__name__)
        return False, str(exc)
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                try:
                    server.close()
                except Exception:
                    pass


def _send_resend(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> tuple[bool, str]:
    settings = get_settings()
    from_addr = (settings.email_from or "").strip() or "Fourth Place <onboarding@resend.dev>"
    payload = {
        "from": from_addr,
        "to": [to_email],
        "subject": subject,
        "text": text_body,
    }
    if html_body:
        payload["html"] = html_body

    logger.info("RESEND: sending to %s from %r (key %s)", to_email, from_addr, _mask(settings.resend_api_key))
    if "onboarding@resend.dev" in from_addr:
        logger.warning(
            "RESEND: using the onboarding@resend.dev test sender - Resend only delivers "
            "to the email address of your own Resend account until you verify a domain."
        )
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key.strip()}"},
            json=payload,
            timeout=15,
        )
        logger.debug("RESEND: HTTP %s body=%s", response.status_code, response.text[:500])
        if response.is_error:
            logger.error("RESEND: request rejected (HTTP %s): %s", response.status_code, response.text[:500])
            return False, response.text
        msg_id = str(response.json().get("id", "accepted"))
        logger.info("RESEND: accepted, id=%s", msg_id)
        return True, msg_id
    except httpx.HTTPError as exc:
        logger.error("RESEND: request failed for %s: %s (%s)", to_email, exc, type(exc).__name__)
        return False, str(exc)


def _smtp_credentials_configured(settings) -> bool:
    user = (settings.smtp_user or "").strip()
    password = (settings.smtp_password or "").strip().replace(" ", "")
    if not user or not password:
        return False
    if user.lower().startswith("your_") or user.lower() == "your_email@gmail.com":
        return False
    if password.lower().startswith("your_") or password.lower() == "your_gmail_app_password":
        return False
    return True


def _resend_credentials_configured(settings) -> bool:
    key = (settings.resend_api_key or "").strip()
    if not key:
        return False
    if key.lower().startswith("your_") or key.lower() == "your_resend_api_key":
        return False
    return True


def send_email(to_email: str, subject: str, text_body: str) -> tuple[bool, str]:
    return send_email_html(to_email, subject, text_body, "")


def send_email_html(
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str,
) -> tuple[bool, str]:
    """Send an email using either Resend or SMTP.
    - If a Resend API key is configured, use Resend first.
    - Otherwise fall back to SMTP if its credentials are valid.
    Returns (ok, detail) where *ok* is a bool and *detail* is a message.
    """
    logger.debug("send_email_html called: to=%r subject=%r", to_email, subject)
    if not to_email.strip():
        logger.error("Empty recipient address")
        return False, "Invalid email address"

    settings = get_settings()
    debug_email_config()

    # Prefer Resend when the API key looks valid
    if _resend_credentials_configured(settings):
        logger.debug("Provider chosen: Resend (preferred)")
        ok, detail = _send_resend(to_email, subject, text_body, html_body)
        if ok:
            return ok, detail
        # If Resend fails, fall back to SMTP (if possible)
        logger.warning("Resend send failed (%s); attempting SMTP fallback", detail)
        if _smtp_credentials_configured(settings):
            logger.debug("Falling back to SMTP after Resend failure")
            return _send_smtp(to_email, subject, text_body, html_body)
        logger.error("Resend failed and no SMTP credentials available")
        return False, detail

    # No Resend key – try SMTP if configured
    if _smtp_credentials_configured(settings):
        logger.debug("Provider chosen: SMTP (no Resend configured)")
        return _send_smtp(to_email, subject, text_body, html_body)

    # Neither provider is configured
    logger.error(
        "No valid email credentials configured; email NOT sent to %s. "
        "Check backend/.env for SMTP or Resend values.",
        to_email,
    )
    return False, "Email credentials are not configured in backend/.env. Add real SMTP or Resend values."


def send_email_batch(recipients: list[str], subject: str, text_body: str, html_body: str | None = None) -> tuple[int, int]:
    logger.info("Batch send: %d recipient(s)", len(recipients))
    sent = failed = 0
    for index, recipient in enumerate(recipients):
        if index:
            time.sleep(0.6)
        ok, detail = send_email_html(recipient, subject, text_body, html_body or "")
        logger.debug("Batch %d/%d -> %s: %s (%s)", index + 1, len(recipients), recipient, "OK" if ok else "FAIL", detail)
        sent += int(ok)
        failed += int(not ok)
    logger.info("Batch done: sent=%d failed=%d", sent, failed)
    return sent, failed


if __name__ == "__main__":
    # Standalone test:  py email_service.py you@example.com
    target = sys.argv[1] if len(sys.argv) > 1 else ""
    if not target:
        print("Usage: py email_service.py recipient@example.com")
        sys.exit(1)
    debug_email_config()
    ok, detail = send_email_html(target, "Fourth Place test", "Test email body", "<b>Test email body</b>")
    print("RESULT:", ok, detail)