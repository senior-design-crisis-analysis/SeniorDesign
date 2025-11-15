import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SeverityEnum } from "@/enumTypes"
import { useMemo } from "react"


export function BreakingNumbers(props: any) {

    const mostCommon = useMemo(() => {
        const freq: Record<string, number> = {};
        let max = 0, top = '—';

        for (const p of props.posts) {
            if (!p.disaster_type) continue;      // skip nulls
            const d = p.disaster_type;
            freq[d] = (freq[d] || 0) + 1;
            if (freq[d] > max) { max = freq[d]; top = d; }
        }
        return top;
        }, [props.posts]);

  return (
    <div className="w-full mb-[1rem] flex flex-col md:flex-row gap-4 *:data-[slot=card]:from-slate-100 *:data-[slot=card]:to-card *:data-[slot=card]:bg-gradient-to-t">
      
      <Card className="flex-1 @container/card text-left">
        <CardHeader>
          <CardDescription className="font-semibold">Total Posts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {props.posts.length.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Gathered from all-time
          </div>
        </CardFooter>
      </Card>
      <Card className="flex-1 @container/card text-left">
        <CardHeader>
          <CardDescription className="font-semibold">High-Severity Posts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {props.posts.filter((p: any) => p.severity_level == "high" as SeverityEnum).length.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Gathered from all-time
          </div>
        </CardFooter>
      </Card>
      <Card className="flex-1 @container/card text-left">
        <CardHeader>
          <CardDescription className="font-semibold">Help Request Posts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {props.posts.filter((p: any) => p.help_request).length}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Gathered from all-time
          </div>
        </CardFooter>
      </Card>
      <Card className="flex-1 @container/card text-left">
        <CardHeader>
          <CardDescription className="font-semibold">Most Common Disaster</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {mostCommon.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Gathered from all-time
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}