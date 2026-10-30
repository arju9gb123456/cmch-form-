-- =====================================================================
-- CMCH Forms — Supabase schema
-- Supabase Dashboard → SQL Editor → New query → yeh poora paste karke RUN karo
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tables ----------
create table if not exists public.forms (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title       text not null,
  subtitle    text not null default '',
  fields      jsonb not null default '[]'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.submissions (
  id          uuid primary key default gen_random_uuid(),
  form_id     uuid not null references public.forms(id) on delete cascade,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists submissions_form_created_idx on public.submissions (form_id, created_at desc);

-- Admin allow-list: sirf in emails wale Supabase users admin panel khol payenge
create table if not exists public.admins (
  email text primary key
);

-- ---------- Helper ----------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Row Level Security ----------
alter table public.forms       enable row level security;
alter table public.submissions enable row level security;
alter table public.admins      enable row level security;   -- no policies = API se koi access nahi

drop policy if exists "forms: read live or admin"   on public.forms;
drop policy if exists "forms: admin insert"          on public.forms;
drop policy if exists "forms: admin update"          on public.forms;
drop policy if exists "forms: admin delete"          on public.forms;
drop policy if exists "subs: anyone can submit to live form" on public.submissions;
drop policy if exists "subs: admin read"             on public.submissions;
drop policy if exists "subs: admin delete"           on public.submissions;

-- Koi bhi LIVE form padh sakta hai (fill karne ke liye); admin sab padh sakta hai
create policy "forms: read live or admin" on public.forms
  for select using (is_active or public.is_admin());
create policy "forms: admin insert" on public.forms
  for insert to authenticated with check (public.is_admin());
create policy "forms: admin update" on public.forms
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "forms: admin delete" on public.forms
  for delete to authenticated using (public.is_admin());

-- Koi bhi sirf LIVE form me submit kar sakta hai, lekin padh/delete sirf admin
create policy "subs: anyone can submit to live form" on public.submissions
  for insert to anon, authenticated
  with check (exists (select 1 from public.forms f where f.id = form_id and f.is_active));
create policy "subs: admin read" on public.submissions
  for select to authenticated using (public.is_admin());
create policy "subs: admin delete" on public.submissions
  for delete to authenticated using (public.is_admin());

-- ---------- Default RCH form ----------
insert into public.forms (slug, title, subtitle, fields, is_active)
values ('rch', 'Chief Medical & Health Officer District Bhopal M.P. RCH Tracking Form', '', '[
  {
    "id": "f01",
    "label": "Date of PREGNANT WOMAN Registration",
    "type": "date",
    "required": true
  },
  {
    "id": "f02",
    "label": "Name of PREGNANT WOMAN",
    "type": "text",
    "required": true
  },
  {
    "id": "f03",
    "label": "Samagra ID of PREGNANT WOMAN",
    "type": "text",
    "placeholder": "8–9 digit Samagra ID",
    "pattern": "^\\d{8,9}$",
    "patternMsg": "Samagra ID must be 8–9 digits"
  },
  {
    "id": "f04",
    "label": "Aadhaar no. of PREGNANT WOMAN",
    "type": "text",
    "placeholder": "12-digit Aadhaar",
    "pattern": "^\\d{12}$",
    "patternMsg": "Aadhaar must be 12 digits"
  },
  {
    "id": "f05",
    "label": "Name of PREGNANT WOMAN''s Husband",
    "type": "text"
  },
  {
    "id": "f06",
    "label": "Samagra of Husband",
    "type": "text",
    "placeholder": "8–9 digit Samagra ID",
    "pattern": "^\\d{8,9}$",
    "patternMsg": "Samagra ID must be 8–9 digits"
  },
  {
    "id": "f07",
    "label": "Mobile No. PREGNANT WOMAN",
    "type": "tel",
    "placeholder": "10-digit mobile",
    "pattern": "^[6-9]\\d{9}$",
    "patternMsg": "Enter a valid 10-digit mobile number"
  },
  {
    "id": "f08",
    "label": "Age of PREGNANT WOMAN (years)",
    "type": "number"
  },
  {
    "id": "f09",
    "label": "Gravida (Para)",
    "type": "text",
    "placeholder": "e.g. G2 P1"
  },
  {
    "id": "f10",
    "label": "LMP Date",
    "type": "date"
  },
  {
    "id": "f11",
    "label": "Date of Antenatal Checkup 1",
    "type": "date"
  },
  {
    "id": "f12",
    "label": "Date of Antenatal Checkup 2",
    "type": "date"
  },
  {
    "id": "f13",
    "label": "Date of Antenatal Checkup 3",
    "type": "date"
  },
  {
    "id": "f14",
    "label": "Date of Antenatal Checkup 4",
    "type": "date"
  },
  {
    "id": "f15",
    "label": "Weight of PREGNANT WOMAN (kg)",
    "type": "number"
  },
  {
    "id": "f16",
    "label": "Height of PREGNANT WOMAN (cm)",
    "type": "number"
  },
  {
    "id": "f17",
    "label": "HB (g/dL)",
    "type": "number"
  },
  {
    "id": "f18",
    "label": "Date of BT / Iron Sucrose injection given",
    "type": "date"
  },
  {
    "id": "f19",
    "label": "Blood Pressure",
    "type": "text",
    "placeholder": "e.g. 120/80",
    "pattern": "^\\d{2,3}\\/\\d{2,3}$",
    "patternMsg": "Write BP like 120/80"
  },
  {
    "id": "f20",
    "label": "Date: Labetalol / MgSO4 given",
    "type": "date"
  },
  {
    "id": "f21",
    "label": "Tetanus Toxoid / TD1 / TD Booster Date",
    "type": "date"
  },
  {
    "id": "f22",
    "label": "Test GDM done (Yes/No)",
    "type": "yesno"
  },
  {
    "id": "f23",
    "label": "Value of GDM test",
    "type": "text"
  },
  {
    "id": "f24",
    "label": "Place of Delivery (Name of Hospital)",
    "type": "text"
  },
  {
    "id": "f25",
    "label": "Date of Delivery",
    "type": "date"
  },
  {
    "id": "f26",
    "label": "Time of Delivery",
    "type": "time"
  },
  {
    "id": "f27",
    "label": "Normal Vaginal Delivery / C-Section",
    "type": "radio",
    "options": [
      "Normal Vaginal Delivery",
      "C-Section"
    ]
  },
  {
    "id": "f28",
    "label": "Any Complications",
    "type": "textarea"
  },
  {
    "id": "f29",
    "label": "Number of Live Children",
    "type": "number"
  },
  {
    "id": "f30",
    "label": "Number of Children Born (Total Number of Deliveries)",
    "type": "number"
  },
  {
    "id": "f31",
    "label": "Whether Single / Twins Born",
    "type": "radio",
    "options": [
      "Single",
      "Twins",
      "Triplets"
    ]
  },
  {
    "id": "f32",
    "label": "Male / Female",
    "type": "radio",
    "options": [
      "Male",
      "Female",
      "Both (Twins)"
    ]
  },
  {
    "id": "f33",
    "label": "Weight of Baby (kg)",
    "type": "number"
  },
  {
    "id": "f34",
    "label": "Admitted to NBSU / SNCU / PICU",
    "type": "select",
    "options": [
      "Not Admitted",
      "NBSU",
      "SNCU",
      "PICU"
    ]
  },
  {
    "id": "f35",
    "label": "Date of Discharge",
    "type": "date"
  }
]'::jsonb, true)
on conflict (slug) do nothing;

-- ---------- Apna admin add karo ----------
-- 1) Authentication → Users → "Add user" se email + password banao
-- 2) Neeche apna email daal kar yeh line run karo:
-- insert into public.admins (email) values ('your-email@example.com');
