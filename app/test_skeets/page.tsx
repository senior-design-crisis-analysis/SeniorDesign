import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import USHeatmapClient from "@/components/USHeatMapClient";
import BlueskyProfileCard from "./components/BlueskyProfileCard";

export default async function Page() {
  // Await the Supabase client
  const supabase = await createClient();

  // Get auth claims
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Fetch notes from Supabase table
  const { data: notes } = await supabase.from("test_skeets").select();

  return (
    <div>
      <pre>{JSON.stringify(notes, null, 2)}</pre>
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4 mt-8">Bluesky Profile Viewer</h1>
        <BlueskyProfileCard handle="sara012345.bsky.social" />
        <br />
        <BlueskyProfileCard handle="testapio.bsky.social" />
        <h1 className="text-xl font-bold p-4">Heatmap</h1>
        <div className="p-30 bg-white rounded-lg shadow">
          <USHeatmapClient />
        </div>
      </main>
    </div>
  );
}
