import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import supabase from "../supabase-client";
import './CountMap.css'
import "mapbox-gl/dist/mapbox-gl.css";

const CountMap = () => {
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
        [-179, 18], // Southwest corner [lng, lat]
        [-65, 72],  // Northeast corner [lng, lat]
      ],
    });

    if (!mapRef.current) return;

    mapRef.current.on("load", async () => {
      if (!mapRef.current) return;

      // Fetch data from Supabase
      const { data, error } = await supabase
        .from("locations")
        .select("id, latitude, longitude, reported_timestamp");

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      // Convert to GeoJSON
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: data.map((row) => ({
          type: "Feature",
          properties: {
            id: row.id,
            reported_timestamp: row.reported_timestamp,
          },
          geometry: {
            type: "Point",
            coordinates: [row.longitude, row.latitude],
          },
        })),
      };

      // Add GeoJSON source
      mapRef.current.addSource("locations", {
        type: "geojson",
        data: geojson,
      });

      // Add heatmap layer
      mapRef.current.addLayer({
        id: "locations-heat",
        type: "heatmap",
        source: "locations",
        maxzoom: 15,
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
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            2,
            15,
            20,
          ],
          "heatmap-opacity": 0.8,
        },
      });

      // Optional circle layer
      mapRef.current.addLayer({
        id: "locations-point",
        type: "circle",
        source: "locations",
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

    return () => mapRef.current?.remove();
  }, []);

  return (
    <div
      className="CountMap"
      id="map"
      ref={mapContainerRef}
      style={{ width: "100vw", height: "100vh" }}
    />
  );
};

export default CountMap;
