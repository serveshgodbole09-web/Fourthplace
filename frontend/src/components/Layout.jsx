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
          <div className="max-w-6xl mx-auto px-2.5 py-2.5 sm:px-4 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <Link to="/" className="flex items-center shrink-0" aria-label="Fourth Place home">
                <img
                  src={`/assets/fourthplace-logo-${night ? "night" : "day"}.png`}
                  alt="Fourth Place"
                  className="h-8 w-auto max-w-[110px] object-contain sm:h-10 sm:max-w-[150px] md:h-12 md:max-w-[190px]"
                />
              </Link>

              <nav className="hidden md:flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
                {links.map(([to, label]) => (
                  <NavLink key={to} to={to} className="ink-underline" end={to === "/"}>
                    {label}
                  </NavLink>
                ))}
              </nav>

              <div className="hidden md:flex items-center gap-3">
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

              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="md:hidden inline-flex items-center justify-center rounded-full border border-current/15 bg-[#f7f1e9]/80 px-2.5 py-2 text-ink shadow-sm dark:bg-[#2d4939]/80 dark:text-[#f4eee3]"
              >
                <span className="sr-only">Menu</span>
                <span className="flex flex-col gap-1.5">
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                </span>
              </button>
            </div>

            <div className="md:hidden mt-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex min-w-max items-center gap-1.5 pb-0.5">
                {links.map(([to, label]) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] whitespace-nowrap transition-colors ${
                        isActive
                          ? "border-ink bg-ink text-cream dark:border-[#f4eee3] dark:bg-[#f4eee3] dark:text-[#20372b]"
                          : "border-current/10 bg-[#f7f1e9]/60 text-ink/70 dark:bg-[#2d4939]/80 dark:text-[#f4eee3]/80"
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {open && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden border-t border-ink/10 bg-cream/90 px-4 pb-4 pt-3 dark:bg-[#20372b]/95"
              >
                <div className="flex flex-col gap-2.5 text-sm">
                  {links.map(([to, label]) => (
                    <NavLink key={to} to={to} className="rounded-full border border-current/10 px-3 py-2">
                      {label}
                    </NavLink>
                  ))}
                  <Link to="/register" className="rounded-full border border-current/10 px-3 py-2">
                    Register
                  </Link>
                  <Link to="/wallet" className="rounded-full border border-current/10 px-3 py-2">
                    Wallet
                  </Link>
                  <Link to="/admin/login" className="rounded-full border border-current/10 px-3 py-2 opacity-60">
                    Staff
                  </Link>
                </div>
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
