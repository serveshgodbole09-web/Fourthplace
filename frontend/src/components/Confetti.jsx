import { useEffect, useRef, useState } from "react";

const COLORS = ["#6f9f7a", "#a9bf8e", "#b49a61", "#47745a", "#e9e1d2", "#234234"];

export default function Confetti({ fire }) {
  const ref = useRef(null);
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!fire) return;
    const next = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 2800);
    return () => clearTimeout(t);
  }, [fire]);

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 w-2 h-3"
          style={{
            left: `${p.x}%`,
            background: p.color,
            animation: `fall 2.4s ${p.delay}s ease-in forwards`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(480deg); opacity: 0.2; } }`}</style>
    </div>
  );
}
