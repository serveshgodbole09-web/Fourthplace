import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import CouponCard from "../components/CouponCard.jsx";
import LoyaltyCard from "../components/LoyaltyCard.jsx";
import PageFade from "../components/PageFade.jsx";

export default function Wallet() {
  const { customer } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [loyalty, setLoyalty] = useState(null);

  useEffect(() => {
    if (!customer) return;
    Promise.allSettled([
      api("/wallet/coupons", { auth: true, role: "customer" }),
      api("/wallet/loyalty", { auth: true, role: "customer" }),
    ]).then(([couponsResult, loyaltyResult]) => {
      if (couponsResult.status === "fulfilled") setCoupons(couponsResult.value);
      else setErr(couponsResult.reason.message);
      if (loyaltyResult.status === "fulfilled") setLoyalty(loyaltyResult.value);
      else if (couponsResult.status === "fulfilled") setErr("Loyalty card is unavailable. Restart the backend to enable it.");
      setLoading(false);
    });
  }, [customer]);

  if (!customer) {
    return (
      <PageFade>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p>Sign in to open your paper wallet.</p>
          <Link to="/register" className="inline-block mt-6 underline">
            Register
          </Link>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display italic text-5xl">{customer.name}'s wallet</h1>
        {err && <p className="mt-4 text-terracotta">{err}</p>}
        {loyalty && <div className="mt-8"><LoyaltyCard card={loyalty} /></div>}
        <div className="grid sm:grid-cols-2 gap-4 mt-10">
          {coupons.map((c) => (
            <CouponCard key={c.id} coupon={c} />
          ))}
          {loading && <p className="opacity-70">Opening your wallet…</p>}
          {!loading && coupons.length === 0 && <p className="opacity-70">Empty for now. Spin the wheel or wait for a birthday.</p>}
        </div>
      </div>
    </PageFade>
  );
}
