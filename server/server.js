const express = require('express');
const cors = require('cors');
const path = require('path');
const cpanelClient = require('./cpanelClient');
const mailClient = require('./mailClient');

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ------------------------------------
// cPanel Server Settings API
// ------------------------------------

// Get current server connection status
app.get('/api/config', (req, res) => {
  res.json(cpanelClient.getConfig());
});

// Update server connection settings
app.post('/api/config', (req, res) => {
  const { serverUrl, username, apiToken, authType } = req.body;
  const updated = cpanelClient.setConfig({ serverUrl, username, apiToken, authType });
  res.json({ success: true, config: updated });
});

// Logout / Disconnect current cPanel account
app.post('/api/config/logout', (req, res) => {
  const cleared = cpanelClient.clearConfig();
  res.json({ success: true, message: 'Logged out from cPanel account', config: cleared });
});

// Test connection to live cPanel
app.post('/api/config/test', async (req, res) => {
  const result = await cpanelClient.testConnection();
  res.json(result);
});

// ------------------------------------
// cPanel Email Accounts Admin API
// ------------------------------------

// List all email accounts (optionally filtered by domain)
app.get('/api/accounts', async (req, res) => {
  try {
    const domain = req.query.domain || null;
    const accounts = await cpanelClient.listAccounts(domain);
    const unreadCounts = mailClient.getUnreadCounts();

    // Attach unread counts to accounts
    const enriched = accounts.map(acc => ({
      ...acc,
      unreadCount: unreadCounts[acc.email] || 0
    }));

    res.json({
      success: true,
      total: enriched.length,
      accounts: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List all domains in cPanel
app.get('/api/domains', async (req, res) => {
  try {
    const domains = await cpanelClient.listDomains();
    res.json({ success: true, domains });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new cPanel email account
app.post('/api/accounts', async (req, res) => {
  try {
    const { emailUser, domain, password, quotaMb } = req.body;
    if (!emailUser || !domain || !password) {
      return res.status(400).json({ success: false, error: 'Email username, domain, and password are required' });
    }

    const created = await cpanelClient.createAccount({ emailUser, domain, password, quotaMb });
    res.json({ success: true, account: created });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update account quota
app.put('/api/accounts/:email/quota', async (req, res) => {
  try {
    const { quotaMb } = req.body;
    const updated = await cpanelClient.updateQuota(req.params.email, quotaMb);
    res.json({ success: true, account: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update account password
app.put('/api/accounts/:email/password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'New password is required' });
    }
    const result = await cpanelClient.updatePassword(req.params.email, newPassword);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Suspend / Unsuspend account
app.put('/api/accounts/:email/suspend', async (req, res) => {
  try {
    const result = await cpanelClient.toggleSuspend(req.params.email);
    res.json({ success: true, account: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete account
app.delete('/api/accounts/:email', async (req, res) => {
  try {
    const result = await cpanelClient.deleteAccount(req.params.email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ------------------------------------
// Webmail & Messages API (Send & Receive)
// ------------------------------------

// Get emails (unified or filtered by account)
app.get('/api/emails', (req, res) => {
  const { account, folder, search, unreadOnly } = req.query;
  const emails = mailClient.getEmails({
    account,
    folder: folder || 'inbox',
    search: search || '',
    unreadOnly: unreadOnly === 'true'
  });
  const unreadCounts = mailClient.getUnreadCounts();

  res.json({
    success: true,
    total: emails.length,
    unreadTotal: unreadCounts.all || 0,
    unreadCounts,
    emails
  });
});

// Get single email content
app.get('/api/emails/:id', (req, res) => {
  const email = mailClient.getEmailById(req.params.id);
  if (!email) {
    return res.status(404).json({ success: false, error: 'Email not found' });
  }
  res.json({ success: true, email });
});

// Send new email
app.post('/api/emails/send', async (req, res) => {
  try {
    const { fromAccount, to, cc, bcc, subject, body, smtpPassword, smtpHost } = req.body;
    const sentItem = await mailClient.sendEmail({
      fromAccount,
      to,
      cc,
      bcc,
      subject,
      body,
      smtpPassword,
      smtpHost
    });
    res.json({ success: true, email: sentItem });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Toggle star / mark read / delete email
app.post('/api/emails/:id/mark-read', (req, res) => {
  const isRead = req.body.isRead !== undefined ? req.body.isRead : true;
  const updated = mailClient.markRead(req.params.id, isRead);
  res.json({ success: true, email: updated });
});

app.post('/api/emails/:id/toggle-star', (req, res) => {
  const updated = mailClient.toggleStarred(req.params.id);
  res.json({ success: true, email: updated });
});

app.delete('/api/emails/:id', (req, res) => {
  const result = mailClient.deleteEmail(req.params.id);
  res.json(result);
});

// Direct Webmail Roundcube session generator
app.get('/api/webmail-session/:email', (req, res) => {
  const email = req.params.email;
  const cfg = cpanelClient.getConfig();
  const domain = email.split('@')[1] || 'domain.com';
  
  // Standard cPanel webmail direct port is 2096 (SSL) or 2095
  const webmailBase = cfg.serverUrl 
    ? cfg.serverUrl.replace(':2083', ':2096').replace(':2082', ':2095') 
    : `https://webmail.${domain}`;

  res.json({
    success: true,
    email,
    webmailUrl: `${webmailBase}/?user=${encodeURIComponent(email)}`,
    note: 'One-click launch to native Roundcube Webmail interface'
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Giant Eye EmailOS] Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
