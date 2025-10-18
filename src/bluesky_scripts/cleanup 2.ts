import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// Language detection library
import { franc } from 'franc-min'; // npm install franc-min

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteNonEnglishPosts() {
  console.log('🔍 Analyzing posts for language...');
  
  // Get all posts
  const { data: posts, error } = await supabase
    .from('be-posts_input')
    .select('uri, text');
  
  if (error || !posts) {
    console.error('Error fetching posts:', error);
    return;
  }
  
  console.log(`📊 Analyzing ${posts.length} posts...`);
  
  const nonEnglishUris: string[] = [];
  let processed = 0;
  
  for (const post of posts) {
    // Detect language from text
    const lang = franc(post.text, { minLength: 10 });
    
    // franc returns 'eng' for English, 'und' for undefined
    if (lang !== 'eng' && lang !== 'und') {
      nonEnglishUris.push(post.uri);
    }
    
    processed++;
    if (processed % 100 === 0) {
      console.log(`✅ Analyzed ${processed}/${posts.length}`);
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`✅ English posts: ${posts.length - nonEnglishUris.length}`);
  console.log(`❌ Non-English posts: ${nonEnglishUris.length}`);
  
  if (nonEnglishUris.length === 0) {
    console.log('🎉 No non-English posts to delete!');
    return;
  }
  
  // Delete in batches (Supabase has limits)
  const batchSize = 1000;
  let deleted = 0;
  
  for (let i = 0; i < nonEnglishUris.length; i += batchSize) {
    const batch = nonEnglishUris.slice(i, i + batchSize);
    
    const { error: deleteError } = await supabase
      .from('be-posts_input')
      .delete()
      .in('uri', batch);
    
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
    } else {
      deleted += batch.length;
      console.log(`🗑️ Deleted ${deleted}/${nonEnglishUris.length}`);
    }
  }
  
  console.log(`\n🎉 Cleanup complete! Deleted ${deleted} non-English posts`);
}

deleteNonEnglishPosts().catch(console.error);