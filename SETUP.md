# ContractorPro — Deploy Guide

Follow these steps in order. Total time: ~45 minutes.

---

## 1. Supabase (Database + Auth)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `contractorpro`, pick a region close to your users
3. Once created, go to **SQL Editor** → paste the entire contents of `supabase/schema.sql` → **Run**
4. Go to **Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`

### Enable Google OAuth (optional but recommended)
1. Go to **Authentication → Providers → Google**
2. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
3. Enable "Google+ API", create OAuth credentials (Web application)
4. Add `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect URI
5. Paste the Client ID and Secret into Supabase

---

## 2. Stripe (Payments)

1. Go to [stripe.com](https://stripe.com) → create account
2. **Products → Add Product**:
   - Name: `ContractorPro`
   - Price: `$29.00` / month (recurring)
   - Copy the **Price ID** (starts with `price_`) → `VITE_STRIPE_PRICE_ID`
3. **Developers → API Keys** → copy **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
4. Copy the **Secret key** (starts with `sk_`) — you'll need it for Step 4

### Enable Stripe Customer Portal
1. Go to **Settings → Billing → Customer Portal**
2. Enable it and set your return URL (your app URL + `/profile`)

---

## 3. Vercel (Hosting)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo (push this folder to GitHub first)
3. Framework: **Vite**
4. Add Environment Variables (Settings → Environment Variables):

```
VITE_SUPABASE_URL          = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY     = eyJ...
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_...
VITE_STRIPE_PRICE_ID       = price_...
```

5. Deploy → copy your Vercel URL (e.g. `https://contractorpro.vercel.app`)

### Update Supabase Auth Redirect
- Supabase → Authentication → URL Configuration
- Add your Vercel URL to **Site URL** and **Redirect URLs**

---

## 4. Supabase Edge Functions (Stripe activation)

Install Supabase CLI:
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Set secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx   # set after step below
supabase secrets set APP_URL=https://contractorpro.vercel.app
```

Deploy functions:
```bash
supabase functions deploy activate-subscription
supabase functions deploy stripe-webhook
supabase functions deploy customer-portal
```

### Register Stripe Webhook
1. Stripe → **Developers → Webhooks → Add Endpoint**
2. URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Events to listen for:
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `customer.subscription.paused`
   - `invoice.payment_failed`
4. Copy the **Signing Secret** → run:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 5. Local Development

```bash
cp .env.example .env.local
# fill in your keys

npm install
npm run dev
# → http://localhost:3000
```

---

## Checklist

- [ ] Supabase project created + schema.sql run
- [ ] Google OAuth configured (optional)
- [ ] Stripe product created ($29/mo)
- [ ] Pushed to GitHub
- [ ] Deployed to Vercel with env vars
- [ ] Supabase redirect URLs updated
- [ ] Edge functions deployed
- [ ] Stripe webhook registered

---

## Revenue Math

| Contractors | Monthly Revenue | Annual |
|-------------|----------------|--------|
| 10          | $290           | $3,480 |
| 50          | $1,450         | $17,400 |
| 100         | $2,900         | $34,800 |
| 500         | $14,500        | $174,000 |

Supabase free tier supports 50,000 users. Vercel free tier covers unlimited deploys.
Your only costs are Stripe fees (2.9% + 30¢ per transaction).
