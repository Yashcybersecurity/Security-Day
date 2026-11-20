-- Run in Supabase: SQL Editor > New query > Run
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null check (phone ~ '^[0-9]{10}$'),
  participant_type text not null check (participant_type in ('student','staff')),
  reg_no text,
  department text not null,
  year int check (year between 1 and 4),
  event text not null check (event in ('hackathon','ctf','workshop')),
  team_size int not null default 1,
  team_name text,
  team_members text,
  problem_statement text,
  payment_screenshot text,
  constraint ctf_rules check (
    event <> 'ctf' or (
      participant_type = 'student' and
      team_size = 2 and
      team_name is not null and
      problem_statement is null
    )
  ),
  constraint hackathon_rules check (
    event <> 'hackathon' or (
      team_size in (3, 4) and
      team_name is not null and
      problem_statement is not null
    )
  ),
  constraint workshop_rules check (
    event <> 'workshop' or (
      team_size = 1 and
      team_name is null and
      team_members is null and
      problem_statement is null
    )
  ),
  constraint student_needs_details check (
    participant_type <> 'student' or (reg_no is not null and year is not null)
  )
);

-- Prevent duplicate registrations across Email, Phone Number, Student Register Number, Team Name, and Payment Screenshot
create unique index if not exists registrations_email_uq on public.registrations (lower(email));
create unique index if not exists registrations_phone_uq on public.registrations (phone);
create unique index if not exists registrations_reg_no_uq on public.registrations (upper(reg_no)) where reg_no is not null;
create unique index if not exists registrations_team_name_uq on public.registrations (lower(team_name)) where team_name is not null;
create unique index if not exists registrations_payment_screenshot_uq on public.registrations (md5(payment_screenshot)) where payment_screenshot is not null;

alter table public.registrations enable row level security;

-- Public visitors can only INSERT. They cannot read anyone's data.
drop policy if exists "public can register" on public.registrations;
create policy "public can register" on public.registrations
  for insert to anon, authenticated with check (true);

-- Only logged-in admins (users you create in Auth) can read / edit / delete.
drop policy if exists "admins read" on public.registrations;
create policy "admins read" on public.registrations for select to authenticated using (true);
drop policy if exists "admins update" on public.registrations;
create policy "admins update" on public.registrations for update to authenticated using (true);
drop policy if exists "admins delete" on public.registrations;
create policy "admins delete" on public.registrations for delete to authenticated using (true);
