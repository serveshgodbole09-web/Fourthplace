import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../api";
import { useAuth } from "../../auth.jsx";

const TABS = ["Overview", "Guests", "Guestbook", "Offers", "Menu", "Gallery"];
const PIE_COLORS = ["#6f9f7a", "#a9bf8e", "#b49a61", "#47745a", "#e9e1d2", "#234234"];

function authOpts() {
  return { auth: true, role: "admin" };
}

async function uploadImage(file) {
  const body = new FormData();
  body.append("file", file);
  const result = await api("/admin/upload", { method: "POST", body, ...authOpts() });
  return result.url;
}

export default function AdminStudio() {
  const { admin, logoutAdmin } = useAuth();
  const [tab, setTab] = useState("Overview");

  return (
    <div className="min-h-screen bg-[#20372b] text-[#f4eee3] [&_.paper-card]:text-ink">
      <header className="border-b border-cream/10 px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display italic text-2xl">Fourth Place · studio</p>
          <p className="text-xs opacity-60">{admin?.email}</p>
        </div>
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest">
          <Link to="/" className="opacity-70">
            Public site
          </Link>
          <button type="button" onClick={logoutAdmin}>
            Sign out
          </button>
        </div>
      </header>
      <div className="flex flex-wrap gap-2 px-4 pt-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest border ${
              tab === t ? "bg-cream text-ink" : "border-cream/20"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {tab === "Overview" && <Overview />}
        {tab === "Guests" && <Guests />}
        {tab === "Guestbook" && <Guestbook />}
        {tab === "Offers" && <Offers />}
        {tab === "Menu" && <MenuAdmin />}
        {tab === "Gallery" && <GalleryAdmin />}
      </div>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/admin/analytics", authOpts())
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  const pie = useMemo(
    () =>
      Object.entries(data?.prize_breakdown || {}).map(([name, value]) => ({
        name,
        value,
      })),
    [data],
  );

  if (err) return <p className="text-terracotta">{err}</p>;
  if (!data) return <p className="opacity-70">Gathering the house numbers…</p>;

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Regulars" value={data.total_customers} />
        <Stat label="Average rating" value={data.average_rating} />
        <Stat label="Guestbook notes" value={data.feedback_count} />
        <Stat label="Spin wins" value={`${data.spin_wins} / ${data.spin_total}`} />
      </div>
      <div className="grid lg:grid-cols-2 gap-8 mt-10">
        <div className="h-72 paper-card rounded-2xl p-4 text-ink">
          <p className="text-xs uppercase tracking-widest mb-3">Feedback volume</p>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data.feedback_trend}>
              <CartesianGrid stroke="#ffffff22" />
              <XAxis dataKey="date" tick={{ fill: "#f4eee3", fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#f4eee3", fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#a9bf8e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72 paper-card rounded-2xl p-4 text-ink">
          <p className="text-xs uppercase tracking-widest mb-3">Wheel landings</p>
          {pie.length === 0 ? (
            <p className="opacity-60 text-sm mt-8">No spins yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {pie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="paper-card rounded-2xl p-5">
      <p className="text-[10px] uppercase tracking-[0.3em] opacity-70">{label}</p>
      <p className="font-display italic text-4xl mt-2">{value}</p>
    </div>
  );
}

function Guests() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [stampMsg, setStampMsg] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`, authOpts())
        .then(setRows)
        .catch((e) => setErr(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function awardStamp(customerId) {
    setStampMsg("");
    try {
      const result = await api(`/admin/customers/${customerId}/loyalty-stamp`, { method: "POST", ...authOpts() });
      setStampMsg(result.message);
    } catch (e) {
      setStampMsg(e.message);
    }
  }

  async function resetLoyalty(customerId) {
    if (!window.confirm("Reset this full loyalty card and allow one new spin?")) return;
    setStampMsg("");
    try {
      const result = await api(`/admin/customers/${customerId}/loyalty-reset`, { method: "POST", ...authOpts() });
      setStampMsg(result.message);
    } catch (e) {
      setStampMsg(e.message);
    }
  }

  async function deleteGuest(customerId, customerName) {
    if (!window.confirm(`Are you sure you want to delete guest "${customerName}"? This will permanently remove their records.`)) return;
    setStampMsg("");
    try {
      const result = await api(`/admin/customers/${customerId}`, { method: "DELETE", ...authOpts() });
      setStampMsg(result.message || "Guest deleted.");
      setRows((current) => current.filter((guest) => guest.id !== customerId));
    } catch (e) {
      setStampMsg(e.message);
    }
  }

  return (
    <div>
      <input
        placeholder="Search name or phone"
        className="w-full max-w-md bg-transparent border-b border-cream/20 py-3 outline-none"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {err && <p className="text-terracotta mt-3">{err}</p>}
      <div className="overflow-x-auto mt-6">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase tracking-widest opacity-60">
            <tr>
              <th className="py-2">Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Birthday</th>
              <th>Loyalty</th>
              <th>Reset</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-cream/10">
                <td className="py-3">{c.name}</td>
                <td>{c.phone}</td>
                <td className="text-xs opacity-80">{c.email || "—"}</td>
                <td>{c.date_of_birth}</td>
                <td>
                  <button type="button" className="text-xs uppercase tracking-widest text-amber" onClick={() => awardStamp(c.id)}>
                    Stamp
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    disabled={c.loyalty_stamps < c.loyalty_goal}
                    title={c.loyalty_stamps < c.loyalty_goal ? `Needs ${c.loyalty_goal - c.loyalty_stamps} more stamp${c.loyalty_goal - c.loyalty_stamps === 1 ? "" : "s"}` : "Reset full card"}
                    className="text-xs uppercase tracking-widest text-terracotta disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => resetLoyalty(c.id)}
                  >
                    Reset
                  </button>
                </td>
                <td>
                  <button type="button" className="text-xs uppercase tracking-widest text-red-400 hover:text-red-300" onClick={() => deleteGuest(c.id, c.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stampMsg && <p className="text-sm text-gold mt-3">{stampMsg}</p>}
    </div>
  );
}

function Guestbook() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState([]);

  function load() {
    setErr("");
    api("/admin/feedback", authOpts())
      .then((data) => {
        setRows(data);
        setErr("");
      })
      .catch((e) => setErr(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSelect(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function selectAll() {
    if (selected.length === rows.length) {
      setSelected([]);
      return;
    }
    setSelected(rows.map((row) => row.id));
  }

  async function deleteSelected() {
    if (selected.length === 0) return;
    const confirmed = window.confirm(`Delete ${selected.length} guestbook note(s)?`);
    if (!confirmed) return;

    setErr("");

    try {
      await Promise.all(
        selected.map((id) => api(`/admin/feedback/${id}`, { method: "DELETE", ...authOpts() })),
      );
      setSelected([]);
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="space-y-4">
      {err && <p className="text-terracotta">{err}</p>}

      {rows.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-cream/20 pb-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.length === rows.length && rows.length > 0}
              onChange={selectAll}
            />
            Select all
          </label>

          <button
            type="button"
            className="text-xs uppercase tracking-widest text-red-400 disabled:opacity-40"
            disabled={selected.length === 0}
            onClick={deleteSelected}
          >
            Delete selected
          </button>
        </div>
      )}

      {rows.map((f) => (
        <article key={f.id} className="paper-card rounded-2xl p-5 text-ink">
          <div className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(f.id)}
              onChange={() => toggleSelect(f.id)}
              aria-label={`Select note by ${f.guest_name}`}
            />
            <div>
              <p className="font-display text-xl">{f.guest_name}</p>
              <p className="text-gold mt-1">{"★".repeat(f.rating)}</p>
            </div>
          </div>
          <p className="mt-2 opacity-85">{f.comment || "—"}</p>
          <p className="text-xs opacity-50 mt-3">{new Date(f.created_at).toLocaleString()}</p>
        </article>
      ))}
      {rows.length === 0 && <p className="opacity-70">No notes yet.</p>}
    </div>
  );
}

function Offers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", discount: "", scheduled_at: "", send_now: false });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function load() {
    api("/offers", authOpts()).then(setRows).catch((e) => setErr(e.message));
  }

  useEffect(load, []);

  async function create(e) {
    e.preventDefault();
    setMsg("");
    const body = {
      ...form,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    };
    try {
      await api("/offers", { method: "POST", body, ...authOpts() });
      setForm({ title: "", description: "", discount: "", scheduled_at: "", send_now: false });
      setMsg("Offer saved.");
      load();
    } catch (ex) {
      setMsg(ex.message);
    }
  }

  async function launch(id) {
    setMsg("");
    try {
      await api(`/offers/${id}/launch`, { method: "POST", ...authOpts() });
      setMsg("Email batch finished. Check the recipient inboxes.");
      load();
    } catch (ex) {
      setMsg(ex.message);
    }
  }

  async function deleteOffer(id) {
    const confirmed = window.confirm("Delete this offer permanently?");
    if (!confirmed) return;
    setMsg("");
    try {
      await api(`/offers/${id}`, { method: "DELETE", ...authOpts() });
      setMsg("Offer deleted.");
      load();
    } catch (ex) {
      setMsg(ex.message);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      {err && <p className="text-terracotta lg:col-span-2">{err}</p>}
      <form onSubmit={create} className="space-y-4">
        <h2 className="font-display italic text-3xl">Compose an offer</h2>
        <input
          required
          placeholder="Title"
          className="w-full bg-transparent border-b border-cream/20 py-2 outline-none"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          required
          placeholder="Discount line"
          className="w-full bg-transparent border-b border-cream/20 py-2 outline-none"
          value={form.discount}
          onChange={(e) => setForm({ ...form, discount: e.target.value })}
        />
        <textarea
          placeholder="Description for the email"
          className="w-full bg-transparent border border-cream/20 rounded-xl p-3 min-h-[100px] outline-none"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className="block text-sm opacity-80">
          Schedule (optional)
          <input
            type="datetime-local"
            className="w-full bg-transparent border-b border-cream/20 py-2 outline-none"
            value={form.scheduled_at}
            onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.send_now} onChange={(e) => setForm({ ...form, send_now: e.target.checked })} />
          Send now via email
        </label>
        <button type="submit" className="ink-btn px-6 py-3 rounded-full bg-terracotta text-cream text-xs uppercase tracking-widest">
          Save offer
        </button>
        {msg && <p className="text-sm text-gold">{msg}</p>}
      </form>
      <div className="space-y-3">
        {rows.map((o) => (
          <article key={o.id} className="paper-card rounded-2xl p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-display text-xl">{o.title}</p>
                <p className="text-sm opacity-70">{o.discount}</p>
                <p className="text-xs mt-2 uppercase tracking-widest">
                  {o.status} · emails sent {o.emails_sent ?? o.sms_sent ?? 0} · failed {o.emails_failed ?? o.sms_failed ?? 0}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {o.status !== "sent" && (
                  <button type="button" className="text-xs uppercase tracking-widest" onClick={() => launch(o.id)}>
                    Launch
                  </button>
                )}
                <button type="button" className="text-xs uppercase tracking-widest text-red-400" onClick={() => deleteOffer(o.id)}>
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const emptyMenu = {
  name: "",
  description: "",
  category: "beverages",
  price: "",
  image_url: "",
  is_available: true,
  sort_order: 0,
  image_file: null,
};

function MenuAdmin() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyMenu);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    api("/menu/all", authOpts()).then(setRows).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    setMsg("");
    try {
      const imageUrl = form.image_file ? await uploadImage(form.image_file) : form.image_url;
      if (!imageUrl) throw new Error("Choose an image first");
      const body = { ...form, image_url: imageUrl, price: Number(form.price), sort_order: Number(form.sort_order) || 0 };
      delete body.image_file;
      if (editing) await api(`/menu/${editing}`, { method: "PUT", body, ...authOpts() });
      else await api("/menu", { method: "POST", body, ...authOpts() });
      setForm(emptyMenu);
      setEditing(null);
      setMsg("Menu saved.");
      load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function remove(id) {
    await api(`/menu/${id}`, { method: "DELETE", ...authOpts() });
    load();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      {msg && <p className="text-gold lg:col-span-2">{msg}</p>}
      {err && <p className="text-terracotta lg:col-span-2">{err}</p>}
      <form onSubmit={save} className="space-y-3">
        <h2 className="font-display italic text-3xl">{editing ? "Edit item" : "New item"}</h2>
        <input required placeholder="Name" className="w-full bg-transparent border-b border-cream/20 py-2 outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea placeholder="Description" className="w-full bg-transparent border border-cream/20 rounded-xl p-3 outline-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="w-full bg-[#20372b] border border-cream/20 rounded-lg p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="beverages">Beverages</option>
          <option value="food">Food</option>
          <option value="art">Art specials</option>
        </select>
        <input required type="number" step="0.01" placeholder="Price" className="w-full bg-transparent border-b border-cream/20 py-2 outline-none" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <label className="text-sm opacity-80">
          Menu image
          <input required={!form.image_url} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="w-full mt-2 text-sm" onChange={(e) => setForm({ ...form, image_file: e.target.files?.[0] || null })} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
          Available
        </label>
        <button type="submit" className="ink-btn px-6 py-3 rounded-full bg-terracotta text-cream text-xs uppercase tracking-widest">
          {editing ? "Update" : "Add"}
        </button>
      </form>
      <div className="space-y-2">
        {rows.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 paper-card rounded-xl p-3 text-sm">
            <div>
              <p>{item.name}</p>
              <p className="opacity-60 text-xs">
                {item.category} · ₹{item.price} {item.is_available ? "" : "· hidden"}
              </p>
            </div>
            <div className="flex gap-3 text-xs uppercase tracking-widest">
              <button
                type="button"
                onClick={() => {
                  setEditing(item.id);
                  setForm({ ...item, price: String(item.price), image_file: null });
                }}
              >
                Edit
              </button>
              <button type="button" onClick={() => remove(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryAdmin() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title: "", image_url: "", caption: "", sort_order: 0, image_file: null });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    api("/admin/gallery", authOpts()).then(setRows).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  async function add(e) {
    e.preventDefault();
    setMsg("");
    try {
      if (!form.image_file) throw new Error("Choose an image first");
      const imageUrl = await uploadImage(form.image_file);
      await api("/admin/gallery", { method: "POST", body: { ...form, image_url: imageUrl, sort_order: Number(form.sort_order) || 0 }, ...authOpts() });
      setForm({ title: "", image_url: "", caption: "", sort_order: 0, image_file: null });
      setMsg("Image added.");
      load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function remove(id) {
    await api(`/admin/gallery/${id}`, { method: "DELETE", ...authOpts() });
    load();
  }

  return (
    <div>
      {err && <p className="text-terracotta mb-4">{err}</p>}
      {msg && <p className="text-gold mb-4">{msg}</p>}
      <form onSubmit={add} className="grid sm:grid-cols-2 gap-3 max-w-2xl">
        <label className="text-sm opacity-80 sm:col-span-2">
          Gallery image
          <input required type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="w-full mt-2 text-sm" onChange={(e) => setForm({ ...form, image_file: e.target.files?.[0] || null })} />
        </label>
        <input placeholder="Title" className="bg-transparent border-b border-cream/20 py-2 outline-none" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Caption" className="bg-transparent border-b border-cream/20 py-2 outline-none" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
        <button type="submit" className="ink-btn px-6 py-2 rounded-full bg-terracotta text-cream text-xs uppercase tracking-widest">
          Add to gallery
        </button>
      </form>
      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        {rows.map((img) => (
          <figure key={img.id} className="relative">
            <img src={img.image_url} alt={img.title} className="w-full h-40 object-cover rounded-xl" />
            <figcaption className="text-xs mt-1">{img.title}</figcaption>
            <button type="button" className="text-xs uppercase tracking-widest mt-1" onClick={() => remove(img.id)}>
              Delete
            </button>
          </figure>
        ))}
      </div>
    </div>
  );
}
