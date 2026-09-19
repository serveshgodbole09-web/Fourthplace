export default function LoyaltyCard({ card }) {
  const progress = Math.min(100, (card.stamps / card.goal) * 100);
  const rewardText = "free coffee or an art kit";

  return (
    <article className="relative overflow-hidden rounded-2xl p-6 bg-moss text-cream shadow-paper">
      <div className="absolute -right-10 -top-12 w-36 h-36 rounded-full border border-cream/20" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-amber">Fourth Place regulars</p>
            <h2 className="font-display italic text-3xl mt-2">The little loyalty card</h2>
          </div>
          <p className="font-display text-2xl">{card.stamps}/{card.goal}</p>
        </div>
        <div className="grid grid-cols-8 gap-2 mt-7" aria-label={`${card.stamps} of ${card.goal} loyalty stamps collected`}>
          {Array.from({ length: card.goal }, (_, index) => (
            <span key={index} className={`aspect-square rounded-full border border-cream/50 flex items-center justify-center text-xs ${index < card.stamps ? "bg-terracotta text-cream" : "bg-transparent"}`}>
              {index < card.stamps ? "✓" : ""}
            </span>
          ))}
        </div>
        <div className="h-1.5 bg-cream/20 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-terracotta transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm mt-4 opacity-90">
          {card.stamps >= card.goal
            ? `Reward unlocked: ${rewardText}`
            : `${card.goal - card.stamps} more visit${card.goal - card.stamps === 1 ? "" : "s"} to unlock ${rewardText}.`}
        </p>
      </div>
    </article>
  );
}
