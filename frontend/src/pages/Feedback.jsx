import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import PageFade from "../components/PageFade.jsx";

export default function Feedback() {
  const { customer } = useAuth();
  const [summary, setSummary] = useState({ average: 0, count: 0 });
  const [form, setForm] = useState({ guest_name: "", rating: 5, comment: "", phone: "" });
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/feedback/summary").then(setSummary).catch(() => {});
    if (customer) setForm((f) => ({ ...f, guest_name: customer.name, phone: customer.phone }));
  }, [customer]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    try {
      await api("/feedback", { method: "POST", body: form });
      setOk("Thank you. Your note went to the house, not the feed.");
      const s = await api("/feedback/summary");
      setSummary(s);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <PageFade>
      <div className="max-w-xl mx-auto px-4 py-16">
        <h1 className="font-display italic text-5xl">Guestbook</h1>
        <p className="mt-4 text-sm opacity-80">
          Public house average: <strong>{summary.average || "—"}</strong> / 5 from {summary.count} notes.
          Individual comments are for the team only.
        </p>
        <form onSubmit={submit} className="mt-10 space-y-4">
          <input
            required
            placeholder="Your name"
            className="w-full bg-transparent border-b border-current/20 py-3 outline-none"
            value={form.guest_name}
            onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
          />
          <input
            placeholder="Phone (optional, if you are a regular)"
            className="w-full bg-transparent border-b border-current/20 py-3 outline-none"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="flex gap-2 pt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setForm({ ...form, rating: n })}
                className={`text-2xl ${n <= form.rating ? "text-terracotta" : "opacity-30"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            placeholder="A line for the kitchen or the wall"
            className="w-full bg-transparent border border-current/20 rounded-xl p-3 min-h-[120px] outline-none"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
          {err && <p className="text-terracotta text-sm">{err}</p>}
          {ok && <p className="text-moss text-sm">{ok}</p>}
          <button type="submit" className="px-6 py-3 rounded-full bg-ink text-cream dark:bg-cream dark:text-ink text-xs uppercase tracking-widest">
            Leave a note
          </button>
        </form>
      </div>
    </PageFade>
  );
}
