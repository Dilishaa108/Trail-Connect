import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useLocation } from "wouter";
import type { Destination } from "@workspace/api-client-react";

// Fix default marker icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function difficultyColor(score: number) {
  if (score <= 50) return "#16a34a";
  if (score <= 75) return "#d97706";
  return "#dc2626";
}

function difficultyLabel(score: number) {
  if (score <= 50) return "Easy";
  if (score <= 75) return "Moderate";
  return "Hard";
}

function makeIcon(score: number) {
  const color = difficultyColor(score);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

function FitBounds({ destinations }: { destinations: Destination[] }) {
  const map = useMap();
  useEffect(() => {
    if (destinations.length === 0) return;
    const valid = destinations.filter(d => d.lat && d.lng);
    if (valid.length === 0) return;
    const bounds = L.latLngBounds(valid.map(d => [d.lat!, d.lng!]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [destinations, map]);
  return null;
}

interface Props {
  destinations: Destination[];
}

export function TrekMap({ destinations }: Props) {
  const [, setLocation] = useLocation();
  const valid = destinations.filter(d => d.lat && d.lng);

  return (
    <div className="relative rounded-2xl overflow-hidden border shadow-md" style={{ height: 520 }}>
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-xl border px-3 py-2 shadow text-xs space-y-1.5">
        {[
          { label: "Easy", color: "#16a34a" },
          { label: "Moderate", color: "#d97706" },
          { label: "Hard", color: "#dc2626" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-gray-700 font-medium">{label}</span>
          </div>
        ))}
        <div className="pt-1 border-t text-gray-500">{valid.length} routes shown</div>
      </div>

      <MapContainer
        center={[28.3, 84.1]}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds destinations={valid} />
        {valid.map(dest => (
          <Marker
            key={dest.id}
            position={[dest.lat!, dest.lng!]}
            icon={makeIcon(dest.difficulty)}
          >
            <Popup maxWidth={220} className="trek-popup">
              <div className="p-1">
                <div className="font-bold text-sm text-gray-900 mb-1">{dest.name}</div>
                <div className="text-xs text-gray-500 mb-2">{dest.region}</div>
                <div className="grid grid-cols-2 gap-1 text-xs mb-3">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <div className="text-gray-400">Duration</div>
                    <div className="font-semibold text-gray-700">{dest.duration}</div>
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <div className="text-gray-400">Max Alt.</div>
                    <div className="font-semibold text-gray-700">{dest.maxAltitude}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: difficultyColor(dest.difficulty) + "20",
                      color: difficultyColor(dest.difficulty),
                    }}
                  >
                    {difficultyLabel(dest.difficulty)}
                  </span>
                  <span className={`text-xs font-semibold ${dest.seatsLeft <= 3 ? "text-red-600" : "text-emerald-600"}`}>
                    {dest.seatsLeft} seats left
                  </span>
                </div>
                <button
                  onClick={() => setLocation(`/destinations/${dest.id}`)}
                  className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ background: "hsl(185,62%,25%)" }}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
