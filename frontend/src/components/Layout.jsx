import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../auth.jsx";

const links = [
  ["/", "Home"],
  ["/menu", "Menu"],
  ["/about", "About"],
  ["/location", "Find us"],
  ["/feedback", "Guestbook"],
  ["/spin", "Spin"],
];

export default function Layout({ night }) {
  const { customer, logoutCustomer } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className={night ? "dark" : ""}>
      <div className="min-h-screen bg-cream text-ink dark:bg-[#20372b] dark:text-[#f4eee3] transition-colors">
        <div className="grain" />
        <header className="sticky top-0 z-40 backdrop-blur-md bg-cream/75 dark:bg-[#20372b]/80 border-b border-ink/10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center" aria-label="Fourth Place home">
              <img
                src={`/assets/fourthplace-logo-${night ? "night" : "day"}.png`}
                alt="Fourth Place"
                className="h-12 w-auto max-w-[190px] object-contain"
              />
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
              {links.map(([to, label]) => (
                <NavLink key={to} to={to} className="ink-underline" end={to === "/"}>
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              {customer ? (
                <div className="flex items-center gap-2 text-xs">
                  <Link to="/wallet" className="ink-underline">
                    Wallet
                  </Link>
                  <button type="button" onClick={logoutCustomer}>
                    Sign out
                  </button>
                </div>
              ) : (
                <Link to="/register" className="text-xs uppercase tracking-widest">
                  Become a regular
                </Link>
              )}
              <Link to="/admin/login" className="text-[10px] uppercase tracking-widest opacity-50">
                Staff
              </Link>
            </div>
          </div>
          <AnimatePresence>
            {open && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden px-4 pb-4 flex flex-col gap-3"
              >
                {links.map(([to, label]) => (
                  <NavLink key={to} to={to}>
                    {label}
                  </NavLink>
                ))}
                <Link to="/register">Register</Link>
                <Link to="/wallet">Wallet</Link>
                <Link to="/admin/login" className="opacity-60">
                  Staff
                </Link>
              </motion.nav>
            )}
          </AnimatePresence>
        </header>
        <main>
          <Outlet />
        </main>
        <footer className="mt-24 bg-[#20372b] text-[#f4eee3]">
          <div className="max-w-7xl mx-auto px-4 py-16 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:items-start">
              <div>
                <p className="font-display italic text-5xl md:text-6xl leading-none">Fourth Place</p>
                <p className="mt-5 text-xs uppercase tracking-[0.35em] text-terracotta">
                  Café · Gallery · Slow hours
                </p>
                <p className="mt-6 max-w-md text-base leading-relaxed text-[#f4eee3]/85">
                  An elevated dining experience in Satara, bringing together refined ambience, diverse flavours and memorable evenings.
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-terracotta font-medium">Connect</p>
                <div className="mt-6 space-y-4 text-base">
                  <a
                    href={import.meta.env.VITE_INSTAGRAM_URL || "https://www.instagram.com/fourthplace__?utm_source=qr&stkn=NXBzdXN2N2w2dzQz"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 hover:text-terracotta transition-colors"
                  >
                    <span className="text-xl">◎</span>
                    <span>Instagram</span>
                  </a>
                 
                    
                  
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-terracotta font-medium">Visit</p>
                <div className="mt-6 space-y-4 text-base text-[#f4eee3]/90">
                  <p>Fourth Place Art cafe</p>
                  <p>Shaniwar Peth, Rajmachi, Guruwar Peth</p>
                  <p>Satara, Maharashtra 415001</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Cafe Fourth Place, Shaniwar Peth, Rajmachi, Guruwar Peth, Satara, Maharashtra 415001"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-3 rounded-md border border-terracotta bg-terracotta/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#f4eee3] hover:bg-terracotta hover:text-[#20372b] transition-colors"
                >
                  <span>◎</span>
                  <span>Get Directions</span>
                </a>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-terracotta font-medium">Contact</p>
                <div className="mt-6 space-y-4 text-base text-[#f4eee3]/90">
                  <p>8006006989</p>
                </div>
                <div className="mt-8">
                  <p className="text-xs uppercase tracking-[0.35em] text-terracotta font-medium">Hours</p>
                  <p className="mt-4 text-base text-[#f4eee3]/90">11:00 AM — 11:00 PM</p>
                  <p className="mt-2 text-base text-[#f4eee3]/90">Open daily</p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
