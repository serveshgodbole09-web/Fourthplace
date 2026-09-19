import { useEffect, useState } from "react";
import { api } from "../api";
import PageFade from "../components/PageFade.jsx";

export default function Location() {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    api("/auth/public-config")
      .then(setCfg)
      .catch(() =>
        setCfg({
          google_maps_api_key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
          cafe_map_query:
            import.meta.env.VITE_CAFE_MAP_QUERY ||
            "Cafe Fourth Place, Shaniwar Peth, Rajmachi, Guruwar Peth, Satara, Maharashtra 415001",
          cafe_lat: 17.6785133,
          cafe_lng: 73.9937337,
        }),
      );
  }, []);

  const query = encodeURIComponent(
    cfg?.cafe_map_query ||
      "Cafe Fourth Place, Shaniwar Peth, Rajmachi, Guruwar Peth, Satara, Maharashtra 415001",
  );
  const key = cfg?.google_maps_api_key?.trim();
  const hasUsableKey = key && key.toLowerCase() !== "your_google_maps_api_key";
  const embed = hasUsableKey
    ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${query}`
    : `https://maps.google.com/maps?q=${query}&output=embed`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  return (
    <PageFade>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="font-display italic text-5xl">Find the door</h1>
        <p className="mt-4 opacity-80">
          Shaniwar Peth, Rajmachi, Guruwar Peth, Satara, Maharashtra 415001 · open 11am–11pm 
        </p>
        <div className="mt-8 overflow-hidden rounded-2xl min-h-[380px] paper-card">
          <iframe title="Fourth Place map" src={embed} className="w-full h-[420px] border-0" loading="lazy" />
        </div>
        <a
          href={directions}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-6 px-6 py-3 rounded-full bg-terracotta text-cream text-xs uppercase tracking-widest"
        >
          Directions
        </a>
      </div>
    </PageFade>
  );
}
