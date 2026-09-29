// cPanel Email Hub - Mobile First Client Controller

const state = {
  activeTab: 'tabInbox',
  activeAccount: 'all', // 'all' or 'user@domain.com'
  activeDomain: 'all',  // 'all' or 'locumireland.ie', etc.
  activeFolder: 'inbox',
  emailSearch: '',
  accountSearch: '',
  unreadOnly: false,
  accounts: [],
  domains: [],
  emails: [],
  currentlyManagingEmail: null,
  currentOpenedEmail: null
};

// DOM Elements
const dom = {
  // Navigation
  navItems: document.querySelectorAll('.bottom-nav .nav-item'),
  tabs: document.querySelectorAll('.tab-content'),
  navInboxBadge: document.getElementById('navInboxBadge'),
  
  // Header
  connectionStatusSubtitle: document.getElementById('connectionStatusSubtitle'),
  refreshBtn: document.getElementById('refreshBtn'),
  quickComposeBtn: document.getElementById('quickComposeBtn'),
  headerLogoutBtn: document.getElementById('headerLogoutBtn'),
  accountSwitcherTrigger: document.getElementById('accountSwitcherTrigger'),
  currentAvatar: document.getElementById('currentAvatar'),
  currentAccountLabel: document.getElementById('currentAccountLabel'),
  currentAccountSub: document.getElementById('currentAccountSub'),
  domainFilterBar: document.getElementById('domainFilterBar'),
  chipCountAll: document.getElementById('chipCountAll'),

  // Inbox
  emailSearchInput: document.getElementById('emailSearchInput'),
  folderButtons: document.querySelectorAll('.folder-pill-bar .folder-btn'),
  filterUnreadOnlyBtn: document.getElementById('filterUnreadOnlyBtn'),
  emailListContainer: document.getElementById('emailListContainer'),
  inboxCountBadge: document.getElementById('inboxCountBadge'),
  fabCompose: document.getElementById('fabCompose'),

  // Accounts Tab
  statTotalAccounts: document.getElementById('statTotalAccounts'),
  statStorageTotal: document.getElementById('statStorageTotal'),
  openCreateAccountBtn: document.getElementById('openCreateAccountBtn'),
  accountSearchInput: document.getElementById('accountSearchInput'),
  accountsListContainer: document.getElementById('accountsListContainer'),

  // Server Settings Tab
  serverConfigForm: document.getElementById('serverConfigForm'),
  cfgServerUrl: document.getElementById('cfgServerUrl'),
  cfgUsername: document.getElementById('cfgUsername'),
  cfgApiToken: document.getElementById('cfgApiToken'),
  btnTestConnection: document.getElementById('btnTestConnection'),
  btnServerLogout: document.getElementById('btnServerLogout'),

  // Modals
  accountSwitcherModal: document.getElementById('accountSwitcherModal'),
  accountSwitcherList: document.getElementById('accountSwitcherList'),
  closeSwitcherBtn: document.getElementById('closeSwitcherBtn'),

  composeModal: document.getElementById('composeModal'),
  composeForm: document.getElementById('composeForm'),
  composeFrom: document.getElementById('composeFrom'),
  composeTo: document.getElementById('composeTo'),
  composeSubject: document.getElementById('composeSubject'),
  composeBody: document.getElementById('composeBody'),
  closeComposeBtn: document.getElementById('closeComposeBtn'),
  cancelComposeBtn: document.getElementById('cancelComposeBtn'),

  createAccountModal: document.getElementById('createAccountModal'),
  createAccountForm: document.getElementById('createAccountForm'),
  newAccUser: document.getElementById('newAccUser'),
  newAccDomain: document.getElementById('newAccDomain'),
  newAccPassword: document.getElementById('newAccPassword'),
  newAccQuota: document.getElementById('newAccQuota'),
  btnGenPassword: document.getElementById('btnGenPassword'),
  closeCreateAccountBtn: document.getElementById('closeCreateAccountBtn'),
  cancelCreateAccBtn: document.getElementById('cancelCreateAccBtn'),

  manageAccountModal: document.getElementById('manageAccountModal'),
  manageModalEmailTitle: document.getElementById('manageModalEmailTitle'),
  manageQuotaSelect: document.getElementById('manageQuotaSelect'),
  manageNewPassword: document.getElementById('manageNewPassword'),
  btnSaveQuota: document.getElementById('btnSaveQuota'),
  btnSavePassword: document.getElementById('btnSavePassword'),
  btnToggleSuspend: document.getElementById('btnToggleSuspend'),
  btnDeleteAccount: document.getElementById('btnDeleteAccount'),
  closeManageModalBtn: document.getElementById('closeManageModalBtn'),

  // Email Detail View
  emailDetailView: document.getElementById('emailDetailView'),
  closeEmailDetailBtn: document.getElementById('closeEmailDetailBtn'),
  replyEmailBtn: document.getElementById('replyEmailBtn'),
  deleteEmailDetailBtn: document.getElementById('deleteEmailDetailBtn'),
  detailAvatar: document.getElementById('detailAvatar'),
  detailFromName: document.getElementById('detailFromName'),
  detailFromEmail: document.getElementById('detailFromEmail'),
  detailDate: document.getElementById('detailDate'),
  detailAccountBadge: document.getElementById('detailAccountBadge'),
  detailSubject: document.getElementById('detailSubject'),
  detailBody: document.getElementById('detailBody'),
  detailAttachmentsContainer: document.getElementById('detailAttachmentsContainer'),

  toastContainer: document.getElementById('toastContainer')
};

