// import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// import { createClient } from 'jsr:@supabase/supabase-js@^2';
// const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
// // API Key rotation setup - all 12 keys (updated to match classification-worker)
// const API_KEYS = [
//   Deno.env.get("GROQ_API_KEY") ?? "",
//   Deno.env.get("GROQ_API_KEY_2") ?? "",
//   Deno.env.get("GROQ_API_KEY_medha") ?? "",
//   Deno.env.get("GROQ_API_KEY_oviya") ?? "",
//   Deno.env.get("GROQ_API_KEY_jasz-aaa") ?? "",
//   Deno.env.get("GROQ_API_KEY_jasz-schoolEmail") ?? "",
//   Deno.env.get("GROQ_API_KEY_jasz-persEmail") ?? "",
//   Deno.env.get("GROQ_API_KEY_jasz-acm") ?? "",
//   Deno.env.get("GROQ_API_KEY_jasz-asl") ?? "",
//   Deno.env.get("GROQ_API_KEY-jasz-pc") ?? "",
//   Deno.env.get("GROQ_API_KEY_jasz-he") ?? "",
//   Deno.env.get("GROQ_API_KEY_jasz-dc") ?? ""
// ].filter((key)=>key);
// // Function to determine current key index based on UTC hour (updated to match classification-worker)
// function getCurrentKeyIndex() {
//   const now = new Date();
//   const currentHourUTC = now.getUTCHours();
//   // Rotate through all 12 keys, changing every hour
//   return currentHourUTC % API_KEYS.length;
// }
// // Function to calculate time until next rotation (in milliseconds)
// function getTimeUntilNextRotation() {
//   const now = new Date();
//   const nextHour = new Date(now);
//   nextHour.setHours(nextHour.getHours() + 1);
//   nextHour.setMinutes(0, 0, 0); // Next hour, 0 minutes, 0 seconds, 0 milliseconds
//   return nextHour.getTime() - now.getTime();
// }
// function getCurrentAPIKeyInfo() {
//   const keyIndex = getCurrentKeyIndex();
//   const timeUntilNextRotation = getTimeUntilNextRotation();
//   const nextRotationUTC = new Date(Date.now() + timeUntilNextRotation).toISOString();
//   return {
//     current_key_index: keyIndex,
//     total_keys: API_KEYS.length,
//     next_rotation_at: nextRotationUTC,
//     minutes_until_rotation: Math.round(timeUntilNextRotation / 60000),
//     current_utc_hour: new Date().getUTCHours(),
//     rotation_schedule: "HOURLY_UTC"
//   };
// }
// // Helper function for logging
// function logInfo(type, data) {
//   console.log(JSON.stringify({
//     type,
//     ...data
//   }));
// }
// Deno.serve(async ()=>{
//   const monitorStart = Date.now();
//   const apiKeyInfo = getCurrentAPIKeyInfo();
//   logInfo("monitor_start", {
//     timestamp: new Date().toISOString(),
//     ...apiKeyInfo
//   });
//   try {
//     // 1. Get table sizes and basic counts
//     const [{ count: inputPosts, error: inputError }, { count: queuePosts, error: queueError }, { count: failedPosts, error: failedError }, { count: outputPosts, error: outputError }] = await Promise.all([
//       // Total posts in input table
//       supabase.from("be_posts_input").select("uri", {
//         count: 'exact',
//         head: true
//       }),
//       // Current queue size
//       supabase.from("processing_queue").select("uri", {
//         count: 'exact',
//         head: true
//       }),
//       // Failed classifications (total)
//       supabase.from("failed_classifications").select("uri", {
//         count: 'exact',
//         head: true
//       }),
//       // Successful classifications
//       supabase.from("be_extracted_info_output").select("uri", {
//         count: 'exact',
//         head: true
//       })
//     ]);
//     // Check for errors in basic counts
//     if (inputError || queueError || failedError || outputError) {
//       logInfo("count_errors", {
//         inputError: inputError?.message,
//         queueError: queueError?.message,
//         failedError: failedError?.message,
//         outputError: outputError?.message
//       });
//     }
//     // 2. Get recent classifications for current API key period (last hour)
//     const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
//     const { data: recentClassifications, error: recentError } = await supabase.from("be_extracted_info_output").select("processed_at, disaster_type, model_confidence, api_key_index").gte('processed_at', oneHourAgo).order('processed_at', {
//       ascending: false
//     });
//     if (recentError) {
//       logInfo("recent_classifications_error", {
//         error: recentError.message
//       });
//     }
//     // 3. Get disaster type breakdown for current API key period
//     const { data: disasterBreakdown, error: breakdownError } = await supabase.from("be_extracted_info_output").select("disaster_type, api_key_index").neq("disaster_type", "not_relevant").gte('processed_at', oneHourAgo);
//     if (breakdownError) {
//       logInfo("disaster_breakdown_error", {
//         error: breakdownError.message
//       });
//     }
//     // 4. Get recent failures
//     const { data: recentFailures, error: failuresError } = await supabase.from("failed_classifications").select("error_message, created_at, api_key_index").gte('created_at', oneHourAgo);
//     if (failuresError) {
//       logInfo("recent_failures_error", {
//         error: failuresError.message
//       });
//     }
//     // 5. Get 24-hour performance data for all keys
//     const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
//     const { data: keyPerformance, error: keyPerfError } = await supabase.from("be_extracted_info_output").select("api_key_index, disaster_type, processed_at").gte('processed_at', twentyFourHoursAgo);
//     if (keyPerfError) {
//       logInfo("key_performance_error", {
//         error: keyPerfError.message
//       });
//     }
//     // 6. Calculate metrics with proper null checks
//     const totalInput = inputPosts || 0;
//     const totalOutput = outputPosts || 0;
//     const currentQueue = queuePosts || 0;
//     const totalFailures = failedPosts || 0;
//     const recentFailuresCount = recentFailures?.length || 0;
//     // Disaster classification rate (overall)
//     const disasterPosts = disasterBreakdown?.length || 0;
//     const disasterRate = totalOutput > 0 ? (disasterPosts / totalOutput * 100).toFixed(1) : "0.0";
//     // Processing completion rate
//     const completionRate = totalInput > 0 ? ((totalOutput + totalFailures) / totalInput * 100).toFixed(1) : "0.0";
//     // Recent activity (last hour - current API key period)
//     const recentProcessed = recentClassifications?.length || 0;
//     const recentDisasters = recentClassifications?.filter((p)=>p.disaster_type !== "not_relevant").length || 0;
//     const recentDisasterRate = recentProcessed > 0 ? (recentDisasters / recentProcessed * 100).toFixed(1) : "0.0";
//     // 7. Calculate API key specific metrics
//     const currentKey = apiKeyInfo.current_key_index;
//     const currentKeyProcessed = recentClassifications?.filter((p)=>p.api_key_index === currentKey).length || 0;
//     const currentKeyDisasters = recentClassifications?.filter((p)=>p.api_key_index === currentKey && p.disaster_type !== "not_relevant").length || 0;
//     const currentKeyDisasterRate = currentKeyProcessed > 0 ? (currentKeyDisasters / currentKeyProcessed * 100).toFixed(1) : "0.0";
//     // 8. Calculate 24-hour API key performance
//     const keyStats = {};
//     if (keyPerformance) {
//       keyPerformance.forEach((item)=>{
//         const key = item.api_key_index;
//         if (!keyStats[key]) {
//           keyStats[key] = {
//             total: 0,
//             disasters: 0
//           };
//         }
//         keyStats[key].total++;
//         if (item.disaster_type !== "not_relevant") {
//           keyStats[key].disasters++;
//         }
//       });
//     }
//     // 9. Compile dashboard data
//     const dashboard = {
//       type: "system_dashboard",
//       timestamp: new Date().toISOString(),
//       processing_time_ms: Date.now() - monitorStart,
//       // Table sizes
//       table_sizes: {
//         be_posts_input: totalInput,
//         processing_queue: currentQueue,
//         failed_classifications: totalFailures,
//         be_extracted_info_output: totalOutput
//       },
//       // Processing metrics
//       processing_metrics: {
//         completion_rate: `${completionRate}%`,
//         disaster_classification_rate: `${disasterRate}%`,
//         total_processed: totalOutput + totalFailures,
//         remaining_in_queue: currentQueue,
//         queue_processing_time_estimate: currentQueue > 0 ? `${Math.round(currentQueue / 6 * 2.5 / 60)} hours` : "0 hours"
//       },
//       // Current API key performance (last hour)
//       current_key_performance: {
//         key_index: currentKey,
//         posts_processed: currentKeyProcessed,
//         disasters_identified: currentKeyDisasters,
//         disaster_rate: `${currentKeyDisasterRate}%`,
//         period_hours: 1
//       },
//       // Recent performance (last hour)
//       recent_performance: {
//         period_hours: 1,
//         posts_processed: recentProcessed,
//         disasters_identified: recentDisasters,
//         disaster_rate: `${recentDisasterRate}%`,
//         rate_limit_errors: recentFailuresCount
//       },
//       // 24-hour API key performance
//       api_key_performance_24h: Object.keys(keyStats).map((key)=>({
//           key_index: parseInt(key),
//           total_posts: keyStats[key].total,
//           disasters: keyStats[key].disasters,
//           disaster_rate: keyStats[key].total > 0 ? `${(keyStats[key].disasters / keyStats[key].total * 100).toFixed(1)}%` : "0%"
//         })),
//       // API Key info
//       api_key_info: apiKeyInfo,
//       // System health
//       system_health: {
//         status: recentFailuresCount > 10 ? "degraded" : currentQueue > 1000 ? "behind" : "healthy",
//         recommendation: currentQueue > 1000 ? "Increase processing capacity" : recentFailuresCount > 10 ? "Check API key limits" : "Normal operation",
//         current_key_utilization: `${currentKeyProcessed} posts in current period`
//       }
//     };
//     // 10. Log the dashboard
//     logInfo("dashboard_data", dashboard);
//     // 11. Store in monitoring table for historical analysis - FIXED VERSION
//     const monitoringData = {
//       timestamp: new Date().toISOString(),
//       input_posts: totalInput,
//       queue_size: currentQueue,
//       output_posts: totalOutput,
//       failed_posts: totalFailures,
//       disaster_rate: parseFloat(disasterRate),
//       completion_rate: parseFloat(completionRate),
//       api_key_index: apiKeyInfo.current_key_index,
//       rate_limit_errors: recentFailuresCount,
//       current_key_posts: currentKeyProcessed,
//       current_key_disasters: currentKeyDisasters,
//       current_utc_hour: apiKeyInfo.current_utc_hour,
//       monitoring_duration_ms: Date.now() - monitorStart
//     };
//     const { data: storageResult, error: storageError } = await supabase.from("system_monitoring").insert(monitoringData).select(); // Add .select() to see what was inserted
//     if (storageError) {
//       logInfo("monitor_storage_error", {
//         error: storageError.message,
//         error_details: storageError.details,
//         error_hint: storageError.hint,
//         monitoring_data: monitoringData
//       });
//     } else {
//       logInfo("monitor_storage_success", {
//         stored_id: storageResult?.[0]?.id,
//         timestamp: monitoringData.timestamp
//       });
//     }
//     return new Response(JSON.stringify({
//       message: "Dashboard generated and stored successfully",
//       data: dashboard,
//       storage_success: !storageError,
//       storage_error: storageError?.message
//     }), {
//       headers: {
//         "Content-Type": "application/json"
//       }
//     });
//   } catch (error) {
//     logInfo("monitor_error", {
//       error: error.message,
//       stack: error.stack,
//       timestamp: new Date().toISOString()
//     });
//     return new Response(JSON.stringify({
//       error: "Monitoring failed",
//       details: error.message
//     }), {
//       status: 500,
//       headers: {
//         "Content-Type": "application/json"
//       }
//     });
//   }
// }); 