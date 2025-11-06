// src/bluesky_scripts/firehose_accounts.ts
import { Jetstream } from '@skyware/jetstream';
import { BskyAgent } from "@atproto/api";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from "ws";
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase env vars");
  process.exit(1);
}

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  TRACKED_ACCOUNTS: [
    'nws.noaa.gov', 'fema.govmirrors.com', 'actionnews5.com', 'npr.org',
    'sacurrent.bsky.social', 'calfire.bsky.social', 'cbssundaymorning.bsky.social',
    'ucanr.edu', 'massdfs.bsky.social', 'denverpolice.bsky.social'
  ],
  MAX_POSTS: 10000,
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
const agent = new BskyAgent({ service: "https://api.bsky.app" });

let collectedPosts = 0;
const handleCache = new Map<string, string>();

async function getTrackedDIDs(): Promise<Set<string>> {
  const dids = new Set<string>();
  for (const account of CONFIG.TRACKED_ACCOUNTS) {
    try {
      const profile = await agent.resolveHandle({ handle: account });
      dids.add(profile.data.did);
      handleCache.set(profile.data.did, account);
      console.log(`✅ Resolved ${account} -> ${profile.data.did}`);
    } catch (e: any) {
      console.warn(`⚠️  Failed to resolve ${account}:`, e?.message);
    }
  }
  return dids;
}

async function startFirehose() {
  console.log("🚀 Starting Account Firehose...");
  const trackedDIDs = await getTrackedDIDs();

  const jetstream = new Jetstream({
    wantedCollections: ['app.bsky.feed.post'],
    ws: WebSocket,
  });

  jetstream.on('commit', async (event: any) => {
    if (collectedPosts >= CONFIG.MAX_POSTS) {
      jetstream.close();
      return;
    }

    if (event.commit.collection !== 'app.bsky.feed.post') return;
    if (!trackedDIDs.has(event.did)) return;

    const text = event.commit.record?.text || '';
    const authorHandle = handleCache.get(event.did) || event.did;

    const postData = {
      uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      cid: event.commit.cid,
      author: authorHandle,
      text: text,
      indexed_at: event.commit.record.createdAt,
      source: 'accounts'
    };

    const { error } = await supabase.from('be_posts_input').insert(postData);
    if (error) return;
    collectedPosts++;
  });

  jetstream.start();
}

startFirehose();
