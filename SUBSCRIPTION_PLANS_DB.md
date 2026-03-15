# Subscription & Payment Database Flow

This document describes the database design for **subscription plans** and the split between **invoice payments** (customer paying an invoice) and **subscription payments** (user paying for SaaS plan).

---

## 1. Payment Tables: Invoice vs Subscription

| Purpose | Tables | Description |
|--------|--------|-------------|
| **Invoice payments** | `invoice_payments`, `invoice_payment_transactions` | When a **customer** pays an **invoice** (payment link / gateway). |
| **Subscription payments** | `subscription_payments` | When a **user** pays for their **Pro/Business** subscription (SaaS billing). |

Previously named `payments` and `payment_transactions` have been renamed to make it explicit they are for **invoices** only.

---

## 2. Subscription Plans (Catalog)

Plans are stored in Supabase so you can change pricing and features without code deploys.

### Table: `subscription_plans`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `slug` | text | `free` \| `pro` \| `business` (unique) |
| `name` | text | Display name |
| `description` | text | Optional |
| `price_amount` | numeric | Null for free or “contact sales” (Business) |
| `price_currency` | text | e.g. USD |
| `billing_interval` | text | `monthly` \| `yearly` \| null |
| `is_contact_sales` | boolean | True for Business (custom pricing) |
| `sort_order` | smallint | For ordering on pricing page |

- **Free:** `price_amount = 0`, `is_contact_sales = false`
- **Pro:** Fixed price (e.g. 19.99), `is_contact_sales = false`
- **Business:** `price_amount = null`, `is_contact_sales = true`

### Table: `subscription_plan_features`

Feature limits per plan (used for enforcement and display).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `subscription_plan_id` | uuid | FK → subscription_plans |
| `feature_key` | text | e.g. `invoices_per_month`, `businesses_count` |
| `limit_type` | text | `number` \| `unlimited` |
| `limit_value` | numeric | Used when limit_type = number; null for unlimited |

**Seeded limits:**

| Plan | Feature | Limit |
|------|---------|--------|
| Free | `invoices_per_month` | 5 |
| Free | `businesses_count` | 1 |
| Free | `clients_per_business` | 10 |
| Pro | `invoices_per_month` | 50 |
| Pro | `businesses_count` | unlimited |
| Pro | `clients_per_business` | 30 |
| Business | `invoices_per_month` | unlimited |
| Business | `businesses_count` | unlimited |
| Business | `clients_per_business` | unlimited |

---

## 3. Subscriptions (Per User)

Table: `subscriptions` — **one row per user (profile)**. Limits apply across all businesses owned by that user.

| Column | Description |
|--------|-------------|
| `id` | uuid PK |
| `user_id` | FK → profiles.id (unique: one subscription per user) |
| `plan` | Slug: free \| pro \| business (kept for quick lookups) |
| `subscription_plan_id` | FK → subscription_plans (source of truth for features) |
| `status` | active \| cancelled \| expired |
| `start_date`, `end_date` | Billing window |

When creating or updating a subscription, set both `plan` (slug) and `subscription_plan_id` from the chosen `subscription_plans` row. **Enforcement:** `invoices_per_month` = total invoices created in the current month across **all** businesses owned by the user; `businesses_count` = number of businesses owned by the user.

---

## 4. Subscription Payments (SaaS Billing)

Table: `subscription_payments`

Records each payment made **for** a subscription (e.g. Pro monthly charge), separate from invoice payments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `subscription_id` | uuid | FK → subscriptions |
| `amount` | numeric | |
| `currency` | text | |
| `status` | text | pending \| success \| failed |
| `paid_at` | timestamptz | When payment succeeded |
| `provider_reference` | text | Gateway reference |
| `raw_payload` | jsonb | Optional gateway response |

---

## 5. App Usage

1. **Pricing page**  
   - Select from `subscription_plans` (and join `subscription_plan_features`) to show plans, prices, and feature bullets.  
   - Use `slug`, `name`, `price_amount`, `price_currency`, `billing_interval`, `is_contact_sales`, and feature rows.

2. **Enforcement**  
   - Subscriptions are **per user** (`subscriptions.user_id`).  
   - When creating an invoice: check `invoices_per_month` for the **user’s** plan (via their subscription’s `subscription_plan_id` → `subscription_plan_features`). Compare to **total invoices created this month across all businesses** owned by that user.  
   - When creating a business: check `businesses_count` for the user’s plan. Compare to **total number of businesses** owned by that user.

