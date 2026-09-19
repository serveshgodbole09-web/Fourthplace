import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import PageFade from "../components/PageFade.jsx";

export default function Register() {
  const { loginCustomer, customer } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    newsletter_opt_in: true,
  });
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        const data = await api("/auth/customer/login", { method: "POST", body: { phone: form.phone } });
        loginCustomer(data.access_token, data.customer);
      } else {
        const data = await api("/customers/register", { method: "POST", body: form });
        loginCustomer(data.access_token, data.customer);
      }
      nav("/spin");
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <PageFade>
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="font-display italic text-5xl">{mode === "register" ? "Join the house" : "Welcome back"}</h1>
        <p className="mt-3 text-sm opacity-80">Name, phone, email, birthday. That's the whole membership card.</p>
        {customer && <p className="mt-4 text-sm">Signed in as {customer.name}.</p>}
        <form onSubmit={submit} className="mt-10 space-y-5">
          {mode === "register" && (
            <input
              required
              placeholder="Name"
              className="w-full bg-transparent border-b border-current/20 py-3 outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            required
            placeholder="Phone"
            className="w-full bg-transparent border-b border-current/20 py-3 outline-none"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          {mode === "register" && (
            <input
              required
              type="email"
              placeholder="Email"
              className="w-full bg-transparent border-b border-current/20 py-3 outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          )}
          {mode === "register" && (
            <label className="block text-sm opacity-80">
              Date of birth
              <input
                required
                type="date"
                className="w-full bg-transparent border-b border-current/20 py-3 outline-none"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              />
            </label>
          )}
          {mode === "register" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.newsletter_opt_in}
                onChange={(e) => setForm({ ...form, newsletter_opt_in: e.target.checked })}
              />
              Quiet notes about new hangs and rainy-day pour-overs (email)
            </label>
          )}
          {err && <p className="text-terracotta text-sm">{err}</p>}
          <button type="submit" className="w-full py-3 rounded-full bg-terracotta text-cream uppercase tracking-widest text-sm">
            {mode === "register" ? "Register" : "Sign in"}
          </button>
        </form>
        <button type="button" className="mt-6 text-sm ink-underline" onClick={() => setMode(mode === "register" ? "login" : "register")}>
          {mode === "register" ? "Already a regular? Sign in with phone" : "New here? Register"}
        </button>
      </div>
    </PageFade>
  );
}