// ----------------------------------------------------
// UI Notification Helpers
// ----------------------------------------------------
function showToast(message, type = 'info', duration = 3200) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
async function initApp() {
  bindEvents();
  await loadServerConfig();
  await loadAllData();
}

function bindEvents() {
  // Navigation Tabs
  dom.navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Account Switcher Trigger
  dom.accountSwitcherTrigger.addEventListener('click', openAccountSwitcherModal);
  dom.closeSwitcherBtn.addEventListener('click', () => closeModal(dom.accountSwitcherModal));

  // Compose
  dom.quickComposeBtn.addEventListener('click', () => openComposeModal());
  dom.fabCompose.addEventListener('click', () => openComposeModal());
  dom.closeComposeBtn.addEventListener('click', () => closeModal(dom.composeModal));
  dom.cancelComposeBtn.addEventListener('click', () => closeModal(dom.composeModal));
  dom.composeForm.addEventListener('submit', handleSendEmail);

  // Refresh
  dom.refreshBtn.addEventListener('click', async () => {
    dom.refreshBtn.style.transform = 'rotate(360deg)';
    dom.refreshBtn.style.transition = 'transform 0.6s ease';
    await loadAllData();
    showToast('All inboxes & cPanel accounts synced', 'success');
    setTimeout(() => {
      dom.refreshBtn.style.transform = 'none';
      dom.refreshBtn.style.transition = 'none';
    }, 600);
  });

  // Email Filters & Search
  dom.emailSearchInput.addEventListener('input', (e) => {
    state.emailSearch = e.target.value;
    renderEmailList();
  });

  dom.folderButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.folderButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFolder = btn.getAttribute('data-folder');
      loadEmails();
    });
  });

  dom.filterUnreadOnlyBtn.addEventListener('click', () => {
    state.unreadOnly = !state.unreadOnly;
    dom.filterUnreadOnlyBtn.classList.toggle('active', state.unreadOnly);
    loadEmails();
  });

  // Create Account Modal
  dom.openCreateAccountBtn.addEventListener('click', openCreateAccountModal);
  dom.closeCreateAccountBtn.addEventListener('click', () => closeModal(dom.createAccountModal));
  dom.cancelCreateAccBtn.addEventListener('click', () => closeModal(dom.createAccountModal));
  dom.createAccountForm.addEventListener('submit', handleCreateAccount);
  dom.btnGenPassword.addEventListener('click', generatePassword);

  // Manage Account Modal
  dom.closeManageModalBtn.addEventListener('click', () => closeModal(dom.manageAccountModal));
  dom.btnSaveQuota.addEventListener('click', handleSaveQuota);
  dom.btnSavePassword.addEventListener('click', handleSavePassword);
  dom.btnToggleSuspend.addEventListener('click', handleToggleSuspend);
  dom.btnDeleteAccount.addEventListener('click', handleDeleteAccount);

  // Accounts Tab Search
  dom.accountSearchInput.addEventListener('input', (e) => {
    state.accountSearch = e.target.value;
    renderAccountsList();
  });

  // Server Settings Form
  dom.serverConfigForm.addEventListener('submit', handleSaveServerConfig);
  dom.btnTestConnection.addEventListener('click', handleTestConnection);
  dom.btnServerLogout.addEventListener('click', handleLogout);
  dom.headerLogoutBtn.addEventListener('click', handleLogout);

  // Email Detail View actions
  dom.closeEmailDetailBtn.addEventListener('click', () => {
    dom.emailDetailView.classList.remove('active');
  });
  dom.replyEmailBtn.addEventListener('click', handleReplyCurrentEmail);
  dom.deleteEmailDetailBtn.addEventListener('click', handleDeleteCurrentEmail);

  // Close modals on clicking overlay background
  [dom.accountSwitcherModal, dom.composeModal, dom.createAccountModal, dom.manageAccountModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  dom.navItems.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  dom.tabs.forEach(tab => {
    tab.classList.toggle('active', tab.id === tabId);
  });

  // Hide FAB if on settings tab
  dom.fabCompose.style.display = tabId === 'tabSettings' ? 'none' : 'flex';
}

