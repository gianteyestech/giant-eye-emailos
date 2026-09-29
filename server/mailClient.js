const nodemailer = require('nodemailer');

class MailClient {
  constructor() {
    this.emails = [];
  }

  getEmails({ account, folder = 'inbox', search = '', unreadOnly = false }) {
    let result = [...this.emails];

    if (folder) {
      result = result.filter(e => (e.folder || 'inbox') === folder);
    }

    if (account && account !== 'all') {
      result = result.filter(e => e.account.toLowerCase() === account.toLowerCase());
    }

    if (unreadOnly) {
      result = result.filter(e => !e.isRead);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.fromName.toLowerCase().includes(q) ||
        e.fromEmail.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        e.account.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.date) - new Date(a.date));

    return result;
  }

  getEmailById(id) {
    const item = this.emails.find(e => e.id === id);
    if (item) {
      item.isRead = true; // Auto-mark read on open
    }
    return item;
  }

  markRead(id, isRead = true) {
    const item = this.emails.find(e => e.id === id);
    if (item) {
      item.isRead = isRead;
      return item;
    }
    return null;
  }

  toggleStarred(id) {
    const item = this.emails.find(e => e.id === id);
    if (item) {
      item.isStarred = !item.isStarred;
      return item;
    }
    return null;
  }

  deleteEmail(id) {
    const idx = this.emails.findIndex(e => e.id === id);
    if (idx >= 0) {
      const item = this.emails[idx];
      if (item.folder === 'trash') {
        // Permanent delete
        this.emails.splice(idx, 1);
      } else {
        // Move to trash
        item.folder = 'trash';
      }
      return { success: true, item };
    }
    return { success: false, message: 'Email not found' };
  }

  async sendEmail({ fromAccount, to, cc, bcc, subject, body, smtpPassword, smtpHost }) {
    if (!fromAccount || !to || !subject) {
      throw new Error('From, To, and Subject are required');
    }

    const newEmailItem = {
      id: 'em-' + Date.now(),
      account: fromAccount,
      fromName: fromAccount.split('@')[0],
      fromEmail: fromAccount,
      to: to,
      cc: cc || '',
      bcc: bcc || '',
      subject: subject,
      preview: body.slice(0, 100),
      body: body,
      date: new Date().toISOString(),
      isRead: true,
      isStarred: false,
      folder: 'sent',
      attachments: []
    };

    // If live SMTP credentials are provided, attempt real SMTP transport
    if (smtpPassword && smtpHost) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: 465,
          secure: true,
          auth: {
            user: fromAccount,
            pass: smtpPassword
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        await transporter.sendMail({
          from: `"${fromAccount}" <${fromAccount}>`,
          to,
          cc,
          bcc,
          subject,
          text: body
        });
      } catch (err) {
        console.warn('[MailClient] Live SMTP delivery error:', err.message);
        // Continue to save locally with a note
        newEmailItem.deliveryStatus = `Simulated (SMTP note: ${err.message})`;
      }
    } else {
      newEmailItem.deliveryStatus = 'Dispatched (Simulated / Local outbox)';
    }

    this.emails.unshift(newEmailItem);
    return newEmailItem;
  }

  getUnreadCounts() {
    const counts = { all: 0 };
    for (const em of this.emails) {
      if (!em.isRead && em.folder === 'inbox') {
        counts.all++;
        counts[em.account] = (counts[em.account] || 0) + 1;
      }
    }
    return counts;
  }
}

module.exports = new MailClient();
