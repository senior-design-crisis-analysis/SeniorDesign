"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
//import cborToLexRecord from "@atproto/api";
const supabase_js_1 = require("@supabase/supabase-js");
const common_1 = require("@atproto/common");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role for writes
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
const FIREHOSE_URL = "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos";
const ws = new ws_1.default(FIREHOSE_URL);
// Buffer config
const BATCH_SIZE = 50; // insert every 50 posts
const FLUSH_INTERVAL = 5000; // or every 5s
let buffer = [];
let flushing = false;
async function flushBuffer() {
    if (flushing || buffer.length === 0)
        return;
    flushing = true;
    const toInsert = buffer.splice(0, BATCH_SIZE);
    try {
        const { error } = await supabase.from("posts").insert(toInsert);
        if (error) {
            console.error("Insert error:", error);
            buffer = toInsert.concat(buffer);
        }
        else {
            console.log(`Inserted ${toInsert.length} posts`);
        }
    }
    catch (err) {
        console.error("Unexpected insert failure:", err);
        buffer = toInsert.concat(buffer);
    }
    finally {
        flushing = false;
    }
}
// Periodic flush (time-based)
setInterval(() => {
    if (buffer.length > 0)
        flushBuffer();
}, FLUSH_INTERVAL);
ws.on("open", () => {
    console.log("Connected to Bluesky firehose");
});
ws.on("message", (data) => {
    try {
        const msg = JSON.parse(data.toString());
        if (!msg.commit?.ops)
            return;
        for (const op of msg.commit.ops) {
            if (op.path.startsWith("app.bsky.feed.post") && op.action === "create" && op.record) {
                try {
                    const record = (0, common_1.cborDecode)(op.record);
                    if (record?.text) {
                        buffer.push({
                            content: record.text,
                            timestamp: record.createdAt ?? msg.time,
                        });
                        // Flush immediately if buffer is too big
                        if (buffer.length >= BATCH_SIZE)
                            flushBuffer();
                    }
                }
                catch (err) {
                    console.error("Decode error:", err);
                }
            }
        }
    }
    catch (err) {
        console.error("Parse error:", err);
    }
});
ws.on("error", (err) => {
    console.error("WebSocket error:", err);
});
ws.on("close", () => {
    console.log("Disconnected from firehose");
});
