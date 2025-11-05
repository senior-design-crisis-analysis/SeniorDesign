"use client"

import { TrendingUp } from "lucide-react"
import { useState, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AuthorData = {
  author: string
  postCount: number
}

type Props = {
  authorData: AuthorData[]
}

const AuthorAnalysis = ({ authorData }: Props) => {
  const topAuthors = authorData.slice(0, 10)
  const chartHeight = 200

  const formatAuthorName = (name: string) =>
    name.length > 8 ? name.substring(0, 6) + "..." : name

  const totalPosts = topAuthors.reduce((sum, author) => sum + author.postCount, 0)
  const maxCount = Math.max(...topAuthors.map((item) => item.postCount), 1)
  const topAuthor = topAuthors[0]?.author || ""
  const topAuthorCount = topAuthors[0]?.postCount || 0

  const [hoveredAuthor, setHoveredAuthor] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const chartRef = useRef<HTMLDivElement>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Authors</CardTitle>
        <CardDescription>Most active authors by post count</CardDescription>
      </CardHeader>

      <CardContent className="relative">
        {/* Tooltip that follows cursor */}
        {hoveredAuthor && (
          <div
            className="absolute bg-background border rounded-lg px-3 py-2 shadow-xl z-20 min-w-[120px] text-center whitespace-nowrap pointer-events-none transition-opacity duration-100"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y - 15, // offset above cursor
              transform: "translate(-30%, -100%)",
            }}
          >
            <div className="font-bold text-lg tabular-nums text-foreground mb-1">
              {topAuthors.find((a) => a.author === hoveredAuthor)?.postCount ?? ""}
            </div>
            <div className="text-xs text-muted-foreground border-t pt-1">
              {hoveredAuthor}
            </div>
          </div>
        )}

        <div
          ref={chartRef}
          className="flex items-end justify-between h-80 pt-4 pb-12 px-2 relative"
          onMouseMove={(e) => {
            const rect = chartRef.current?.getBoundingClientRect()
            if (rect) {
              setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              })
            }
          }}
        >
          {topAuthors.map((item, index) => {
            const barHeight = (item.postCount / maxCount) * chartHeight
            const chartColors = [
              "hsl(222.2 84% 4.9%)",
              "hsl(222.2 47.4% 11.2%)",
              "hsl(217.2 32.6% 17.5%)",
              "hsl(215.3 25% 26.7%)",
              "hsl(215.3 19.3% 34.5%)",
              "hsl(215.4 16.3% 46.9%)",
              "hsl(215 20.2% 65.1%)",
              "hsl(212.7 26.8% 83.9%)",
              "hsl(214.3 31.8% 91.4%)",
              "hsl(210 40% 96.1%)",
            ]
            const color = chartColors[index % chartColors.length]

            return (
              <div
                key={item.author}
                className="flex flex-col items-center group relative flex-1 max-w-10"
                onMouseEnter={() => setHoveredAuthor(item.author)}
                onMouseLeave={() => setHoveredAuthor(null)}
              >
                <div
                  className="flex flex-col justify-end w-full min-h-0 transition-transform duration-300 group-hover:scale-105"
                  style={{ height: `${chartHeight}px` }}
                >
                  <div
                    className="w-full rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: color,
                      minHeight: item.postCount > 0 ? "2px" : "0px",
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </div>

                <div className="w-full text-center mt-3 px-0.9">
                  <div className="transform -rotate-65 origin-bottom whitespace-nowrap">
                    <span className="text-xs text-muted-foreground font-medium transition-colors duration-200 group-hover:text-foreground">
                      {formatAuthorName(item.author)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          **{topAuthor}** leads with **{topAuthorCount} posts**{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Top 10 authors with {totalPosts} total posts
        </div>
      </CardFooter>
    </Card>
  )
}

export default AuthorAnalysis



// "use client"

// import { TrendingUp } from "lucide-react"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"

// type AuthorData = {
//   author: string;
//   postCount: number;
// };

// type Props = {
//   authorData: AuthorData[];
// };

// const AuthorAnalysis = ({ authorData }: Props) => {
//   // Get only top 10 authors (no minimum post requirement)
//   const topAuthors = authorData.slice(0, 10);
  
//   const formatAuthorName = (name: string) => {
//     if (name.length > 8) {
//       return name.substring(0, 6) + '...';
//     }
//     return name;
//   };

//   const totalPosts = topAuthors.reduce((sum, author) => sum + author.postCount, 0);
//   const maxCount = Math.max(...topAuthors.map(item => item.postCount), 1);
//   const topAuthor = topAuthors[0]?.author || "";
//   const topAuthorCount = topAuthors[0]?.postCount || 0;

//   // Fixed height for the chart area
//   const chartHeight = 180;

//   if (authorData.length === 0) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>Top Authors</CardTitle>
//           <CardDescription>Most active authors by post count</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <p className="text-center text-slate-500 py-8">
//             No author data available.
//           </p>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Top Authors</CardTitle>
//         <CardDescription>Most active authors by post count</CardDescription>
//       </CardHeader>
//       {/* 1. Spacing Fix: Reduced padding-bottom from pb-16 to pb-10 on the chart container. */}
//       <CardContent className="overflow-hidden">
//         <div className="flex items-end justify-between h-64 pt-4 pb-10 px-2">
//           {topAuthors.map((item, index) => {
//             const barHeight = (item.postCount / maxCount) * chartHeight;
//             const chartColors = [
//               "hsl(222.2 84% 4.9%)", 
//               "hsl(222.2 47.4% 11.2%)", 
//               "hsl(217.2 32.6% 17.5%)",
//               "hsl(215.3 25% 26.7%)",  
//               "hsl(215.3 19.3% 34.5%)", 
//               "hsl(215.4 16.3% 46.9%)",
//               "hsl(215 20.2% 65.1%)",
//               "hsl(212.7 26.8% 83.9%)",
//               "hsl(214.3 31.8% 91.4%)",
//               "hsl(210 40% 96.1%)",
//             ];
//             const color = chartColors[index % chartColors.length];

//             return (
//               // Main hover group
//               <div key={item.author} className="flex flex-col items-center group relative flex-1 max-w-10">
                
//                 {/* 3. Hover Fix: Using 'hidden' and 'group-hover:block' for robust visibility */}
//                 <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-background border rounded-lg px-3 py-2 shadow-xl z-20 min-w-[120px] text-center pointer-events-none">
//                   <div className="font-bold text-lg tabular-nums text-foreground mb-1">
//                     {item.postCount}
//                   </div>
//                   <div className="text-xs text-muted-foreground border-t pt-1">
//                     {item.author}
//                   </div>
//                   <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-3 h-3 bg-background border-b border-r rotate-45"></div>
//                 </div>

//                 {/* 2. Vertical Bar Container (The visible part of the chart) */}
//                 <div 
//                   className="flex flex-col justify-end w-full min-h-0 transition-transform duration-300 group-hover:scale-105"
//                   style={{ height: `${chartHeight}px` }}
//                 >
//                   {/* 2. Rounded Corners Fix: Added rounded-t-sm to the bar itself. 
//                      The original code had rounded-t-sm, but it seems it wasn't applied. 
//                      Ensuring it is explicitly here. 
//                      The issue in the image often happens if the bar's height is very close to zero, but not here.
//                   */}
//                   <div 
//                     className="w-full rounded-t-sm transition-all duration-300 group-hover:brightness-110 group-hover:shadow-lg"
//                     style={{ 
//                       height: `${barHeight}px`,
//                       backgroundColor: color,
//                       minHeight: item.postCount > 0 ? '2px' : '0px'
//                     }}
//                   />
//                 </div>
                
//                 {/* 1. Spacing Fix: Reduced margin-top from mt-6 to mt-3 on the author label */}
//                 <div className="w-full text-center mt-3 px-1">
//                   <div className="transform -rotate-45 origin-top whitespace-nowrap">
//                     <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors duration-200">
//                       {formatAuthorName(item.author)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </CardContent>
//       <CardFooter className="flex-col items-start gap-2 text-sm">
//         <div className="flex gap-2 leading-none font-medium">
//           **{topAuthor}** leads with **{topAuthorCount} posts** <TrendingUp className="h-4 w-4" />
//         </div>
//         <div className="text-muted-foreground leading-none">
//           Top 10 authors with {totalPosts} total posts
//         </div>
//       </CardFooter>
//     </Card>
//   );
// };

// export default AuthorAnalysis;

/*
*
*
*  ABOVE WORKS
* 
* /

// import { useEffect, useRef } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
// import './AuthorAnalysis.css';

// type AuthorData = {
//   author: string;
//   postCount: number;
// };

// type Props = {
//   authorData: AuthorData[];
// };

// const AuthorAnalysis = ({ authorData }: Props) => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     if (!canvasRef.current || authorData.length === 0) return;

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     // Clear canvas
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Chart dimensions
//     const padding = 60;
//     const chartWidth = canvas.width - padding * 2;
//     const chartHeight = canvas.height - padding * 2;

//     // Find max value for scaling
//     const maxPosts = Math.max(...authorData.map(a => a.postCount));

//     // Bar width
//     const barWidth = chartWidth / authorData.length * 0.8;

//     // Draw bars
//     authorData.forEach((author, index) => {
//       const barHeight = (author.postCount / maxPosts) * chartHeight;
//       const x = padding + (index * chartWidth / authorData.length);
//       const y = canvas.height - padding - barHeight;

//       // Bar
//       ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
//       ctx.fillRect(x, y, barWidth, barHeight);

//       // Author label (rotated)
//       ctx.save();
//       ctx.fillStyle = '#374151';
//       ctx.font = '12px system-ui';
//       ctx.textAlign = 'right';
//       ctx.translate(x + barWidth / 2, canvas.height - padding + 20);
//       ctx.rotate(-Math.PI / 4);
//       ctx.fillText(author.author, 0, 0);
//       ctx.restore();

//       // Count label
//       ctx.fillStyle = '#1f2937';
//       ctx.font = '12px system-ui';
//       ctx.textAlign = 'center';
//       ctx.fillText(author.postCount.toString(), x + barWidth / 2, y - 5);
//     });

//     // Y-axis label
//     ctx.fillStyle = '#6b7280';
//     ctx.font = '14px system-ui';
//     ctx.textAlign = 'center';
//     ctx.save();
//     ctx.translate(20, canvas.height / 2);
//     ctx.rotate(-Math.PI / 2);
//     ctx.fillText('Number of Posts', 0, 0);
//     ctx.restore();

//   }, [authorData]);

//   if (authorData.length === 0) {
//     return (
//       <Card className="AuthorAnalysis">
//         <CardHeader>
//           <CardTitle>Authors with 10+ Disaster Posts</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <p className="text-center text-slate-500">No data available</p>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card className="AuthorAnalysis">
//       <CardHeader>
//         <CardTitle>Authors with 10+ Disaster Posts</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="chart-container">
//           <canvas 
//             ref={canvasRef} 
//             width={800} 
//             height={400}
//             className="author-chart"
//           />
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default AuthorAnalysis; */