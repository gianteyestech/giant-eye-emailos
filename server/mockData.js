// Pre-configured accounts matching the user's cPanel screenshot
// Domains: locumireland.ie, thetaxlink.com

const initialAccounts = [
  {
    email: 'admin@locumireland.ie',
    user: 'admin',
    domain: 'locumireland.ie',
    diskused: 1044480, // ~1.02 KB
    diskquota: 1073741824, // 1 GB
    humandiskused: '1.02 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.01,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-01-10T08:00:00Z',
    unreadCount: 3
  },
  {
    email: 'agency@locumireland.ie',
    user: 'agency',
    domain: 'locumireland.ie',
    diskused: 87511040, // 85.41 KB
    diskquota: 1073741824,
    humandiskused: '85.41 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.01,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-01-12T09:15:00Z',
    unreadCount: 1
  },
  {
    email: 'agency.finance@locumireland.ie',
    user: 'agency.finance',
    domain: 'locumireland.ie',
    diskused: 0,
    diskquota: 1073741824,
    humandiskused: '0 bytes',
    humandiskquota: '1 GB',
    diskpercentage: 0.0,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-01-15T11:00:00Z',
    unreadCount: 0
  },
  {
    email: 'billing@locumireland.ie',
    user: 'billing',
    domain: 'locumireland.ie',
    diskused: 80117760, // 78.23 KB
    diskquota: 1073741824,
    humandiskused: '78.23 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.01,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-01-20T14:30:00Z',
    unreadCount: 2
  },
  {
    email: 'contact@thetaxlink.com',
    user: 'contact',
    domain: 'thetaxlink.com',
    diskused: 907993088, // 886.73 KB
    diskquota: 1073741824,
    humandiskused: '886.73 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.08,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-02-01T10:00:00Z',
    unreadCount: 4
  },
  {
    email: 'doctor@locumireland.ie',
    user: 'doctor',
    domain: 'locumireland.ie',
    diskused: 87310336, // 85.26 KB
    diskquota: 1073741824,
    humandiskused: '85.26 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.01,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-02-03T16:00:00Z',
    unreadCount: 0
  },
  {
    email: 'finance.agency@locumireland.ie',
    user: 'finance.agency',
    domain: 'locumireland.ie',
    diskused: 2119680, // 2.07 KB
    diskquota: 1073741824,
    humandiskused: '2.07 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.0,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-02-05T12:00:00Z',
    unreadCount: 0
  },
  {
    email: 'finance.hospital@locumireland.ie',
    user: 'finance.hospital',
    domain: 'locumireland.ie',
    diskused: 0,
    diskquota: 1073741824,
    humandiskused: '0 bytes',
    humandiskquota: '1 GB',
    diskpercentage: 0.0,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-02-10T09:00:00Z',
    unreadCount: 0
  },
  {
    email: 'hospital@locumireland.ie',
    user: 'hospital',
    domain: 'locumireland.ie',
    diskused: 128565248, // 125.55 KB
    diskquota: 1073741824,
    humandiskused: '125.55 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.01,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-02-15T10:30:00Z',
    unreadCount: 1
  },
  {
    email: 'hospital.finance@locumireland.ie',
    user: 'hospital.finance',
    domain: 'locumireland.ie',
    diskused: 80072704, // 78.2 KB
    diskquota: 1073741824,
    humandiskused: '78.2 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.01,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-02-18T13:45:00Z',
    unreadCount: 0
  },
  {
    email: 'info@thetaxlink.com',
    user: 'info',
    domain: 'thetaxlink.com',
    diskused: 414121984, // 394.94 MB
    diskquota: 1073741824, // 1 GB
    humandiskused: '394.94 MB',
    humandiskquota: '1 GB',
    diskpercentage: 38.57,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-01-05T07:15:00Z',
    unreadCount: 6
  },
  {
    email: 'invoices@locumireland.ie',
    user: 'invoices',
    domain: 'locumireland.ie',
    diskused: 0,
    diskquota: 1073741824,
    humandiskused: '0 bytes',
    humandiskquota: '1 GB',
    diskpercentage: 0.0,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-02-22T11:20:00Z',
    unreadCount: 1
  },
  {
    email: 'noreply@locumireland.ie',
    user: 'noreply',
    domain: 'locumireland.ie',
    diskused: 101367808, // 98.99 KB
    diskquota: 1073741824,
    humandiskused: '98.99 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.01,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-02-25T15:10:00Z',
    unreadCount: 0
  },
  {
    email: 'ops@locumireland.ie',
    user: 'ops',
    domain: 'locumireland.ie',
    diskused: 79841280, // 77.96 KB
    diskquota: 1073741824,
    humandiskused: '77.96 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.01,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-02-28T09:40:00Z',
    unreadCount: 1
  },
  {
    email: 'support@locumireland.ie',
    user: 'support',
    domain: 'locumireland.ie',
    diskused: 1005568, // 982 bytes
    diskquota: 1073741824,
    humandiskused: '982 B',
    humandiskquota: '1 GB',
    diskpercentage: 0.0,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-03-01T14:00:00Z',
    unreadCount: 2
  },
  {
    email: 'test@thetaxlink.com',
    user: 'test',
    domain: 'thetaxlink.com',
    diskused: 161044480, // 157.28 KB
    diskquota: 1073741824,
    humandiskused: '157.28 KB',
    humandiskquota: '1 GB',
    diskpercentage: 0.01,
    suspended_login: 0,
    suspended_incoming: 0,
    has_custom_quota: true,
    created_at: '2026-03-05T12:00:00Z',
    unreadCount: 0
  }
];

