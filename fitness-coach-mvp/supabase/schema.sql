-- ============================================================
-- FITNESS COACH MVP — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null check (role in ('coach', 'client')) default 'client',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- COACHES
-- ============================================================
create table public.coaches (
  id uuid references public.profiles on delete cascade primary key,
  bio text,
  specialties text[], -- e.g. ['basketball', 'weight-loss', 'strength']
  instagram_handle text,
  stripe_customer_id text,
  stripe_account_id text,
  created_at timestamptz default now()
);

-- ============================================================
-- CLIENTS
-- ============================================================
create table public.clients (
  id uuid references public.profiles on delete cascade primary key,
  coach_id uuid references public.coaches(id),
  date_of_birth date,
  height_cm numeric(5,1),
  starting_weight_kg numeric(5,2),
  goal text,
  sport text, -- e.g. 'basketball', 'general fitness'
  position text, -- basketball position if applicable
  stripe_customer_id text,
  subscription_status text default 'inactive' check (subscription_status in ('active', 'inactive', 'canceled', 'past_due')),
  subscription_id text,
  subscription_price_id text,
  created_at timestamptz default now()
);

-- ============================================================
-- WEEKLY CHECK-INS
-- ============================================================
create table public.checkins (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  week_start date not null, -- Monday of that week
  submitted_at timestamptz default now(),

  -- Body Metrics
  body_weight_kg numeric(5,2),
  body_fat_pct numeric(4,1),

  -- Measurements (cm)
  chest_cm numeric(5,1),
  waist_cm numeric(5,1),
  hips_cm numeric(5,1),
  left_arm_cm numeric(5,1),
  right_arm_cm numeric(5,1),
  left_thigh_cm numeric(5,1),
  right_thigh_cm numeric(5,1),

  -- Recovery & Lifestyle
  avg_sleep_hours numeric(3,1),
  avg_daily_steps integer,
  energy_level integer check (energy_level between 1 and 10),
  stress_level integer check (stress_level between 1 and 10),

  -- Training Performance
  sessions_completed integer,
  sessions_planned integer,
  avg_session_rpe numeric(3,1) check (avg_session_rpe between 1 and 10), -- rate of perceived exertion

  -- Basketball-specific (optional)
  shooting_pct numeric(4,1),
  vertical_jump_cm numeric(5,1),
  sprint_time_sec numeric(4,2), -- e.g. 3/4 court sprint

  -- Notes
  client_notes text,
  wins text, -- What went well
  struggles text,

  -- Coach feedback
  coach_feedback text,
  coach_reviewed_at timestamptz,

  unique(client_id, week_start)
);

-- ============================================================
-- PROGRESS PHOTOS
-- ============================================================
create table public.progress_photos (
  id uuid default uuid_generate_v4() primary key,
  checkin_id uuid references public.checkins(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  storage_path text not null, -- path in Supabase Storage
  photo_type text check (photo_type in ('front', 'side', 'back', 'other')),
  uploaded_at timestamptz default now()
);

-- ============================================================
-- COACH PROGRAMS (future expansion)
-- ============================================================
create table public.programs (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.coaches(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  description text,
  program_type text check (program_type in ('training', 'nutrition', 'combined')),
  is_template boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- MESSAGES (coach <-> client)
-- ============================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.coaches enable row level security;
alter table public.clients enable row level security;
alter table public.checkins enable row level security;
alter table public.progress_photos enable row level security;
alter table public.programs enable row level security;
alter table public.messages enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Coaches can view all their clients' profiles
create policy "Coaches can view client profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.clients c
      join public.coaches co on co.id = c.coach_id
      where c.id = profiles.id and co.id = auth.uid()
    )
  );

-- Coaches table
create policy "Coaches can view own record" on public.coaches
  for select using (auth.uid() = id);

create policy "Coaches can update own record" on public.coaches
  for update using (auth.uid() = id);

create policy "Clients can view their coach" on public.coaches
  for select using (
    exists (
      select 1 from public.clients
      where clients.id = auth.uid() and clients.coach_id = coaches.id
    )
  );

-- Clients table
create policy "Clients can view own record" on public.clients
  for select using (auth.uid() = id);

create policy "Clients can update own record" on public.clients
  for update using (auth.uid() = id);

create policy "Coaches can view their clients" on public.clients
  for select using (
    exists (
      select 1 from public.coaches
      where coaches.id = auth.uid() and coaches.id = clients.coach_id
    )
  );

-- Check-ins
create policy "Clients can manage own checkins" on public.checkins
  for all using (auth.uid() = client_id);

create policy "Coaches can view client checkins" on public.checkins
  for select using (
    exists (
      select 1 from public.clients c
      where c.id = checkins.client_id and c.coach_id = auth.uid()
    )
  );

create policy "Coaches can update client checkins (feedback)" on public.checkins
  for update using (
    exists (
      select 1 from public.clients c
      where c.id = checkins.client_id and c.coach_id = auth.uid()
    )
  );

-- Progress photos
create policy "Clients can manage own photos" on public.progress_photos
  for all using (auth.uid() = client_id);

create policy "Coaches can view client photos" on public.progress_photos
  for select using (
    exists (
      select 1 from public.clients c
      where c.id = progress_photos.client_id and c.coach_id = auth.uid()
    )
  );

-- Messages
create policy "Users can view own messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('progress-photos', 'progress-photos', false);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policies
create policy "Clients upload own photos" on storage.objects
  for insert with check (
    bucket_id = 'progress-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clients view own photos" on storage.objects
  for select using (
    bucket_id = 'progress-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Coaches view client photos" on storage.objects
  for select using (
    bucket_id = 'progress-photos' and
    exists (
      select 1 from public.clients c
      where c.id::text = (storage.foldername(name))[1]
      and c.coach_id = auth.uid()
    )
  );

create policy "Avatar uploads" on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Avatar reads" on storage.objects
  for select using (bucket_id = 'avatars');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );

  -- Also insert into coaches or clients table
  if coalesce(new.raw_user_meta_data->>'role', 'client') = 'coach' then
    insert into public.coaches (id) values (new.id);
  else
    insert into public.clients (id) values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
