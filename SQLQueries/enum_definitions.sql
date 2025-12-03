create type severity_enum as enum (
  'low',
  'medium',
  'high'
);

create type disaster_enum as enum (
  'not_relevant',
  'auto_accident',
  'fire',
  'flood',
  'earthquake',
  'severe_storm',
  'shooting',
  'tornado',
  'hurricane',
  'extreme_heat',
  'tropical_storm',
  'other_disaster'
);

create type status_enum as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);
