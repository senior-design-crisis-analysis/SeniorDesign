"use client";

import { useEffect, useState } from "react";
import USHeatmap from "./USHeatmap";
import type { Metric } from "@/app/test_skeets/api/states/types/metric";

export default function USHeatmapClient() {
  const [stateData, setData] = useState<Metric[]>([]);

  useEffect(() => {
  async function loadData() {
    try {
      const res = await fetch("test_skeets/api/states");
      const json = await res.json();
      console.log("Fetched states:", json); // ✅ PROVE the data
      setData(json);
    } catch (err) {
      console.error("Failed to fetch states:", err);
    }
  }
  loadData();
}, []);


  return <USHeatmap data={stateData} />;
}
