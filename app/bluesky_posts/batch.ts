import WebSocket from "ws";
//import cborToLexRecord from "@atproto/api";
import { createClient } from "@supabase/supabase-js";
import { cborDecode } from "@atproto/common";
import type { AppBskyFeedPost } from "@atproto/api";


const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // service role for writes
const supabase = createClient(supabaseUrl, supabaseKey);

const FIREHOSE_URL = "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos";

// Buffer config
const BATCH_SIZE = 50;   // insert every 50 posts
const FLUSH_INTERVAL = 5000; // or every 5s

// In-memory buffer
interface PostRow {
  timestamp: string;   // ISO 8601 timestamp
  content: string;
}

let buffer: PostRow[] = [];
let flushing = false;

async function flushBuffer() {
  if (flushing || buffer.length === 0) return;
  flushing = true;

  const toInsert = buffer.splice(0, BATCH_SIZE);

  try {
    const { error } = await supabase.from("posts").insert(toInsert);
    if (error) {
      console.error("Insert error:", error);
      buffer = toInsert.concat(buffer);
    } else {
      console.log(`Inserted ${toInsert.length} posts`);
    }
  } catch (err) {
    console.error("Unexpected insert failure:", err);
    buffer = toInsert.concat(buffer);
  } finally {
    flushing = false;
  }
}


// Periodic flush (time-based)
setInterval(() => {
  if (buffer.length > 0) flushBuffer();
}, FLUSH_INTERVAL);

interface CommitOp {
  action: string;
  path: string;
  cid?: string;
  record?: PostRow;
}

interface CommitMsg {
  seq: number;
  repo: string;
  time: string;
  commit?: {
    ops: CommitOp[];
  };
}

const ws = new WebSocket(FIREHOSE_URL);

ws.on("open", () => {
  console.log("Connected to Bluesky firehose");
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString()) as CommitMsg;
    if (!msg.commit?.ops) return;

    for (const op of msg.commit.ops) {
      if (op.path.startsWith("app.bsky.feed.post") && op.action === "create" && op.record) {
        try {
          const record = cborDecode(op.record) as AppBskyFeedPost.Record;

          if (record?.text) {
            buffer.push({
              content: record.text,
              timestamp: record.createdAt ?? msg.time,
            });

            // Flush immediately if buffer is too big
            if (buffer.length >= BATCH_SIZE) flushBuffer();
          }
        } catch (err) {
          console.error("Decode error:", err);
        }
      }
    }
  } catch (err) {
    console.error("Parse error:", err);
  }
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err);
});

ws.on("close", () => {
  console.log("Disconnected from firehose");
});
