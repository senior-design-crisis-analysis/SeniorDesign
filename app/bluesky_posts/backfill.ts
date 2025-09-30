//app/bluesky_posts/backfill.ts
import { BskyAgent } from '@atproto/api';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// ---------------- Supabase Setup ----------------
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key for inserts
);

// ---------------- Bluesky Agent ----------------
const agent = new BskyAgent({ service: 'https://bsky.social' });

// ---------------- Login Function ----------------
async function login() {
  const username = process.env.BLUESKY_USERNAME!;
  const password = process.env.BLUESKY_PASSWORD!;

  const session = await agent.login({ identifier: username, password });
  console.log('✅ Logged in as', username);
  console.log('Access token (JWT) stored in agent for requests');
}

// ---------------- Backfill Function ----------------
/*
async function backfill(username: string, limit = 100) {
  console.log(`🔄 Backfilling posts for @${username}...`);

  let cursor: string | undefined = undefined;
  let fetched = 0;

  while (fetched < limit) {
    const res = await agent.api.app.bsky.feed.getAuthorFeed({
      actor: username,
      cursor,
      limit: 50, // fetch in batches of 50
    });

    const feed = res.data.feed;
    if (!feed.length) break;

    // Transform and insert into Supabase
    const rows = feed.map((item: any) => ({
      uri: item.post.uri,
      cid: item.post.cid,
      text: item.post.record?.text ?? '',
      author: item.post.author.handle,
      indexedAt: item.post.indexedAt,
    }));

const { error } = await supabase
  .from('posts')
  .upsert(rows, { onConflict: 'uri' });

if (error) {
  console.error('❌ Supabase insert error:', error);
  break;
}

console.log(`✅ Inserted ${rows.length} posts`);


    console.log(`✅ Inserted ${feed.length} posts`);

    fetched += feed.length;
    cursor = res.data.cursor;
    if (!cursor) break; // no more pages
  }

  console.log(`🎉 Finished backfill: ${fetched} posts`);
}
*/

async function backfillAll(username: string) {
  let cursor: string | undefined = undefined;
  let totalFetched = 0;

  while (true) {
    const res = await agent.api.app.bsky.feed.getAuthorFeed({
      actor: username,
      cursor,
      limit: 50,
    });

    const feed = res.data.feed;
    if (!feed.length) break;

    const rows = feed.map((item: any) => ({
      uri: item.post.uri,
      cid: item.post.cid,
      text: item.post.record?.text ?? '',
      author: item.post.author.handle,
      indexedAt: item.post.indexedAt,
    }));

    await supabase.from('posts').upsert(rows, { onConflict: 'uri' });
    
    totalFetched += feed.length;
    console.log(`✅ Total fetched: ${totalFetched}`);

    cursor = res.data.cursor;
    if (!cursor) break;
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`🎉 Complete! Fetched ${totalFetched} total posts`);
}

// ---------------- Main Execution ----------------
async function main() {
  await login(); // Automatically logs in and sets JWT
  await backfillAll('bsky.app'); // Replace with target username & total posts
}

main().catch(console.error);
