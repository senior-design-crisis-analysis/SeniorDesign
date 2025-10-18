import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import './CountMap.css'
import "mapbox-gl/dist/mapbox-gl.css";
import type { Feature, Point, GeoJsonProperties } from 'geojson';

type Row = {
  longitude: number | null;
  latitude: number | null;
  created_at: string | null;
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
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 2,
      maxBounds: [
        [-179, 18],
        [-65, 72],
      ],
    });

    const map = mapRef.current;

    map.on('load', () => {
      // keep only rows with coordinates

      const features: Feature<Point, GeoJsonProperties>[] = posts
        .filter((p): p is Row & { longitude: number; latitude: number } =>
          p.longitude != null && p.latitude != null
        )
        .map(p => ({
          type: 'Feature' as const,
          properties: { timestamp: p.created_at },
          geometry: {
            type: 'Point' as const,
            coordinates: [p.longitude, p.latitude],
          },
        }));

const source: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features, // now typed correctly
};

      map.addSource('filtered-points', { type: 'geojson', data: source });

      // heat-map layer
      map.addLayer({
        id: 'heatmap',
        type: 'heatmap',
        source: 'filtered-points',
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(33,102,172,0)',
            0.2,
            'rgb(103,169,207)',
            0.4,
            'rgb(209,229,240)',
            0.6,
            'rgb(253,219,199)',
            0.8,
            'rgb(239,138,98)',
            1,
            'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
          'heatmap-opacity': 0.8,
        },
      });

      // optional circle layer
      map.addLayer({
        id: 'circles',
        type: 'circle',
        source: 'filtered-points',
        minzoom: 7,
        paint: {
          'circle-radius': 4,
          'circle-color': 'rgba(0,0,0,0.7)',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 1,
          'circle-opacity': 0.6,
        },
      });
    });

    return () => map.remove();
  }, [posts]); // re-build sources when filtered set changes

  return (
    <div
      ref={mapContainerRef}
      className="CountMap"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default CountMap;