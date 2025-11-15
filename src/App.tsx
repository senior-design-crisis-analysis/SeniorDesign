import { useState, useEffect, useMemo } from "react";
import type { DisasterEnum, SeverityEnum } from "./enumTypes";
import HeatMap from "./components/HeatMap";

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
import Nav from "./components/Nav";

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
  if (!iso) return false;
  const d = new Date(iso);
  return d >= from && d <= to;
};

function App() {
  const [posts, setPosts] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showHelpList, setShowHelpList] = useState(false);
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: oneYearAgo,
    to: today,
  });
  const [disaster, setDisaster] = useState<DisasterEnum | undefined>();
  const [severity, setSeverity] = useState<SeverityEnum | undefined>();

  const visibleMapPoints = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const base = posts.filter(
      (p) =>
        p.latitude != null &&
        p.longitude != null &&
        isInRange(p.indexed_at, dateRange.from, dateRange.to) &&
        (disaster === undefined || p.disaster_type === disaster) &&
        (severity === undefined || p.severity_level === severity)
    );
    return showHelpList ? base.filter((p) => p.help_request) : base;
  }, [posts, dateRange, disaster, severity, showHelpList]);

  /* cards that have to be shown in the side panel ------------------*/
  const visibleHelpCards = useMemo(() => {
    if (!showHelpList) return []; // panel hidden
    return visibleMapPoints.filter((p) => p.help_request); // already filtered above, but keeps the intent explicit
  }, [visibleMapPoints, showHelpList]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("be_extracted_info_output")
        .select("*")
        .limit(3000);
      if (error) setError(error.message);
      else setPosts(data || []);
    };
    fetchPosts();
  }, []);

  if (error) return <p style={{ color: "red" }}>Supabase error: {error}</p>;
  if (!posts.length)
    return (
      <Alert>
        <Loader />
        <AlertTitle>Loading</AlertTitle>
        <AlertDescription>Loading Disaster Data...</AlertDescription>
      </Alert>
    );

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div>
      <Nav />
      <div className="pt-[2rem]  flex justify-between items-center mb-2">
        <div
          className="text-left px-2 py-2"
          style={{ color: "#020617", fontSize: "28px", fontWeight: 600 }}
        >
          Disaster Dashboard
        </div>
      </div>
      <Card className="w-full mb-8 container">
        <CardHeader>
          <CardTitle className="text-left text-lg font-semibold">
            Disaster Posts in the United States
          </CardTitle>
          <CardDescription className="text-left">
            Showing {visibleMapPoints.length} posts from Bluesky
          </CardDescription>
          <CardAction>
            <div className="flex items-center space-x-2 z-[1000]">
              {/* Date Range */}
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-56 justify-between z-[1000]"
                  >
                    {dateRange?.from && dateRange?.to
                      ? `${formatDate(dateRange.from)} - ${formatDate(
                          dateRange.to
                        )}`
                      : "Select date"}
                    <ChevronDownIcon className="text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[1000]" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>

              {/* Severity */}
              <Select
                value={severity ?? "all"}
                onValueChange={(v) =>
                  setSeverity(v === "all" ? undefined : (v as SeverityEnum))
                }
              >
                <SelectTrigger className="w-[170px] z-[1000]">
                  <SelectValue placeholder="Severity Level" />
                </SelectTrigger>
                <SelectContent className="z-[1000]">
                  <SelectGroup>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Disaster */}
              <Select
                value={disaster ?? "all"}
                onValueChange={(v) =>
                  setDisaster(v === "all" ? undefined : (v as DisasterEnum))
                }
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="All Disasters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Disasters</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="flood">Flood</SelectItem>
                    <SelectItem value="hurricane">Hurricane</SelectItem>
                    <SelectItem value="earthquake">Earthquake</SelectItem>
                    <SelectItem value="tornado">Tornado</SelectItem>
                    <SelectItem value="extreme_heat">Extreme Heat</SelectItem>
                    <SelectItem value="shooting">Shooting</SelectItem>
                    <SelectItem value="auto_accident">Auto Accident</SelectItem>
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

        <CardContent className="flex gap-4">
          <HeatMap posts={visibleMapPoints} />
          {showHelpList && (
            <Card className="w-[380px]">
              <div className="card-header p-3 font-semibold">Help Requests</div>
              <div className="overflow-y-auto max-h-[480px] p-2">
                {visibleHelpCards.length === 0 ? (
                  <p className="text-center text-slate-500">
                    No help requests found.
                  </p>
                ) : (
                  visibleHelpCards.map((post) => (
                    <HelpRequestPost
                      key={post.uri}
                      data={{
                        handle: post.author ?? "Anonymous",
                        category: post.disaster_type ?? "unknown",
                        severity: post.severity_level ?? "unknown",
                        text: post.original_text ?? "",
                        location: post.location_mentioned ?? "unknown",
                        time: post.indexed_at ?? "",
                      }}
                    />
                  ))
                )}
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
      <footer className="text-center mt-10 text-xs text-slate-500">
        Made with love by Professor Sarac's Team 77 at the University of Texas
        at Dallas.
      </footer>
    </div>
  );
}

export default App;
