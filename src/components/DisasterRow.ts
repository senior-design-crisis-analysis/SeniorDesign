import type { SeverityEnum, DisasterEnum } from "@/enumTypes";

export type DisasterRow = {
  uri: string;
  location_mentioned: string | null;
  latitude: number | null;
  model_confidence: number | null;
  longitude: number | null;
  original_text: string | null;
  author: string | null;
  indexed_at: string | null;
  help_request: boolean | null;
  disaster_type: DisasterEnum | null;
  severity_level: SeverityEnum | null;
  like_count: number | null;
};
