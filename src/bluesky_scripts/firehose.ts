import { Jetstream } from '@skyware/jetstream';
import { BskyAgent } from "@atproto/api";
import { createClient } from '@supabase/supabase-js';
import { franc } from 'franc-min';
import dotenv from 'dotenv';
dotenv.config();
import WebSocket from "ws";


// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables!');
  console.error('Please set SUPABASE_URL and SUPABASE_KEY');
  console.error('\nCurrent values:');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL || 'NOT SET');
  console.error('SUPABASE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  process.exit(1);
}
// Configuration
const CONFIG = {
  // Supabase credentials
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  
  // Filter settings
  KEYWORDS: ['vehicle collision', 'freeway crash', 'highway crash', 'mult-car pileup', 'traffic fatality', 'drunk driving',
    'wildfire', 'smoke plume', 'fire containment',
    'flash flood warning', 'storm surge', 
    'earthquake', 'epicenter', 'seismic activity', 'seismic tremor', 'richter magnitude',
    'hail damage', 'lightning', 'downed power lines', 'wind gusts', 'thunderstorm warning', 'thunderstorm watch', 'severe thunder',
    'active shooter', 'mass shooting', 'polic standoff',
    'tornado', 'funnel cloud', 'record winds',
    'hurricane', 'category 3', 'category 4', 'category 5', 'landfall', 'coastal evacuation',
    'extreme heat', 'record temperature', 'cooling center',
    'heavy rainfall', 'tropical depression',
    'chemical spill', 'train derailment', 'gas explosion', 'building collapse'
  ],
  LANGUAGES: ['eng'], 
  TRACKED_ACCOUNTS: ['nws.noaa.gov', 'fema.govmirrors.com', 'actionnews5.com', 'npr.org', 'sacurrent.bsky.social', 'calfire.bsky.social', 'cbssundaymorning.bsky.social', 'ucanr.edu',
    'massdfs.bsky.social', 'denverpolice.bsky.social'],

  MAX_POSTS: 10000, // TODO: change to 1000

};

// Initialize Supabase client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

const agent = new BskyAgent({ service: "https://api.bsky.app" });

// Counter for collected posts
let collectedPosts = 0;

const DIDcache = new Map <string, string> ();
const handleCache = new Map<string, string>();

async function getTrackedAccountDIDs(): Promise<Set<string>> {
    const dids = new Set<string>();
  
  for (const account of CONFIG.TRACKED_ACCOUNTS) {
    try {
      // Resolve handle to DID
        const profile = await agent.resolveHandle({ handle: account });
        dids.add(profile.data.did);
        DIDcache.set(account, profile.data.did);
        console.log(`Resolved ${account} -> ${profile.data.did}`);
      
    } catch (error: any) {
      // Handle specific error types
      if (error?.error === 'AccountTakedown') {
        console.warn(`⚠️  Account suspended/taken down: ${account} - skipping`);
      } else if (error?.message?.includes('Unable to resolve handle')) {
        console.warn(`⚠️  Account not found: ${account} - check handle spelling`);
      } else {
        console.error(`❌ Failed to resolve account ${account}:`, error?.message || error);
      }
    } 
}
  return dids;
}

function shouldCollectPost(event: any, text: string, trackedDIDs: Set<string>): boolean {
  // Always collect if author is in tracked accounts
  if (trackedDIDs.has(event.did)) {
    return true;
  }
  
  // Otherwise, check keyword and language filters
  return matchesKeywords(text, CONFIG.KEYWORDS) && matchesLanguage(text, CONFIG.LANGUAGES);
}

// Language detection helper
function detectLanguage(text: string): string {
  if (!text || text.length < 10) return 'unknown';
  const lang = franc(text);
  return lang === 'und' ? 'unknown' : lang;
}

// Keyword filter helper
function matchesKeywords(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true; // No filter
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
}

// Language filter helper
function matchesLanguage(text: string, languages: string[]): boolean {
  if (languages.length === 0) return true; // No filter
  const detected = detectLanguage(text);
  return languages.includes(detected);
}

// Main function
async function startFirehose() {
  console.log('Starting Bluesky Firehose...');
  console.log(`Config: Max ${CONFIG.MAX_POSTS} posts`);
  console.log(`Keywords: ${CONFIG.KEYWORDS.length ? CONFIG.KEYWORDS.join(', ') : 'ALL'}`);
  console.log(`Languages: ${CONFIG.LANGUAGES.length ? CONFIG.LANGUAGES.join(', ') : 'ALL'}`);
  console.log(`Tracked Accounts: ${CONFIG.TRACKED_ACCOUNTS.length ? CONFIG.TRACKED_ACCOUNTS.join(', ') : 'NONE'}`);

  console.log('---');
  
  console.log('🔄 Resolving tracked accounts...');
  const trackedDIDs = await getTrackedAccountDIDs();
  console.log(`Tracking ${trackedDIDs.size} accounts`);
  console.log('---');

  const jetstream = new Jetstream({
    wantedCollections: ['app.bsky.feed.post'],
    ws: WebSocket,
  });

  jetstream.on('commit', async (event: any) => {
    // Stop if we've reached the limit
    if (collectedPosts >= CONFIG.MAX_POSTS) {
      console.log(`Reached limit of ${CONFIG.MAX_POSTS} posts. Stopping...`);
      jetstream.close();
      process.exit(0);
    }

    // Only process posts
    if (event.commit.collection !== 'app.bsky.feed.post') return;
    
    //get post text
    const record = event.commit.record;
    const text = record?.text || '';

    // Skip posts without text
    if (!text) return;

    // Apply keyword filter
    if (!shouldCollectPost(event, text, trackedDIDs)) return;

    //get author handle using @atproto/api
    //const authorData = await agent.getProfile({ actor: event.did });
    //const authorHandle = authorData.data.handle;

    const isTrackedAccount = trackedDIDs.has(event.did);
    
    // Get author handle - use cache first, then API call if needed
    let authorHandle: string;
    if (handleCache.has(event.did)) {
      authorHandle = handleCache.get(event.did)!;
    } else {
      try {
        const authorData = await agent.getProfile({ actor: event.did });
        authorHandle = authorData.data.handle;
        handleCache.set(event.did, authorHandle);
      } catch (error: any) {
        if (error?.error === 'AccountTakedown') {
          console.warn(`⚠️  Skipping post from suspended account: ${event.did}`);
        } else {
          console.warn(`⚠️  Skipping post, failed to get handle for ${event.did}:`, error?.message);
        }
        return;
      }
    }
    

    // Prepare data for insertion matching your table structure
    const postData = {
      uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
      cid: event.commit.cid,
      author: authorHandle,
      text: text,
      indexed_at: record.createdAt, // Use the post's original creation timestamp
      // status will default to 'pending' from your table default
    };

    // Insert into Supabase (with duplicate skip)
    const { error } = await supabase
      .from('be_posts_input')
      .insert(postData);

    if (error) {
      // If duplicate, skip silently (PostgreSQL error code 23505)
      if (error.code === '23505') {
        return;
      }
      console.error('❌ Insert error:', error.message);
    } else {
      collectedPosts++;
      //console.log(`✅ [${collectedPosts}/${CONFIG.MAX_POSTS}] Saved post from ${authorHandle}...`);
      //console.log(`   "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`);
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

// Run the script
startFirehose();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Shutting down gracefully...');
  console.log(`📊 Total posts collected: ${collectedPosts}`);
  process.exit(0);
});
