# Eddie's Showroom — Prototype Handoff

A multi-page HTML prototype for a bilingual (EN/ES) used-car dealership site, built around Eddie Marquez — a real, named salesperson. Three pages, all interactive, all linked.

## Files

```
prototype/
├── index.html         # Homepage (hero, 6 inventory carousels, credit app, trade/drive tiles, footer)
├── car.html           # Vehicle detail page (?slug=...)
├── admin.html         # Eddie's admin dashboard (?screen=home|add|manage|leads|settings)
├── styles.css         # Design tokens + global styles
├── data.js            # All vehicles, leads, settings, copy strings (EN+ES)
├── components.jsx     # Shared: VehicleCard, CarPhoto, SiteHeader, badges, helpers
├── homepage.jsx       # Homepage component
├── car-page.jsx       # Car page component (mobile + desktop layouts)
├── chat-widget.jsx    # Bottom-right chat widget (full lead capture flow)
├── admin.jsx          # AdminShell + 5 inner screens (home, add wizard, manage, leads, settings)
├── tweaks-panel.jsx   # Floating Tweaks panel (lang toggle, palette, demo flags)
├── _shell.jsx         # AppShell wrapper: lang state + Tweaks + nav helpers
└── README.md
```

## Running locally

Open `index.html` directly in a browser, or:

```bash
npx serve prototype
# or
python -m http.server -d prototype 8000
```

(All scripts are CDN-loaded React + Babel; no build step needed for the prototype.)

## Navigation map

| From → To | Trigger |
| --- | --- |
| `index.html` → `car.html?slug=…` | Click any vehicle card |
| `index.html` → `admin.html` | "admin →" link in footer |
| `car.html` → `index.html` | Header logo / back button |
| `admin.html` → `index.html` | "Exit to public site" in admin shell |
| Any page → SMS to Eddie | "Text Eddie" button |
| Any page → Chat widget | Floating bubble bottom-right |

Language is preserved across navigations via `?lang=en|es`.

---

## Backend integration plan (Supabase + Vercel + GitHub)

The prototype is structured so wiring real data is mechanical. Every screen reads from `window.SHOWROOM_DATA` (defined in `data.js`). Replace that single object with Supabase queries and you're 90% there.

### 1. Supabase schema

Three tables map 1:1 to the demo data shape:

```sql
-- Vehicles (inventory)
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  stock text,
  year int, make text, model text, trim text, body text,
  mileage int, ext_color text, int_color text, drive text, engine text,
  transmission text, mpg text, vin text,
  pricing_type text check (pricing_type in ('sale','lease','apr','cash_bonus')),
  sale_price numeric, monthly_payment numeric, lease_term int, lease_down numeric,
  apr_rate numeric, apr_term int, cash_bonus numeric,
  tags text[],
  hero_hue int, hero_tone text,
  description_en text, description_es text,
  section text, photos int default 6,
  created_at timestamptz default now(),
  status text check (status in ('draft','live','sold')) default 'draft'
);

-- Leads (chat captures + credit app submissions)
create table leads (
  id uuid primary key default gen_random_uuid(),
  name text, phone text, email text,
  source text,                   -- 'chat' | 'credit_app' | 'trade_form'
  intent text, budget text, timeline text, credit text, contact_time text,
  vehicle_id uuid references vehicles(id),
  vehicle_label text,
  transcript jsonb,
  status text check (status in ('new','contacted','appointment','won','lost')) default 'new',
  created_at timestamptz default now()
);

-- Settings (single-row dealership profile)
create table settings (
  id int primary key default 1,
  dealership text, address text, phone text,
  hours_weekday text, hours_saturday text,
  pitch_en text, pitch_es text,
  -- ... mirrors data.js settings shape
  updated_at timestamptz default now()
);
```

Enable Row-Level Security:
- `vehicles`: anon can `select where status = 'live'`; auth (Eddie) can do everything
- `leads`: anon can `insert`; auth can `select`/`update`
- `settings`: anon can `select`; auth can `update`

Storage bucket `vehicle-photos` (public read, auth write) for the photo array currently faked by `photos: 7` count.

### 2. Wiring the frontend

Replace the inline `data.js` script in each HTML file with a small loader:

