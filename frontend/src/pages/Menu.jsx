import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api";
import PageFade from "../components/PageFade.jsx";

const TABS = [
  { id: "all", label: "All" },
  { id: "beverages", label: "Beverages" },
  { id: "food", label: "Food" },
  { id: "art", label: "Art specials" },
];

export default function Menu() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("all");
  const menuUrl = typeof window !== "undefined" ? `${window.location.origin}/menu` : "/menu";

  useEffect(() => {
    api("/menu").then(setItems).catch(() => setItems([]));
  }, []);

  const filtered = items.filter((i) => tab === "all" || i.category === tab);

  return (
    <PageFade>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-terracotta">The card</p>
            <h1 className="font-display italic text-5xl mt-2">What we are pouring</h1>
          </div>
          <div className="paper-card p-4 flex items-center gap-4 rounded-xl">
            <QRCodeSVG value={menuUrl} size={72} bgColor="transparent" fgColor="#234234" />
            <p className="text-xs max-w-[10rem] leading-relaxed">Print this on the physical menu. It always opens the live list.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-10">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest border ${
                tab === t.id ? "bg-ink text-cream dark:bg-cream dark:text-ink" : "border-current/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </PageFade>
  );
}

function MenuCard({ item }) {
  const [flipped, setFlipped] = useState(false);
  const imageSrc = item.image_url || "/assets/cafe-hero.webp";

  return (
    <motion.button
      layout
      type="button"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -8, rotateX: 4, rotateY: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="group text-left paper-card rounded-2xl overflow-hidden [transform-style:preserve-3d] shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_18px_35px_rgba(0,0,0,0.14)]"
    >
      <div className="h-44 overflow-hidden bg-ink/5">
        <motion.img
          src={imageSrc}
          alt=""
          onError={(event) => {
            event.currentTarget.src = "/assets/cafe-hero.webp";
            event.currentTarget.onerror = null;
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          whileHover={{ scale: 1.06 }}
        />
      </div>
      <div className="p-5">
        <p className="text-[10px] uppercase tracking-widest text-terracotta">{item.category}</p>
        <h3 className="font-display text-2xl mt-1">{item.name}</h3>
        <p className={`text-sm mt-2 leading-relaxed transition-opacity duration-300 ${flipped ? "opacity-100" : "opacity-70"}`}>
          {item.description}
        </p>
        <p className="mt-4 text-sm">₹{item.price}</p>
      </div>
    </motion.button>
  );
}
