//src/bluesky_scripts/keywordsearch.ts
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
  //const password = process.env.BLUESKY_PASSWORD!;

  //const session = await agent.login({ identifier: username, password });
  console.log('✅ Logged in as', username);
  console.log('Access token (JWT) stored in agent for requests');
}
// scrape by keyword search method
async function scrapeBySearch(query: string, maxPosts: number = 1000) {
  console.log(`\n🔍 Searching for: "${query}"`);
  console.log(`🎯 Target: ${maxPosts} posts`);
  
  let cursor: string | undefined;
  let totalFetched = 0;
  let totalNew = 0;
  let iteration = 0;

  while (totalFetched < maxPosts) {
    iteration++;
    console.log(`\n--- Iteration ${iteration} ---`);

    try {
      const res = await agent.api.app.bsky.feed.searchPosts({
        q: query,
        cursor,
        limit: 100, // Max limit per request
      });

      const posts = res.data.posts;
      console.log(`📦 Fetched ${posts.length} posts from API`);
      
      if (!posts.length) {
        console.log('⚠️ No more posts found');
        break;
      }

      // Transform posts to match your DB schema
      const rows = posts.map((post: any) => ({
        uri: post.uri,
        cid: post.cid,
        text: post.record?.text || '',
        author: post.author.handle,
        indexedAt: post.indexedAt,
      }));

      // Check which posts already exist
      const { data: existing } = await supabase
        .from('be-posts_input')
        .select('uri')
        .in('uri', rows.map(r => r.uri));

      const existingUris = new Set(existing?.map(p => p.uri) || []);
      const newRows = rows.filter(r => !existingUris.has(r.uri));

      console.log(`🔍 Found ${newRows.length} new posts out of ${rows.length}`);

      // Insert only new posts
      if (newRows.length > 0) {
        const { error } = await supabase
          .from('be-posts_input')
          .insert(newRows);

        if (error) {
          console.error('❌ Supabase insert error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          break;
        }

        totalNew += newRows.length;
        console.log(`✅ Inserted ${newRows.length} new posts`);
      } else {
        console.log(`⏭️ All posts already exist, continuing...`);
      }

      totalFetched += posts.length;
      console.log(`📊 Progress: ${totalFetched}/${maxPosts} processed | ${totalNew} new posts added`);

      cursor = res.data.cursor;
      console.log(`📍 Cursor: ${cursor ? 'exists' : 'NONE'}`);

      if (!cursor) {
        console.log('⚠️ No more results available for this query');
        break;
      }

      // Rate limiting - be respectful
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error('❌ Error in iteration:', err);
      break;
    }
  }

  console.log(`\n🎉 Search complete for "${query}"`);
  console.log(`📊 Total processed: ${totalFetched} posts`);
  console.log(`✨ New posts added: ${totalNew}`);
  console.log(`🔄 Already existed: ${totalFetched - totalNew}`);
  
  return totalNew;
}

// ---------------- Scrape Multiple Topics ----------------
async function scrapeMultipleTopics(queries: string[], maxPerQuery: number = 500) {
  await login();

  let grandTotal = 0;

  for (const query of queries) {
    const newPosts = await scrapeBySearch(query, maxPerQuery);
    grandTotal += newPosts;
    
    // Wait between different queries
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n🎊 ALL SEARCHES COMPLETE!`);
  console.log(`🌟 Grand total: ${grandTotal} new posts added`);
}


// ---------------- Main Execution ----------------
async function main() {
  await login(); // Automatically logs in and sets JWT
  //this is for specific users --> can add more 

let topics: string[] = ["disaster", "rain", "tornado"];
scrapeMultipleTopics(topics, 500);

}

main().catch(console.error);