function openModal(modal) {
  modal.classList.add('active');
}

function closeModal(modal) {
  modal.classList.remove('active');
}

// ----------------------------------------------------
// Data Loading
// ----------------------------------------------------
async function loadAllData() {
  await Promise.all([
    loadDomains(),
    loadAccounts(),
    loadEmails()
  ]);
}

async function loadServerConfig() {
  try {
    const res = await API.getConfig();
    if (res.serverUrl) dom.cfgServerUrl.value = res.serverUrl;
    if (res.username) dom.cfgUsername.value = res.username;
    if (res.hasToken) dom.cfgApiToken.placeholder = '•••••••••••••••• (Configured)';

    if (res.isConfigured) {
      dom.connectionStatusSubtitle.textContent = `Connected (${res.accountsCount} accounts)`;
      dom.connectionStatusSubtitle.style.color = '#34d399';
    } else {
      dom.connectionStatusSubtitle.textContent = 'Not Connected';
      dom.connectionStatusSubtitle.style.color = 'var(--text-dim)';
    }
  } catch (err) {
    console.error('Config fetch failed:', err);
  }
}

async function loadDomains() {
  try {
    const res = await API.getDomains();
    if (res.success && res.domains) {
      state.domains = res.domains;
      renderDomainChips();
      populateDomainSelects();
    }
  } catch (err) {
    console.error('Error fetching domains:', err);
  }
}

async function loadAccounts() {
  try {
    const res = await API.getAccounts();
    if (res.success && res.accounts) {
      state.accounts = res.accounts;
      dom.statTotalAccounts.textContent = state.accounts.length;
      dom.chipCountAll.textContent = state.accounts.length;

      // Calculate total storage
      const totalBytes = state.accounts.reduce((sum, a) => sum + (a.diskused || 0), 0);
      dom.statStorageTotal.textContent = formatBytes(totalBytes);

      renderAccountsList();
      populateComposeFromSelect();
      updateHeaderCurrentAccount();
    }
  } catch (err) {
    console.error('Error fetching accounts:', err);
  }
}

async function loadEmails() {
  try {
    const res = await API.getEmails({
      account: state.activeAccount,
      folder: state.activeFolder,
      search: state.emailSearch,
      unreadOnly: state.unreadOnly
    });

    if (res.success) {
      state.emails = res.emails;
      renderEmailList();

      // Update badge
      if (res.unreadTotal > 0) {
        dom.navInboxBadge.style.display = 'block';
        dom.navInboxBadge.textContent = res.unreadTotal > 99 ? '99+' : res.unreadTotal;
        dom.inboxCountBadge.textContent = `(${res.unreadTotal})`;
      } else {
        dom.navInboxBadge.style.display = 'none';
        dom.inboxCountBadge.textContent = '';
      }
    }
  } catch (err) {
    console.error('Error loading emails:', err);
  }
}

