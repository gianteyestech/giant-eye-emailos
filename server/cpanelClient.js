const axios = require('axios');
const https = require('https');

class CpanelClient {
  constructor() {
    this.config = {
      serverUrl: process.env.CPANEL_SERVER_URL || '', // e.g. https://premium265.web-hosting.com:2083
      username: process.env.CPANEL_USERNAME || '',    // cPanel account username
      apiToken: process.env.CPANEL_API_TOKEN || '',    // cPanel API token (or password)
      authType: process.env.CPANEL_AUTH_TYPE || 'token', // 'token' or 'password'
      isConfigured: false
    };

    // In-memory working store (starts clean, populated when cPanel is connected)
    this.accounts = [];
    this.domains = [];

    if (this.config.serverUrl && this.config.username && this.config.apiToken) {
      this.config.isConfigured = true;
    }

    // Axios instance for cPanel
    this.axiosInstance = axios.create({
      timeout: 12000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Many shared hosts have self-signed or wildcard SNI on port 2083
      })
    });
  }

  getConfig() {
    return {
      serverUrl: this.config.serverUrl,
      username: this.config.username,
      hasToken: Boolean(this.config.apiToken),
      authType: this.config.authType,
      isConfigured: this.config.isConfigured,
      domainsCount: this.domains.length,
      accountsCount: this.accounts.length
    };
  }

  setConfig(newConfig) {
    let cleanUrl = (newConfig.serverUrl || '').trim();
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    // Make sure port 2083 is present if omitted
    if (cleanUrl && !cleanUrl.includes(':2083') && !cleanUrl.includes(':2082')) {
      const urlObj = new URL(cleanUrl);
      if (!urlObj.port) {
        urlObj.port = '2083';
        cleanUrl = urlObj.origin;
      }
    }

    this.config.serverUrl = cleanUrl;
    this.config.username = (newConfig.username || '').trim();
    if (newConfig.apiToken) {
      this.config.apiToken = (newConfig.apiToken || '').trim();
    }
    this.config.authType = newConfig.authType || 'token';
    this.config.isConfigured = Boolean(this.config.serverUrl && this.config.username && this.config.apiToken);

    return this.getConfig();
  }

  clearConfig() {
    this.config = {
      serverUrl: '',
      username: '',
      apiToken: '',
      authType: 'token',
      isConfigured: false
    };
    this.accounts = [];
    this.domains = [];
    return this.getConfig();
  }

  getAuthHeaders() {
    if (this.config.authType === 'password') {
      const encoded = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64');
      return {
        Authorization: `Basic ${encoded}`
      };
    } else {
      return {
        Authorization: `cpanel ${this.config.username}:${this.config.apiToken}`
      };
    }
  }

  async testConnection() {
    if (!this.config.isConfigured) {
      return {
        success: false,
        message: 'cPanel server settings are incomplete. Please provide Server URL, Username, and API Token.'
      };
    }

    try {
      const endpoint = `${this.config.serverUrl}/execute/Email/list_pops_with_disk`;
      const response = await this.axiosInstance.get(endpoint, {
        headers: this.getAuthHeaders()
      });

      if (response.data && (response.data.status === 1 || Array.isArray(response.data.data))) {
        return {
          success: true,
          message: `Successfully connected to Namecheap cPanel! Found ${response.data.data.length} email account(s).`,
          accountCount: response.data.data.length
        };
      } else {
        return {
          success: false,
          message: response.data?.errors?.[0] || 'cPanel responded but did not return accounts list.'
        };
      }
    } catch (err) {
      return {
        success: false,
        message: `Connection failed: ${err.response?.data?.errors?.[0] || err.message}`
      };
    }
  }

  async listAccounts(filterDomain = null) {
    if (this.config.isConfigured) {
      try {
        const endpoint = `${this.config.serverUrl}/execute/Email/list_pops_with_disk`;
        const params = filterDomain ? { domain: filterDomain } : {};
        const response = await this.axiosInstance.get(endpoint, {
          headers: this.getAuthHeaders(),
          params
        });

        if (response.data && response.data.status === 1 && Array.isArray(response.data.data)) {
          // Normalize cPanel UAPI output
          const liveAccounts = response.data.data.map((acc) => {
            const diskUsedBytes = Number(acc.diskused) || 0;
            const diskQuotaBytes = Number(acc.diskquota) || (acc.diskquota === 'unlimited' ? 0 : 0);
            const percentage = diskQuotaBytes > 0 ? ((diskUsedBytes / diskQuotaBytes) * 100).toFixed(2) : 0;

            return {
              email: acc.email,
              user: acc.user,
              domain: acc.domain,
              diskused: diskUsedBytes,
              diskquota: diskQuotaBytes,
              humandiskused: acc.humandiskused || this.formatBytes(diskUsedBytes),
              humandiskquota: acc.humandiskquota || (diskQuotaBytes === 0 ? 'Unlimited' : this.formatBytes(diskQuotaBytes)),
              diskpercentage: Number(percentage),
              suspended_login: acc.suspended_login || 0,
              suspended_incoming: acc.suspended_incoming || 0,
              unreadCount: 0
            };
          });

          // Sync our domains list
          const uniqueDomains = [...new Set(liveAccounts.map(a => a.domain).filter(Boolean))];
          if (uniqueDomains.length > 0) {
            this.domains = uniqueDomains;
          }
          this.accounts = liveAccounts;
          return this.accounts;
        }
      } catch (err) {
        console.warn('[cPanelClient] Remote fetch error, falling back to local cached store:', err.message);
      }
    }

    // Local / cached fallback
    if (filterDomain) {
      return this.accounts.filter(a => a.domain.toLowerCase() === filterDomain.toLowerCase());
    }
    return this.accounts;
  }

  async listDomains() {
    if (this.config.isConfigured) {
      try {
        const endpoint = `${this.config.serverUrl}/execute/Email/list_mail_domains`;
        const response = await this.axiosInstance.get(endpoint, {
          headers: this.getAuthHeaders()
        });
        if (response.data?.status === 1 && Array.isArray(response.data.data)) {
          this.domains = response.data.data;
          return this.domains;
        }
      } catch (err) {
        console.warn('[cPanelClient] Could not fetch remote domains:', err.message);
      }
    }
    return this.domains;
  }

  async createAccount({ emailUser, domain, password, quotaMb }) {
    const fullEmail = `${emailUser}@${domain}`;
    const quotaNumber = Number(quotaMb) || 1024; // default 1 GB

    if (this.config.isConfigured) {
      try {
        const endpoint = `${this.config.serverUrl}/execute/Email/add_pop`;
        const response = await this.axiosInstance.get(endpoint, {
          headers: this.getAuthHeaders(),
          params: {
            email: emailUser,
            domain: domain,
            password: password,
            quota: quotaNumber === 0 ? 0 : quotaNumber
          }
        });

        if (response.data?.status !== 1) {
          throw new Error(response.data?.errors?.[0] || 'cPanel rejected creation');
        }
      } catch (err) {
        throw new Error(err.response?.data?.errors?.[0] || err.message);
      }
    }

    // Update in-memory record
    const diskQuotaBytes = quotaNumber === 0 ? 0 : quotaNumber * 1024 * 1024;
    const newAcc = {
      email: fullEmail,
      user: emailUser,
      domain: domain,
      diskused: 0,
      diskquota: diskQuotaBytes,
      humandiskused: '0 bytes',
      humandiskquota: quotaNumber === 0 ? 'Unlimited' : `${quotaNumber >= 1024 ? (quotaNumber / 1024).toFixed(0) + ' GB' : quotaNumber + ' MB'}`,
      diskpercentage: 0.0,
      suspended_login: 0,
      suspended_incoming: 0,
      has_custom_quota: true,
      created_at: new Date().toISOString(),
      unreadCount: 0
    };

    // Add if not existing
    const existingIndex = this.accounts.findIndex(a => a.email.toLowerCase() === fullEmail.toLowerCase());
    if (existingIndex >= 0) {
      this.accounts[existingIndex] = newAcc;
    } else {
      this.accounts.unshift(newAcc);
    }

    if (!this.domains.includes(domain)) {
      this.domains.push(domain);
    }

    return newAcc;
  }

  async updateQuota(fullEmail, quotaMb) {
    const [user, domain] = fullEmail.split('@');
    const quotaNumber = Number(quotaMb) || 0;

    if (this.config.isConfigured) {
      try {
        const endpoint = `${this.config.serverUrl}/execute/Email/edit_pop_quota`;
        await this.axiosInstance.get(endpoint, {
          headers: this.getAuthHeaders(),
          params: {
            email: user,
            domain: domain,
            quota: quotaNumber
          }
        });
      } catch (err) {
        throw new Error(err.response?.data?.errors?.[0] || err.message);
      }
    }

    const acc = this.accounts.find(a => a.email.toLowerCase() === fullEmail.toLowerCase());
    if (acc) {
      const bytes = quotaNumber === 0 ? 0 : quotaNumber * 1024 * 1024;
      acc.diskquota = bytes;
      acc.humandiskquota = quotaNumber === 0 ? 'Unlimited' : (quotaNumber >= 1024 ? (quotaNumber / 1024) + ' GB' : quotaNumber + ' MB');
      acc.diskpercentage = bytes > 0 ? Number(((acc.diskused / bytes) * 100).toFixed(2)) : 0;
    }
    return acc;
  }

  async updatePassword(fullEmail, newPassword) {
    const [user, domain] = fullEmail.split('@');
    if (this.config.isConfigured) {
      try {
        const endpoint = `${this.config.serverUrl}/execute/Email/passwd_pop`;
        await this.axiosInstance.get(endpoint, {
          headers: this.getAuthHeaders(),
          params: {
            email: user,
            domain: domain,
            password: newPassword
          }
        });
      } catch (err) {
        throw new Error(err.response?.data?.errors?.[0] || err.message);
      }
    }
    return { success: true, email: fullEmail };
  }

  async toggleSuspend(fullEmail) {
    const [user, domain] = fullEmail.split('@');
    const acc = this.accounts.find(a => a.email.toLowerCase() === fullEmail.toLowerCase());
    if (!acc) throw new Error('Account not found');

    const shouldSuspend = acc.suspended_login === 0;
    const action = shouldSuspend ? 'suspend_login' : 'unsuspend_login';

    if (this.config.isConfigured) {
      try {
        const endpoint = `${this.config.serverUrl}/execute/Email/${action}`;
        await this.axiosInstance.get(endpoint, {
          headers: this.getAuthHeaders(),
          params: {
            email: user,
            domain: domain
          }
        });
      } catch (err) {
        throw new Error(err.response?.data?.errors?.[0] || err.message);
      }
    }

    acc.suspended_login = shouldSuspend ? 1 : 0;
    acc.suspended_incoming = shouldSuspend ? 1 : 0;
    return acc;
  }

  async deleteAccount(fullEmail) {
    const [user, domain] = fullEmail.split('@');
    if (this.config.isConfigured) {
      try {
        const endpoint = `${this.config.serverUrl}/execute/Email/delete_pop`;
        await this.axiosInstance.get(endpoint, {
          headers: this.getAuthHeaders(),
          params: {
            email: user,
            domain: domain
          }
        });
      } catch (err) {
        throw new Error(err.response?.data?.errors?.[0] || err.message);
      }
    }

    this.accounts = this.accounts.filter(a => a.email.toLowerCase() !== fullEmail.toLowerCase());
    return { success: true, email: fullEmail };
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new CpanelClient();