3. **Subscription flow (frontend)**  
   - **Landing:** Pricing section fetches `subscription_plans` + features and shows "Choose this plan". Logged-in → `/subscribe?plan=<slug>`; else → `/login?redirect=/subscribe?plan=<slug>`.  
   - **Subscribe page (`/subscribe`):** Requires auth. Query `?plan=free|pro|business` pre-selects plan; `?from=onboarding` shows "Skip for now". Free → set subscription and go to dashboard; Pro → "Continue to payment" (Snippe integration); Business → contact mailto.  
   - **After sign-up/onboarding:** Verify OTP success redirects to `/subscribe?from=onboarding` (paywall with skip).  
   - **Payment:** Pro/Business payments will use Snippe (POST /v1/payments, webhook, then insert `subscription_payments` and set subscription). See [Snippe docs](https://docs.snippe.sh/docs/2026-01-25).

4. **After migrations**  
   - Run `supabase gen types typescript --local` (or your project ID) and replace `database.types.ts` so types match `invoice_payments`, `invoice_payment_transactions`, `subscription_plans`, `subscription_plan_features`, `subscription_payments`.  
   - Any code that referenced `payments` or `payment_transactions` should use `invoice_payments` and `invoice_payment_transactions`.

---

## 6. Migrations

- `20260314000000_rename_payments_to_invoice_payments.sql`  
  - Renames `payments` → `invoice_payments`, `payment_transactions` → `invoice_payment_transactions`, updates FKs and RLS.

- `20260314010000_subscription_plans_and_features.sql`  
  - Creates `subscription_plans`, `subscription_plan_features`, adds `subscription_plan_id` to `subscriptions`, creates `subscription_payments`, seeds plans and features.

- `20260317000000_subscription_plan_limit_checks.sql`  
  - Adds `check_plan_limit(user_id, feature_key)` and BEFORE INSERT triggers on `invoices` (invoices_per_month) and `businesses` (businesses_count). On limit exceeded, raises with message `PLAN_LIMIT:<feature_key>`.

- `20260317100000_clients_per_business_limit.sql`  
  - Seeds `clients_per_business`: Free 10, Pro 30, Business unlimited. Extends `check_plan_limit` with optional `p_context` (for business_id). Adds BEFORE INSERT trigger on `clients`.

Apply with `supabase db push` (or your usual migration flow).

---

## 7. Limit enforcement (backend)

Limits must be enforced in the **backend** so they cannot be bypassed. Two main options:

| Approach | How it works | Pros | Cons |
|----------|--------------|------|------|
| **Postgres triggers + function** | `BEFORE INSERT` on `invoices` and `businesses` calls a shared `check_plan_limit(user_id, feature_key)` that reads the user’s plan, looks up the feature limit in `subscription_plan_features`, computes current usage, and `RAISE EXCEPTION` if over limit. | Cannot be bypassed; no app code change for insert paths; single source of truth in DB. | Limit logic lives in SQL; adding a new feature requires a new trigger and a usage branch in the function. |
| **Edge Function / RPC** | Client calls an Edge Function or RPC (e.g. `create_invoice`) that checks limits then performs the insert. | Logic can be in TypeScript; easy to return 402 and redirect URL. | All write paths must go through that API; if RLS still allows direct insert, users could bypass unless we lock down inserts. |

**Chosen approach: Postgres function + triggers**

- A single function **`check_plan_limit(p_user_id uuid, p_feature_key text, p_context jsonb DEFAULT NULL)`**:
  - Loads the user’s active subscription and its `subscription_plan_id`.
  - Loads the plan’s feature row from `subscription_plan_features` for `p_feature_key`.
  - If `limit_type = 'unlimited'`, returns without error.
  - Otherwise computes current usage: `invoices_per_month` = count invoices this month for all businesses owned by `p_user_id`; `businesses_count` = count businesses where `owner_id = p_user_id`; `clients_per_business` = count clients for the business in `p_context->>'business_id'`.
  - If `current_usage >= limit_value`, raises an exception with message `PLAN_LIMIT:<feature_key>` so the app can show “Plan limit reached” and redirect to `/subscribe`.

- **Triggers:**
  - **`invoices`**: `BEFORE INSERT` → get `owner_id` from `businesses` for `NEW.business_id`, call `check_plan_limit(owner_id, 'invoices_per_month')`.
  - **`businesses`**: `BEFORE INSERT` → call `check_plan_limit(NEW.owner_id, 'businesses_count')`.
  - **`clients`**: `BEFORE INSERT` → get `owner_id` from `businesses` for `NEW.business_id`, call `check_plan_limit(owner_id, 'clients_per_business', jsonb_build_object('business_id', NEW.business_id))`.

- **App:** On insert failure, if the error message contains `PLAN_LIMIT` (e.g. `PLAN_LIMIT:invoices_per_month`), show a toast and redirect to `/subscribe` (or open upgrade modal). No need to change how the app inserts (it keeps using `supabase.from('invoices').insert(...)` etc.).

**Adding a new feature limit later:** Add a row in `subscription_plan_features`, implement the usage query for that `feature_key` inside `check_plan_limit`, and add a trigger on the relevant table that calls `check_plan_limit(..., 'new_feature_key')`.
