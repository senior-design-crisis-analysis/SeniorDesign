import { BskyAgent } from "@atproto/api";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

// Configuration
const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  BATCH_SIZE: 1000, // Process 1000 posts at a time
  DELAY_BETWEEN_REQUESTS: 100, // 100ms delay between API calls (rate limiting)
};

// Initialize clients
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
const agent = new BskyAgent({ service: "https://api.bsky.app" });

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Update author handle for a single post
async function updatePostAuthor(uri: string): Promise<{ success: boolean; author?: string; error?: string }> {
  try {
    const postThread = await agent.getPostThread({ uri });
    
    if (!postThread.data.thread.post) {
      return { success: false, error: 'Post not found' };
    }

    const post = postThread.data.thread.post;
    const authorHandle = post.author.handle;

    // Update in database
    const { error } = await supabase
      .from('be_extracted_info_output')
      .update({ author: authorHandle })
      .eq('uri', uri);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, author: authorHandle };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Main function
async function updateAllAuthors() {
  console.log('🚀 Starting author handle updater...');
  console.log(`📊 Batch size: ${CONFIG.BATCH_SIZE}`);
  console.log('---\n');

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  let hasMore = true;
  let offset = 0;

  while (hasMore) {
    console.log(`Fetching batch starting at offset ${offset}...`);
    
    // Fetch batch of posts
    const { data: posts, error } = await supabase
      .from('be_extracted_info_output')
      .select('uri')
      .order('indexed_at', { ascending: false })
      .range(offset, offset + CONFIG.BATCH_SIZE - 1);

    if (error) {
      console.error('❌ Error fetching posts:', error.message);
      break;
    }

    if (!posts || posts.length === 0) {
      hasMore = false;
      console.log('No more posts to process');
      break;
    }

    console.log(`   Found ${posts.length} posts in this batch`);

    // Process each post in the batch
    for (const post of posts) {
      totalProcessed++;
      
      const result = await updatePostAuthor(post.uri);
      
      if (result.success) {
        totalUpdated++;
        console.log(`[${totalProcessed}] Updated ${post.uri.slice(0, 50)}...`);
        console.log(`   Author: ${result.author}`);
      } else {
        totalFailed++;
        console.log(`❌ [${totalProcessed}] Failed ${post.uri.slice(0, 50)}...`);
        console.log(`   Error: ${result.error}`);
      }

      // Rate limiting delay
      await sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
    }

    // Move to next batch
    offset += CONFIG.BATCH_SIZE;

    // Check if we got fewer posts than batch size (means we're done)
    if (posts.length < CONFIG.BATCH_SIZE) {
      hasMore = false;
    }

    console.log(`\n📊 Progress: ${totalUpdated} updated, ${totalFailed} failed, ${totalProcessed} total\n`);
  }

  console.log('\n🎉 Author update complete!');
  console.log(`Successfully updated: ${totalUpdated}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`Total processed: ${totalProcessed}`);
}

// Run the script
updateAllAuthors()
  .then(() => {
    console.log('\nScript finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Shutting down gracefully...');
  process.exit(0);
});