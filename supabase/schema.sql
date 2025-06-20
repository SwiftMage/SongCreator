-- Create profiles table
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  subscription_status text default 'free',
  credits_remaining integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create songs table
create table songs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  questionnaire_data jsonb not null,
  generated_lyrics text,
  audio_url text,
  mureka_task_id text,
  mureka_data jsonb,
  payment_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Create orders table
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  song_id uuid references songs(id) on delete cascade not null,
  amount decimal(10,2) not null,
  currency text default 'USD' not null,
  payment_provider_id text not null,
  status text default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security Policies

-- Profiles policies
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Songs policies
alter table songs enable row level security;

create policy "Users can view own songs" on songs
  for select using (auth.uid() = user_id);

create policy "Users can insert own songs" on songs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own songs" on songs
  for update using (auth.uid() = user_id);

-- Orders policies
alter table orders enable row level security;

create policy "Users can view own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Users can insert own orders" on orders
  for insert with check (auth.uid() = user_id);

-- Functions

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, subscription_status, credits_remaining)
  values (new.id, new.raw_user_meta_data->>'full_name', 'free', 1);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for performance
create index songs_user_id_idx on songs(user_id);
create index songs_status_idx on songs(status);
create index orders_user_id_idx on orders(user_id);
create index orders_song_id_idx on orders(song_id);
create index orders_status_idx on orders(status);