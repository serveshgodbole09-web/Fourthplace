"""Email delivery through SMTP or Resend, configured only through environment variables."""

from __future__ import annotations

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import smtplib
import time

import httpx

from config import get_settings

logger = logging.getLogger("fourthplace.email")


def _smtp_message(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> MIMEMultipart:
    message = MIMEMultipart("alternative")
    settings = get_settings()
    sender = settings.email_from.strip() or f"Fourth Place <{settings.smtp_user.strip()}>"
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = to_email
    message.attach(MIMEText(text_body, "plain", "utf-8"))
    if html_body:
        message.attach(MIMEText(html_body, "html", "utf-8"))
    return message


def _send_smtp(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> tuple[bool, str]:
    settings = get_settings()
    user = settings.smtp_user.strip()
    password = settings.smtp_password.strip().replace(" ", "")
    try:
        if settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()
        if user and password:
            server.login(user, password)
        server.send_message(_smtp_message(to_email, subject, text_body, html_body))
        server.quit()
        return True, "sent"
    except Exception as exc:
        logger.error("SMTP send failed to %s: %s", to_email, exc)
        return False, str(exc)


def _send_resend(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> tuple[bool, str]:
    settings = get_settings()
    payload = {
        "from": settings.email_from.strip() or "Fourth Place <onboarding@resend.dev>",
        "to": [to_email],
        "subject": subject,
        "text": text_body,
    }
    if html_body:
        payload["html"] = html_body
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key.strip()}"},
            json=payload,
            timeout=15,
        )
        if response.is_error:
            return False, response.text
        return True, str(response.json().get("id", "accepted"))
    except httpx.HTTPError as exc:
        logger.error("Email request failed for %s: %s", to_email, exc)
        return False, str(exc)


def _smtp_credentials_configured(settings) -> bool:
    user = settings.smtp_user.strip()
    password = settings.smtp_password.strip().replace(" ", "")
    if not user or not password:
        return False
    if user.lower().startswith("your_") or user.lower() == "your_email@gmail.com":
        return False
    if password.lower().startswith("your_") or password.lower() == "your_gmail_app_password":
        return False
    return True


def _resend_credentials_configured(settings) -> bool:
    key = settings.resend_api_key.strip()
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
    if not to_email.strip():
        return False, "Invalid email address"
    settings = get_settings()
    if _smtp_credentials_configured(settings):
        return _send_smtp(to_email, subject, text_body, html_body)
    if _resend_credentials_configured(settings):
        return _send_resend(to_email, subject, text_body, html_body)
    logger.warning("No valid email credentials configured; email not sent to %s", to_email)
    return False, "Email credentials are not configured in backend/.env. Add real SMTP or Resend values."


def send_email_batch(recipients: list[str], subject: str, text_body: str, html_body: str | None = None) -> tuple[int, int]:
    sent = failed = 0
    for index, recipient in enumerate(recipients):
        if index:
            time.sleep(0.6)
        ok, _ = send_email_html(recipient, subject, text_body, html_body or "")
        sent += int(ok)
        failed += int(not ok)
    return sent, failed
