import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

type Locations = {
  locationType: string;
  count: number;
};

type Props = {
  disasterData: Locations[];
};

const LocationCount = ({ disasterData }: Props) => {
  const formatDisasterName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const maxCount = Math.max(...disasterData.map(item => item.count), 1);

  return (
    <Card>
      <CardHeader>
        <p className="card-header-text text-left">Top Mentioned Locations</p>
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
              <div key={item.locationType} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-[150px]">
                  <span className="text-sm font-medium">
                    {formatDisasterName(item.locationType)}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <div className="flex-1 bg-secondary rounded-md h-9 overflow-hidden">
                    <div 
                      className="h-9 rounded-md transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                      {item.count}
                    </span>

                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationCount;