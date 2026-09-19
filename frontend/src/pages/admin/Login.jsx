import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../auth.jsx";
import PageFade from "../../components/PageFade.jsx";

export default function AdminLogin() {
  const { loginAdmin, admin } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@fourthplace.cafe");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const data = await api("/auth/admin/login", { method: "POST", body: { email, password } });
      loginAdmin(data.access_token, data.admin);
      nav("/admin");
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <PageFade>
      <div className="min-h-screen bg-ink text-cream flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold">Staff only</p>
          <h1 className="font-display italic text-5xl mt-2">The back room</h1>
          {admin && <p className="mt-3 text-sm opacity-70">Already signed in as {admin.email}.</p>}
          <form onSubmit={submit} className="mt-10 space-y-5">
            <input
              required
              type="email"
              placeholder="Email"
              className="w-full bg-transparent border-b border-cream/20 py-3 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              required
              type="password"
              placeholder="Password"
              className="w-full bg-transparent border-b border-cream/20 py-3 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {err && <p className="text-terracotta text-sm">{err}</p>}
            <button type="submit" className="ink-btn w-full py-3 rounded-full bg-terracotta text-cream uppercase tracking-widest text-sm">
              Enter
            </button>
          </form>
          <Link to="/" className="inline-block mt-8 text-sm opacity-70 ink-underline">
            Back to the café
          </Link>
        </div>
      </div>
    </PageFade>
  );
}
