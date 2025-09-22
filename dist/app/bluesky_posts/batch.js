"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
require("dotenv/config");
const supabase_js_1 = require("@supabase/supabase-js");
const common_1 = require("@atproto/common");
// Load Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
}
console.log("Supabase URL loaded:", !!supabaseUrl);
console.log("Supabase Service Key loaded:", !!supabaseKey);
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Buffer config
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 5000;
const MAX_BUFFER_SIZE = 500; // Prevent memory overload
let buffer = [];
let flushing = false;
// Flush buffer to Supabase
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
// Periodic flush
setInterval(() => {
    if (buffer.length > 0)
        flushBuffer();
}, FLUSH_INTERVAL);
// WebSocket connection
const FIREHOSE_URL = "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos";
const ws = new ws_1.default(FIREHOSE_URL);
ws.on("open", () => {
    console.log("Connected to Bluesky firehose");
});
ws.on("message", (data) => {
    try {
        // Only parse string messages
        if (typeof data === "string") {
            const msg = JSON.parse(data);
            if (!msg.commit?.ops)
                return;
            for (const op of msg.commit.ops) {
                if (op.path.startsWith("app.bsky.feed.post") && op.action === "create" && op.record) {
                    try {
                        const record = (0, common_1.cborDecode)(op.record);
                        if (record?.text) {
                            if (buffer.length < MAX_BUFFER_SIZE) {
                                buffer.push({
                                    content: record.text,
                                    timestamp: record.createdAt ?? msg.time,
                                });
                            }
                            else {
                                // drop extra posts if buffer is full
                                console.warn("Buffer full, dropping post");
                            }
                            if (buffer.length >= BATCH_SIZE)
                                flushBuffer();
                        }
                    }
                    catch (err) {
                        if (err instanceof Error)
                            console.error("Decode error:", err.message);
                    }
                }
            }
            if (buffer.length >= BATCH_SIZE)
                flushBuffer();
        }
        // Silently ignore binary/CBOR messages
    }
    catch (err) {
        // Silently ignore invalid JSON
    }
});
ws.on("error", (err) => {
    console.error("WebSocket error:", err);
});
ws.on("close", (code, reason) => {
    console.log(`Disconnected from firehose. Code: ${code}, Reason: ${reason}`);
});
// Handle uncaught exceptions
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
