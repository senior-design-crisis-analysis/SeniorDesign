"use client";

import { TrendingUp } from "lucide-react";
import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthorData = {
  author: string;
  postCount: number;
};

type Props = {
  authorData: AuthorData[];
};

const AuthorAnalysis = ({ authorData }: Props) => {
  const topAuthors = authorData.slice(0, 12);
  const chartWidth = 260;

  const totalPosts = topAuthors.reduce((sum, a) => sum + a.postCount, 0);
  const maxCount = Math.max(...topAuthors.map((a) => a.postCount), 1);
  const topAuthor = topAuthors[0]?.author || "";
  const topAuthorCount = topAuthors[0]?.postCount || 0;

  const [hoveredAuthor, setHoveredAuthor] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const chartColors = [
    "rgba(0, 0, 0, 1)",
    "rgba(25, 31, 46, 1)",
    "rgba(41, 48, 62, 1)",
    "rgba(55, 62, 76, 1)",
    "rgba(82, 89, 102, 1)",
    "rgba(103, 110, 123, 1)",
    "rgba(124, 132, 144, 1)",
    "rgba(154, 163, 174, 1)",
    "rgba(178, 188, 198, 1)",
    "rgba(206, 216, 226, 1)",
    "rgba(235, 245, 255, 1)",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Authors</CardTitle>
        <CardDescription>
          Breakdown of the most active authors by post count
        </CardDescription>
      </CardHeader>

      <CardContent className="relative pb-2">
        {hoveredAuthor && (
          <div
            className="absolute bg-background border rounded-lg px-3 py-2 shadow-xl z-20 min-w-[120px] text-center whitespace-nowrap pointer-events-none"
            style={{
              left: tooltipPos.x + 30,
              top: tooltipPos.y - 10,
              transform: "translateY(-50%)",
            }}
          >
            <div className="font-bold text-lg tabular-nums text-foreground mb-1">
              {topAuthors.find((a) => a.author === hoveredAuthor)?.postCount ??
                ""}
            </div>
            <div className="text-xs text-muted-foreground border-t pt-1">
              {hoveredAuthor}
            </div>
          </div>
        )}

        <div
          ref={chartRef}
          className="flex flex-col gap-3 h-full relative"
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
          {topAuthors.map((item, index) => {
            const barWidth = (item.postCount / maxCount) * chartWidth;
            const color = chartColors[index % chartColors.length];

            return (
              <div
                key={item.author}
                className="flex items-center gap-3 group relative"
                onMouseEnter={() => setHoveredAuthor(item.author)}
                onMouseLeave={() => setHoveredAuthor(null)}
              >
                <span className="w-20 text-xs text-muted-foreground text-right group-hover:text-foreground transition-colors">
                  {item.author.length > 12
                    ? item.author.slice(0, 8) + "..."
                    : item.author}
                </span>
                <div
                  className="h-5 rounded-r-sm transition-transform duration-300 group-hover:scale-[1.03]"
                  style={{
                    width: `${barWidth}px`,
                    backgroundColor: color,
                    boxShadow:
                      "0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)",
                  }}
                ></div>
                <span className="text-xs font-medium text-muted-foreground ml-2">
                  {item.postCount}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/*<CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium whitespace-nowrap">
          {topAuthor} leads with
          {topAuthorCount} posts
          <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>*/}
    </Card>
  );
};

export default AuthorAnalysis;
