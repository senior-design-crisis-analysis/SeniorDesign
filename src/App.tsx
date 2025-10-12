import { useState, useEffect } from 'react'
import CountMap from './components/CountMap'
import {   Card,
  CardAction,
  CardContent,
  CardDescription,
  //CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card'
import type { DateRange } from 'react-day-picker'
import { ChevronDownIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './components/ui/popover'
import { Button } from './components/ui/button'
import { Calendar } from './components/ui/calendar'
import { DateRangePicker } from './components/ui/date-range-picker'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'
import { Label } from './components/ui/label'
import { Switch } from './components/ui/switch'
import HelpRequestPost from './components/HelpRequestPost'
import './App.css'
import supabase from './supabase-client'

  type Row = {
    uri: string;
    author: string | null;
    disaster_type: string | null;
    severity_level: string | null;
    original_text: string | null;
    location_mentioned: string | null;
    created_at: string | null;
    help_req: boolean | null;
  };

function App() {
  const [posts, setPosts] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 12), // Example start date (June 12, 2025)
    to: new Date(2025, 6, 15),   // Example end date (July 15, 2025)
  })

    useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('SZ-extracted_info_output_duplicate')
        .select('*');

        console.log('Supabase answer:', { data, error });
      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setPosts(data || []);
      }
    };

    fetchPosts();
  }, []);

  if (error) return <p style={{ color: 'red' }}>Supabase error: {error}</p>;
  if (!posts.length) return <p>Loading…</p>;




  return (
    <>
    <Card className="w-full container DisasterPostsintheUnitedStates">
      <CardHeader>
          <CardTitle className="text-left">Disaster Posts in the United States</CardTitle>
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
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
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

            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Disaster" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="earthquake">Earthquake</SelectItem>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="hurricane">Hurricane</SelectItem>
                  <SelectItem value="tornado">Tornado</SelectItem>
                  <SelectItem value="shooting">Shooting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Switch id="help-requests" />
              <Label htmlFor="help-requests">Help Requests</Label>
            </div>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
      {/*<CountMap />*/}
      <Card className='w-full max-w-sm HelpRequestPosts'>
        <div className='card-header'>
          <p className='card-header-text'>Help Request Posts</p>
        </div>
        <div className="frame-clip-content max-h-[473px] w-[377px] overflow-y-auto overflow-x-hidden scrollbar-none">
          <div className='frame-posts'>
            {posts
            .filter((post) => post.help_req === true)
            .map((post) => (
              <div key={post.uri}>
                <HelpRequestPost
                  data={{
                    handle: post.author ?? 'Anonymous',
                    category: post.disaster_type ?? 'unknown',
                    severity: post.severity_level ?? 'unknown',
                    text: post.original_text ?? '',
                    location: post.location_mentioned ?? 'unknown',
                    time: post.created_at ?? '',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>
      </CardContent>
      </Card>
    </>
  )
}

export default App
