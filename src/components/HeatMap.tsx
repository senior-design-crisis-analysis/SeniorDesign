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
//import HelpRequestPost from "./HelpRequestPost";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Clock4, Calendar, AlertCircle } from "lucide-react";

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
  const layerRef = useRef<L.Layer | undefined>(undefined);

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
      {/*the following div with the 2 cards is susan's code */}
      <div className="mt-[0.5rem] flex flex-col md:flex-row gap-[0.5rem]">
      <Card className="w-3/7 flex-none p-3 gap-0">
        <p className="scroll-m-20 text-[16px] font-semibold tracking-tight">Marker Key</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {Object.entries(disasterColors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1 whitespace-nowrap">
              <span className="rounded-full" style={{ background: color, width: 12, height: 12 }} />
              <span className="break-words whitespace-normal">
                {key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="w-4/7 flex-none p-3 gap-2">
        <p className="scroll-m-20 text-[16px] font-semibold tracking-tight">Heatmap Key</p>
        <p className="text-muted-foreground"> Severity × Confidence </p>
        <div
          className="mt-1 h-5 w-full rounded-full"
          style={{
            background:
              "linear-gradient(to right, blue, cyan, lime, yellow, red)",
          }}
        />
      </Card>

      </div>
      {/*
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
      </div> */}
      {/*
      <hr className="my-1" />
      <strong>Heatmap = Severity × Confidence</strong>
      <div
        className="mt-1 h-2 w-full"
        style={{
          background:
            "linear-gradient(to right, blue, cyan, lime, yellow, red)",
        }}
      />*/}
    </div>
  );
}

// Main HeatMap component
export default function HeatMap({ posts }: { posts: DisasterRow[] }) {
  const [showMarkers, setShowMarkers] = useState(true);
  

  return (
    <div className="flex flex-col items-center relative">
      <div style={{ position: "relative", width: 750, height: 500 }}>
      {/*<div style={{ position: "relative", width: 650, height: 500 }}>*/}
        <button
          onClick={() => setShowMarkers((prev) => !prev)}
          className="absolute top-2 right-2 z-500 bg-white border border-gray-300 shadow-sm rounded-md px-2 py-1 text-sm"
        >
          {showMarkers ? "Hide Markers" : "Show Markers"}
        </button>

        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={3.5}
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
              .map((r, i) => {

                const dateStr = r.indexed_at; // "2025-11-04T18:31:08+00:00"
                const d = dateStr ? new Date(dateStr) : new Date();

                const date = new Intl.DateTimeFormat('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC'
                }).format(d);

                const time = new Intl.DateTimeFormat('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'UTC'
                }).format(d);
                
                return (
                <CircleMarker
                  key={r.uri ?? i}
                  center={[r.latitude!, r.longitude!]}
                  radius={8}
                  color={disasterColors[r.disaster_type ?? 'unknown'] || 'gray'}
                  fillColor={disasterColors[r.disaster_type ?? 'unknown'] || 'gray'}
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
                    closeButton={true}
                    className="custom-popup-floating"
                    offset={[0,0]}
                  >
                    <style>
                      {`
        .custom-popup-floating {
          transform: translateY(-0.25rem);
        }
        .custom-popup-floating .leaflet-popup-content-wrapper {
          background   : white !important;   /* give it a face */
          border-radius: 8px !important;
          border-width: 2px;
          border-color: #cbd5e1;
          box-shadow   : none !important;
          padding      : 0.1rem !important;     /* 1 rem gap all round */
          position     : relative;           /* containing block for x */
        }
        .custom-popup-floating .leaflet-popup-close-button {
          position : absolute;
          top      : 1rem;   /* sits inside the 1 rem padding */
          right    : 1rem;
          font-size: 18px;
          color    : #555;
          z-index  : 1;
        }

        .custom-popup-floating .leaflet-popup-tip {
          display: none !important;
        }
      `}
                    </style>

                    <div className="flex items-center justify-center align-middle g-0">
                      {/*<HelpRequestPost
                        data={{
                          handle: r.author ?? "Anonymous",
                          category: r.disaster_type ?? "unknown",
                          severity: r.severity_level ?? "unknown",
                          text: r.original_text ?? "",
                          location: r.location_mentioned ?? "unknown",
                          time: r.indexed_at ?? "",
                        }}
                      />*/}
                          <div className="w-3xl g-0">
                            <p className="text-[14px] font-semibold">@{r.author}</p>
                            <div className="flex flex-row gap-[0.25rem]">
                                <Badge className={"rounded-full px-3 py-1 border-2 capitalize flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis"}>
                                  {r.disaster_type
                                    ? r.disaster_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                                    : 'Unknown'}
                                </Badge>
                                <Badge className={"rounded-full px-2 py-1 capitalize flex items-center justify-center text-white"}
                                  style={
                                    r.severity_level === "high"
                                      ? { backgroundColor: "#B91C1C" }
                                      : r.severity_level === "medium"
                                      ? { backgroundColor: "#CA8A04" }
                                      : r.severity_level === "low"
                                      ? { backgroundColor: "#67A9CF" }
                                      : undefined
                                  }
                                >
                                  {r.severity_level}
                                </Badge>
                            </div>
                            <div className="">
                              <p className="post-text">{r.original_text}</p>
                            </div>
                            <div className="flex flex-row items-center">
                              <div className="flex flex-row items-center gap-[6px]">
                                <MapPin size={16} className="text-slate-500" />
                                <p className="text-[13px] text-slate-500">{r.location_mentioned}</p>
                              </div>
                              <div className="flex-1" />
                              <div className="flex flex-row items-center gap-[6px]">
                                {r.help_request ? (
                                <AlertCircle
                                  color="white"
                                  fill="red"
                                  className="w-[22px] h-[22px]"
                                />
                              ) : (
                                <AlertCircle
                                  color="white"
                                  fill="#C0C0C0"
                                  className="w-[22px] h-[22px]"
                                />
                              )}
                              <p className="font-semibold">Help Request</p>
                              </div>
                            </div>
                            <div className="flex flex-row items-center">
                              <div className="flex flex-row items-center gap-[6px]">
                                <Calendar size={16} className="text-slate-500" />
                                {/*<p className="label-text">{time}</p>*/}
                                <p className="text-[13px] text-slate-500">{date}</p>
                              </div>
                              <div className="flex-1" />
                              <div className="flex flex-row items-center gap-[6px]">
                                <Clock4 size={16} className="text-slate-500" />
                                {/*<p className="label-text">{time}</p>*/}
                                <p className="text-[13px] text-slate-500">{time}</p>
                              </div>
                            </div>
                          </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
        })}
        </MapContainer>
      </div>

      <Legend />
    </div>
  );
}
