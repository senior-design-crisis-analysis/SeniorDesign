// src/bluesky_scripts/firehose_keywords.ts
import { Jetstream } from "@skyware/jetstream";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  KEYWORDS: [
    // traffic & accidents
    "traffic accident", "road closed", "car crash", "multi-vehicle", "pileup",
    "major crash", "traffic backed up", "intersection blocked", "vehicle collision",
    "freeway crash", "highway crash", "road closure", "lane blocked",
    "intersection closed", "pedestrian struck",
    // weather & natural disasters
    "storm damage", "flooding", "hailstorm", "mudslide", "tornado warning",
    "evacuation order", "extreme heat", "cold front", "severe weather alert",
    "flash flood warning", "earthquake", "hurricane", "tornado",
    "severe thunderstorm", "blizzard", "winter storm", "tsunami warning",
    "volcanic eruption", "landslide", "drought conditions", "state of emergency",
    "tropical storm", "seismic activity", "richter magnitude", "aftershock",
    "epicenter", "downed power lines", "thunderstorm warning", "severe thunder",
    "thunderstorm watch", "record winds",
  ],
  MAX_POSTS: 10000,
  RUN_DURATION: 5 * 60 * 60 * 1000, // 5 hours
  MAX_RETRIES: 5,
  RETRY_DELAY: 15 * 1000, // 15 seconds
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let collectedPosts = 0;

function containsKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return CONFIG.KEYWORDS.some((kw) => lower.includes(kw));
}

async function startFirehose(retryCount = 0) {
  console.log(`Starting Keyword Firehose (attempt ${retryCount + 1})...`);
  console.log(`Collecting up to ${CONFIG.MAX_POSTS} posts`);
  console.log(`Keywords: ${CONFIG.KEYWORDS.length}`);

  const jetstream = new Jetstream({
    wantedCollections: ["app.bsky.feed.post"],
    ws: WebSocket,
    timeout: 60000, // ⏱️ Give the connection up to 60s to establish
  });

  // Stop after configured duration
  setTimeout(() => {
    console.log("\n⏰ Time limit reached — shutting down...");
    console.log(`📊 Total posts collected: ${collectedPosts}`);
    jetstream.close();
    process.exit(0);
  }, CONFIG.RUN_DURATION);

  jetstream.on("commit", async (event: any) => {
    if (collectedPosts >= CONFIG.MAX_POSTS) {
      console.log(`Reached ${CONFIG.MAX_POSTS} posts — stopping.`);
      jetstream.close();
      process.exit(0);
    }

    if (event.commit.collection !== "app.bsky.feed.post") return;
    const record = event.commit.record;
    if (!record?.text) return;

    const text = record.text;
    if (!containsKeyword(text)) return;

    const postData = {
      uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      cid: event.commit.cid,
      author: event.did,
      text: text,
      indexed_at: record.createdAt,
    };

    const { error } = await supabase.from("be_posts_input").insert(postData);

    if (error) {
      if (error.code !== "23505") {
        console.error("Insert error:", error.message);
      }
      return;
    }

    collectedPosts++;
    if (collectedPosts % 100 === 0) {
      console.log(`Collected ${collectedPosts} posts...`);
    }
  });

  jetstream.on("error", async (err: Error) => {
    console.error("Jetstream error:", err.message);
    jetstream.close();

    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(`Retrying in ${CONFIG.RETRY_DELAY / 1000}s...`);
      setTimeout(() => startFirehose(retryCount + 1), CONFIG.RETRY_DELAY);
    } else {
      console.error("Max retries reached — exiting.");
      process.exit(1);
    }
  });

  jetstream.on("close", () => {
    console.log("Connection closed");
  });

  jetstream.start();
}

startFirehose();
