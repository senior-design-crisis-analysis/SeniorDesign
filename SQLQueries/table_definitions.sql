create table public.be_posts_input (
  text text not null,
  author text not null,
  cid text not null,
  uri text not null,
  indexed_at timestamp with time zone null default now(),
  status public.status_enum null default 'pending'::status_enum,
  constraint be - posts_input_pkey primary key (uri),
  constraint be_posts_input_uri_key unique (uri),
  constraint posts_uri_key unique (uri)
) TABLESPACE pg_default;

create table public.processing_queue (
  post_text text not null,
  uri text not null,
  indexed_at timestamp with time zone null default now(),
  status public.status_enum null default 'pending'::status_enum,
  attempts integer null default 0,
  error_message text null,
  processed_at timestamp with time zone null default now(),
  author text null,
  cid text null,
  constraint processing_queue_pkey primary key (uri)
) TABLESPACE pg_default;

create table public.be_extracted_info_output (
  location_mentioned text null,
  latitude double precision null,
  model_confidence double precision null,
  longitude double precision null,
  original_text text null,
  uri text not null,
  author text null,
  indexed_at timestamp with time zone null,
  help_request boolean not null default false,
  disaster_type public.disaster_enum not null default 'not_relevant'::disaster_enum,
  severity_level public.severity_enum null,
  processed_at timestamp with time zone null,
  like_count bigint null default '0'::bigint,
  repost_count bigint null default '0'::bigint,
  reply_count bigint null default '0'::bigint,
  constraint be - extracted_info_output_pkey primary key (uri),
  constraint be_extracted_info_output_uri_key unique (uri)
) TABLESPACE pg_default;

create table public.failed_classifications (
  post_text text not null,
  uri text not null,
  attempts integer null default 0,
  error_message text null,
  last_attempt timestamp with time zone null default now(),
  author text null,
  cid text null,
  constraint failed_classifications_pkey primary key (uri)
) TABLESPACE pg_default;

create table public.system_monitoring (
  id bigserial not null,
  timestamp timestamp with time zone null default now(),
  input_posts integer null default 0,
  queue_size integer null default 0,
  output_posts integer null default 0,
  failed_posts integer null default 0,
  disaster_rate numeric(5, 2) null default 0,
  completion_rate numeric(5, 2) null default 0,
  api_key_index integer null default 0,
  rate_limit_errors integer null default 0,
  current_key_posts integer null default 0,
  current_key_disasters integer null default 0,
  current_utc_hour integer null,
  monitoring_duration_ms integer null default 0,
  constraint system_monitoring_pkey primary key (id)
) TABLESPACE pg_default;
