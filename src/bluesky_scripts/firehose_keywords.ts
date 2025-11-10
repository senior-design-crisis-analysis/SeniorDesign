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
  KEYWORDS: [ // fires 'fire department', 'brush fire', 'apartment fire', 'fire crews', 'wildfire smoke', 'wild fire', 'wildfire', 'structure fire', 'fire evacuation', 'fire warning', 'fire alert', 'fire damage', 'firefighters', 'fire suppression', 'fire outbreak', 'fire containment', 'fire hazard', 'fire risk', 'fire zone', 'fire watch', ' firefighters on scene', // infrastructure issues 'power outage', 'blackout', 'downed lines', 'gas leak', 'bridge collapse', 'water main break', 'sinkhole', 'chemical spill', 'train derailment', 'building collapse', 'power outage', 'pipeline rupture', 'infrastructure failure', // health & emergency 'mass casualty', 'ambulance', 'injured', 'shelter in place', 'state of emergency', 'rescue teams', 'search and rescue', 'medical emergency', 'public health alert', 'disease outbreak', 'contaminated water', 'epidemic', 'pandemic', 'hospital surge', 'emergency response', 'quarantine order', 'fatal accident', 'critical condition', 'disaster relief', 'emergency evacuation', 'first responders', 'emergency services', 'rescue operation', 'urgent assistance', 'triage', 'mass gathering', 'situation report', 'emergency medical services', 'displaced residents', 'crisis management', 'temporary shelter', 'emergency hotline', 'public safety alert', 'health advisory', 'police standoff', 'active shooter', 'hostage situation', 'category 5 hurricane', 'category 4 hurricane', 'category 3 hurricane', 'storm surge warning', 'coastal evacuation', 'extreme heat warning', 'record high temperature', 'cooling center', 'heat advisory', 'heavy rainfall warning', 'tropical depression'
    'fire department', 'brush fire', 'apartment fire', 'fire crews', 'wildfire smoke',
    'wild fire', 'wildfire', 'structure fire', 'fire evacuation', 'fire warning',
    'fire alert', 'fire damage', 'firefighters', 'fire suppression', 'fire outbreak',
    'fire containment', 'fire hazard', 'fire risk', 'fire zone', 'fire watch',
    'firefighters on scene', // infrastructure issues
    'power outage', 'blackout', 'downed lines', 'gas leak', 'bridge collapse',
    'water main break', 'sinkhole', 'chemical spill', 'train derailment',
    'building collapse', 'power outage', 'pipeline rupture', 'infrastructure failure',
    // health & emergency
    'mass casualty', 'ambulance', 'injured', 'shelter in place', 'state of emergency',
    'rescue teams', 'search and rescue', 'medical emergency', 'public health alert',
    'disease outbreak', 'contaminated water', 'epidemic', 'pandemic', 'hospital surge',
    'emergency response', 'quarantine order', 'fatal accident', 'critical condition',
    'disaster relief', 'emergency evacuation', 'first responders', 'emergency services',
    'rescue operation', 'urgent assistance', 'triage', 'mass gathering', 'situation report',
    'emergency medical services', 'displaced residents', 'crisis management',
    'temporary shelter', 'emergency hotline', 'public safety alert', 'health advisory',
    'police standoff', 'active shooter', 'hostage situation', 'category 5 hurricane',
    'category 4 hurricane', 'category 3 hurricane', 'storm surge warning',
    'coastal evacuation', 'extreme heat warning', 'record high temperature',
    'cooling center', 'heat advisory', 'heavy rainfall warning', 'tropical depression'
  ],
  MAX_POSTS: 10000,
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let collectedPosts = 0;

function containsKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return CONFIG.KEYWORDS.some((kw) => lower.includes(kw));
}

async function startFirehose() {
  console.log("🚀 Starting Keyword Firehose...");
  console.log(`📊 Collecting up to ${CONFIG.MAX_POSTS} posts`);
  console.log(`🔑 Keywords: ${CONFIG.KEYWORDS.length}`);

  const jetstream = new Jetstream({
    wantedCollections: ["app.bsky.feed.post"],
    ws: WebSocket,
  });

  // ⏱️ Run for 7 minutes for testing
  const RUN_DURATION = 7 * 60 * 1000;
  setTimeout(() => {
    console.log("\n⏰ Time limit reached — shutting down...");
    console.log(`📊 Total posts collected: ${collectedPosts}`);
    process.exit(0);
  }, RUN_DURATION);

  jetstream.on("commit", async (event: any) => {
    if (collectedPosts >= CONFIG.MAX_POSTS) {
      console.log(`✅ Reached ${CONFIG.MAX_POSTS} posts — stopping.`);
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

    const { error } = await supabase
      .from("be_posts_input")
      .insert(postData);

    if (error) {
      if (error.code !== "23505") {
        console.error("❌ Insert error:", error.message);
      }
      return;
    }

    collectedPosts++;
    if (collectedPosts % 100 === 0) {
      console.log(`📈 Collected ${collectedPosts} posts...`);
    }
  });

  jetstream.on("error", (err: Error) => {
    console.error("❌ Jetstream error:", err);
  });

  jetstream.on("close", () => {
    console.log("🔌 Connection closed");
  });

  jetstream.start();
}

startFirehose();