// ----------------------------------------------------
// Renderers
// ----------------------------------------------------
function renderDomainChips() {
  // Preserve "All Domains"
  dom.domainFilterBar.innerHTML = `
    <button class="filter-chip ${state.activeDomain === 'all' ? 'active' : ''}" data-domain="all">
      All Domains <span class="chip-count">${state.accounts.length}</span>
    </button>
  `;

  state.domains.forEach(d => {
    const count = state.accounts.filter(a => a.domain.toLowerCase() === d.toLowerCase()).length;
    const btn = document.createElement('button');
    btn.className = `filter-chip ${state.activeDomain === d ? 'active' : ''}`;
    btn.setAttribute('data-domain', d);
    btn.innerHTML = `${d} <span class="chip-count">${count}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeDomain = d;
      renderAccountsList();
      // If active account not in domain, reset to all
      if (state.activeAccount !== 'all') {
        const accDomain = state.activeAccount.split('@')[1];
        if (accDomain !== d) {
          state.activeAccount = 'all';
          updateHeaderCurrentAccount();
          loadEmails();
        }
      }
    });
    dom.domainFilterBar.appendChild(btn);
  });

  // Rebind "All Domains" button
  dom.domainFilterBar.firstElementChild.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    state.activeDomain = 'all';
    renderAccountsList();
  });
}

function updateHeaderCurrentAccount() {
  if (state.activeAccount === 'all') {
    dom.currentAvatar.className = 'account-avatar all-inboxes';
    dom.currentAvatar.textContent = '📬';
    dom.currentAccountLabel.textContent = 'All Inboxes (Unified)';
    dom.currentAccountSub.textContent = state.accounts.length > 0
      ? `${state.accounts.length} Accounts Across ${state.domains.length} Domains`
      : '0 Accounts Connected';
  } else {
    dom.currentAvatar.className = 'account-avatar';
    dom.currentAvatar.textContent = state.activeAccount.charAt(0).toUpperCase();
    dom.currentAccountLabel.textContent = state.activeAccount;
    const acc = state.accounts.find(a => a.email.toLowerCase() === state.activeAccount.toLowerCase());
    dom.currentAccountSub.textContent = acc ? `${acc.humandiskused} / ${acc.humandiskquota}` : 'Active Mailbox';
  }
}

function renderEmailList() {
  if (!state.emails || state.emails.length === 0) {
    const hasAccounts = state.accounts && state.accounts.length > 0;
    dom.emailListContainer.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-dim);">
        <div style="font-size: 38px; margin-bottom: 8px;">${hasAccounts ? '📭' : '⚙️'}</div>
        <strong style="color: var(--text-main); font-size: 15px;">${hasAccounts ? 'No emails found' : 'No cPanel Account Connected'}</strong>
        <p style="font-size: 13px; margin-top: 4px;">${hasAccounts ? 'Nothing here in this folder or search filter.' : 'Go to the Server tab to connect your cPanel server and sync mailboxes.'}</p>
      </div>
    `;
    return;
  }

  dom.emailListContainer.innerHTML = '';

  state.emails.forEach(email => {
    const card = document.createElement('div');
    card.className = `email-card ${!email.isRead ? 'unread' : ''}`;
    
    const initials = (email.fromName || email.fromEmail).charAt(0).toUpperCase();
    const formattedDate = formatEmailDate(email.date);
    const hasAttachments = email.attachments && email.attachments.length > 0;

    card.innerHTML = `
      <div class="email-card-header">
        <div class="email-sender-meta">
          <div class="email-sender-avatar">${initials}</div>
          <span class="email-sender">${escapeHtml(email.fromName || email.fromEmail)}</span>
        </div>
        <span class="email-date">${formattedDate}</span>
      </div>

      <div class="email-subject">${escapeHtml(email.subject)}</div>
      <div class="email-snippet">${escapeHtml(email.preview || email.body.slice(0, 100))}</div>

      <div class="email-card-footer">
        <span class="target-account-tag">
          <span>@</span> ${escapeHtml(email.account)}
        </span>
        ${hasAttachments ? `<span class="attachment-pill">📎 ${email.attachments.length}</span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openEmailDetail(email));
    dom.emailListContainer.appendChild(card);
  });
}

