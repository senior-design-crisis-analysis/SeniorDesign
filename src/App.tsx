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
import LocationCount from "./components/LocationCount/LocationCount";
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AuthorAnalysis from "./components/AuthorAnalysis";
import DisasterTypeCount from "./components/DisasterTypeCount";

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
  const [showHelpList, setShowHelpList] = useState(false); // ← default help request toggle

  const today = new Date();
  //const oneYearAgo = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);   // 14 days ago
  //oneYearAgo.setFullYear(today.getFullYear() - 1); // 1 year ago
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: twoWeeksAgo, // 00:00 on the same day 2 weeks ago
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
    return showHelpList ? base.filter((p) => p.help_request === true) : base;
  }, [posts, dateRange, disaster, severity, showHelpList]);

  /* cards that have to be shown in the side panel ------------------*/
  const visibleHelpCards = useMemo(() => {
    if (!showHelpList) return []; // panel hidden
    return visibleMapPoints.filter((p) => p.help_request); // already filtered above, but keeps the intent explicit
  }, [visibleMapPoints, showHelpList]);

  const locationSummary = useMemo(() => {
  const counts: Record<string, number> = {};
  visibleMapPoints.forEach((p) => {
    const key = p.location_mentioned ?? 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([locationType, count]) => ({ locationType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);          // top-10
  }, [visibleMapPoints]);
  const authorStats = useMemo(() => {
  // Count posts per author
  const authorCounts: Record<string, number> = {};
  
  posts.forEach(post => {
    if (post.author) {
      authorCounts[post.author] = (authorCounts[post.author] || 0) + 1;
    }
  });

  // ADDED NOV.4 BY JASZ
  // Convert to array and filter for authors with 10+ posts
  return Object.entries(authorCounts)
    .map(([author, postCount]) => ({ author, postCount }))
    .filter(author => author.postCount >= 10)
    .sort((a, b) => b.postCount - a.postCount); // Sort descending
  }, [posts]);

  // ADDED NOV.4 BY JASZ
  const disasterStats = useMemo(() => {
    const disasterCounts: Record<string, number> = {};
  
    posts.forEach(post => {
      if (post.disaster_type) {
        disasterCounts[post.disaster_type] = (disasterCounts[post.disaster_type] || 0) + 1;
      }
    });

    // Convert to array and sort by count descending
    return Object.entries(disasterCounts)
      .map(([disasterType, count]) => ({ disasterType, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error, count } = await supabase
        .from("be_extracted_info_output")
        .select("*", { count: "exact" }); // ← see how many rows exist

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

  const formatDate = (date: Date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      <div
        className="text-left px-2 py-2"
        style={{ color: "#020617", fontSize: "28px", fontWeight: 600 }}
      >
        Disaster Post Analysis Dashboard
      </div>
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
                      className="bg-white w-56 justify-between font-normal"
                    >
                      {dateRange?.from && dateRange?.to
                        ? `${formatDate(dateRange.from)} - ${formatDate(
                            dateRange.to
                          )}`
                        : "Select date"}
                      <ChevronDownIcon className="text-slate-400" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      className="rounded-lg border shadow-sm"
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Select
                value={severity ?? "all"}
                onValueChange={(v) =>
                  setSeverity(v === "all" ? undefined : (v as SeverityEnum))
                }
              >
                <SelectTrigger className="w-[170px]">
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
                    <SelectItem value="auto_accident">Auto Accident</SelectItem>
                    <SelectItem value="earthquake">Earthquake</SelectItem>
                    <SelectItem value="extreme_heat">Extreme Heat</SelectItem>
                    <SelectItem value="flood">Flood</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="hurricane">Hurricane</SelectItem>
                    <SelectItem value="severe_storm">Severe Storm</SelectItem>
                    <SelectItem value="shooting">Shooting</SelectItem>
                    <SelectItem value="tornado">Tornado</SelectItem>
                    <SelectItem value="tropical_storm">
                      Tropical Storm
                    </SelectItem>
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
          {/*<CountMap posts={visibleMapPoints} />*/}

          <MapContainer
              center={[39.8, -98.5]}
              zoom={4}
              className="w-full h-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <CountMap posts={visibleMapPoints} />
          </MapContainer>

          {showHelpList && (
            <Card className="w-full max-w-sm HelpRequestPosts">
              <div className="card-header">
                <p className="card-header-text">Help Requests</p>
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

          {!showHelpList && (
            <div className="w-full max-w-sm TopLocations">
              <LocationCount disasterData={locationSummary} />
            </div>
          )}
          
        </CardContent>

        {/*  */}
        {/* Bottom section: Disaster Type and Author Analysis side by side */}
          <CardContent>
            <div className="mt-6 grid grid-cols-2 gap-6">
              {/* Left: Disaster Type Count */}
              <div>
                {disasterStats.length > 0 ? (
                  <DisasterTypeCount disasterData={disasterStats} />
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    No disaster type data available.
                  </p>
                )}
              </div>

              {/* Right: Author Analysis */}
              <div>
                {authorStats.length > 0 ? (
                  <AuthorAnalysis authorData={authorStats} />
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    No authors with 10+ posts in the current dataset.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
      </Card> 
      <TableSkeetTable />

    </div>
  );
}

export default App;
