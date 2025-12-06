import { Jetstream } from '@skyware/jetstream';
import { BskyAgent } from "@atproto/api";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from "ws";
dotenv.config();

// --- Environment Validation ---
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables!');
  process.exit(1);
}

// --- Config ---
const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  TRACKED_ACCOUNTS: [ 
    'nws.noaa.gov', 'fema.govmirrors.com', 'actionnews5.com', 'npr.org', 
    'sacurrent.bsky.social', 'calfire.bsky.social', 'cbssundaymorning.bsky.social', 
    'ucanr.edu', 'massdfs.bsky.social', 'denverpolice.bsky.social', 
    'nytimes.com', 'cnn.com', 'cnnipr.bsky.social', 'reuters.com', 
    'usgs-quakebot.bsky.social', 'noaacomms.noaa.gov', 'noaa.gov', 
    'climate.noaa.gov', 'nws.noaa.gov', 'apnews.com', 'boston.gov', 
    '311.boston.gov', 'berkeleyca.gov', 'chicago-city.bsky.social', 
    'fire.boston.gov', 'cityofbellevuewa.bsky.social', 'aptnnews.bsky.social', 
    'cbseveningnews.bsky.social', 'alert.boston.gov', 'cityema.bsky.social', 
    'cityofokc.bsky.social', 'forbes.com', 'altnps.bsky.social' ],
  MAX_POSTS: 10000,  // cap number for testing
};

// --- Initialize Supabase and Agent ---
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
const agent = new BskyAgent({ service: "https://api.bsky.app" });

// --- Tracking ---
let collectedPosts = 0;
const handleCache = new Map<string, string>();
const DIDcache = new Map<string, string>();

// --- Resolve account handles to DIDs ---
async function getTrackedAccountDIDs(): Promise<Set<string>> {
  const dids = new Set<string>();
  for (const account of CONFIG.TRACKED_ACCOUNTS) {
    try {
      const profile = await agent.resolveHandle({ handle: account });
      dids.add(profile.data.did);
      DIDcache.set(account, profile.data.did);
      console.log(`Resolved ${account} → ${profile.data.did}`);
    } catch (error: any) {
      console.warn(`Could not resolve ${account}: ${error?.message}`);
    }
  }
  return dids;
}

// --- Main Firehose ---
async function startFirehose() {
  console.log('🚀 Starting Firehose (Accounts)');
  console.log(`👥 Tracking ${CONFIG.TRACKED_ACCOUNTS.length} accounts...`);

  const trackedDIDs = await getTrackedAccountDIDs();
  console.log(`${trackedDIDs.size} DIDs ready\n---`);

  const jetstream = new Jetstream({
    wantedCollections: ['app.bsky.feed.post'],
    ws: WebSocket,
  });

  // ⏱️ Stop automatically after 5 hours (in milliseconds)
  const RUN_DURATION = 5 * 60 * 60 * 1000; // 5 hours

  setTimeout(() => {
    console.log('Time limit reached — stopping firehose...');
    jetstream.close();
    console.log(`📊 Total posts collected: ${collectedPosts}`);
    process.exit(0);
  }, RUN_DURATION);

  jetstream.on('commit', async (event: any) => {

    if (event.commit.collection !== 'app.bsky.feed.post') return;
    if (!trackedDIDs.has(event.did)) return; // Only track specific accounts

    const record = event.commit.record;
    const text = record?.text || '';
    if (!text) return;

    // Resolve handle (cache first)
    let authorHandle: string;
    if (handleCache.has(event.did)) {
      authorHandle = handleCache.get(event.did)!;
    } else {
      try {
        const authorData = await agent.getProfile({ actor: event.did });
        authorHandle = authorData.data.handle;
        handleCache.set(event.did, authorHandle);
      } catch {
        console.warn(`⚠️  Failed to get handle for ${event.did}`);
        return;
      }
    }

    const postData = {
      uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      cid: event.commit.cid,
      author: authorHandle,
      text: text,
      indexed_at: record.createdAt,
    };

    const { error } = await supabase
      .from('be_posts_input')
      .insert(postData);

    if (error) {
      if (error.code === '23505') return; // duplicate
      console.error('❌ Insert error:', error.message);
    } else {
      collectedPosts++;
      //console.log(`✅ [${collectedPosts}] ${authorHandle}: ${text.slice(0, 60)}...`);
    }
  });

  jetstream.on('error', (err: Error) => {
    console.error('❌ Jetstream error:', err);
  });

  jetstream.on('close', () => {
    console.log('Connection closed');
  });

  jetstream.start();

}

// --- Start ---
startFirehose();

process.on('SIGINT', () => {
  console.log('\nGraceful shutdown...');
  console.log(`📊 Total posts collected: ${collectedPosts}`);
  process.exit(0);
});
