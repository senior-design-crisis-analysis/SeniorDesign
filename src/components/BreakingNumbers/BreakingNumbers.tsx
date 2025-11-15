import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


export function BreakingNumbers(props: any) {
  return (
    <div className="w-full mb-[1rem] flex flex-col md:flex-row gap-6 *:data-[slot=card]:from-slate-100 *:data-[slot=card]:to-card *:data-[slot=card]:bg-gradient-to-t">
      
      <Card className="flex-1 @container/card text-left">
        <CardHeader>
          <CardDescription className="font-bold">Total Posts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
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
          <CardDescription className="font-bold">High-Severity Posts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
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
          <CardDescription className="font-bold">Help Request Posts</CardDescription>
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
          <CardDescription className="font-bold">Most Common Disaster</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
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