function renderAccountsList() {
  let list = [...state.accounts];

  // Domain filter
  if (state.activeDomain !== 'all') {
    list = list.filter(a => a.domain.toLowerCase() === state.activeDomain.toLowerCase());
  }

  // Account search filter
  if (state.accountSearch && state.accountSearch.trim()) {
    const q = state.accountSearch.trim().toLowerCase();
    list = list.filter(a => a.email.toLowerCase().includes(q) || a.domain.toLowerCase().includes(q));
  }

  if (list.length === 0) {
    const hasAccounts = state.accounts && state.accounts.length > 0;
    dom.accountsListContainer.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-dim);">
        <div style="font-size: 38px; margin-bottom: 8px;">${hasAccounts ? '🔍' : '👥'}</div>
        <strong style="color: var(--text-main); font-size: 15px;">${hasAccounts ? 'No matching email accounts' : 'No cPanel Accounts Connected'}</strong>
        <p style="font-size: 13px; margin-top: 4px;">${hasAccounts ? 'Try adjusting your search or domain filter.' : 'Go to the Server tab to connect your cPanel server and view accounts.'}</p>
      </div>
    `;
    return;
  }

  dom.accountsListContainer.innerHTML = '';

  list.forEach(acc => {
    const card = document.createElement('div');
    card.className = 'account-card';

    const isSuspended = acc.suspended_login === 1;
    const percentage = Math.min(100, Math.max(0, acc.diskpercentage || 0));
    let colorClass = 'normal';
    if (percentage > 80) colorClass = 'danger';
    else if (percentage > 50) colorClass = 'warn';

    card.innerHTML = `
      <div class="account-card-top">
        <div class="acc-email-block">
          <div class="acc-icon">✉️</div>
          <div class="acc-details">
            <span class="acc-email">${escapeHtml(acc.email)}</span>
            <span class="acc-domain-pill">${escapeHtml(acc.domain)}</span>
          </div>
        </div>
        <span class="acc-status-tag ${isSuspended ? 'suspended' : 'unrestricted'}">
          ${isSuspended ? '🔒 Suspended' : '✓ Unrestricted'}
        </span>
      </div>

      <div class="storage-block">
        <div class="storage-labels">
          <span>Storage: <strong>${acc.humandiskused || '0 B'}</strong> / ${acc.humandiskquota || '1 GB'}</span>
          <span>${percentage}%</span>
        </div>
        <div class="storage-track">
          <div class="storage-bar-fill ${colorClass}" style="width: ${Math.max(2, percentage)}%;"></div>
        </div>
      </div>

      <div class="account-actions-row">
        <button class="btn-acc-action primary btn-check-mail">
          📬 Check Mail
        </button>
        <button class="btn-acc-action btn-manage-acc">
          ⚙️ Manage
        </button>
        <button class="btn-acc-action btn-webmail-acc" title="Open cPanel Roundcube Session">
          🌐 Webmail
        </button>
      </div>
    `;

    // Action clicks
    card.querySelector('.btn-check-mail').addEventListener('click', () => {
      state.activeAccount = acc.email;
      updateHeaderCurrentAccount();
      switchTab('tabInbox');
      loadEmails();
      showToast(`Switched inbox to ${acc.email}`, 'info');
    });

    card.querySelector('.btn-manage-acc').addEventListener('click', () => {
      openManageAccountModal(acc);
    });

    card.querySelector('.btn-webmail-acc').addEventListener('click', async () => {
      try {
        const res = await API.getWebmailSession(acc.email);
        if (res.webmailUrl) {
          window.open(res.webmailUrl, '_blank');
          showToast(`Opening Roundcube Webmail for ${acc.email}`, 'info');
        }
      } catch (err) {
        showToast('Could not open webmail session', 'error');
      }
    });

    dom.accountsListContainer.appendChild(card);
  });
}

function openAccountSwitcherModal() {
  dom.accountSwitcherList.innerHTML = '';

  // 1. "All Inboxes" entry
  const allCard = document.createElement('div');
  allCard.className = `account-card ${state.activeAccount === 'all' ? 'active-border' : ''}`;
  allCard.style.padding = '10px 12px';
  allCard.style.cursor = 'pointer';
  allCard.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="account-avatar all-inboxes" style="width: 32px; height: 32px; font-size: 13px;">📬</div>
        <div>
          <strong style="font-size: 14px; color: white;">All Inboxes (Unified)</strong>
          <div style="font-size: 11px; color: var(--text-dim);">${state.accounts.length} accounts aggregated</div>
        </div>
      </div>
      ${state.activeAccount === 'all' ? '<span style="color: var(--accent-primary); font-size: 16px;">✓</span>' : ''}
    </div>
  `;
  allCard.addEventListener('click', () => {
    state.activeAccount = 'all';
    updateHeaderCurrentAccount();
    closeModal(dom.accountSwitcherModal);
    loadEmails();
    showToast('Switched to Unified Inbox', 'info');
  });
  dom.accountSwitcherList.appendChild(allCard);

  // 2. Individual accounts
  state.accounts.forEach(acc => {
    const isSelected = state.activeAccount.toLowerCase() === acc.email.toLowerCase();
    const item = document.createElement('div');
    item.className = `account-card ${isSelected ? 'active-border' : ''}`;
    item.style.padding = '10px 12px';
    item.style.cursor = 'pointer';

    item.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
          <div class="account-avatar" style="width: 32px; height: 32px; font-size: 13px;">
            ${acc.email.charAt(0).toUpperCase()}
          </div>
          <div style="min-width: 0;">
            <div style="font-size: 13.5px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHtml(acc.email)}
            </div>
            <div style="font-size: 11px; color: var(--text-dim);">${acc.humandiskused} used • ${acc.domain}</div>
          </div>
        </div>
        ${isSelected ? '<span style="color: var(--accent-primary); font-size: 16px;">✓</span>' : ''}
      </div>
    `;

    item.addEventListener('click', () => {
      state.activeAccount = acc.email;
      updateHeaderCurrentAccount();
      closeModal(dom.accountSwitcherModal);
      loadEmails();
      showToast(`Switched inbox to ${acc.email}`, 'info');
    });

    dom.accountSwitcherList.appendChild(item);
  });

  openModal(dom.accountSwitcherModal);
}

// ----------------------------------------------------
// Compose Email
// ----------------------------------------------------
function populateComposeFromSelect() {
  dom.composeFrom.innerHTML = '';
  if (!state.accounts || state.accounts.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No connected mailboxes (connect in Server tab)';
    opt.disabled = true;
    opt.selected = true;
    dom.composeFrom.appendChild(opt);
    return;
  }
  state.accounts.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc.email;
    opt.textContent = `${acc.email} (${acc.domain})`;
    if (state.activeAccount !== 'all' && state.activeAccount.toLowerCase() === acc.email.toLowerCase()) {
      opt.selected = true;
    }
    dom.composeFrom.appendChild(opt);
  });
}

function openComposeModal(prefill = {}) {
  populateComposeFromSelect();
  if (prefill.from) dom.composeFrom.value = prefill.from;
  if (prefill.to) dom.composeTo.value = prefill.to;
  if (prefill.subject) dom.composeSubject.value = prefill.subject;
  if (prefill.body) dom.composeBody.value = prefill.body;
  else dom.composeBody.value = '';

  openModal(dom.composeModal);
}

async function handleSendEmail(e) {
  e.preventDefault();
  const fromAccount = dom.composeFrom.value;
  const to = dom.composeTo.value;
  const subject = dom.composeSubject.value;
  const body = dom.composeBody.value;

  try {
    const res = await API.sendEmail({
      fromAccount,
      to,
      subject,
      body
    });

    if (res.success) {
      closeModal(dom.composeModal);
      dom.composeForm.reset();
      showToast(`Email dispatched from ${fromAccount}`, 'success');
      loadEmails();
    } else {
      showToast(res.error || 'Failed to send email', 'error');
    }
  } catch (err) {
    showToast('Failed to send email', 'error');
  }
}

// ----------------------------------------------------
// Email Detail View
// ----------------------------------------------------
async function openEmailDetail(email) {
  state.currentOpenedEmail = email;
  dom.detailAvatar.textContent = (email.fromName || email.fromEmail).charAt(0).toUpperCase();
  dom.detailFromName.textContent = email.fromName || email.fromEmail;
  dom.detailFromEmail.textContent = email.fromEmail;
  dom.detailDate.textContent = formatDetailDate(email.date);
  dom.detailAccountBadge.textContent = `to ${email.account}`;
  dom.detailSubject.textContent = email.subject;
  dom.detailBody.textContent = email.body;

  // Render attachments
  dom.detailAttachmentsContainer.innerHTML = '';
  if (email.attachments && email.attachments.length > 0) {
    const title = document.createElement('strong');
    title.style.fontSize = '12px';
    title.style.color = 'var(--text-dim)';
    title.textContent = `ATTACHMENTS (${email.attachments.length}):`;
    dom.detailAttachmentsContainer.appendChild(title);

    email.attachments.forEach(att => {
      const attCard = document.createElement('div');
      attCard.style.cssText = `
        background: var(--bg-tertiary);
        border: 1px solid var(--border-glass);
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12.5px;
      `;
      attCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>📎</span>
          <span>${escapeHtml(att.name)}</span>
          <span style="color: var(--text-dim); font-size: 11px;">(${att.size})</span>
        </div>
        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;">Download</button>
      `;
      dom.detailAttachmentsContainer.appendChild(attCard);
    });
  }

  // Mark read
  if (!email.isRead) {
    await API.markRead(email.id, true);
    email.isRead = true;
    renderEmailList();
  }

  dom.emailDetailView.classList.add('active');
}

