// API Client wrapper for cPanel Email Hub

const API = {
  // Config & Server
  async getConfig() {
    const res = await fetch('/api/config');
    return res.json();
  },

  async setConfig(configData) {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData)
    });
    return res.json();
  },

  async testConnection() {
    const res = await fetch('/api/config/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  async logout() {
    const res = await fetch('/api/config/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  // Accounts
  async getAccounts(domain = null) {
    const url = domain && domain !== 'all' ? `/api/accounts?domain=${encodeURIComponent(domain)}` : '/api/accounts';
    const res = await fetch(url);
    return res.json();
  },

  async getDomains() {
    const res = await fetch('/api/domains');
    return res.json();
  },

  async createAccount(data) {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateQuota(email, quotaMb) {
    const res = await fetch(`/api/accounts/${encodeURIComponent(email)}/quota`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotaMb })
    });
    return res.json();
  },

  async updatePassword(email, newPassword) {
    const res = await fetch(`/api/accounts/${encodeURIComponent(email)}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    return res.json();
  },

  async toggleSuspend(email) {
    const res = await fetch(`/api/accounts/${encodeURIComponent(email)}/suspend`, {
      method: 'PUT'
    });
    return res.json();
  },

  async deleteAccount(email) {
    const res = await fetch(`/api/accounts/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getWebmailSession(email) {
    const res = await fetch(`/api/webmail-session/${encodeURIComponent(email)}`);
    return res.json();
  },

  // Emails (Webmail)
  async getEmails({ account = 'all', folder = 'inbox', search = '', unreadOnly = false }) {
    const params = new URLSearchParams();
    if (account) params.append('account', account);
    if (folder) params.append('folder', folder);
    if (search) params.append('search', search);
    if (unreadOnly) params.append('unreadOnly', 'true');

    const res = await fetch(`/api/emails?${params.toString()}`);
    return res.json();
  },

  async getEmailById(id) {
    const res = await fetch(`/api/emails/${id}`);
    return res.json();
  },

  async sendEmail(data) {
    const res = await fetch('/api/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async markRead(id, isRead = true) {
    const res = await fetch(`/api/emails/${id}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead })
    });
    return res.json();
  },

  async deleteEmail(id) {
    const res = await fetch(`/api/emails/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};
