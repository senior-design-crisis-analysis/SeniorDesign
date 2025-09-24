"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Metric } from "@/app/test_skeets/api/states/types/metric";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

type Props = {
  data: Metric[];
};

export default function USHeatmap({ data }: Props) {
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Map for quick lookup
  const valueMap: Record<string, Metric> = {};
  data.forEach((d) => {
    valueMap[d.state_name.toLowerCase()] = d;
  });

  // Color scale (light gray → slate)
  const values = data.map((d) => d.metric_value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const colorScale = scaleLinear<string>()
    .domain([min, max])
    .range(["#e2e8f0", "#1e293b"]);

  return (
    <div className="w-full flex flex-col items-center relative">
      {/* Tooltip */}
      <div
        style={{
          position: "fixed",
          top: tooltipPos.y + 12,
          left: tooltipPos.x + 12,
          pointerEvents: "none",
          zIndex: 10,
        }}
        className={`px-3 py-1 rounded text-white text-sm transition-opacity duration-200 ${
          tooltipContent ? "opacity-100 bg-gray-900" : "opacity-0"
        }`}
      >
        {tooltipContent}
      </div>

     {/* Map Wrapper */}
<div className="w-full max-w-[60rem] mx-auto p-4">
  <ComposableMap
    projection="geoAlbersUsa"
    width={60 * 16} // 60rem × 16px
    height={37.5 * 16} // 37.5rem × 16px for ~4:3 aspect ratio
  >
    <ZoomableGroup>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const stateName = geo.properties.name as string;
            const metric = valueMap[stateName.toLowerCase()];

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={metric ? colorScale(metric.metric_value) : "#fafafaff"}
                stroke="#333"
                onMouseEnter={(evt) => {
                  setTooltipContent(
                    metric
                      ? `${stateName}: ${metric.metric_value} relevant skeets.`
                      : `${stateName}: No relevant skeets.`
                  );
                  setTooltipPos({ x: evt.clientX, y: evt.clientY });
                }}
                onMouseMove={(evt) =>
                  setTooltipPos({ x: evt.clientX, y: evt.clientY })
                }
                onMouseLeave={() => setTooltipContent("")}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", opacity: 0.85 },
                  pressed: { outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>
    </ZoomableGroup>
  </ComposableMap>
</div>

      {/* Legend */}
      <div className="mt-4 w-80">
        <div className="flex justify-between text-sm text-gray-700 mb-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
        <div
          className="h-4 w-full rounded"
          style={{
            background: `linear-gradient(to right, #EEE, #1e293b)`,
          }}
        />
        <div className="text-center text-xs text-gray-500 mt-1">
          Skeet Count
        </div>
      </div>
    </div>
  );
}