function handleReplyCurrentEmail() {
  if (!state.currentOpenedEmail) return;
  const em = state.currentOpenedEmail;
  dom.emailDetailView.classList.remove('active');
  openComposeModal({
    from: em.account,
    to: em.fromEmail,
    subject: em.subject.startsWith('Re:') ? em.subject : `Re: ${em.subject}`,
    body: `\n\n--- On ${formatDetailDate(em.date)}, ${em.fromName} wrote:\n> ${em.body.replace(/\n/g, '\n> ')}`
  });
}

async function handleDeleteCurrentEmail() {
  if (!state.currentOpenedEmail) return;
  const id = state.currentOpenedEmail.id;
  try {
    const res = await API.deleteEmail(id);
    if (res.success) {
      dom.emailDetailView.classList.remove('active');
      showToast('Email moved to trash', 'info');
      loadEmails();
    }
  } catch (err) {
    showToast('Failed to delete email', 'error');
  }
}

// ----------------------------------------------------
// cPanel Account Admin Actions
// ----------------------------------------------------
function populateDomainSelects() {
  dom.newAccDomain.innerHTML = '';
  state.domains.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    dom.newAccDomain.appendChild(opt);
  });
}

function openCreateAccountModal() {
  populateDomainSelects();
  generatePassword();
  openModal(dom.createAccountModal);
}

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 16; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  dom.newAccPassword.value = pass;
}

