// import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// import { createClient } from 'jsr:@supabase/supabase-js@^2';
// const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
// const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
// const BATCH_SIZE = 6;
// function delay(ms) {
//   return new Promise((resolve)=>setTimeout(resolve, ms));
// }
// // Helper function to format error logs
// function logError(type, data) {
//   console.log(`ERROR: ${JSON.stringify({
//     type,
//     ...data
//   })}`);
// }
// // Helper function to format normal logs
// function logInfo(type, data) {
//   console.log(JSON.stringify({
//     type,
//     ...data
//   }));
// }
// async function classifyOne(postText) {
//   const classifyStart = Date.now();
//   const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${GROQ_API_KEY}`,
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       model: "qwen/qwen3-32b",
//       temperature: 0.1,
//       max_tokens: 800,
//       messages: [
//         {
//           role: "user",
//           content: `CLASSIFY this social-media post. Output ONLY JSON, no reasoning.\n` + `CATEGORIES: not_relevant, auto_accident, fire, flood, earthquake, severe_storm, shooting, tornado, hurricane, extreme_heat, tropical_storm, other_disaster\n` + `RULES:\n` + `- Hypotheticals/metaphors/jokes → not_relevant\n` + `- News discussions without immediate events → not_relevant\n` + `- Car fires → auto_accident\n` + `- Infrastructure discussions → not_relevant\n` + `- Help requests (asking for assistance/rescue) → set help_request to true\n` + `- Choose most specific applicable category\n` + `- Extract location names from text if mentioned\n` + `- Estimate coordinates only if specific location is clear\n` + `- Assess severity based on impact/urgency described\n` + `JSON: {\n` + `  "disaster_type": "",\n` + `  "severity_level": "low/medium/high",\n` + `  "location_mentioned": "text/null",\n` + `  "latitude": number/null,\n` + `  "longitude": number/null,\n` + `  "model_confidence": 0.0-1.0,\n` + `  "help_request": true/false\n` + `}\n` + `Post: "${postText}"`
//         }
//       ]
//     })
//   });
//   if (!groqRes.ok) {
//     const txt = await groqRes.text();
//     throw new Error(`Groq HTTP ${groqRes.status} – ${txt}`);
//   }
//   const raw = await groqRes.json();
//   const content = raw.choices[0].message.content;
//   const jsonStr = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
//   const classifyTime = Date.now() - classifyStart;
//   return {
//     data: JSON.parse(jsonStr),
//     classifyTime: classifyTime
//   };
// }
// Deno.serve(async ()=>{
//   const cronStart = Date.now();
//   logInfo("worker_start", {
//     timestamp: new Date().toISOString(),
//     batch_size: BATCH_SIZE
//   });
//   // 1. Get URIs already classified
//   const { data: doneRows } = await supabase.from("be_extracted_info_output").select("uri");
//   const doneSet = new Set((doneRows ?? []).map((d)=>d.uri));
//   // 2. Get jobs from processing queue
//   const { data: queueRows, error: fetchErr } = await supabase.from("processing_queue").select("*").order("indexed_at", {
//     ascending: true
//   }).limit(BATCH_SIZE);
//   if (fetchErr) {
//     logError("queue_fetch_error", {
//       error: fetchErr.message
//     });
//     return new Response(JSON.stringify({
//       msg: "select failed",
//       error: fetchErr
//     }), {
//       headers: {
//         "Content-Type": "application/json"
//       },
//       status: 500
//     });
//   }
//   const todo = (queueRows ?? []).filter((r)=>!doneSet.has(r.uri));
//   logInfo("processing_start", {
//     total_todo: todo.length,
//     queue_fetched: queueRows?.length || 0,
//     already_processed: queueRows ? queueRows.length - todo.length : 0
//   });
//   if (todo.length === 0) {
//     const totalTime = Date.now() - cronStart;
//     logInfo("nothing_to_process", {
//       processing_time_ms: totalTime
//     });
//     return new Response(JSON.stringify({
//       msg: "Nothing to process",
//       processing_time_ms: totalTime
//     }), {
//       headers: {
//         "Content-Type": "application/json"
//       }
//     });
//   }
//   // 3. Classify + process
//   let successCount = 0;
//   let errorCount = 0;
//   const classificationTimes = [];
//   const results = [];
//   for (const row of todo){
//     const rowStart = Date.now();
//     try {
//       const { data: payload, classifyTime } = await classifyOne(row.post_text);
//       classificationTimes.push(classifyTime);
//       // Create result log with all possible properties
//       const resultLog = {
//         type: "classification_result",
//         uri: row.uri,
//         disaster_type: payload.disaster_type,
//         classification_time: classifyTime,
//         model_confidence: payload.model_confidence,
//         help_request: payload.help_request || false,
//         error: undefined,
//         error_details: undefined,
//         action: undefined
//       };
//       results.push(resultLog);
//       if (payload.disaster_type === "not_relevant") {
//         const { error: delErr } = await supabase.from("processing_queue").delete().eq("uri", row.uri);
//         if (delErr) {
//           resultLog.error = "delete_failed";
//           resultLog.error_details = delErr.message;
//           logError("delete_failed", {
//             uri: row.uri,
//             error: delErr.message
//           });
//         } else {
//           resultLog.action = "deleted_not_relevant";
//           successCount++;
//         }
//       } else {
//         // Insert classification
//         const { error: insErr } = await supabase.from("be_extracted_info_output").insert({
//           uri: row.uri,
//           original_text: row.post_text,
//           author: row.author,
//           indexed_at: row.indexed_at,
//           disaster_type: payload.disaster_type,
//           severity_level: payload.severity_level,
//           location_mentioned: payload.location_mentioned,
//           latitude: payload.latitude,
//           longitude: payload.longitude,
//           model_confidence: payload.model_confidence,
//           help_request: payload.help_request || false,
//           processed_at: new Date().toISOString()
//         });
//         if (insErr) throw insErr;
//         // Remove from queue
//         const { error: delErr } = await supabase.from("processing_queue").delete().eq("uri", row.uri);
//         if (delErr) {
//           resultLog.error = "delete_failed";
//           resultLog.error_details = delErr.message;
//           logError("delete_failed", {
//             uri: row.uri,
//             error: delErr.message
//           });
//         } else {
//           resultLog.action = "processed";
//           successCount++;
//         }
//       }
//       // Log the result (single line per classification)
//       console.log(JSON.stringify(resultLog));
//       const rowTime = Date.now() - rowStart;
//       logInfo("row_completed", {
//         uri: row.uri,
//         total_row_time: rowTime,
//         classification_time: classifyTime
//       });
//       // CRITICAL: Add delay after successful processing (but not after last item)
//       if (row !== todo[todo.length - 1]) {
//         logInfo("adding_delay", {
//           delay_ms: 1500,
//           timestamp: new Date().toISOString()
//         });
//         await delay(1500);
//       }
//     } catch (err) {
//       const msg = err.stack ?? err.message ?? String(err);
//       errorCount++;
//       // Structured error log with ERROR: prefix
//       logError("classification_error", {
//         uri: row.uri,
//         error: msg.substring(0, 200),
//         attempts: (row.attempts ?? 0) + 1
//       });
//       // Record failure in database
//       await supabase.from("failed_classifications").insert({
//         uri: row.uri,
//         post_text: row.post_text,
//         error_message: msg,
//         attempts: (row.attempts ?? 0) + 1,
//         last_attempt: new Date().toISOString(),
//         author: row.author,
//         cid: row.cid
//       });
//       // Remove from queue even on error
//       await supabase.from("processing_queue").delete().eq("uri", row.uri);
//       // CRITICAL: Also add delay after errors (but not after last item)
//       if (row !== todo[todo.length - 1]) {
//         logInfo("adding_delay_after_error", {
//           delay_ms: 1500,
//           timestamp: new Date().toISOString()
//         });
//         await delay(1500);
//       }
//     }
//   // NO DELAY OUTSIDE THE TRY-CATCH BLOCK
//   }
//   // Final summary (single log line)
//   const totalTime = Date.now() - cronStart;
//   const avgClassificationTime = classificationTimes.length > 0 ? classificationTimes.reduce((a, b)=>a + b, 0) / classificationTimes.length : 0;
//   logInfo("worker_summary", {
//     success_count: successCount,
//     error_count: errorCount,
//     total_time_ms: totalTime,
//     avg_classification_time_ms: Math.round(avgClassificationTime),
//     posts_per_minute: (successCount / totalTime * 60000).toFixed(2),
//     batch_size: BATCH_SIZE,
//     efficiency: `${(successCount / todo.length * 100).toFixed(1)}%`
//   });
//   return new Response(JSON.stringify({
//     processed: todo.length,
//     success: successCount,
//     errors: errorCount,
//     processing_time_ms: totalTime,
//     avg_classification_time_ms: avgClassificationTime,
//     posts_per_minute: (successCount / totalTime * 60000).toFixed(2),
//     batch_size: BATCH_SIZE,
//     message: `Processed ${successCount} posts in ${totalTime}ms`
//   }), {
//     headers: {
//       "Content-Type": "application/json"
//     }
//   });
// }); 