const initialDomains = [
  'locumireland.ie',
  'thetaxlink.com'
];

const initialEmails = [
  {
    id: 'em-101',
    account: 'info@thetaxlink.com',
    fromName: 'Revenue Commissioners IR',
    fromEmail: 'notifications@revenue.ie',
    to: 'info@thetaxlink.com',
    subject: 'Form 11 Tax Return Filing Confirmation',
    preview: 'Your annual assessment filing reference #TR-2026-8941 has been received and queued for processing...',
    body: `Dear Client,\n\nThis is an automated confirmation that your annual assessment filing reference #TR-2026-8941 for company fiscal year 2025/2026 has been successfully received by the Revenue Commissioners system.\n\nNext Steps:\n1. Your filing will be validated within 3 business days.\n2. Any tax credit adjustments will reflect in your ROS portal.\n\nIf you have any queries, please reference this number in your correspondence.\n\nKind regards,\nRevenue Online Services`,
    date: '2026-09-28T14:15:00Z',
    isRead: false,
    isStarred: true,
    folder: 'inbox',
    attachments: [
      { name: 'ROS_Filing_Summary.pdf', size: '245 KB' }
    ]
  },
  {
    id: 'em-102',
    account: 'admin@locumireland.ie',
    fromName: 'St. James Hospital Clinical Dept',
    fromEmail: 'clinical.staffing@stjames.ie',
    to: 'admin@locumireland.ie',
    subject: 'Urgent: Consultant Anaesthetist Cover Needed (Weekend)',
    preview: 'We require weekend locum cover for our Surgical Ward beginning Friday 18:00 to Monday 08:00...',
    body: `Hi Locum Ireland Team,\n\nWe urgently require weekend locum cover for our surgical unit:\n\n- Position: Consultant Anaesthetist / Senior Registrar\n- Dates: Friday Oct 2nd 18:00 - Monday Oct 5th 08:00\n- Hourly Rate: Standard On-call + Emergency Ward bonus\n\nPlease let us know if any qualified doctors on your registry are available for immediate confirmation.\n\nBest regards,\nClinical Staffing Coordinator\nSt. James's Hospital Dublin`,
    date: '2026-09-28T13:40:00Z',
    isRead: false,
    isStarred: true,
    folder: 'inbox',
    attachments: []
  },
  {
    id: 'em-103',
    account: 'contact@thetaxlink.com',
    fromName: 'Liam O\'Connor (Client)',
    fromEmail: 'liam.oconnor.tech@gmail.com',
    to: 'contact@thetaxlink.com',
    subject: 'Inquiry regarding R&D Tax Credit Advisory',
    preview: 'Hello TaxLink team, I run a 12-person SaaS startup in Galway and wanted to schedule an initial consultation...',
    body: `Hello TaxLink Team,\n\nI was referred to your firm by a colleague who praised your corporate tax expertise.\n\nWe are a growing SaaS startup based in Galway, and we are planning to submit our claim for the 30% R&D Tax Credit for the previous fiscal period. Can we schedule a brief 20-minute Zoom call this week to review our eligibility and advisory rates?\n\nLooking forward to hearing from you.\n\nBest,\nLiam O'Connor\nFounder & CEO`,
    date: '2026-09-28T11:20:00Z',
    isRead: false,
    isStarred: false,
    folder: 'inbox',
    attachments: []
  },
  {
    id: 'em-104',
    account: 'billing@locumireland.ie',
    fromName: 'Mater Private Healthcare',
    fromEmail: 'ap@materprivate.ie',
    to: 'billing@locumireland.ie',
    subject: 'Remittance Advice - Invoices #LI-8842 and #LI-8843',
    preview: 'Payment has been authorized and dispatched via SEPA transfer to your Bank of Ireland account...',
    body: `To Locum Ireland Accounts Payable,\n\nPlease find attached the remittance advice for electronic bank transfer executed today for €14,850.00 covering locum doctor placements during August 2026.\n\nInvoices reconciled:\n- #LI-8842 (€8,200)\n- #LI-8843 (€6,650)\n\nThank you for your prompt service.\n\nRegards,\nMater Private Accounts Dept`,
    date: '2026-09-28T09:05:00Z',
    isRead: false,
    isStarred: false,
    folder: 'inbox',
    attachments: [
      { name: 'Remittance_Sep2026.pdf', size: '112 KB' }
    ]
  },
  {
    id: 'em-105',
    account: 'support@locumireland.ie',
    fromName: 'Dr. Sarah Jenkins',
    fromEmail: 'dr.jenkins.cardio@gmail.com',
    to: 'support@locumireland.ie',
    subject: 'GMC Registration & Garda Vetting Certificate Upload',
    preview: 'I have attached my updated IMC cert and Garda clearance document for placement approval...',
    body: `Dear Locum Ireland Support,\n\nFollowing my registration call yesterday, please find attached my updated Irish Medical Council (IMC) retention certificate along with my Garda vetting clearance certificate.\n\nPlease update my profile status so I can begin receiving placement notifications.\n\nThank you,\nDr. Sarah Jenkins MRCPI`,
    date: '2026-09-27T17:50:00Z',
    isRead: false,
    isStarred: false,
    folder: 'inbox',
    attachments: [
      { name: 'IMC_Certificate_2026.pdf', size: '480 KB' },
      { name: 'Garda_Vetting_Clearance.pdf', size: '320 KB' }
    ]
  },
  {
    id: 'em-106',
    account: 'info@thetaxlink.com',
    fromName: 'Stripe Payments',
    fromEmail: 'support@stripe.com',
    to: 'info@thetaxlink.com',
    subject: 'Daily Payout of €3,420.00 is on its way',
    preview: 'Your funds are scheduled to arrive in your designated business account within 1-2 business days...',
    body: `Hi The Tax Link,\n\nA payout of €3,420.00 has been initiated from your Stripe balance and will arrive in your Bank of Ireland account on Wednesday, September 30.\n\nView the breakdown in your Stripe Dashboard.\n\nThanks,\nThe Stripe Team`,
    date: '2026-09-27T14:10:00Z',
    isRead: true,
    isStarred: false,
    folder: 'inbox',
    attachments: []
  },
  {
    id: 'em-107',
    account: 'admin@locumireland.ie',
    fromName: 'Namecheap Hosting Notification',
    fromEmail: 'support@namecheap.com',
    to: 'admin@locumireland.ie',
    subject: 'Automated SSL Certificate Renewal Successful',
    preview: 'cPanel Sectigo SSL Certificate for *.locumireland.ie and mail.locumireland.ie has renewed...',
    body: `Dear cPanel Customer,\n\nYour free cPanel/Sectigo AutoSSL certificate for domains:\n- locumireland.ie\n- mail.locumireland.ie\n- cpanel.locumireland.ie\n\nhas been automatically validated and renewed for an additional 90 days. No manual action is required.\n\nBest regards,\nNamecheap Infrastructure Support`,
    date: '2026-09-26T04:00:00Z',
    isRead: true,
    isStarred: false,
    folder: 'inbox',
    attachments: []
  }
];

module.exports = {
  initialAccounts,
  initialDomains,
  initialEmails
};
