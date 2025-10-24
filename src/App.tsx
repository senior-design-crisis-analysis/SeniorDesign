import { useState, useEffect, useMemo } from "react";
import type { DisasterEnum, SeverityEnum } from "./enumTypes";
import CountMap from "./components/CountMap";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  //CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import type { DateRange } from "react-day-picker";
import { ChevronDownIcon, Loader } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Button } from "./components/ui/button";
import { Calendar } from "./components/ui/calendar";
//import { DateRangePicker } from './components/ui/date-range-picker'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import HelpRequestPost from "./components/HelpRequestPost";
import "./App.css";
import supabase from "./supabase-client";
import TableSkeetTable from "./components/posts_table/ExtractedInfoTable";

type Row = {
  uri: string;
  location_mentioned: string | null;
  latitude: number | null;
  longitude: number | null;
  original_text: string | null;
  author: string | null;
  indexed_at: string | null;
  help_request: boolean | null;
  disaster_type: DisasterEnum | null;
  severity_level: SeverityEnum | null;
};

const isInRange = (iso: string | null, from: Date, to: Date) => {
  if (!iso) return false; // ignore rows without created_at
  const d = new Date(iso);
  return d >= from && d <= to;
};

function App() {
  const [posts, setPosts] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showHelpList, setShowHelpList] = useState(true);   // ← NEW

  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1); // 1 year ago
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: oneYearAgo, // 00:00 on the same day last year
    to: today, // 00:00 today (inclusive for your ≤ test)
  });

  const [disaster, setDisaster] = useState<DisasterEnum | undefined>(undefined);
  const [severity, setSeverity] = useState<SeverityEnum | undefined>(undefined);

  /* coordinates that have to be painted on the map -----------------*/
  const visibleMapPoints = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];

    const base = posts.filter(
      (p) =>
        p.latitude != null &&
        p.longitude != null &&
        isInRange(p.indexed_at, dateRange.from!, dateRange.to!) &&
        (disaster === undefined || p.disaster_type === disaster) &&
        (severity === undefined || p.severity_level === severity)
    );

    /* when the switch is ON  ->  only help-request points
      when the switch is OFF ->  every post that has coords   */
    return showHelpList
      ? base.filter((p) => p.help_request === true)
      : base;
  }, [posts, dateRange, disaster, severity, showHelpList]);

    /* cards that have to be shown in the side panel ------------------*/
  const visibleHelpCards = useMemo(() => {
    if (!showHelpList) return [];                       // panel hidden
    return visibleMapPoints.filter((p) => p.help_request);  // already filtered above, but keeps the intent explicit
  }, [visibleMapPoints, showHelpList]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error, count } = await supabase
      .from("FE2-extracted_info_output_duplicate")
      .select("*", { count: "exact" });   // ← see how many rows exist

    console.log("Supabase answer:", { data, error, count });
      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setPosts(data || []);
      }
    };

    fetchPosts();
  }, []);

  if (error) return <p style={{ color: "red" }}>Supabase error: {error}</p>;
  if (!posts.length)
    return (
      <Alert>
        <Loader />
        <AlertTitle className="text-left">Loading</AlertTitle>
        <AlertDescription>
          Thank you for your patience with Disaster Post Analysis Dashboard!
        </AlertDescription>
      </Alert>
    );

  return (
    <div>
      <Card className="w-full container DisasterPostsintheUnitedStates">
        <CardHeader>
          <CardTitle className="text-left">
            Disaster Posts in the United States
          </CardTitle>
          <CardDescription className="text-left">
            Count of disaster posts on Bluesky
          </CardDescription>
          <CardAction>
            <div className="flex items-center space-x-2">
              {/*<DateRangePicker
                onUpdate={(values) => console.log(values)}
                initialDateFrom="2025-10-01"
                initialDateTo="2025-10-31"
                align="start"
                locale="en-GB"
                showCompare={false}
              />*/}
              <div className="flex flex-col gap-3">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date"
                      className="w-48 justify-between font-normal"
                    >
                      {dateRange?.from && dateRange?.to
                        ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                        : "Select date"}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from} // The month displayed initially
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      className="rounded-lg border shadow-sm"
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>

                {/*<Calendar
                  mode="range"
                  defaultMonth={dateRange?.from} // The month displayed initially
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  className="rounded-lg border shadow-sm"
                />*/}
              </div>

              <Select
                value={severity ?? "all"}
                onValueChange={(v) => setSeverity(v === "all" ? undefined : (v as SeverityEnum))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Severity Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={disaster ?? "all"}
                onValueChange={(v) => setDisaster(v === "all" ? undefined : (v as DisasterEnum))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Disasters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Disasters</SelectItem>
                    <SelectItem value="auto_accident">Auto Accident</SelectItem>
                    <SelectItem value="earthquake">Earthquake</SelectItem>
                    <SelectItem value="extreme_heat">Extreme Heat</SelectItem>
                    <SelectItem value="flood">Flood</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="hurricane">Hurricane</SelectItem>
                    <SelectItem value="severe_storm">Severe Storm</SelectItem>
                    <SelectItem value="shooting">Shooting</SelectItem>
                    <SelectItem value="tornado">Tornado</SelectItem>
                    <SelectItem value="tropical_storm">Tropical Storm</SelectItem>
                    <SelectItem value="other_disaster">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Switch
                  id="help-requests"
                  checked={showHelpList}
                  onCheckedChange={setShowHelpList}
                />
                <Label htmlFor="help-requests">Help Requests</Label>
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="DPITUSContainer">
          <CountMap posts={visibleMapPoints} />
          {showHelpList && (
            <Card className="w-full max-w-sm HelpRequestPosts">
              <div className="card-header">
                <p className="card-header-text">Help Request Posts</p>
              </div>
              <div className="frame-clip-content max-h-[473px] w-[377px] overflow-y-auto overflow-x-hidden scrollbar-none">
                <div className="frame-posts">
                  {visibleHelpCards.length === 0 ? (
                    <p className="handle-text text-center">
                      No help requests in the selected period.
                    </p>
                  ) : (
                    visibleHelpCards.map((post) => (
                      <div key={post.uri}>
                        <HelpRequestPost
                          data={{
                            handle: post.author ?? "Anonymous",
                            category: post.disaster_type ?? "unknown",
                            severity: post.severity_level ?? "unknown",
                            text: post.original_text ?? "",
                            location: post.location_mentioned ?? "unknown",
                            time: post.indexed_at ?? "",
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
      <TableSkeetTable />
    </div>
  );
}

export default App;
