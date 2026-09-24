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
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
                  className="h-10 w-auto max-w-[120px] object-contain sm:h-12 sm:max-w-[160px] md:h-14 md:max-w-[210px]"
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
                className="md:hidden ml-auto flex h-8 w-8 items-center justify-center bg-transparent p-0 text-ink transition-colors dark:text-[#f4eee3]"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label="Toggle page menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="flex flex-col items-center justify-center gap-[4px]">
                  <span className="block h-[1.5px] w-5 bg-current" />
                  <span className="block h-[1.5px] w-5 bg-current" />
                  <span className="block h-[1.5px] w-5 bg-current" />
                </span>
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden mt-2 rounded-2xl border border-current/10 bg-[#f7f1e9]/70 p-2 shadow-sm dark:bg-[#2d4939]/80">
                <div className="max-h-52 overflow-y-auto space-y-1.5">
                  {links.map(([to, label]) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/"}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-xl px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors ${
                          isActive
                            ? "bg-ink text-cream dark:bg-[#f4eee3] dark:text-[#20372b]"
                            : "text-ink/75 hover:bg-black/5 dark:text-[#f4eee3]/80 dark:hover:bg-white/5"
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
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
