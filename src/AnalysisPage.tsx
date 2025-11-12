"use client";
import { Card, CardContent } from "@/components/ui/card";
import AuthorAnalysis from "./components/AuthorAnalysis";
import DisasterTypePieChart from "./components/DisasterTypeCount";
import LocationCount from "./components/LocationCount/LocationCount";
import supabase from "./supabase-client";
import { useEffect, useMemo, useState } from "react";
import type { DisasterEnum, SeverityEnum } from "./enumTypes";

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

export default function AnalysisPage() {
  const [posts, setPosts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("be_extracted_info_output")
          .select("*")
          .limit(3000);

        if (error) {
          setError(error.message);
        } else {
          setPosts(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const authorStats = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.author) counts[p.author] = (counts[p.author] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([author, postCount]) => ({ author, postCount }))
      .filter((a) => a.postCount >= 10)
      .sort((a, b) => b.postCount - a.postCount);
  }, [posts]);

  const locationStats = useMemo(() => {
    const locationCounts: Record<string, number> = {};

    posts.forEach((post) => {
      const locRaw = post.location_mentioned;
      if (
        locRaw && // not null or undefined
        locRaw.trim() !== "" && // not empty
        locRaw.trim().toLowerCase() !== "null" // not the string "null"
      ) {
        const loc = locRaw.trim().toLowerCase();
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
    });

    return Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .filter((loc) => loc.count >= 5) // show only locations with ≥5 mentions
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [posts]);

  const disasterStats = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.disaster_type)
        counts[p.disaster_type] = (counts[p.disaster_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([disasterType, count]) => ({ disasterType, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-left mb-4">Data Analysis</h2>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Loading data...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-left mb-4">Data Analysis</h2>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center text-red-500">
              Error loading data: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-left mb-4">Data Analysis</h2>
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LocationCount locationData={locationStats} />
            <DisasterTypePieChart disasterData={disasterStats} />
            <AuthorAnalysis authorData={authorStats} />
          </div>
        </CardContent>
      </Card>
      <footer className="text-center mt-10 text-xs text-slate-500">
        Made with love by Professor Sarac's Team 77 at the University of Texas
        at Dallas.
      </footer>
    </div>
  );
}
