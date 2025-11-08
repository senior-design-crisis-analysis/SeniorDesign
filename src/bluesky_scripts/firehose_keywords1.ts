// src/bluesky_scripts/firehose_keywords.ts
import { Jetstream } from "@skyware/jetstream";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import WebSocket from "ws";
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  MAX_POSTS: 10000,
  KEYWORDS: [

    // traffic & accidents 
    'traffic accident', 'road closed', 'car crash', 'multi-vehicle', 
    'pileup', 'major crash', 'traffic backed up', 'intersection blocked', 
    'vehicle collision', 'freeway crash', 'highway crash', 'road closure',
    'lane blocked', 'intersection closed', 'pedestrian struck',
    
    // weather & natural disasters 
    'storm damage', 'flooding', 'hailstorm', 'mudslide', 
    'tornado warning', 'evacuation order', 'extreme heat', 'cold front', 
    'severe weather alert', 'flash flood warning', 'earthquake', 
    'hurricane', 'tornado', 'severe thunderstorm', 'blizzard', 'winter storm',
    'tsunami warning', 'volcanic eruption', 'landslide', 'drought conditions',
    'storm damage', 'evacuation order', 'state of emergency', 'tropical storm'  
],

};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let collectedPosts = 0;
let lastSeq = 0;

async function getLastCursor() {
  const { data, error } = await supabase
    .from("firehose_state")
    .select("last_seq")
    .eq("name", "keywords")
    .single();

  if (error || !data) {
    console.log("ℹ️ No previous cursor found — starting fresh.");
    return 0;
  }

  console.log(`↩️ Resuming from cursor: ${data.last_seq}`);
  return data.last_seq;
}

async function saveCursor(seq: number) {
  await supabase.from("firehose_state").upsert({
    name: "keywords",
    last_seq: seq,
  });
}

function containsKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return CONFIG.KEYWORDS.some((kw) => lower.includes(kw));
}

async function startFirehose() {
  console.log("🚀 Starting Keyword Firehose...");

  const startSeq = await getLastCursor();

  const jetstream = new Jetstream({
    wantedCollections: ["app.bsky.feed.post"],
    ws: WebSocket,
    cursor: startSeq > 0 ? startSeq : undefined,
  });

  jetstream.on("commit", async (event: any) => {
    lastSeq = event.commit.seq;

    if (collectedPosts >= CONFIG.MAX_POSTS) {
      console.log(`✅ Reached limit of ${CONFIG.MAX_POSTS}`);
      await saveCursor(lastSeq);
      jetstream.close();
      console.log(`📊 Saved cursor ${lastSeq} — total collected ${collectedPosts}`);
      process.exit(0);
      return;
    }

    if (event.commit.collection !== "app.bsky.feed.post") return;

    const record = event.commit.record;
    if (!record || !record.text) return;

    if (!containsKeyword(record.text)) return;

    const postData = {
      uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      cid: event.commit.cid,
      author: event.did,
      text: record.text,
      indexed_at: record.createdAt,
      source: "keywords",
    };

    const { error } = await supabase
      .from("be_posts_input")
      .upsert(postData, { onConflict: "uri" });

    if (!error) {
        collectedPosts++;

      // 🧮 Print progress every 100 posts
      if (collectedPosts % 100 === 0) {
        console.log(`📈 Collected ${collectedPosts} posts so far...`);
      }
    }
  });

  // Graceful shutdown logic — catches all exit scenarios
async function shutdown(reason: string) {
  console.log(`\n🛑 Shutting down (${reason})...`);
  try {
    await saveCursor(lastSeq);
    console.log(`📊 Saved cursor: ${lastSeq}`);
    console.log(`✅ Total posts collected: ${collectedPosts}`);
  } catch (err) {
    console.error("⚠️ Failed to save cursor on shutdown:", err);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT (manual stop)"));
process.on("SIGTERM", () => shutdown("SIGTERM (GitHub cancel)"));
process.on("beforeExit", () => shutdown("beforeExit"));
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught exception:", err);
  shutdown("uncaughtException");
});

jetstream.start();

}

startFirehose();
