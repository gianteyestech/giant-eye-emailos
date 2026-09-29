# Giant Eye EmailOS — B2B SaaS Architecture Blueprint

---

## 🎯 Executive Summary & Value Proposition
Giant Eye EmailOS converts standard, inexpensive cPanel mail hosting into a unified, high-performance, mobile-native email client (the *"Superhuman for cPanel / Webmail"*).

* **Customer Pain:** Google Workspace and Microsoft 365 charge $6–$18/user/month. An agency or multi-domain business hosting 50 mailboxes pays $300–$900/month. Standard cPanel webmail (Roundcube) is fragmented, dated, lacks unified inboxes, and has no native mobile app.
* **EmailOS Solution:** One flat subscription ($19–$69/month) for unlimited or high-volume mailboxes across all their cPanel servers and domains, with a unified mobile/desktop PWA.

---

## 🏗️ Multi-Tenant Architecture & Tech Stack

```
[ PWA / Mobile / Desktop Frontend ]
                │
         HTTPS / JWT
                ▼
      [ API Gateway / BFF ] ─── Auth (Supabase / Clerk / JWT)
         │              │
         │              └── Credentials Vault (AES-256-GCM / KMS)
         ▼
[ PostgreSQL / Supabase ]
         ▲
         │ (Cached mail & metadata)
         │
[ Background Sync Fleet ] (BullMQ + Redis + ImapFlow)
         │
         ├──> cPanel UAPI (:2083)  ── Provisioning, Quotas, Mailbox Admin
         └──> Dovecot/Exim (:993/:465) ── Real-time IMAP Sync & SMTP Dispatch
```

---

## 🗄️ Database Schema Blueprint (PostgreSQL)

```sql
-- 1. Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'starter', -- starter, pro, agency, enterprise
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'trialing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Organization Users (Team Members)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Connected cPanel Servers (Encrypted Vault)
CREATE TABLE cpanel_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    server_url VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    encrypted_credentials TEXT NOT NULL, -- AES-256-GCM encrypted
    auth_type VARCHAR(20) DEFAULT 'auto', -- 'password' or 'token'
    status VARCHAR(50) DEFAULT 'active',
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- 4. Managed Mailboxes
CREATE TABLE mailboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES cpanel_servers(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    disk_used_bytes BIGINT DEFAULT 0,
    disk_quota_bytes BIGINT DEFAULT 0,
    is_suspended BOOLEAN DEFAULT FALSE,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    imap_status VARCHAR(50) DEFAULT 'disconnected'
);

-- 5. Email Threads & Search Cache
CREATE TABLE email_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox_id UUID REFERENCES mailboxes(id) ON DELETE CASCADE,
    message_id VARCHAR(255),
    thread_id VARCHAR(255),
    subject TEXT,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    snippet TEXT,
    date TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    folder VARCHAR(50) DEFAULT 'inbox',
    has_attachments BOOLEAN DEFAULT FALSE
);
```

---

## 🔒 Security & Credential Protection
* **Envelope Encryption:** Master key stored in KMS / Secret Manager; individual credentials encrypted at rest using AES-256-GCM.
* **Row-Level Security (RLS):** All data isolated per tenant (`org_id`).
* **Zero-Knowledge Session Handling:** Sessions decrypted only in ephemeral worker memory for sync jobs.

---

## 🚀 Live Email Synchronization Engine
1. **cPanel UAPI Worker:** Handles administrative tasks (listing mailboxes, modifying quotas, creating emails, suspension).
2. **IMAP Sync Fleet (`ImapFlow` + `BullMQ`):**
   * Uses persistent IMAP IDLE connections or periodic differential syncs.
   * Caches headers, snippets, and attachments in database storage.
   * Real-time push to the frontend using WebSockets / Server-Sent Events (SSE).

---

## 💰 Commercial Pricing Tiers

| Tier | Price | Highlights |
| :--- | :---: | :--- |
| **Starter** | **$12 / mo** | 1 cPanel Server, 10 Mailboxes, 1 User Seat, Unified Inbox, Mobile PWA |
| **Pro** | **$29 / mo** | 3 cPanel Servers, 50 Mailboxes, 3 User Seats, Real-time IMAP Sync, Email Tracking |
| **Agency** | **$69 / mo** | Unlimited Servers, 200 Mailboxes, 10 User Seats, Shared Inboxes, Webhooks |
| **Reseller / White-Label** | **$149 / mo** | Custom domain (`mail.agency.com`), custom branding, unlimited seats, client billing |

---

## 📋 Implementation Roadmap

* [ ] **Phase 1: Multi-Tenant Database & User Authentication**
  * PostgreSQL / Supabase setup, Prisma ORM schema, Clerk/Supabase Auth (Organizations & Roles).
* [ ] **Phase 2: Encrypted Credential Vault & Server Manager**
  * AES-256-GCM encryption helper, Multi-server onboarding dashboard.
* [ ] **Phase 3: Real-Time IMAP Synchronization Fleet**
  * `ImapFlow` background worker, Redis queue, WebSocket live push.
* [ ] **Phase 4: Shared Inboxes & Mailbox Delegation**
  * Assign mailboxes to team members, internal conversation notes.
* [ ] **Phase 5: Stripe Billing & Subscription Gate**
  * Stripe Checkout, tiered feature locks, Customer Portal.
* [ ] **Phase 6: Custom Domain & White-Label Reseller Portal**
  * CNAME routing for agencies (`mail.customerdomain.com`).
