-- Daily API usage counters per provider (Bright Data, AIML, Speechmatics, Featherless)
create table if not exists public.provider_usage_daily (
  usage_date date not null default (timezone('utc', now()))::date,
  provider text not null check (provider in ('bright_data', 'aiml', 'speechmatics', 'featherless')),
  request_count integer not null default 0,
  primary key (usage_date, provider)
);

create index if not exists idx_provider_usage_daily_date on public.provider_usage_daily (usage_date desc);

alter table public.provider_usage_daily enable row level security;
