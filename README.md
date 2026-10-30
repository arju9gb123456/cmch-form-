# CMCH Forms — RCH Tracking Form + Admin Panel

CMHO District Bhopal (M.P.) ka **RCH Tracking Form** online — saath me admin panel jahan:

- Har submitted form ka data aata hai (search, record view, delete)
- **Excel (.xlsx)** export
- **PDF export** — table wala (saare records) aur form-wise (har record alag page, paper form jaisa)
- **Form Builder** — naya custom form banao, fields add/edit/reorder karo, Save karte hi form **LIVE** ho jata hai apne link par (`index.html?f=<slug>`)

| Page | Kaam |
|---|---|
| `index.html` | Default RCH form (`?f=rch`) |
| `index.html?f=my-form` | Builder se banaya gaya koi bhi form |
| `admin.html` | Admin panel |

## Do mode

**1. Local demo mode (default)** — `config.js` me Supabase details khali hon toh data sirf usi browser me (localStorage) save hota hai. Testing ke liye theek hai, **lekin dusre logon ka bhara hua data admin tak nahi aayega.** Demo admin password: `admin123`.

**2. Supabase mode (live use ke liye)** — sabka data ek database me, admin kahin se bhi dekh sakta hai.

## Supabase setup (5 minute)

1. [supabase.com](https://supabase.com) → **New project** banao (region: Mumbai).
2. **SQL Editor → New query** → `supabase/schema.sql` ka poora content paste karke **Run**. Isse tables, security (RLS) aur default RCH form ban jayega.
3. **Authentication → Users → Add user** → apna email + password banao (auto-confirm on).
4. SQL Editor me apna email admin list me daalo:
   ```sql
   insert into public.admins (email) values ('aapka-email@example.com');
   ```
5. **Authentication → Sign In / Providers** me **"Allow new users to sign up" OFF** kar do.
6. **Project Settings → API** se **Project URL** aur **anon public key** copy karke `config.js` me daalo, commit + push.

Bas — ab `admin.html` par us email/password se login karo.

## Security

- Form fill karne wala sirf **live form me data daal** sakta hai — kisi ka data padh nahi sakta.
- Submissions padhna/delete karna aur forms banana sirf `admins` table wale emails kar sakte hain (Row Level Security).
- `anon` key public rehne ke liye hi bani hai; **service_role key kabhi `config.js` me mat daalna.**
- Is form me Aadhaar / Samagra / health data hai — admin password strong rakho aur export ki hui files share karte waqt dhyan rakho.

## Deploy

Pure static site hai (koi build nahi). GitHub Pages, Vercel ya Netlify — kahin bhi chal jayega.

---
Made by Arjun Ahirwar
