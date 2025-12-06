// ----- top of src/bluesky_scripts/backfill.ts -----
import { BskyAgent } from '@atproto/api';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

// only load dotenv locally, never in GitHub Actions
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
  console.log('[DEBUG] Loaded local .env file');
} else {
  console.log('[DEBUG] Skipping dotenv (production mode)');
}

// Helper: prefer long service role var, but accept others
function findSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_KEY ??
    process.env.VITE_SUPABASE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
  );
}

// Try to ensure envs are loaded. If missing, attempt to load .env from repo root as a fallback.
async function ensureEnvLoaded() {
  const supabaseKeyBefore = findSupabaseKey();
  if (process.env.SUPABASE_URL && supabaseKeyBefore) return;

  // Attempt to load from repo root .env (fallback only)
  try {
    // compute repo-root .env path relative to this file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const rootEnvPath = path.resolve(__dirname, '../../.env');

    // Dynamically import dotenv to avoid forcing it in environments where not needed
    // (we're in ESM)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  if (process.env.NODE_ENV !== 'production') {
      await import('dotenv/config');
      }
    const res = dotenv.config({ path: rootEnvPath });
    console.log('[DEBUG] dotenv.config result:', res.parsed ? 'LOADED' : 'NOT LOADED');
    console.log('[DEBUG] attempted .env path:', rootEnvPath);
  } catch (err) {
    console.log('[DEBUG] dotenv load attempt failed (maybe not installed):', (err as Error).message);
  }
}

// Run the loader synchronously-ish before client creation
await ensureEnvLoaded();

// Now pick the key again
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = findSupabaseKey();

// Debug output (SAFE): show which env names exist (not printing secret values)
const candidateNames = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_KEY',
  'VITE_SUPABASE_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
  'SUPABASE_URL',
  'BLUESKY_USERNAME',
  'BLUESKY_PASSWORD',
];

const present = candidateNames.filter((n) => !!process.env[n]);
console.log('[DEBUG] Present env variable NAMES:', present);
console.log('[DEBUG] SUPABASE_URL present?', SUPABASE_URL ? 'YES' : 'NO');
console.log('[DEBUG] SUPABASE_KEY detected?', SUPABASE_KEY ? `YES (len=${SUPABASE_KEY.length})` : 'NO');

// If still missing, fail with a clear message and helpful hints
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing Supabase env values. Required: SUPABASE_URL and one of: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY, VITE_SUPABASE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY');
  console.error('Present env names:', present.join(', ') || '(none)');
  // throw to stop startup (Supabase client would have thrown the generic error anyway)
  throw new Error('Supabase environment variables are not available in this runtime.');
}

// ---------------- Supabase Setup ----------------
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
/*
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
*/
async function backfillAll(username: string) {
  // Get the last cursor from your database (if you saved it)
  // Or start from the beginning
  let cursor: string | undefined = undefined;
  let totalFetched = 0;
  let totalNew = 0;
  let iteration = 0;

  console.log(`🔄 Starting complete backfill for @${username}...`);

  while (true) {
    iteration++;
    console.log(`\n--- Iteration ${iteration} ---`);
    
    try {
      const res = await agent.api.app.bsky.feed.getAuthorFeed({
        actor: username,
        cursor, // ← This moves forward through time
        limit: 50,
      });

      const feed = res.data.feed;
      console.log(`📦 Fetched ${feed.length} posts from API`);
      
      if (!feed.length) {
        console.log('⚠️ No more posts available');
        break;
      }

      const rows = feed.map((item: any) => ({
        uri: item.post.uri,
        cid: item.post.cid,
        text: item.post.record?.text ?? '',
        author: item.post.author.handle,
        indexedAt: item.post.indexedAt,
      }));
      console.log("[DEBUG] Writing to table:", "be_posts_input");
      // Check which posts are new
      const { data: existing } = await supabase
        .from('be_posts_input')
        .select('uri')
        .in('uri', rows.map(r => r.uri));

      const existingUris = new Set(existing?.map(p => p.uri) || []);
      const newRows = rows.filter(r => !existingUris.has(r.uri));

      
      
      if (newRows.length > 0) {
        const { error } = await supabase
          .from('be_posts_input')
          .insert(newRows); // ← Use INSERT for truly new posts

        if (error) {
          console.error('❌ Supabase error:', error);
          break;
        }
        
        totalNew += newRows.length;
        console.log(`Inserted ${newRows.length} NEW posts (${rows.length - newRows.length} already existed)`);
      } else {
        console.log(`All ${rows.length} posts already exist, continuing...`);
      }
      
      totalFetched += feed.length;
      console.log(`Total processed: ${totalFetched} | Total new: ${totalNew}`);

      cursor = res.data.cursor;
      console.log(`Cursor: ${cursor ? 'exists' : 'NONE'}`);
      
      if (!cursor) {
        console.log('Reached end of user\'s timeline');
        break;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      console.error('❌ Error in iteration:', err);
      break;
    }
  }

  console.log(`\nBackfill complete!`);
  console.log(`Processed: ${totalFetched} posts`);
  console.log(`New posts added: ${totalNew}`);
  console.log(`Already existed: ${totalFetched - totalNew}`);
}
// ---------------- Main Execution ----------------
async function main() {
  await login(); // Automatically logs in and sets JWT
  //this is for specific users --> can add more 
  await backfillAll('bsky.app'); 
  await backfillAll('fema.govmirrors.com');
  await backfillAll('sara012345.bsky.social');
}

main().catch(console.error);
