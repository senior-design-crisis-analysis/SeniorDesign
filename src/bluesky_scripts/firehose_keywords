// src/bluesky_scripts/firehose_keywords.ts
import { Jetstream } from '@skyware/jetstream';
import { BskyAgent } from "@atproto/api";
import { createClient } from '@supabase/supabase-js';
import { franc } from 'franc-min';
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
  KEYWORDS: [
    'vehicle collision', 'freeway crash', 'highway crash', 'wildfire', 
    'flash flood warning', 'earthquake', 'hurricane', 'tornado', 
    'chemical spill', 'train derailment', 'building collapse'
  ],
  LANGUAGES: ['eng'],
  MAX_POSTS: 10000,
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
const agent = new BskyAgent({ service: "https://api.bsky.app" });

let collectedPosts = 0;

function detectLanguage(text: string) {
  if (!text || text.length < 10) return 'unknown';
  const lang = franc(text);
  return lang === 'und' ? 'unknown' : lang;
}

function matchesKeywords(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

function matchesLanguage(text: string, languages: string[]) {
  const detected = detectLanguage(text);
  return languages.includes(detected);
}

function shouldCollect(text: string): boolean {
  return matchesKeywords(text, CONFIG.KEYWORDS) && matchesLanguage(text, CONFIG.LANGUAGES);
}

async function startFirehose() {
  console.log("🚀 Starting Keyword Firehose...");

  const jetstream = new Jetstream({
    wantedCollections: ['app.bsky.feed.post'],
    ws: WebSocket,
  });

  jetstream.on('commit', async (event: any) => {
    if (collectedPosts >= CONFIG.MAX_POSTS) {
      console.log(`✅ Reached limit of ${CONFIG.MAX_POSTS}`);
      jetstream.close();
      return;
    }

    if (event.commit.collection !== 'app.bsky.feed.post') return;
    const text = event.commit.record?.text || '';
    if (!shouldCollect(text)) return;

    const postData = {
      uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      cid: event.commit.cid,
      author: event.did,
      text: text,
      indexed_at: event.commit.record.createdAt,
      source: 'keywords'
    };

    const { error } = await supabase.from('be_posts_input').insert(postData);
    if (error) return;
    collectedPosts++;
  });

  jetstream.start();
}

startFirehose();
