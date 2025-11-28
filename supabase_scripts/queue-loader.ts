// import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
// const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
// const BATCH_SIZE = 5;
// Deno.serve(async ()=>{
//   const loaderStart = Date.now();
//   console.log(`[queue-loader] START - ${new Date().toISOString()}`);
//   try {
//     /* 1. Check input table */ const inputFetchStart = Date.now();
//     const { data: inputRows, error: inputError } = await supabase.from("be_posts_input").select("uri, text, indexed_at, author, cid").order("indexed_at", {
//       ascending: true
//     }).limit(BATCH_SIZE);
//     const inputFetchTime = Date.now() - inputFetchStart;
//     console.log(`[queue-loader] Input fetch: ${inputFetchTime}ms`);
//     if (inputError) {
//       console.error("[queue-loader] Error reading input table:", inputError);
//       throw inputError;
//     }
//     if (!inputRows || inputRows.length === 0) {
//       const totalTime = Date.now() - loaderStart;
//       console.log(`[queue-loader] COMPLETED (empty) in: ${totalTime}ms`);
//       return new Response(JSON.stringify({
//         moved: 0,
//         processing_time_ms: totalTime,
//         message: "No rows to move"
//       }), {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       });
//     }
//     console.log(`[queue-loader] Found ${inputRows.length} rows in input table`);
//     /* 2. Check for duplicates in queue */ const duplicateCheckStart = Date.now();
//     const uris = inputRows.map((row)=>row.uri);
//     const { data: existingQueueRows } = await supabase.from("processing_queue").select("uri").in("uri", uris);
//     const duplicateCheckTime = Date.now() - duplicateCheckStart;
//     console.log(`[queue-loader] Duplicate check: ${duplicateCheckTime}ms`);
//     const existingUris = new Set((existingQueueRows ?? []).map((row)=>row.uri));
//     const rowsToMove = inputRows.filter((row)=>!existingUris.has(row.uri));
//     if (rowsToMove.length === 0) {
//       const totalTime = Date.now() - loaderStart;
//       console.log(`[queue-loader] COMPLETED (all duplicates) in: ${totalTime}ms`);
//       return new Response(JSON.stringify({
//         moved: 0,
//         processing_time_ms: totalTime,
//         message: "All rows already in queue"
//       }), {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       });
//     }
//     console.log(`[queue-loader] Moving ${rowsToMove.length} rows to queue`);
//     /* 3. Insert into queue */ const queueJobs = rowsToMove.map((row)=>({
//         uri: row.uri,
//         post_text: row.text,
//         status: 'pending',
//         attempts: 0,
//         indexed_at: row.indexed_at || new Date().toISOString(),
//         author: row.author,
//         cid: row.cid
//       }));
//     const queueInsertStart = Date.now();
//     const { error: insertError } = await supabase.from("processing_queue").insert(queueJobs);
//     const queueInsertTime = Date.now() - queueInsertStart;
//     console.log(`[queue-loader] Queue insert: ${queueInsertTime}ms`);
//     if (insertError) {
//       console.error("[queue-loader] Error inserting into queue:", insertError);
//       throw insertError;
//     }
//     /* 4. Delete from input table */ const deleteStart = Date.now();
//     const movedUris = rowsToMove.map((row)=>row.uri);
//     const { error: deleteError } = await supabase.from("be_posts_input").delete().in('uri', movedUris);
//     const deleteTime = Date.now() - deleteStart;
//     console.log(`[queue-loader] Input delete: ${deleteTime}ms`);
//     const totalTime = Date.now() - loaderStart;
//     console.log(`[queue-loader] SUCCESS - Moved ${rowsToMove.length} rows in ${totalTime}ms`);
//     console.log(`[queue-loader] COMPLETED in: ${totalTime}ms`);
//     return new Response(JSON.stringify({
//       moved: rowsToMove.length,
//       uris: movedUris,
//       processing_time_ms: totalTime,
//       steps: {
//         input_fetch: inputFetchTime,
//         duplicate_check: duplicateCheckTime,
//         queue_insert: queueInsertTime,
//         input_delete: deleteTime
//       },
//       message: `Successfully moved ${rowsToMove.length} rows to queue in ${totalTime}ms`
//     }), {
//       headers: {
//         "Content-Type": "application/json"
//       }
//     });
//   } catch (error) {
//     const totalTime = Date.now() - loaderStart;
//     console.error(`[queue-loader] ERROR in ${totalTime}ms:`, error);
//     return new Response(JSON.stringify({
//       error: error.message,
//       moved: 0,
//       processing_time_ms: totalTime,
//       message: "Failed to move rows"
//     }), {
//       status: 500,
//       headers: {
//         "Content-Type": "application/json"
//       }
//     });
//   }
// });