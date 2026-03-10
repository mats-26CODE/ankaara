# Ankara – Development Plan

Based on [APP_IDEA.md](./APP_IDEA.md), aligned with **kazy_web** dashboard structure (sidebar, layout, styling). Payment (Snippe) and subscriptions are **last**.

---

## Tech Stack


| Layer    | Choice                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------- |
| Frontend | Next.js, TypeScript, TailwindCSS, Shadcn UI                                                         |
| Backend  | Supabase (PostgreSQL, Auth, Storage, Edge Functions)                                                |
| Payments | [Snippe](https://www.snippe.sh/) – integrated last ([docs](https://docs.snippe.sh/docs/2026-01-25)) |


---

## Phase 0 – Onboarding (post-signup)

After sign-up/verification, users who have not completed onboarding are sent to an **onboarding** flow:

1. **Account type:** Choose **Business** or **Individual** (stored in `profiles.account_type`).
2. **Details (e.g. for business):** Business name, location/address, capacity (optional), currency. For **individual**, same form can be used (name = freelancer/display name, address, etc.).
3. On submit: set `profiles.onboarding_completed = true`, `profiles.account_type`, and create the first **business** row (name, address, capacity, currency) so they can start creating clients and invoices.
4. Redirect to dashboard. Guard dashboard so that if `!onboarding_completed` → redirect to `/onboarding`.

Schema support (already in migration `20260310130000`):

- **profiles:** `account_type` ('business' | 'individual'), `onboarding_completed` (boolean).
- **businesses:** `capacity` (text, optional).

---

## Phase 1 – Database & Dashboard Shell

### 1.1 Database schema (Supabase)

- **Tables:** profiles (if missing), businesses, clients, invoices, invoice_items, payments, payment_transactions, invoice_views, invoice_templates, subscriptions.
- **Conventions:** UUID PKs, FKs, `created_at` (and `updated_at` where useful), RLS on all tables.
- **Storage:** buckets `logos`, `invoice_pdfs` with RLS.
- **Improvements:** Add `updated_at` on businesses, clients, invoices; index on `invoices.organization_id`, `invoices.status`, `invoices.due_date` for dashboard queries.

### 1.2 Dashboard shell (kazy_web structure)

- **Layout:** `(dashboard)/layout.tsx` – NavBar + `SidebarProvider` + `DashboardSidebar` + `SidebarInset` (header with `SidebarTrigger`, main content, optional footer).
- **Auth:** Redirect unauthenticated users to `/login` (middleware or layout guard).
- **Sidebar:** Ankara-specific menu:
  - **Overview** → `/dashboard`
  - **Businesses** → `/dashboard/businesses`
  - **Clients** → `/dashboard/clients`
  - **Invoices** (collapsible) → All, Drafts, Sent, Paid, Overdue
- **Styling:** Same patterns as kazy_web – Cards, spacing, `text-muted-foreground`, primary for CTAs.

---

## Phase 2 – Core CRUD

### 2.1 Businesses

- List businesses for current user; create/edit business (name, logo, brand_color, currency, address, tax_number).
- **Current business context:** Store selected `business_id` (e.g. in React context or store). Clients and invoices are scoped to this business.

### 2.2 Clients

- CRUD under selected business (name, email, phone, address).
- List with search/filter; use for invoice “bill to”.

---

## Phase 3 – Invoicing (no payment yet)

### 3.1 Invoices & items

- Create invoice: select client, issue_date, due_date, currency, notes.
- Add/remove/edit **invoice items** (description, quantity, unit_price, total per line).
- Compute subtotal, tax, total (tax can be % or fixed later).
- **Status:** draft → send (status → sent); payment link left empty until Phase 5.
- Invoice number: auto-generate (e.g. `INV-001`, per business).

### 3.2 Invoice preview & sharing

- Preview before send (same layout as public page).
- “Share” = copy link to **public invoice page**  `/invoice/[id]` (or `/i/[id]`).
- **View tracking:** on load of public invoice page, insert into `invoice_views` (ip_address, user_agent, viewed_at); optionally set invoice status to `viewed` if currently `sent`.

### 3.3 Public invoice page

- Route: `/invoice/[id]` (public, no auth).
- Show: business info, client, invoice number, dates, line items, subtotal, tax, total, currency.
- **Pay button:** visible but disabled or “Coming soon” until Snippe is integrated.

---

## Phase 4 – Dashboard Metrics

- **Overview page:**
  - Total revenue (sum of paid invoices).
  - Counts: Paid, Outstanding (sent/viewed, not paid), Overdue (due_date < today, not paid).
  - Recent activity: last created/updated invoices or last payments (when applicable).

---

## Phase 5 – Payment & Subscriptions (last)

- **Invoice payments:** Integrate Snippe Payment Sessions (or link). Generate payment link when user clicks “Send” or “Request payment”; store in `invoices.payment_link`. Webhook updates `payments` and invoice status to `paid`.
- **Subscriptions:** Plans free / pro / business; store in `subscriptions`. Use Snippe for subscription billing when ready; limit features by plan (e.g. invoice count) as per APP_IDEA.

---

## Implementation order (todos)

1. **Database** – Create Supabase schema (tables, RLS, storage buckets).
2. **Dashboard shell** – Sidebar + layout (kazy_web-style), auth guard.
3. **Businesses** – CRUD + current business context.
4. **Clients** – CRUD under selected business.
5. **Invoices** – Create, items, preview, list (no payment link yet).
6. **Public invoice page** – View + view tracking; Pay button placeholder.
7. **Dashboard home** – Metrics + recent activity.
8. **Payment + subscriptions** – Snippe integration (last).

---

## References

- [APP_IDEA.md](./APP_IDEA.md) – entities, schema, MVP, roadmap.
- kazy_web – `(dashboard)/layout.tsx`, `DashboardSidebar`, `components/ui/sidebar`, dashboard page cards/styling.
- [Snippe](https://www.snippe.sh/) – payment provider.
- [Snippe API docs](https://docs.snippe.sh/docs/2026-01-25) – Payment Sessions, webhooks, auth.

