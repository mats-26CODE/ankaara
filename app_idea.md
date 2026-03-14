# ANKARA – SaaS Invoicing Platform

## Product Overview

ANKARA is a modern invoicing platform that allows freelancers, individuals, and businesses to:

- Create professional invoices
- Send invoices via link
- Track invoice views
- Accept payments through payment links
- Monitor invoice status (paid, overdue, etc)

The platform should be:

- Minimal
- Fast
- Mobile-friendly
- Built for Africa
- Integrated with mobile money payment providers

Primary payment integration target:
Snipe Payment Gateway.

---

# Tech Stack

Frontend (Phase 1)
- Next.js
- TypeScript
- TailwindCSS
- Shadcn UI

Backend
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions

Mobile (Phase 2)
- Flutter
- Riverpod

Payments
- Snipe Payment Gateway

Deployment
- Vercel (frontend)
- Supabase (backend)

---

# Core Entities

Main entities required:

- Profiles (users)
- Businesses (business accounts)
- Clients (customers receiving invoices)
- Invoices
- Invoice Items
- Payments
- Payment Transactions
- Invoice Views
- Invoice Templates
- Subscriptions

Cursor should create these tables in Supabase.

---

# Database Schema

All tables should use UUID primary keys.

Enable:

- Row Level Security (RLS)
- Foreign key relationships
- Created_at timestamps

---

# 1 Profiles -> Already done

Linked to Supabase auth.users.

Table: profiles

Fields:

id (uuid, primary key, references auth.users.id)
full_name (text)
email (text)
phone (text)
avatar_url (text)
created_at (timestamp)
updated_at (timestamp)

---

# 2 businesses

Represents a business account.

A user can own one or multiple businesses.

Table: businesses

Fields:

id (uuid, primary key)
owner_id (uuid, foreign key → profiles.id)
name (text)
logo_url (text)
brand_color (text)
currency (text)
address (text)
tax_number (text)
created_at (timestamp)

---

# 3 Clients

Customers receiving invoices.

Table: clients

Fields:

id (uuid, primary key)
business_id (uuid, foreign key → businesses.id)
name (text)
email (text)
phone (text)
address (text)
created_at (timestamp)

---

# 4 Invoices

Main invoice table.

Table: invoices

Fields:

id (uuid, primary key)
business_id (uuid, foreign key → businesses.id)
client_id (uuid, foreign key → clients.id)
invoice_number (text)
status (text)
issue_date (date)
due_date (date)
subtotal (numeric)
tax (numeric)
total (numeric)
currency (text)
payment_link (text)
notes (text)
created_at (timestamp)

Allowed status values:

draft
sent
viewed
paid
overdue
cancelled

---

# 5 Invoice Items

Each invoice contains multiple items.

Table: invoice_items

Fields:

id (uuid, primary key)
invoice_id (uuid, foreign key → invoices.id)
description (text)
quantity (numeric)
unit_price (numeric)
total (numeric)

---

# 6 Invoice Payments

Stores payment records for **customer invoice payments** (payment link / gateway).  
See also: subscription_payments for SaaS plan billing.

Table: invoice_payments (formerly payments)

Fields:

id (uuid, primary key)
invoice_id (uuid, foreign key → invoices.id)
payment_provider (text)
amount (numeric)
currency (text)
status (text)
paid_at (timestamp)
reference (text)

Allowed status values:

pending
success
failed

---

# 7 Invoice Payment Transactions

Stores raw payment gateway responses for invoice payments.

Table: invoice_payment_transactions (formerly payment_transactions)

Fields:

id (uuid, primary key)
invoice_payment_id (uuid, foreign key → invoice_payments.id)
provider_transaction_id (text)
raw_payload (jsonb)
created_at (timestamp)

---

# 8 Invoice Views

Tracks when an invoice link is opened.

Table: invoice_views

Fields:

id (uuid, primary key)
invoice_id (uuid, foreign key → invoices.id)
ip_address (text)
user_agent (text)
viewed_at (timestamp)

---

# 9 Invoice Templates

Allows invoice customization.

Table: invoice_templates

Fields:

id (uuid, primary key)
business_id (uuid, foreign key → businesses.id)
name (text)
layout (jsonb)
is_default (boolean)

---

# 10 Subscriptions

Stores SaaS subscription status. Plans and features are in subscription_plans and subscription_plan_features. Billing for plans is in subscription_payments (separate from invoice_payments).

Table: subscriptions

Fields:

id (uuid, primary key)
business_id (uuid, foreign key → businesses.id)
subscription_plan_id (uuid, foreign key → subscription_plans.id, optional)
plan (text) — slug: free | pro | business
status (text)
start_date (timestamp)
end_date (timestamp)

Table: subscription_plans — catalog (Free, Pro, Business) with name, price_amount, price_currency, billing_interval, is_contact_sales.

Table: subscription_plan_features — per-plan limits, e.g. invoices_per_month (5 / 50 / unlimited), businesses_count (1 / unlimited / unlimited).

Table: subscription_payments — payments made for the subscription (SaaS billing), separate from invoice_payments.

Allowed plan values:

free
pro
business

Allowed status values:

active
cancelled
expired

---

# Storage Buckets

Create Supabase storage buckets:

logos
invoice_pdfs

---

# Core Backend Logic

Edge functions required:

create_invoice
generate_payment_link
handle_payment_webhook
mark_invoice_paid
send_invoice_notification

---

# Invoice Payment Flow

1 User creates invoice

2 System generates payment link

3 Invoice link shared with customer

4 Customer opens invoice page

5 Customer clicks pay

6 Payment gateway processes payment

7 Gateway sends webhook

8 Webhook updates invoice status to PAID

---

# Public Invoice Page

A public route must exist:

/invoice/{invoice_id}

/pay/{invoice_id}

Customer can:

- View invoice
- See items
- See total
- Click pay button

---

# MVP Features

Must build first:

Authentication
Create Business
Create Client
Create Invoice
Add Invoice Items
Share Invoice Link
Invoice View Tracking
Payment Link Integration (We will use https://snipe.sh)
Dashboard

---

# Dashboard Metrics

Display:

Total Revenue
Paid Invoices
Outstanding Invoices
Overdue Invoices
Recent Activity

---

# UI Design Philosophy

Minimal SaaS style.

Inspired by:

Stripe
Linear
Notion

Use:

Large whitespace
Rounded cards
Clean typography
Soft shadows

Primary color:

#4F64F1 or variations of it

Secondary color
#FFFDFF (this is for backgrounds)

---

# Development Roadmap

Phase 1
Database setup
Authentication
businesses
Clients

Phase 2
Invoice creation
Invoice items
Invoice preview

Phase 3
Invoice sharing
Public invoice page

Phase 4
Payment integration

Phase 5
Dashboard analytics

Phase 6
Mobile app (Flutter)

---

# End Goal

Ankara becomes a financial platform that helps businesses:

Create invoices
Track revenue
Get paid faster
Understand cash flow