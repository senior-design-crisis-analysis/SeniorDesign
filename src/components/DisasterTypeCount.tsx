"use client";

import { useState, useRef } from "react";
import { PieChart } from "react-minimal-pie-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sl } from "date-fns/locale";

type DisasterCount = {
  disasterType: string;
  count: number;
};

type Props = {
  disasterData: DisasterCount[];
};

const DisasterTypePieChart = ({ disasterData }: Props) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const total = disasterData.reduce((sum, item) => sum + item.count, 0);

  const baseColors = [
    "#84cc16",
    "#3b82f6",
    "#ef4444",
    "#06b6d4",
    "#fbbf24",
    "#8b5cf6",
    "#b5b5b5",
    "#ec4899",
    "#10b981",
    "#f97316",
    "#a855f7",
    "#0ea5e9",
  ];

  // Darken the lightest colors for better visibility
  const chartColors = baseColors.map((color, i) => {
    return color;
  });

  const data = disasterData.map((item, index) => ({
    title: item.disasterType,
    value: item.count,
    color: chartColors[index % chartColors.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disaster Type Distribution</CardTitle>
        <CardDescription>
          Breakdown of the most common disaster types
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center relative">
        <div
          ref={chartRef}
          className="relative"
          onMouseMove={(e) => {
            const rect = chartRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
            }
          }}
        >
          <PieChart
            data={data}
            lineWidth={100} // full solid circle
            animate
            label={() => ""} // remove default labels
            onMouseOver={(_, index) => setHoveredIndex(index)}
            onMouseOut={() => setHoveredIndex(null)}
          />
          {hoveredIndex !== null && (
            <div
              className="absolute bg-background border rounded-lg px-3 py-2 shadow-xl z-20 min-w-[120px] text-center whitespace-nowrap pointer-events-none transition-opacity duration-100"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y - 15, // offset above cursor
                transform: "translate(-30%, -100%)",
              }}
            >
              <div className="font-bold text-lg tabular-nums text-foreground mb-1">
                {data[hoveredIndex].title
                  .slice(0)
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              <div className="text-xs text-muted-foreground border-t pt-1">
                {((data[hoveredIndex].value / total) * 100).toFixed(1)}% |{" "}
                {data[hoveredIndex].value} posts
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {data.map((item) => (
          <div key={item.title} className="flex items-center gap-1 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="whitespace-nowrap">
              {item.title
                .slice(0)
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DisasterTypePieChart;
