"use client"

import { TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type DisasterCount = {
  disasterType: string;
  count: number;
};

type Props = {
  disasterData: DisasterCount[];
};

const DisasterTypeCount = ({ disasterData }: Props) => {
  const formatDisasterName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const total = disasterData.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...disasterData.map(item => item.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disaster Type Distribution</CardTitle>
        <CardDescription>Breakdown of {total} posts by disaster type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {disasterData.map((item, index) => {
            const percentage = (item.count / maxCount) * 100;
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
              "hsl(210 40% 98%)",
            ];
            const color = chartColors[index % chartColors.length];

            return (
              <div key={item.disasterType} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-[150px]">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium">
                    {formatDisasterName(item.disasterType)}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 min-w-[80px] justify-end">
                    <span className="text-sm font-semibold tabular-nums">
                      {item.count}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                      ({((item.count / total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      {/* <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Total of {total} disaster posts <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing distribution across different disaster types
        </div>
      </CardFooter> */}
    </Card>
  );
};

export default DisasterTypeCount;