import WebSocket from "ws";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { cborDecode } from "@atproto/common";
import type { AppBskyFeedPost } from "@atproto/api";

// Load Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables.");
}

console.log("Supabase URL loaded:", !!supabaseUrl);
console.log("Supabase Service Key loaded:", !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

// Buffer config
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 5000;
const MAX_BUFFER_SIZE = 500; // Prevent memory overload

// In-memory buffer
interface PostRow {
  timestamp: string;
  content: string;
}

let buffer: PostRow[] = [];
let flushing = false;

// Flush buffer to Supabase
async function flushBuffer() {
  if (flushing || buffer.length === 0) return;
  flushing = true;

  const toInsert = buffer.splice(0, BATCH_SIZE);
  
  try {
    const { error } = await supabase.from("posts").insert(toInsert);
    if (error) {
      console.error("Insert error:", error);
      buffer = toInsert.concat(buffer); // Re-add failed inserts
    } else {
      console.log(`Inserted ${toInsert.length} post(s) into Supabase.`);
    }
  } catch (err) {
    console.error("Unexpected insert failure:", err);
    buffer = toInsert.concat(buffer);
  } finally {
    flushing = false;
  }
}

// Periodic flush
setInterval(() => {
  if (buffer.length > 0) flushBuffer();
}, FLUSH_INTERVAL);

// Commit interfaces
interface CommitOp {
  action: string;
  path: string;
  cid?: string;
  record?: unknown;
}

interface CommitMsg {
  seq: number;
  repo: string;
  time: string;
  commit?: { ops: CommitOp[] };
}

// WebSocket connection
const FIREHOSE_URL = "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos";
const ws = new WebSocket(FIREHOSE_URL);

ws.on("open", () => {
  console.log("Connected to Bluesky firehose");
});

// WebSocket message handler
ws.on("message", (data: WebSocket.RawData) => {
  // Ignore binary/CBOR messages entirely
  if (typeof data !== "string") return;

  let msg: CommitMsg;
  try {
    msg = JSON.parse(data) as CommitMsg;
  } catch {
    return; // Ignore invalid JSON silently
  }

  if (!msg.commit?.ops) return;

  for (const op of msg.commit.ops) {
    if (op.path.startsWith("app.bsky.feed.post") && op.action === "create" && op.record) {
      try {
        const record = cborDecode(op.record) as AppBskyFeedPost.Record;
        if (!record?.text) continue;

        if (buffer.length < MAX_BUFFER_SIZE) {
          buffer.push({
            content: record.text,
            timestamp: record.createdAt ?? msg.time,
          });
        } else {
          console.warn("Buffer full, dropping post");
        }

        if (buffer.length >= BATCH_SIZE) flushBuffer();
      } catch (err: unknown) {
        if (err instanceof Error) console.error("Decode error:", err.message);
      }
    }
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
