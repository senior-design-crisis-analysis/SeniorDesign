"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// app/bluesky_posts/backfill.ts
const api_1 = require("@atproto/api");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ---------------- Supabase Setup ----------------
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key for inserts
);
// ---------------- Bluesky Agent ----------------
const agent = new api_1.BskyAgent({ service: 'https://bsky.social' });
// ---------------- Login Function ----------------
async function login() {
    const username = process.env.BLUESKY_USERNAME;
    const password = process.env.BLUESKY_PASSWORD;
    const session = await agent.login({ identifier: username, password });
    console.log('✅ Logged in as', username);
    console.log('Access token (JWT) stored in agent for requests');
}
// ---------------- Backfill Function ----------------
async function backfill(username, limit = 100) {
    console.log(`🔄 Backfilling posts for @${username}...`);
    let cursor = undefined;
    let fetched = 0;
    while (fetched < limit) {
        const res = await agent.api.app.bsky.feed.getAuthorFeed({
            actor: username,
            cursor,
            limit: 50, // fetch in batches of 50
        });
        const feed = res.data.feed;
        if (!feed.length)
            break;
        // Transform and insert into Supabase
        const rows = feed.map((item) => ({
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
        if (!cursor)
            break; // no more pages
    }
    console.log(`🎉 Finished backfill: ${fetched} posts`);
}
// ---------------- Main Execution ----------------
async function main() {
    await login(); // Automatically logs in and sets JWT
    await backfill('bsky.app', 200); // Replace with target username & total posts
}
main().catch(console.error);
