import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PageFade from "../components/PageFade.jsx";

gsap.registerPlugin(ScrollTrigger);

const BEATS = [
  {
    year: "The space",
    text: "Fourth Place is the space between home, work, and everywhere else you're supposed to be — where the coffee is strong, the walls tell stories, and every table has room for one more idea worth chasing.",
  },
  {
    year: "The idea",
    text: "We believe good art and good food come from the same place: patience, care, and a little soul. So we built a café that feels like a gallery you're invited to linger in — for artists, dreamers, coffee lovers, and everyone in between.",
  },
  {
    year: "The whole idea",
    text: "Good food. Good art. Better vibes. That's the whole idea. ♥️",
  },
];

export default function About() {
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".beat", {
        x: -40,
        opacity: 0,
        stagger: 0.2,
        scrollTrigger: { trigger: ref.current, start: "top 70%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <PageFade>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-xs uppercase tracking-[0.35em] text-terracotta">The house story</p>
        <h1 className="font-display italic text-5xl mt-2">Why fourth, not third</h1>
        <div ref={ref} className="mt-16 space-y-10 border-l border-terracotta/40 pl-8">
          {BEATS.map((b) => (
            <div key={b.year} className="beat relative">
              <span className="absolute -left-[39px] top-1 w-3 h-3 rounded-full bg-terracotta" />
              <p className="font-display italic text-2xl">{b.year}</p>
              <p className="mt-2 opacity-80">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </PageFade>
  );
}
