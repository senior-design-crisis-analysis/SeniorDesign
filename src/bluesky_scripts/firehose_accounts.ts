// src/bluesky_scripts/firehose_accounts.ts
import { Jetstream } from '@skyware/jetstream';
import { createClient } from '@supabase/supabase-js';
import { BskyAgent } from "@atproto/api";
import dotenv from 'dotenv';
import WebSocket from "ws";
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase env vars");
  process.exit(1);
}

const CONFIG = 
{ SUPABASE_URL: process.env.SUPABASE_URL!, 
   SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!, 
   TRACKED_ACCOUNTS: [ 
     'nws.noaa.gov', 'fema.govmirrors.com', 'actionnews5.com', 'npr.org', 
     'sacurrent.bsky.social', 'calfire.bsky.social', 
     'cbssundaymorning.bsky.social', 'ucanr.edu', 'massdfs.bsky.social', 
     'denverpolice.bsky.social', 'nytimes.com', 'cnn.com', 
     'cnnipr.bsky.social', 'reuters.com', 'usgs-quakebot.bsky.social', 
     'noaacomms.noaa.gov', 'noaa.gov', 'climate.noaa.gov', 'nws.noaa.gov', 
     'apnews.com', 'boston.gov', '311.boston.gov', 'berkeleyca.gov', 
     'chicago-city.bsky.social', 'fire.boston.gov', 
     'cityofbellevuewa.bsky.social', 'aptnnews.bsky.social', 
     'cbseveningnews.bsky.social', 'alert.boston.gov', 
     'cityema.bsky.social', 'cityofokc.bsky.social', 'forbes.com', 
     'altnps.bsky.social' ], 
 };

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
const agent = new BskyAgent({ service: "https://api.bsky.app" });

let collectedPosts = 0;
let lastSeq = 0;

async function getLastCursor() {
  const { data, error } = await supabase
    .from('firehose_state')
    .select('last_seq')
    .eq('name', 'accounts')
    .single();

  if (error || !data) {
    console.log("ℹ️ No previous cursor found — starting fresh.");
    return 0;
  }

  console.log(`↩️ Resuming from cursor: ${data.last_seq}`);
  return data.last_seq;
}

async function saveCursor(seq: number) {
  await supabase.from('firehose_state')
    .upsert({ name: 'accounts', last_seq: seq });
}

function isTrackedAccount(did: string, trackedHandles: string[]): boolean {
  return trackedHandles.some(handle => did.endsWith(handle));
}

async function startFirehose() {
  console.log("🚀 Starting Accounts Firehose...");

  const startSeq = await getLastCursor();

  const jetstream = new Jetstream({
    wantedCollections: ['app.bsky.feed.post'],
    ws: WebSocket,
    cursor: startSeq > 0 ? startSeq : undefined,
  });
  
    // ⏱️ Automatically stop after 5 hours
  const RUN_DURATION = 5 * 60 * 60 * 1000; // 5 hours in ms
  setTimeout(async () => {
    console.log("\n⏰ Time limit reached — saving cursor and shutting down...");
    await saveCursor(lastSeq);
    console.log(`📊 Total posts collected: ${collectedPosts}`);
    process.exit(0);
  }, RUN_DURATION);

  jetstream.on('commit', async (event: any) => {
    lastSeq = event.commit.seq;

    if (event.commit.collection !== 'app.bsky.feed.post') return;
    if (!isTrackedAccount(event.did, CONFIG.TRACKED_ACCOUNTS)) return;

    const postData = {
      uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      cid: event.commit.cid,
      author: event.did,
      text: event.commit.record?.text || '',
      indexed_at: event.commit.record.createdAt,
      source: 'accounts'
    };

    // Safe insert (avoid duplicates)
    const { error } = await supabase
      .from('be_posts_input')
      .upsert(postData, { onConflict: 'uri' });

    if (!error) collectedPosts++;
  });

  process.on('SIGINT', async () => {
    console.log("\n🛑 Shutting down — saving cursor...");
    await saveCursor(lastSeq);
    console.log(`📊 Total posts collected: ${collectedPosts}`);
    process.exit(0);
  });

  process.on("exit", () => {
    console.log(`🏁 Finished run — total posts collected: ${collectedPosts}`);
  });

  jetstream.start();
}

startFirehose();
