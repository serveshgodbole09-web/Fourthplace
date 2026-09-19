export default function CouponCard({ coupon }) {
  return (
    <article className="paper-card relative overflow-hidden rounded-2xl p-5 border border-dashed border-terracotta/50">
      <div className="absolute -left-3 top-1/2 w-6 h-6 rounded-full bg-cream dark:bg-[#20372b] -translate-y-1/2" />
      <div className="absolute -right-3 top-1/2 w-6 h-6 rounded-full bg-cream dark:bg-[#20372b] -translate-y-1/2" />
      <p className="text-[10px] uppercase tracking-[0.35em] text-terracotta">{coupon.source}</p>
      <h3 className="font-display text-2xl mt-1">{coupon.label}</h3>
      <p className="opacity-80 text-sm mt-1">{coupon.discount}</p>
      <p className="mt-4 font-mono text-lg tracking-widest">{coupon.code}</p>
      {coupon.expires_at && (
        <p className="text-xs mt-2 opacity-60">Until {new Date(coupon.expires_at).toLocaleDateString()}</p>
      )}
    </article>
  );
}