async function handleCreateAccount(e) {
  e.preventDefault();
  const emailUser = dom.newAccUser.value.trim();
  const domain = dom.newAccDomain.value;
  const password = dom.newAccPassword.value;
  const quotaMb = dom.newAccQuota.value;

  try {
    const res = await API.createAccount({
      emailUser,
      domain,
      password,
      quotaMb
    });

    if (res.success) {
      closeModal(dom.createAccountModal);
      dom.createAccountForm.reset();
      showToast(`Created account ${res.account.email}!`, 'success');
      await loadAccounts();
    } else {
      showToast(res.error || 'Failed to create account', 'error');
    }
  } catch (err) {
    showToast('Failed to create account', 'error');
  }
}

function openManageAccountModal(acc) {
  state.currentlyManagingEmail = acc.email;
  dom.manageModalEmailTitle.textContent = `Manage: ${acc.email}`;
  
  // Set current quota in dropdown if matches
  const quotaMb = Math.round(acc.diskquota / (1024 * 1024));
  dom.manageQuotaSelect.value = quotaMb === 0 ? '0' : String(quotaMb);

  dom.btnToggleSuspend.textContent = acc.suspended_login === 1 ? '🔓 Unsuspend Account' : '⏸️ Suspend Account';
  dom.manageNewPassword.value = '';

  openModal(dom.manageAccountModal);
}

async function handleSaveQuota() {
  if (!state.currentlyManagingEmail) return;
  const quotaMb = dom.manageQuotaSelect.value;
  try {
    const res = await API.updateQuota(state.currentlyManagingEmail, quotaMb);
    if (res.success) {
      showToast(`Updated quota for ${state.currentlyManagingEmail}`, 'success');
      closeModal(dom.manageAccountModal);
      loadAccounts();
    }
  } catch (err) {
    showToast('Failed to update quota', 'error');
  }
}

