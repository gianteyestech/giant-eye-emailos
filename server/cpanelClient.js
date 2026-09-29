const axios = require('axios');
const https = require('https');

class CpanelClient {
  constructor() {
    this.config = {
      serverUrl: process.env.CPANEL_SERVER_URL || '',
      username: process.env.CPANEL_USERNAME || '',
      apiToken: process.env.CPANEL_API_TOKEN || '',
      authType: process.env.CPANEL_AUTH_TYPE || 'auto', // 'auto', 'password', or 'token'
      isConfigured: false
    };

    // Active session cache for password-based logins
    this.sessionToken = ''; // e.g. /cpsess1234567890
    this.sessionCookies = '';
    this.sessionExpires = 0;

    // In-memory working store
    this.accounts = [];
    this.domains = [];

    if (this.config.serverUrl && this.config.username && this.config.apiToken) {
      this.config.isConfigured = true;
    }

    this.axiosInstance = axios.create({
      timeout: 15000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
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
    if (cleanUrl && !cleanUrl.includes(':2083') && !cleanUrl.includes(':2082')) {
      try {
        const urlObj = new URL(cleanUrl);
        if (!urlObj.port) {
          urlObj.port = '2083';
          cleanUrl = urlObj.origin;
        }
      } catch (e) {
        // ignore url parsing error
      }
    }

    this.config.serverUrl = cleanUrl;
    this.config.username = (newConfig.username || '').trim();
    if (newConfig.apiToken) {
      this.config.apiToken = (newConfig.apiToken || '').trim();
    }
    this.config.authType = newConfig.authType || 'auto';
    this.config.isConfigured = Boolean(this.config.serverUrl && this.config.username && this.config.apiToken);

    // Invalidate session cache on config change
    this.sessionToken = '';
    this.sessionCookies = '';
    this.sessionExpires = 0;

    return this.getConfig();
  }

  clearConfig() {
    this.config = {
      serverUrl: '',
      username: '',
      apiToken: '',
      authType: 'auto',
      isConfigured: false
    };
    this.sessionToken = '';
    this.sessionCookies = '';
    this.sessionExpires = 0;
    this.accounts = [];
    this.domains = [];
    return this.getConfig();
  }

  // Password-based cPanel session login
  async loginWithPassword() {
    try {
      const params = new URLSearchParams();
      params.append('user', this.config.username);
      params.append('pass', this.config.apiToken);

      const loginUrl = `${this.config.serverUrl}/login/?login_only=1`;
      const res = await this.axiosInstance.post(loginUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (res.data && res.data.status === 1) {
        this.sessionToken = res.data.security_token || '';
        const setCookies = res.headers['set-cookie'] || [];
        this.sessionCookies = setCookies.map(c => c.split(';')[0]).join('; ');
        this.sessionExpires = Date.now() + 25 * 60 * 1000; // 25 min validity
        return { success: true, security_token: this.sessionToken };
      } else {
        const errMsg = res.data?.message || res.data?.notices?.[0] || 'Invalid cPanel username or password.';
        return { success: false, message: errMsg };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      };
    }
  }

  // Universal UAPI executor with automatic token and password-session handling
  async executeUapi(apiPath, params = {}, method = 'GET') {
    if (!this.config.isConfigured) {
      throw new Error('cPanel server connection is not configured.');
    }

    const isPasswordMode = this.config.authType === 'password';

    // 1. If explicitly configured as password mode, or active session exists:
    if (isPasswordMode || this.sessionToken) {
      if (!this.sessionToken || Date.now() > this.sessionExpires) {
        const loginRes = await this.loginWithPassword();
        if (!loginRes.success) {
          throw new Error(`cPanel login failed: ${loginRes.message}`);
        }
      }

      const fullUrl = `${this.config.serverUrl}${this.sessionToken}/execute/${apiPath}`;
      const res = await this.axiosInstance({
        method,
        url: fullUrl,
        headers: {
          'Cookie': this.sessionCookies || ''
        },
        params: method.toUpperCase() === 'GET' ? params : undefined,
        data: method.toUpperCase() !== 'GET' ? params : undefined
      });
      return res.data;
    }

    // 2. Try API Token mode first (Authorization: cpanel user:token)
    try {
      const fullUrl = `${this.config.serverUrl}/execute/${apiPath}`;
      const res = await this.axiosInstance({
        method,
        url: fullUrl,
        headers: {
          'Authorization': `cpanel ${this.config.username}:${this.config.apiToken}`
        },
        params: method.toUpperCase() === 'GET' ? params : undefined,
        data: method.toUpperCase() !== 'GET' ? params : undefined
      });
      return res.data;
    } catch (err) {
      // 3. If token auth failed with 403 or 401, auto-fallback to password session login!
      if (err.response?.status === 403 || err.response?.status === 401) {
        const loginRes = await this.loginWithPassword();
        if (loginRes.success) {
          this.config.authType = 'password';
          const fullUrl = `${this.config.serverUrl}${this.sessionToken}/execute/${apiPath}`;
          const res = await this.axiosInstance({
            method,
            url: fullUrl,
            headers: {
              'Cookie': this.sessionCookies || ''
            },
            params: method.toUpperCase() === 'GET' ? params : undefined,
            data: method.toUpperCase() !== 'GET' ? params : undefined
          });
          return res.data;
        }
      }
      throw err;
    }
  }

  async testConnection() {
    if (!this.config.isConfigured) {
      return {
        success: false,
        message: 'cPanel server settings are incomplete. Please provide Server URL, Username, and Password / API Token.'
      };
    }

    try {
      const responseData = await this.executeUapi('Email/list_pops_with_disk');
      if (responseData && (responseData.status === 1 || Array.isArray(responseData.data))) {
        const count = responseData.data?.length || 0;
        return {
          success: true,
          message: `Successfully connected to cPanel server! Found ${count} email mailbox(es).`,
          accountCount: count
        };
      } else {
        return {
          success: false,
          message: responseData?.errors?.[0] || 'cPanel connected but did not return mailbox list.'
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
        const params = filterDomain ? { domain: filterDomain } : {};
        const responseData = await this.executeUapi('Email/list_pops_with_disk', params);

        if (responseData && responseData.status === 1 && Array.isArray(responseData.data)) {
          const liveAccounts = responseData.data.map((acc) => {
            const diskUsedBytes = Number(acc.diskused) || 0;
            const diskQuotaBytes = Number(acc.diskquota) || 0;
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

          // Extract domains
          const uniqueDomains = [...new Set(liveAccounts.map(a => a.domain).filter(Boolean))];
          if (uniqueDomains.length > 0) {
            this.domains = uniqueDomains;
          }
          this.accounts = liveAccounts;
          return this.accounts;
        }
      } catch (err) {
        console.warn('[cPanelClient] Remote fetch error:', err.message);
      }
    }

    if (filterDomain) {
      return this.accounts.filter(a => a.domain.toLowerCase() === filterDomain.toLowerCase());
    }
    return this.accounts;
  }

  async listDomains() {
    if (this.config.isConfigured) {
      try {
        const responseData = await this.executeUapi('Email/list_mail_domains');
        if (responseData?.status === 1 && Array.isArray(responseData.data)) {
          const domainList = responseData.data.map(d => typeof d === 'string' ? d : d.domain).filter(Boolean);
          if (domainList.length > 0) {
            this.domains = domainList;
          }
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
    const quotaNumber = Number(quotaMb) || 1024;

    if (this.config.isConfigured) {
      try {
        const responseData = await this.executeUapi('Email/add_pop', {
          email: emailUser,
          domain: domain,
          password: password,
          quota: quotaNumber === 0 ? 0 : quotaNumber
        });

        if (responseData?.status !== 1) {
          throw new Error(responseData?.errors?.[0] || 'cPanel rejected creation');
        }
      } catch (err) {
        throw new Error(err.response?.data?.errors?.[0] || err.message);
      }
    }

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
        await this.executeUapi('Email/edit_pop_quota', {
          email: user,
          domain: domain,
          quota: quotaNumber
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
        await this.executeUapi('Email/passwd_pop', {
          email: user,
          domain: domain,
          password: newPassword
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
        await this.executeUapi(`Email/${action}`, {
          email: user,
          domain: domain
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
        await this.executeUapi('Email/delete_pop', {
          email: user,
          domain: domain
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
