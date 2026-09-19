import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

export default function GalleryMasonry() {
  const [images, setImages] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api("/public/gallery")
      .then(setImages)
      .catch(() => setImages([]));
  }, []);

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {images.map((img) => (
          <button
            type="button"
            key={img.id}
            className="mb-4 block w-full overflow-hidden break-inside-avoid"
            onClick={() => setActive(img)}
          >
            <img
              src={img.image_url}
              alt={img.title}
              className="w-full object-cover transition-transform duration-700 hover:scale-110"
            />
            <p className="mt-2 text-xs uppercase tracking-widest opacity-70">{img.title}</p>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {active && (
          <motion.button
            type="button"
            className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.img
              src={active.image_url}
              alt={active.title}
              className="max-h-[85vh] max-w-full object-contain"
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
