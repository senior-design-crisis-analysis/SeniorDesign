export type TableSkeet = {
  uri: string;
  severity_level: "low" | "medium" | "high";
  location_mentioned: string;
  disaster_type:
    | "flood"
    | "fire"
    | "earthquake"
    | "hurricane"
    | "tornado"
    | "shooting"
    | "auto_accident"
    | "storm"
    | "other"
    | "severe_storm";
  latitude: number;
  longitude: number;
  original_text: string;
  author: string;
  help_req: boolean;
  created_at: Date;
};
