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
  title_hi    text not null default '',
  subtitle_hi text not null default '',
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
-- (purane setup ke liye) Hindi columns
alter table public.forms add column if not exists title_hi    text not null default '';
alter table public.forms add column if not exists subtitle_hi text not null default '';

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
insert into public.forms (slug, title, title_hi, subtitle, subtitle_hi, fields, is_active)
values ('rch', 'Chief Medical & Health Officer District Bhopal M.P. RCH Tracking Form', 'मुख्य चिकित्सा एवं स्वास्थ्य अधिकारी, जिला भोपाल (म.प्र.) — RCH ट्रैकिंग फॉर्म', '', '', '[
  {
    "id": "f01",
    "section": "Pregnant Woman Details",
    "section_hi": "गर्भवती महिला का विवरण",
    "label": "Date of PREGNANT WOMAN Registration",
    "label_hi": "गर्भवती महिला के पंजीकरण की तारीख",
    "type": "date",
    "required": true
  },
  {
    "id": "f02",
    "label": "Name of PREGNANT WOMAN",
    "label_hi": "गर्भवती महिला का नाम",
    "type": "text",
    "required": true
  },
  {
    "id": "f03",
    "label": "Samagra ID of PREGNANT WOMAN",
    "label_hi": "गर्भवती महिला की समग्र आईडी",
    "type": "text",
    "placeholder": "8–9 digit Samagra ID",
    "placeholder_hi": "8–9 अंकों की समग्र आईडी",
    "pattern": "^\\d{8,9}$",
    "patternMsg": "Samagra ID must be 8–9 digits",
    "patternMsg_hi": "समग्र आईडी 8–9 अंकों की होनी चाहिए"
  },
  {
    "id": "f04",
    "label": "Aadhaar no. of PREGNANT WOMAN",
    "label_hi": "गर्भवती महिला का आधार नंबर",
    "type": "text",
    "placeholder": "12-digit Aadhaar",
    "placeholder_hi": "12 अंकों का आधार नंबर",
    "pattern": "^\\d{12}$",
    "patternMsg": "Aadhaar must be 12 digits",
    "patternMsg_hi": "आधार नंबर 12 अंकों का होना चाहिए"
  },
  {
    "id": "f05",
    "label": "Name of PREGNANT WOMAN''s Husband",
    "label_hi": "गर्भवती महिला के पति का नाम",
    "type": "text"
  },
  {
    "id": "f06",
    "label": "Samagra of Husband",
    "label_hi": "पति की समग्र आईडी",
    "type": "text",
    "placeholder": "8–9 digit Samagra ID",
    "placeholder_hi": "8–9 अंकों की समग्र आईडी",
    "pattern": "^\\d{8,9}$",
    "patternMsg": "Samagra ID must be 8–9 digits",
    "patternMsg_hi": "समग्र आईडी 8–9 अंकों की होनी चाहिए"
  },
  {
    "id": "f07",
    "label": "Mobile No. PREGNANT WOMAN",
    "label_hi": "गर्भवती महिला का मोबाइल नंबर",
    "type": "tel",
    "placeholder": "10-digit mobile",
    "placeholder_hi": "10 अंकों का मोबाइल नंबर",
    "pattern": "^[6-9]\\d{9}$",
    "patternMsg": "Enter a valid 10-digit mobile number",
    "patternMsg_hi": "सही 10 अंकों का मोबाइल नंबर डालें"
  },
  {
    "id": "f08",
    "label": "Age of PREGNANT WOMAN (years)",
    "label_hi": "गर्भवती महिला की उम्र (वर्ष)",
    "type": "number"
  },
  {
    "id": "f09",
    "label": "Gravida (Para)",
    "label_hi": "ग्रेविडा (पैरा)",
    "type": "text",
    "placeholder": "e.g. G2 P1",
    "placeholder_hi": "जैसे G2 P1"
  },
  {
    "id": "f10",
    "section": "Antenatal Care (ANC)",
    "section_hi": "प्रसवपूर्व देखभाल (ANC)",
    "label": "LMP Date",
    "label_hi": "LMP तारीख (अंतिम माहवारी)",
    "type": "date",
    "hint": "edd"
  },
  {
    "id": "f11",
    "label": "Date of Antenatal Checkup 1",
    "label_hi": "प्रसवपूर्व जाँच 1 की तारीख",
    "type": "date"
  },
  {
    "id": "f12",
    "label": "Date of Antenatal Checkup 2",
    "label_hi": "प्रसवपूर्व जाँच 2 की तारीख",
    "type": "date"
  },
  {
    "id": "f13",
    "label": "Date of Antenatal Checkup 3",
    "label_hi": "प्रसवपूर्व जाँच 3 की तारीख",
    "type": "date"
  },
  {
    "id": "f14",
    "label": "Date of Antenatal Checkup 4",
    "label_hi": "प्रसवपूर्व जाँच 4 की तारीख",
    "type": "date"
  },
  {
    "id": "f15",
    "label": "Weight of PREGNANT WOMAN (kg)",
    "label_hi": "गर्भवती महिला का वजन (किग्रा)",
    "type": "number"
  },
  {
    "id": "f16",
    "label": "Height of PREGNANT WOMAN (cm)",
    "label_hi": "गर्भवती महिला की लंबाई (सेमी)",
    "type": "number"
  },
  {
    "id": "f17",
    "label": "HB (g/dL)",
    "label_hi": "हीमोग्लोबिन / HB (g/dL)",
    "type": "number"
  },
  {
    "id": "f18",
    "label": "Date of BT / Iron Sucrose injection given",
    "label_hi": "रक्त चढ़ाने (BT) / आयरन सुक्रोज़ इंजेक्शन की तारीख",
    "type": "date"
  },
  {
    "id": "f19",
    "label": "Blood Pressure",
    "label_hi": "रक्तचाप (BP)",
    "type": "text",
    "placeholder": "e.g. 120/80",
    "placeholder_hi": "जैसे 120/80",
    "pattern": "^\\d{2,3}\\/\\d{2,3}$",
    "patternMsg": "Write BP like 120/80",
    "patternMsg_hi": "BP ऐसे लिखें: 120/80"
  },
  {
    "id": "f20",
    "label": "Date: Labetalol / MgSO4 given",
    "label_hi": "लेबेटालोल / MgSO4 देने की तारीख",
    "type": "date"
  },
  {
    "id": "f21",
    "label": "Tetanus Toxoid / TD1 / TD Booster Date",
    "label_hi": "टिटनेस टॉक्साइड / TD1 / TD बूस्टर की तारीख",
    "type": "date"
  },
  {
    "id": "f22",
    "label": "Test GDM done (Yes/No)",
    "label_hi": "GDM जाँच हुई (हाँ/नहीं)",
    "type": "yesno"
  },
  {
    "id": "f23",
    "label": "Value of GDM test",
    "label_hi": "GDM जाँच का मान",
    "type": "text"
  },
  {
    "id": "f24",
    "section": "Delivery Details",
    "section_hi": "प्रसव का विवरण",
    "label": "Place of Delivery (Name of Hospital)",
    "label_hi": "प्रसव का स्थान (अस्पताल का नाम)",
    "type": "text"
  },
  {
    "id": "f25",
    "label": "Date of Delivery",
    "label_hi": "प्रसव की तारीख",
    "type": "date"
  },
  {
    "id": "f26",
    "label": "Time of Delivery",
    "label_hi": "प्रसव का समय",
    "type": "time"
  },
  {
    "id": "f27",
    "label": "Normal Vaginal Delivery / C-Section",
    "label_hi": "सामान्य प्रसव / सी-सेक्शन",
    "type": "radio",
    "options": [
      "Normal Vaginal Delivery",
      "C-Section"
    ],
    "options_hi": [
      "सामान्य प्रसव",
      "सी-सेक्शन"
    ]
  },
  {
    "id": "f28",
    "label": "Any Complications",
    "label_hi": "कोई जटिलता",
    "type": "textarea"
  },
  {
    "id": "f29",
    "label": "Number of Live Children",
    "label_hi": "जीवित बच्चों की संख्या",
    "type": "number"
  },
  {
    "id": "f30",
    "label": "Number of Children Born (Total Number of Deliveries)",
    "label_hi": "जन्मे बच्चों की संख्या (कुल प्रसव)",
    "type": "number"
  },
  {
    "id": "f31",
    "section": "Baby Details",
    "section_hi": "शिशु का विवरण",
    "label": "Whether Single / Twins Born",
    "label_hi": "एकल / जुड़वाँ जन्म",
    "type": "radio",
    "options": [
      "Single",
      "Twins",
      "Triplets"
    ],
    "options_hi": [
      "एकल",
      "जुड़वाँ",
      "तीन बच्चे"
    ]
  },
  {
    "id": "f32",
    "label": "Male / Female",
    "label_hi": "लड़का / लड़की",
    "type": "radio",
    "options": [
      "Male",
      "Female",
      "Both (Twins)"
    ],
    "options_hi": [
      "लड़का",
      "लड़की",
      "दोनों (जुड़वाँ)"
    ]
  },
  {
    "id": "f33",
    "label": "Weight of Baby (kg)",
    "label_hi": "शिशु का वजन (किग्रा)",
    "type": "number"
  },
  {
    "id": "f34",
    "label": "Admitted to NBSU / SNCU / PICU",
    "label_hi": "NBSU / SNCU / PICU में भर्ती",
    "type": "select",
    "options": [
      "Not Admitted",
      "NBSU",
      "SNCU",
      "PICU"
    ],
    "options_hi": [
      "भर्ती नहीं",
      "NBSU",
      "SNCU",
      "PICU"
    ]
  },
  {
    "id": "f35",
    "label": "Date of Discharge",
    "label_hi": "डिस्चार्ज की तारीख",
    "type": "date"
  }
]'::jsonb, true)
on conflict (slug) do update set title_hi = excluded.title_hi, fields = excluded.fields
  where public.forms.title_hi = '';

-- ---------- Apna admin add karo ----------
-- 1) Authentication → Users → "Add user" se email + password banao
-- 2) Neeche apna email daal kar yeh line run karo:
-- insert into public.admins (email) values ('your-email@example.com');
