import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import SpinWheel from "../components/SpinWheel.jsx";
import CouponCard from "../components/CouponCard.jsx";
import PageFade from "../components/PageFade.jsx";

export default function Spin() {
  const { customer, loginCustomer } = useAuth();
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!customer) return;
    api("/auth/customer/me", { auth: true, role: "customer" })
      .then((profile) => {
        if (profile.has_spun !== customer.has_spun) {
          loginCustomer(localStorage.getItem("fp_customer_token"), { ...customer, ...profile });
        }
      })
      .catch(() => {});
  }, [customer?.id, customer?.has_spun]);

  function onResult(data) {
    setResult(data);
    if (customer) {
      loginCustomer(localStorage.getItem("fp_customer_token"), { ...customer, has_spun: true });
    }
  }

  return (
    <PageFade>
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display italic text-5xl">One spin. That's the house rule.</h1>
        <p className="mt-4 opacity-80 text-sm">
          Weighted toward small kindnesses. Ten percent of the wheel is a free coffee. Enforced on the server,
          not just the pretty canvas.
        </p>
        {!customer ? (
          <Link to="/register" className="inline-block mt-10 px-6 py-3 rounded-full bg-terracotta text-cream text-xs uppercase tracking-widest">
            Register to spin
          </Link>
        ) : (
          <div className="mt-12">
            <SpinWheel onResult={onResult} disabled={customer.has_spun && !result} />

            {result && (
              <div className="max-w-md mx-auto mt-8 rounded-2xl border border-dashed border-terracotta/60 bg-white/30 p-5 text-left">
                <p className="text-[10px] uppercase tracking-[0.35em] text-terracotta">Spin result</p>
                <h3 className="mt-3 font-display text-3xl italic">{result.prize_label}</h3>

                {result.coupon ? (
                  <p className="mt-2 text-sm opacity-80">{result.coupon.discount}</p>
                ) : (
                  <p className="mt-2 text-sm opacity-80">No coupon this round.</p>
                )}

                {result.coupon && (
                  <div className="mt-5">
                    <CouponCard coupon={{ ...result.coupon, source: "spin" }} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PageFade>
  );
}
