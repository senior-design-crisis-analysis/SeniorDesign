export type DisasterRow = {
  uri: string;
  latitude: number | null;
  longitude: number | null;
  disaster_type: string;
  severity_level: "low" | "medium" | "high" | null;
  model_confidence: number | null;
  location_mentioned: string | null;
  help_request: boolean;
  author: string | null;
  original_text: string | null;
  indexed_at: string | null;
};
