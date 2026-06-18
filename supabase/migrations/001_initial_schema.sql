-- BUSINESSES
-- One row per business that signs up
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  api_key text unique not null default encode(gen_random_bytes(32), 'hex'),
  webhook_url text,
  created_at timestamptz default now()
);

-- SESSIONS
-- One row per active customer WhatsApp chat
create table sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  phone_number text not null,
  customer_ref text,
  started_at timestamptz default now(),
  unique(business_id, phone_number)
);

-- REQUESTS
-- Service requests that need human action (e.g. room service)
create table requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  room text,
  items jsonb,
  raw_message text,
  status text default 'pending' check (status in ('pending', 'done')),
  created_at timestamptz default now()
);

-- LOGS
-- Full message history per session (for AI context + debugging)
create table logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role text check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table businesses enable row level security;
alter table sessions enable row level security;
alter table requests enable row level security;
alter table logs enable row level security;

-- Simple policies for RLS (in production you'd tie these to auth.uid())
-- For MVP, we're relying on the service role key for the agent and API keys for the dashboard
create policy "Allow public read access to businesses" on businesses for select using (true);
create policy "Allow service role full access to businesses" on businesses using (true);

create policy "Allow service role full access to sessions" on sessions using (true);
create policy "Allow service role full access to requests" on requests using (true);
create policy "Allow service role full access to logs" on logs using (true);

-- Allow public read for requests (used by the dashboard staff view via anon key)
-- The dashboard filters by business_id in the query, but RLS should ideally enforce it too.
-- For this prototype, we'll allow anon read and rely on the UI filter.
create policy "Allow public read access to requests" on requests for select using (true);
create policy "Allow public update access to requests" on requests for update using (true);
