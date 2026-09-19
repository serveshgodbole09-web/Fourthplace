import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GalleryMasonry from "../components/GalleryMasonry.jsx";
import { api } from "../api";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [brushColor, setBrushColor] = useState("#20372b");
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState("brush");
  const [rating, setRating] = useState({ average: 0, count: 0 });

  useEffect(() => {
    api("/feedback/summary").then(setRating).catch(() => {});
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-bg",
        { y: 0, scale: 1.08 },
        {
          y: 80,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true },
        },
      );
      gsap.from(".story-line", {
        opacity: 0,
        y: 40,
        stagger: 0.15,
        scrollTrigger: { trigger: storyRef.current, start: "top 75%" },
      });
    });
    return () => ctx.revert();
  }, []);

  function getCanvasPoint(event) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    const ctx = canvas.getContext("2d");
    const point = getCanvasPoint(event);
    if (!point) return;
    drawingRef.current = true;
    lastPointRef.current = point;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : brushColor;
    ctx.lineWidth = tool === "eraser" ? brushSize + 4 : brushSize;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function handlePointerMove(event) {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current) return;
    event.preventDefault();
    const ctx = canvas.getContext("2d");
    const point = getCanvasPoint(event);
    if (!point) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : brushColor;
    ctx.lineWidth = tool === "eraser" ? brushSize + 4 : brushSize;
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function handlePointerUp(event) {
    const canvas = canvasRef.current;
    if (canvas && event?.pointerId !== undefined) {
      canvas.releasePointerCapture?.(event.pointerId);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <PageShell>
      <section ref={heroRef} className="relative min-h-[92vh] overflow-hidden flex items-end">
        <img
          className="hero-bg absolute inset-0 w-full h-full object-cover"
          src="/assets/cafe-hero.png"
          alt="Fourth Place café patio"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20 text-cream flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="uppercase tracking-[0.4em] text-xs"
            >
              Café · Gallery · Slow hours
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-display italic text-5xl md:text-8xl mt-3"
            >
              Fourth Place
            </motion.h1>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 md:mb-2"
          >
            <Link to="/menu" className="bg-terracotta px-6 py-3 rounded-full text-sm uppercase tracking-widest">
              See the menu
            </Link>
            <Link to="/spin" className="border border-cream/40 px-6 py-3 rounded-full text-sm uppercase tracking-widest">
              Spin for a treat
            </Link>
          </motion.div>
        </div>
      </section>

      <section ref={storyRef} className="max-w-3xl mx-auto px-4 py-24">
        <p className="story-line font-display italic text-3xl md:text-4xl leading-snug">
          Third places are for belonging. Fourth Place is for belonging with a sketchbook.
        </p>
        <p className="story-line mt-8 opacity-80 leading-relaxed">
          We roast quietly, hang local work on plaster walls, and keep the lights low enough that conversations
          can take the long way around. Rated {rating.average || "—"} by {rating.count} guests — comments stay
          with the house, not the internet.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <h2 className="font-display text-4xl italic mb-8">Ambience</h2>
        <GalleryMasonry />
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-terracotta">Guest sketchbook</p>
            <h2 className="font-display text-4xl italic mt-2" style={{ fontFamily: '"Segoe Print", "Bradley Hand", cursive' }}>
              Leave a little mark for the next guest.
            </h2>
          </div>
          <p className="max-w-xl text-sm opacity-75">
            This wall is for small doodles, slow ideas, and the kind of things that only make sense over a coffee.
          </p>
        </div>

        <div className="relative rounded-[32px] border border-terracotta/40 bg-[#efe7dc] p-5 shadow-paper">
          <div className="absolute -left-2 top-5 h-8 w-8 rounded-full bg-[#d8cab1]/90" />
          <div className="absolute -right-2 bottom-6 h-8 w-8 rounded-full bg-[#d8cab1]/90" />

          <div className="rotate-[-0.7deg] rounded-[24px] border border-ink/10 bg-[#f6f0e7] p-3 shadow-[inset_0_0_0_1px_rgba(32,55,43,0.04)]">
            <div
              className="rounded-[18px] p-2"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.7), transparent 25%), linear-gradient(135deg, rgba(255,255,255,0.12), rgba(32,55,43,0.02))",
                backgroundColor: "#f6f0e7",
              }}
            >
              <canvas
                ref={canvasRef}
                width={760}
                height={360}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="block h-[360px] w-full rounded-[14px] touch-none"
                style={{
                  backgroundColor: "transparent",
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {[
                { color: "#20372b", label: "Forest" },
                { color: "#d66a4a", label: "Terracotta" },
                { color: "#8aa07f", label: "Moss" },
                { color: "#c8b79a", label: "Sand" },
              ].map((swatch) => (
                <button
                  key={swatch.color}
                  type="button"
                  aria-label={`Select ${swatch.label} brush`}
                  onClick={() => {
                    setTool("brush");
                    setBrushColor(swatch.color);
                  }}
                  className={`h-8 w-8 rounded-full border-2 transition ${brushColor === swatch.color && tool === "brush" ? "border-ink scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: swatch.color }}
                />
              ))}

              <button
                type="button"
                onClick={() => setTool("eraser")}
                className={`px-3 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] border transition ${tool === "eraser" ? "border-ink bg-ink text-cream" : "border-current/20"}`}
              >
                Eraser
              </button>
            </div>

            <div className="flex items-center gap-3 md:justify-end">
              <label className="text-[10px] uppercase tracking-[0.35em] text-terracotta">Brush</label>
              <input
                type="range"
                min="2"
                max="12"
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
                className="accent-terracotta"
              />
              <button
                type="button"
                onClick={clearCanvas}
                className="border border-current/20 px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.3em]"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="font-display text-4xl italic mb-4">From the windows</h2>
        <p className="opacity-70 mb-6 text-sm">Instagram is a living sketchbook. Follow along, or sit here instead.</p>
        <a
          href={import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com"}
          className="inline-block border border-current/20 px-5 py-3 rounded-full text-xs uppercase tracking-widest"
          target="_blank"
          rel="noreferrer"
        >
          Open Instagram
        </a>
      </section>
    </PageShell>
  );
}

function PageShell({ children }) {
  return <div>{children}</div>;
}
