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
| Pro | `invoices_per_month` | 50 |
| Pro | `businesses_count` | unlimited |
| Business | `invoices_per_month` | unlimited |
| Business | `businesses_count` | unlimited |

---

## 3. Subscriptions (Per Business)

Table: `subscriptions` (existing, with new column)

| Column | Description |
|--------|-------------|
| `id` | uuid PK |
| `business_id` | FK → businesses |
| `plan` | Slug: free \| pro \| business (kept for quick lookups) |
| `subscription_plan_id` | FK → subscription_plans (source of truth for features) |
| `status` | active \| cancelled \| expired |
| `start_date`, `end_date` | Billing window |

When creating or updating a subscription, set both `plan` (slug) and `subscription_plan_id` from the chosen `subscription_plans` row.

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
   - When creating an invoice: check `invoices_per_month` for the business’s current plan (via `subscriptions.subscription_plan_id` → `subscription_plan_features`).  
   - When creating a business: check `businesses_count` the same way.  
   - Compare to current usage (count of invoices this month, count of businesses for that user).

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

Apply with `supabase db push` (or your usual migration flow).