async function handleSavePassword() {
  if (!state.currentlyManagingEmail) return;
  const newPassword = dom.manageNewPassword.value.trim();
  if (!newPassword) {
    showToast('Please type a new password', 'error');
    return;
  }
  try {
    const res = await API.updatePassword(state.currentlyManagingEmail, newPassword);
    if (res.success) {
      showToast(`Password updated for ${state.currentlyManagingEmail}`, 'success');
      dom.manageNewPassword.value = '';
      closeModal(dom.manageAccountModal);
    }
  } catch (err) {
    showToast('Failed to update password', 'error');
  }
}

async function handleToggleSuspend() {
  if (!state.currentlyManagingEmail) return;
  try {
    const res = await API.toggleSuspend(state.currentlyManagingEmail);
    if (res.success) {
      const isNowSuspended = res.account.suspended_login === 1;
      showToast(isNowSuspended ? 'Account suspended' : 'Account reactivated', 'info');
      closeModal(dom.manageAccountModal);
      loadAccounts();
    }
  } catch (err) {
    showToast('Failed to toggle suspension', 'error');
  }
}

async function handleDeleteAccount() {
  if (!state.currentlyManagingEmail) return;
  if (!confirm(`Are you sure you want to permanently delete ${state.currentlyManagingEmail} from cPanel?`)) {
    return;
  }
  try {
    const res = await API.deleteAccount(state.currentlyManagingEmail);
    if (res.success) {
      showToast(`Deleted ${state.currentlyManagingEmail}`, 'success');
      closeModal(dom.manageAccountModal);
      loadAccounts();
    }
  } catch (err) {
    showToast('Failed to delete account', 'error');
  }
}

// ----------------------------------------------------
// Server Settings Form Actions
// ----------------------------------------------------
async function handleSaveServerConfig(e) {
  e.preventDefault();
  const serverUrl = dom.cfgServerUrl.value.trim();
  const username = dom.cfgUsername.value.trim();
  const apiToken = dom.cfgApiToken.value.trim();

  try {
    const res = await API.setConfig({
      serverUrl,
      username,
      apiToken,
      authType: 'token'
    });

    if (res.success) {
      showToast('cPanel credentials saved successfully!', 'success');
      loadServerConfig();
      loadAllData();
      switchTab('tabInbox');
    }
  } catch (err) {
    showToast('Failed to save settings', 'error');
  }
}

async function handleLogout() {
  try {
    await API.logout();
    state.accounts = [];
    state.domains = [];
    state.emails = [];
    state.activeAccount = 'all';
    state.activeDomain = 'all';

    // Clear form inputs
    if (dom.cfgServerUrl) dom.cfgServerUrl.value = '';
    if (dom.cfgUsername) dom.cfgUsername.value = '';
    if (dom.cfgApiToken) {
      dom.cfgApiToken.value = '';
      dom.cfgApiToken.placeholder = 'Enter API Token or Password';
    }

    // Update UI headers
    if (dom.connectionStatusSubtitle) {
      dom.connectionStatusSubtitle.textContent = 'Disconnected';
      dom.connectionStatusSubtitle.style.color = 'var(--text-dim)';
    }
    if (dom.statTotalAccounts) dom.statTotalAccounts.textContent = '0';
    if (dom.statStorageTotal) dom.statStorageTotal.textContent = '0 B';
    if (dom.chipCountAll) dom.chipCountAll.textContent = '0';
    if (dom.navInboxBadge) dom.navInboxBadge.style.display = 'none';

    renderDomainChips();
    renderAccountsList();
    renderEmailList();
    updateHeaderCurrentAccount();

    switchTab('tabSettings');
    showToast('Disconnected from cPanel. Ready to connect your next account!', 'info', 4000);
  } catch (err) {
    showToast('Error during logout: ' + (err.message || ''), 'error');
  }
}
window.handleLogout = handleLogout;

async function handleTestConnection() {
  showToast('Testing connection to cPanel server...', 'info');
  try {
    const res = await API.testConnection();
    if (res.success) {
      showToast(res.message, 'success', 5000);
    } else {
      showToast(res.message, 'error', 6000);
    }
  } catch (err) {
    showToast('Connection test error: ' + err.message, 'error');
  }
}

// ----------------------------------------------------
// Formatting Utilities
// ----------------------------------------------------
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatEmailDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDetailDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
