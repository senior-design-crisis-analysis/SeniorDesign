// src/components/CountMap.tsx
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';

declare global {
  interface Window {
    L: typeof L & {
      heatLayer?: (data: number[][], opts?: unknown) => L.Layer;
    };
  }
}

type Row = {
  longitude: number | null;
  latitude: number | null;
  indexed_at: string | null;
};

type Props = {
  posts: Row[];
};

export default function CountMap({ posts }: Props) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    // 1. inject the script only once
    const id = 'leaflet-heat-script';
    if (!document.getElementById(id)) {
      const script = document.createElement('script');
      script.id = id;
      script.src =
        'https://cdn.jsdelivr.net/gh/python-visualization/folium@main/folium/templates/leaflet_heat.min.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // 2. wait until the script is ready

  const start = setInterval(() => {
    if (typeof window === 'undefined') return;          // SSR guard
    if (!window.L?.heatLayer) return;

    clearInterval(start);

    // remove old layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    const clean = posts
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => [p.latitude!, p.longitude!, 1] as [number, number, number]);

    const heatFactory = window.L.heatLayer;   // narrow type
    heatLayerRef.current = heatFactory(clean, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
    }).addTo(map);
  }, 50);

    return () => {
      clearInterval(start);
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, posts]);

  return null; // we do not need an extra div – react-leaflet already gave us one
}
