import { useEffect } from "react";
import { motion } from "framer-motion";

export default function LoadingScreen({ onDone, night }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduced ? 200 : 2200;
    const t = setTimeout(() => onDone?.(), ms);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className={`fixed inset-0 z-[100] flex items-center justify-center ${
        night ? "bg-[#20372b] text-[#f4eee3]" : "bg-cream text-ink"
      }`}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center px-6">
        <div className="relative mx-auto w-[170px] max-w-[48vw]">
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <motion.div
              aria-hidden="true"
              className="block aspect-[250/220] w-full"
              style={{
                backgroundImage:
                  "linear-gradient(112deg, #9b6418 0%, #f9d36b 20%, #fff0a6 34%, #c8871e 51%, #ffe28a 70%, #a96916 100%)",
                backgroundSize: "220% 100%",
                WebkitMaskImage: "url('/assets/fourthplace-mark-gold.png')",
                maskImage: "url('/assets/fourthplace-mark-gold.png')",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
              }}
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ delay: 0.35, duration: 2.2, ease: "easeInOut" }}
            />
          </motion.div>
          <img src="/assets/fourthplace-mark-gold.png" alt="" className="relative block w-full h-auto opacity-0" />
        </div>
        <motion.p
          className="font-display italic text-2xl mt-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
        >
          Fourth Place
        </motion.p>
        <motion.p
          className="text-xs tracking-[0.35em] uppercase mt-7 text-terracotta"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.7 }}
        >
          opening the gallery
        </motion.p>
      </div>
    </motion.div>
  );
}
