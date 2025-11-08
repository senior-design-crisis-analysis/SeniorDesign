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

// ✅ Extend leaflet module to properly type heatLayer
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

// ✅ Colors and weights
const disasterColors: Record<string, string> = {
  fire: "#ef4444",
  shooting: "#000000",
  flood: "#3b82f6",
  earthquake: "#f97316",
  hurricane: "#0ea5e9",
  tornado: "#8b5cf6",
  auto_accident: "#9333ea",
  storm: "#22c55e",
  severe_storm: "#84cc16",
  other: "#6b7280",
};

const severityWeights: Record<string, number> = {
  low: 0.4,
  medium: 0.7,
  high: 1.0,
};

// 🔥 Heat layer
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

// 🌎 Legend component (just UI below map)
function Legend() {
  return (
    <div
      className="mx-auto p-2 bg-white text-sm w-[750px]"
      style={{ fontSize: "14px" }}
    >
      <strong>Disaster Types</strong>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          marginTop: 0,
        }}
      >
        {Object.entries(disasterColors).map(([key, color]) => (
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", gap: "1.5px" }}
          >
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

      <hr style={{ margin: "4px 0" }} />
      <strong>Heatmap = Severity × Confidence</strong>
      <div
        style={{
          marginTop: 2,
          height: 8,
          width: "100%",
          background:
            "linear-gradient(to right, blue, cyan, lime, yellow, red)",
        }}
      />
    </div>
  );
}

// 🌎 Main Component
export default function HeatMap({ posts }: { posts: DisasterRow[] }) {
  const [showMarkers, setShowMarkers] = useState(true);

  return (
    <div className="flex flex-col items-center relative">
      <div style={{ position: "relative", width: 650, height: 500 }}>
        {/* Toggle Button in top-right */}
        <button
          onClick={() => setShowMarkers((prev) => !prev)}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1000,
            background: "white",
            border: "1px solid #d1d5db",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            borderRadius: 6,
            padding: "4px 8px",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
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
                  <Tooltip sticky>
                    {r.disaster_type
                      .slice(0)
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                    –{" "}
                    {r.severity_level
                      .slice(0)
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()) ??
                      "unknown"}{" "}
                    Severity
                  </Tooltip>
                  <Popup
                    closeButton={false}
                    className="custom-popup-transparent"
                    autoPan={true}
                  >
                    <style>
                      {`
      .custom-popup-transparent .leaflet-popup-content-wrapper {
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .custom-popup-transparent .leaflet-popup-tip {
        display: none !important;
      }
    `}
                    </style>

                    <div className="items-center justify-center align-middle">
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

      {/* Legend under the map */}
      <Legend />
    </div>
  );
}
