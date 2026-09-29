# Giant Eye EmailOS

A high-performance, mobile-first, native-feeling progressive web application designed to manage, send, and receive from **all cPanel email accounts** (across multiple domains) from a single unified interface.

---

## 📱 Features

1. **One-Time cPanel Server Setup**:
   - Provide your cPanel / Namecheap Server URL (e.g. `https://your-server.web-hosting.com:2083`), cPanel Username, and API Token.
   - Automatically synchronizes all email accounts across all domains via cPanel UAPI.
   - Live connection diagnostics tester.
   - Starts clean with zero pre-loaded accounts or credentials.

2. **Unified & Dedicated Webmail (Send & Receive)**:
   - **Unified Inbox**: View aggregated messages across all mailboxes in one place.
   - **Swift Account Switcher**: Tap the top account bar to toggle between mailboxes in 1 click.
   - **Full Email Reader**: View senders, dates, attachments (PDFs, docs), quick reply, and trash.
   - **Quick Compose**: Send emails from any of your cPanel addresses with auto-filled 'From' selection.
   - **1-Click Webmail**: Direct link to open Roundcube sessions for any account.

3. **cPanel Account Management (Admin)**:
   - Complete list of all accounts matching your cPanel view.
   - Real-time disk storage progression bars and quota percentages.
   - **+ New Email**: Create new mailboxes on any configured domain with strong password generation and quota assignment.
   - **Manage Sheet**: Modify quota (1 GB, 2 GB, 5 GB, Unlimited), reset passwords, suspend/unsuspend, or delete mailboxes.

4. **Native Mobile Feel (Cross-Platform PWA)**:
   - Responsive touch UI with bottom tab bar, pull/refresh, sheet modals, and dark glassmorphic styling.
   - Can be added to your iPhone / Android home screen as a standalone PWA or packaged via Capacitor / Cordova.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the server (runs on port 3030 by default)
npm start
```

Open your browser at:
```
http://localhost:3030
```

---

## 🔑 Generating a cPanel API Token:
1. Log in to your cPanel dashboard.
2. In the top search bar, search for **"Manage API Tokens"**.
3. Click **+ Create**, give it a name like `EmailOS`, and select full privileges.
4. Copy the generated token and paste it into the **Server Settings** tab in Giant Eye EmailOS.
