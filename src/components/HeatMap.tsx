import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import type { DisasterRow } from "./DisasterRow";
import HelpRequestPost from "./HelpRequestPost";

// Extend leaflet module to properly type heatLayer
declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      radius?: number;
      blur?: number;
      max?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

// Disaster colors & severity weights
const disasterColors: Record<string, string> = {
  fire: "#ef4444",
  shooting: "#000000",
  flood: "#3b82f6",
  earthquake: "#06b6d4",
  hurricane: "#fbbf24",
  tornado: "#8b5cf6",
  auto_accident: "#b5b5b5",
  storm: "#a855f7",
  severe_storm: "#10b981",
  other: "#f97316",
};

const severityWeights: Record<string, number> = {
  low: 0.4,
  medium: 0.7,
  high: 1.0,
};

// Heat layer component
function HeatLayer({ points }: { points: DisasterRow[] }) {
  const map = useMap();
  const layerRef = useRef<L.Layer>();

  useEffect(() => {
    if (!map) return;

    const heatPoints: [number, number, number?][] = points
      .filter((p) => p.latitude && p.longitude)
      .map((p) => {
        const weight =
          (p.model_confidence ?? 0.5) *
          (severityWeights[p.severity_level ?? "medium"] ?? 0.6);
        return [p.latitude!, p.longitude!, weight];
      });

    if (heatPoints.length === 0) return;

    const heat = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 20,
      minOpacity: 0.3,
      maxZoom: 10,
      gradient: {
        0.0: "blue",
        0.3: "cyan",
        0.5: "lime",
        0.7: "yellow",
        0.9: "red",
      },
    });

    layerRef.current = heat;
    heat.addTo(map);

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map, points]);

  return null;
}

// Legend component
function Legend() {
  return (
    <div
      className="mx-auto p-2 bg-white text-sm w-[750px]"
      style={{ fontSize: "14px" }}
    >
      <strong>Disaster Types</strong>
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(disasterColors).map(([key, color]) => (
          <div key={key} className="flex items-center">
            <span
              style={{
                background: color,
                width: 12,
                height: 12,
                display: "inline-block",
                borderRadius: "50%",
              }}
            />
            {key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")}
          </div>
        ))}
      </div>
      <hr className="my-1" />
      <strong>Heatmap = Severity × Confidence</strong>
      <div
        className="mt-1 h-2 w-full"
        style={{
          background:
            "linear-gradient(to right, blue, cyan, lime, yellow, red)",
        }}
      />
    </div>
  );
}

// Main HeatMap component
export default function HeatMap({ posts }: { posts: DisasterRow[] }) {
  const [showMarkers, setShowMarkers] = useState(true);

  return (
    <div className="flex flex-col items-center relative">
      <div style={{ position: "relative", width: 650, height: 500 }}>
        <button
          onClick={() => setShowMarkers((prev) => !prev)}
          className="absolute top-2 right-2 z-500 bg-white border border-gray-300 shadow-sm rounded-md px-2 py-1 text-sm"
        >
          {showMarkers ? "Hide Markers" : "Show Markers"}
        </button>

        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4.5}
          minZoom={3}
          maxZoom={10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          />

          {posts.length > 0 && <HeatLayer points={posts} />}

          {showMarkers &&
            posts
              .filter((r) => r.latitude && r.longitude)
              .map((r, i) => (
                <CircleMarker
                  key={r.uri ?? i}
                  center={[r.latitude!, r.longitude!]}
                  radius={8}
                  color={disasterColors[r.disaster_type] || "gray"}
                  fillColor={disasterColors[r.disaster_type] || "gray"}
                  fillOpacity={0.7}
                  weight={2}
                >
                  {/* Tooltip shows on hover */}
                  <Tooltip sticky>
                    {(r.disaster_type ?? "Unknown")
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                    –{" "}
                    {(r.severity_level ?? "Unknown")
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                    Severity
                  </Tooltip>

                  {/* Floating HelpRequestPost popup */}
                  <Popup
                    closeButton={false}
                    className="custom-popup-floating"
                    offset={[0, -10]}
                  >
                    <style>
                      {`
        .custom-popup-floating .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-popup-floating .leaflet-popup-tip {
          display: none !important;
        }
        .custom-popup-floating {
          transform: translateY(-10px);
        }
      `}
                    </style>

                    <div className="flex items-center justify-center align-middle">
                      <HelpRequestPost
                        data={{
                          handle: r.author ?? "Anonymous",
                          category: r.disaster_type ?? "unknown",
                          severity: r.severity_level ?? "unknown",
                          text: r.original_text ?? "",
                          location: r.location_mentioned ?? "unknown",
                          time: r.indexed_at ?? "",
                        }}
                      />
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
        </MapContainer>
      </div>

      <Legend />
    </div>
  );
}
