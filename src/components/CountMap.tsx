import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "./CountMap.css";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Feature, Point, GeoJsonProperties } from "geojson";

type Row = {
  longitude: number | null;
  latitude: number | null;
  indexed_at: string | null;
};

type Props = {
  posts: Row[];
};

const CountMap = ({ posts }: Props) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98.5795, 39.8283],
      zoom: 2,
      maxBounds: [
        [-179, 18],
        [-65, 72],
      ],
      attributionControl: false, // disable default bottom-right attribution
    });

    const map = mapRef.current;

    // Add attribution control to top-right
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "top-right"
    );

    map.on("load", () => {
      const features: Feature<Point, GeoJsonProperties>[] = posts
        .filter(
          (p): p is Row & { longitude: number; latitude: number } =>
            p.longitude != null && p.latitude != null
        )
        .map((p) => ({
          type: "Feature" as const,
          properties: { timestamp: p.indexed_at },
          geometry: {
            type: "Point" as const,
            coordinates: [p.longitude, p.latitude],
          },
        }));

      const source: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features,
      };

      map.addSource("filtered-points", { type: "geojson", data: source });

      // Heatmap layer
      map.addLayer({
        id: "heatmap",
        type: "heatmap",
        source: "filtered-points",
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            15,
            3,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(33,102,172,0)",
            0.2,
            "rgb(103,169,207)",
            0.4,
            "rgb(209,229,240)",
            0.6,
            "rgb(253,219,199)",
            0.8,
            "rgb(239,138,98)",
            1,
            "rgb(178,24,43)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 15, 20],
          "heatmap-opacity": 0.8,
        },
      });

      // Circle layer (visible at higher zooms)
      map.addLayer({
        id: "circles",
        type: "circle",
        source: "filtered-points",
        minzoom: 7,
        paint: {
          "circle-radius": 4,
          "circle-color": "rgba(0,0,0,0.7)",
          "circle-stroke-color": "white",
          "circle-stroke-width": 1,
          "circle-opacity": 0.6,
        },
      });
    });

    return () => map.remove();
  }, [posts]);

  // Zoom and pan handlers
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    const map = mapRef.current;
    if (!map) return;
    const moveAmount = 2; // degrees of longitude/latitude
    const center = map.getCenter();
    let { lng, lat } = center;
    switch (direction) {
      case "up":
        lat += moveAmount;
        break;
      case "down":
        lat -= moveAmount;
        break;
      case "left":
        lng -= moveAmount;
        break;
      case "right":
        lng += moveAmount;
        break;
    }
    map.easeTo({ center: [lng, lat], duration: 500 });
  };

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="CountMap"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Custom map controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center space-y-1">
        <button onClick={() => handleMove("up")} className="map-btn">
          ↑
        </button>
        <div className="flex space-x-1">
          <button onClick={() => handleMove("left")} className="map-btn">
            ←
          </button>
          <button onClick={handleZoomIn} className="map-btn">
            +
          </button>
          <button onClick={handleZoomOut} className="map-btn">
            −
          </button>
          <button onClick={() => handleMove("right")} className="map-btn">
            →
          </button>
        </div>
        <button onClick={() => handleMove("down")} className="map-btn">
          ↓
        </button>
      </div>
    </div>
  );
};

export default CountMap;