```html
<!-- in index.html / car.html / admin.html, replace <script src="data.js"></script> with: -->
<script type="module">
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
  const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

  const [{ data: vehicles }, { data: leads }, { data: settings }] = await Promise.all([
    sb.from("vehicles").select("*").eq("status", "live"),
    sb.from("leads").select("*").order("created_at", { ascending: false }),
    sb.from("settings").select("*").single(),
  ]);
  window.SHOWROOM_DATA = { vehicles, leads, settings, t: /* keep i18n strings local */ };
  window.dispatchEvent(new Event("showroom-data-ready"));
</script>
```

Then guard the React mount on the `showroom-data-ready` event.

### 3. Mutations (admin actions)

Each admin screen already has a `setScreen` handler and form state. Hook them up:

| Action | File | Hook |
| --- | --- | --- |
| Save new vehicle | `admin.jsx` → `AddVehicleFlow` final step | `sb.from("vehicles").insert(form)` |
| Update vehicle status | `admin.jsx` → `ManageVehicles` row actions | `sb.from("vehicles").update({ status }).eq("id", id)` |
| Mark lead contacted | `admin.jsx` → `LeadsScreen` | `sb.from("leads").update({ status: "contacted" }).eq("id", id)` |
| Submit chat / credit form | `chat-widget.jsx` and `homepage.jsx` credit form | `sb.from("leads").insert({ ...payload, source: "chat" })` |
| Save settings | `admin.jsx` → `SettingsScreen` | `sb.from("settings").update(form).eq("id", 1)` |

### 4. Auth (admin gate)

Wrap `admin.html` body in a Supabase auth check; redirect unauthenticated users to a login page (or a magic-link form). Eddie is the sole user — invite him manually.

### 5. AI description generation

`AddVehicleFlow` already has a `generateAI()` stub. Swap the `setTimeout` for a Vercel Edge Function:

```ts
// /api/generate-description.ts
export const config = { runtime: "edge" };
export default async function handler(req: Request) {
  const { year, make, model, trim, mileage, notes, tone, lang } = await req.json();
  const prompt = `Write a ${tone} ${lang} listing description for a ${year} ${make} ${model} ${trim}, ${mileage} mi. Notes: ${notes}`;
  // call Anthropic or OpenAI, return { en, es }
}
```

### 6. Vercel deploy

`vercel.json`:

```json
{
  "rewrites": [
    { "source": "/v/:slug", "destination": "/car.html?slug=:slug" },
    { "source": "/admin/:screen", "destination": "/admin.html?screen=:screen" }
  ]
}
```

Set env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY` (or your LLM key).

### 7. GitHub workflow

A simple deploy-on-push setup:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: { push: { branches: [main] } }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

For production, migrate the `.jsx` files to `.tsx` with a real Vite build — Babel-in-the-browser is fine for handoff and previews but ships ~1MB of compiler.

---

## Design tokens

All colors live in `styles.css` `:root`. Swap-friendly. Current palette is monochromatic dark navy + slate grays — change `--paper`, `--ink`, `--rust`, `--moss` and the entire site retones.

```css
--paper:    #1A2438;   /* page bg */
--paper-2:  #232E45;   /* card surface */
--paper-3:  #2E3A52;   /* chips, deeper */
--ink:      #E5EAF2;   /* primary text */
--ink-2:    #B4BDCC;   /* secondary text */
--ink-3:    #7A8597;   /* muted */
--rust:     #5B7BB8;   /* brand accent (steel blue) */
--rust-2:   #3F5A8C;   /* darker accent */
--moss:     #4A6890;   /* secondary accent */
```

Dark-mode admin available via `.theme-ink` class wrapper (toggled by the Tweaks panel).

## Tweaks panel

Floating panel exposed in the host's "Tweaks" toolbar. Lets Eddie (or you) toggle:
- Language (EN/ES)
- Admin theme (Light/Dark)
- Demo flags (new-lead pulse)

Add more knobs by appending `<TweakSection>` + a `<Tweak…>` control in `_shell.jsx`.

## Known stubs to replace before launch

- `chat-widget.jsx` — submission `console.log`s the payload; needs Supabase insert
- `homepage.jsx` credit form — `alert()`; needs validation + insert
- `admin.jsx` — `Save changes →` buttons don't persist; wire to Supabase
- `data.js` `photos: 7` → real photo URLs from Supabase storage
- Schema.org JSON-LD in `index.html` is static; render per-vehicle on `car.html`
- Phone numbers / SMS links assume US format

That's the whole bundle. Questions → Eddie's number is in `data.js`. 🚗
