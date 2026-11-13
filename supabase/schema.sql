-- SortMyParking production schema (Supabase free tier, Postgres + PostGIS).
-- v1 of the app runs on local storage; this is the v2 backend the store maps onto.

create extension if not exists postgis;

create table spots (
  id text primary key,
  name text not null,
  area text not null,
  type text not null check (type in ('mall','civic','private','transit','metro','host')),
  profile text not null,
  location geography(point, 4326) not null,
  cap_car int not null default 0,
  cap_bike int not null default 0,
  rate_car int not null default 0,
  rate_bike int not null default 0,
  hours text not null,
  features text[] not null default '{}',
  host_user uuid references auth.users,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index spots_geo on spots using gist (location);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  plate text not null,
  type text not null check (type in ('car','bike')),
  unique (user_id, plate)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references auth.users,
  spot_id text not null references spots,
  plate text not null,
  vehicle text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  amount int not null,
  fee int not null,
  pay_method text not null,
  status text not null default 'active' check (status in ('active','ended','cancelled','no_show')),
  created_at timestamptz not null default now()
);

-- Driver reports feed the availability model (and are its best training signal)
create table reports (
  id bigint generated always as identity primary key,
  spot_id text not null references spots,
  user_id uuid references auth.users,
  level text not null check (level in ('plenty','filling','full')),
  created_at timestamptz not null default now()
);
create index reports_recent on reports (spot_id, created_at desc);

create table tow_reports (
  id bigint generated always as identity primary key,
  location geography(point, 4326) not null,
  user_id uuid references auth.users,
  created_at timestamptz not null default now()
);

create table waitlist (
  user_id uuid references auth.users,
  kind text not null check (kind in ('pass','host')),
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table vehicles enable row level security;
alter table bookings enable row level security;
alter table reports enable row level security;
create policy own_vehicles on vehicles for all using (auth.uid() = user_id);
create policy own_bookings on bookings for all using (auth.uid() = user_id);
create policy insert_reports on reports for insert with check (auth.uid() = user_id);
create policy read_reports on reports for select using (true);
