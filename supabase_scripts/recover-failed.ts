// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// const BATCH_SIZE = 6;

// serve(async (req)=>{
//   const client = new Client(Deno.env.get("SUPABASE_DB_URL"));
//   await client.connect();
//   try {
//     await client.queryObject`BEGIN`;
//     // 1. pick rows
//     const { rows: picked } = await client.queryObject`
//       SELECT uri, post_text, attempts, error_message, author, cid
//       FROM public.failed_classifications
//       ORDER BY last_attempt ASC
//       LIMIT ${BATCH_SIZE}
//       FOR UPDATE SKIP LOCKED;
//     `;
//     if (picked.length === 0) {
//       await client.queryObject`COMMIT`;
//       return new Response(JSON.stringify({
//         moved: 0
//       }), {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       });
//     }
//     const uris = picked.map((r)=>r.uri);
//     // 2. insert into queue (map error_message -> error_message)
//     await client.queryObject`
//       INSERT INTO public.processing_queue
//         (post_text, uri, attempts, error_message, status, author, cid)
//       SELECT post_text,
//              uri,
//              attempts,
//              error_message,
//              'pending',
//              author, 
//              cid
//       FROM public.failed_classifications
//       WHERE uri = ANY (${uris})
//       ON CONFLICT (uri) DO NOTHING;
//     `;
//     // 3. delete from failed
//     await client.queryObject`
//       DELETE FROM public.failed_classifications
//       WHERE uri = ANY (${uris});
//     `;
//     await client.queryObject`COMMIT`;
//     return new Response(JSON.stringify({
//       moved: picked.length
//     }), {
//       headers: {
//         "Content-Type": "application/json"
//       }
//     });
//   } catch (err) {
//     await client.queryObject`ROLLBACK`;
//     console.error("recover-failed error:", err);
//     return new Response(JSON.stringify({
//       error: err.message
//     }), {
//       status: 500,
//       headers: {
//         "Content-Type": "application/json"
//       }
//     });
//   } finally{
//     await client.end();
//   }
// });