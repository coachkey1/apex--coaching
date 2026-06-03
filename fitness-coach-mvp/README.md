# APEX — Elite Coaching Platform

A mobile-first MVP for online fitness and basketball performance coaching, built with Next.js 15, Supabase, and Stripe.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth + DB | Supabase (Postgres + Storage) |
| Payments | Stripe Subscriptions |
| Styling | Tailwind CSS |
| Charts | Recharts |
| File uploads | react-dropzone |
| Deployment | Vercel |

---

## Features

### Coach
- Dashboard with pending check-in alerts
- Client list with subscription status
- Full client profile: weight trend chart, measurements, recovery scores, training data
- Basketball-specific metrics (shooting %, vertical jump, sprint)
- Progress photo review with lightbox
- Written feedback per check-in

### Client
- Weekly check-in form with collapsible sections
- Body weight, body fat, 7-point measurements
- Sleep, steps, energy & stress (1–10 sliders)
- Sessions completed, RPE
- Basketball performance metrics (conditional on sport)
- Wins / struggles / notes for coach
- Progress photo upload (up to 4, typed as front/side/back/other)
- Check-in history with weight trend chart
- Coach feedback display
- Stripe subscription management

---

## Running Locally

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Stripe](https://stripe.com) account (test mode)

---

### 2. Clone and install

```bash
git clone <your-repo-url>
cd fitness-coach-mvp
npm install
```

---

### 3. Set up Supabase

1. Go to [app.supabase.com](https://app.supabase.com) → New Project
2. Once created, go to **SQL Editor**
3. Paste the entire contents of `supabase/schema.sql` and click **Run**
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

### 4. Set up Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) (make sure you're in **Test mode**)
2. Copy your **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy your **Secret key** → `STRIPE_SECRET_KEY`

**Create subscription products:**
- Go to **Products → Add product**
- Create "Monthly Coaching" → Add price → Recurring → Monthly → e.g. $149/month
- Copy the **Price ID** (starts with `price_`) → `STRIPE_MONTHLY_PRICE_ID`
- Create "Quarterly Coaching" → Add price → Recurring → Every 3 months
- Copy Price ID → `STRIPE_QUARTERLY_PRICE_ID`

**Set up webhook (for local dev):**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the **webhook signing secret** it prints → `STRIPE_WEBHOOK_SECRET`

---

### 5. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_QUARTERLY_PRICE_ID=price_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Quick Start Flow

### As a Coach:
1. Register at `/auth/register` → select **Coach**
2. Go to **Settings** → copy your **Coach ID**
3. Share your Coach ID with clients

### As a Client:
1. Register at `/auth/register` → select **Athlete / Client**
2. Go to **Settings** → paste your Coach ID → Save
3. Submit your first **Weekly Check-in**
4. (Optional) Subscribe via Stripe to unlock coaching

### Coach reviews client:
1. Coach sees pending check-ins on dashboard
2. Taps a client → reviews all data, photos, notes
3. Writes feedback → client sees it on their dashboard

---

## Deploying to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Add all environment variables (same as `.env.local` but with production values)
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://apex-coaching.vercel.app`)
5. Deploy

### 3. Set up Stripe webhook for production
1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing secret** → update `STRIPE_WEBHOOK_SECRET` in Vercel env vars

---

## Project Structure

```
fitness-coach-mvp/
├── app/
│   ├── (coach)/coach/          # Coach-only pages
│   │   ├── dashboard/          # Overview, pending check-ins
│   │   ├── clients/            # Client list
│   │   │   └── [id]/           # Individual client detail
│   │   └── settings/           # Coach profile
│   ├── (client)/client/        # Client-only pages
│   │   ├── dashboard/          # Home with latest stats
│   │   ├── checkin/            # Weekly check-in form
│   │   ├── history/            # All past check-ins
│   │   └── settings/           # Profile, goals, subscription
│   ├── api/
│   │   ├── auth/               # Callback, signout
│   │   ├── stripe/             # Checkout, portal
│   │   └── webhooks/stripe/    # Stripe events
│   ├── auth/                   # Login, register
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── coach/                  # CoachFeedbackForm, PhotoGrid, CoachSettingsForm
│   ├── client/                 # CheckinForm, ClientSettingsForm
│   └── shared/                 # MobileNav, PageHeader, StatCard, WeightChart
├── lib/
│   ├── supabase/               # client.ts, server.ts
│   ├── stripe.ts
│   └── utils.ts
├── middleware.ts                # Auth guards + role routing
├── supabase/schema.sql          # Full DB schema + RLS
└── types/index.ts               # TypeScript interfaces
```

---

## Database Schema Overview

- `profiles` — extends Supabase auth, stores role (coach/client)
- `coaches` — bio, specialties, Stripe account
- `clients` — linked to coach, sport, goal, Stripe subscription
- `checkins` — weekly submissions with all metrics
- `progress_photos` — photos linked to check-ins, stored in Supabase Storage
- `messages` — coach ↔ client messaging (schema ready, UI in v2)

All tables have **Row Level Security** — users only see their own data; coaches see their clients' data.

---

## V2 Roadmap

- [ ] In-app messaging between coach and client
- [ ] Push notifications for new check-ins / feedback
- [ ] Training program builder (PDF/video attachments)
- [ ] Nutrition logging
- [ ] Multi-coach support
- [ ] Admin dashboard for platform owner
- [ ] Export check-in data as PDF report
