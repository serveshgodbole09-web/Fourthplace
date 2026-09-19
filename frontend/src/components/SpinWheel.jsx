import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import Confetti from "./Confetti.jsx";

const FALLBACK = [
  { label: "20% off", code: "off20" },
  { label: "15% off", code: "off15" },
  { label: "10% off", code: "off10" },
  { label: "5% off", code: "off5" },
  { label: "Try the specials", code: "try_again" },
  { label: "Free coffee", code: "free_coffee" },
];

export default function SpinWheel({ onResult, disabled }) {
  const canvasRef = useRef(null);
  const [prizes, setPrizes] = useState(FALLBACK);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/spinwheel/prizes")
      .then(setPrizes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;
    const slice = (Math.PI * 2) / prizes.length;
    ctx.clearRect(0, 0, size, size);
    prizes.forEach((p, i) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle + i * slice, angle + (i + 1) * slice);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#6f9f7a" : "#e9e1d2";
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + i * slice + slice / 2);
      ctx.fillStyle = i % 2 === 0 ? "#f4eee3" : "#234234";
      ctx.font = "600 13px Sora, sans-serif";
      ctx.fillText(p.label, r * 0.28, 4);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#20372b";
    ctx.fill();
  }, [prizes, angle]);

  async function spin() {
    if (spinning || disabled) return;
    setSpinning(true);
    setMessage("");
    try {
      const result = await api("/spinwheel/spin", { method: "POST", auth: true, role: "customer" });
      const idx = Math.max(
        0,
        prizes.findIndex((p) => p.code === result.prize_code),
      );
      const slice = (Math.PI * 2) / prizes.length;
      const start = angle;
      const currentAngle = (start % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const pointerAngle = Math.PI * 1.5;
      const targetSliceCenter = (idx + 0.5) * slice;
      const targetAngle = (pointerAngle - targetSliceCenter + Math.PI * 2) % (Math.PI * 2);
      const delta = (targetAngle - currentAngle + Math.PI * 2) % (Math.PI * 2);

      // Whole number of extra spins only — a fractional value here throws off
      // the final landing angle and causes the wheel to stop on the wrong slice.
      const extraSpins = 5 + Math.floor(Math.random() * 3); // 5, 6, or 7 full turns
      const extraTurns = Math.PI * 2 * extraSpins;

      const end = start + extraTurns + delta;
      const duration = 3800;
      const t0 = performance.now();
      await new Promise((resolve) => {
        const tick = (now) => {
          const t = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setAngle(start + (end - start) * eased);
          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      // Normalize stored angle to avoid unbounded growth over many spins
      setAngle(end % (Math.PI * 2));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (result.prize_code === "free_coffee") setConfetti(true);
      setMessage(result.already_spun ? "Your one spin is already spent." : `You landed on ${result.prize_label}.`);
      onResult?.(result);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSpinning(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Confetti fire={confetti} />
      <div className="relative">
        <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-terracotta z-10" />
        <canvas ref={canvasRef} width={340} height={340} className="w-[min(340px,90vw)] h-auto rounded-full shadow-paper" />
      </div>
      <button
        type="button"
        disabled={spinning || disabled}
        onClick={spin}
        className="relative overflow-hidden px-8 py-3 rounded-full bg-terracotta text-cream uppercase tracking-widest text-sm disabled:opacity-50"
      >
        {spinning ? "The wheel is thinking…" : disabled ? "Already spun" : "Spin the wheel"}
      </button>
      {message && <p className="text-sm italic font-display text-center">{message}</p>}
    </div>
  );
}