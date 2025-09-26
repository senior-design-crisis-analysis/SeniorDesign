import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Metric } from "./types/metric";
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("state_metrics")
      .select("state_code, state_name, metric_value");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as Metric[]);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to fetch state metrics" },
      { status: 500 }
    );
  }
}
