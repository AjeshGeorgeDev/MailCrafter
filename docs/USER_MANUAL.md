# MailCrafter User Manual

**Version:** 1.0  
**Last Updated:** December 2024

Welcome to MailCrafter! This comprehensive guide will help you create, manage, and send professional email campaigns with ease.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Creating Email Templates](#creating-email-templates)
4. [Managing Campaigns](#managing-campaigns)
5. [Contact Management](#contact-management)
6. [Analytics & Reporting](#analytics--reporting)
7. [SMTP Configuration](#smtp-configuration)
8. [Multi-Language Support](#multi-language-support)
9. [Team Collaboration](#team-collaboration)
10. [Settings & Preferences](#settings--preferences)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating Your Account

1. Navigate to the MailCrafter homepage
2. Click **"Sign Up"** or **"Register"**
3. Fill in your details:
   - Email address
   - Password (must be at least 8 characters)
   - Name (optional)
4. Click **"Create Account"**
5. Check your email for verification (if enabled)

### First Login

1. Go to the login page
2. Enter your email and password
3. Click **"Sign In"**
4. You'll be redirected to your dashboard

### Default Credentials (Development)

For testing purposes:
- **Email:** `admin@mailcrafter.com`
- **Password:** `Admin123!@#`

---

## Dashboard Overview

The dashboard is your command center for all email marketing activities.

### Main Sections

#### 1. **Dashboard Home**
- Overview statistics (templates, campaigns, sent emails)
- Quick actions (create template, start campaign)
- Recent activity feed

#### 2. **Templates**
- View all email templates
- Create new templates
- Edit existing templates
- Duplicate templates
- Delete templates

#### 3. **Campaigns**
- View all campaigns
- Create new campaigns
- Monitor campaign progress
- View campaign analytics

#### 4. **Analytics**
- Email performance metrics
- Open rates, click rates, conversion rates
- Bounce and complaint tracking
- Export reports

#### 5. **Contacts**
- Manage contact lists
- Import contacts (CSV)
- Export contacts
- View contact status

#### 6. **Email Logs**
- View all sent emails
- Track delivery status
- View email details
- Resend failed emails

#### 7. **Bounces**
- View bounced emails
- Manage bounce handling
- Suppress bounced addresses

#### 8. **Settings**
- Organization settings
- SMTP configuration
- Team management
- API keys
- Language preferences
- DNS verification

---

## Creating Email Templates

### Using the Visual Builder

The visual email builder is the easiest way to create professional email templates.

#### Step 1: Create a New Template

1. Navigate to **Templates** → **New Template**
2. Enter a template name
3. Choose a starting point:
   - **Blank Template** - Start from scratch
   - **Pre-built Template** - Use a professional template
4. Click **"Create"**

#### Step 2: Add Content Blocks

The builder uses a block-based system. Available blocks include:

- **Container** - Group multiple blocks together
- **Text** - Rich text content with formatting
- **Heading** - Headings (H1, H2, H3)
- **Button** - Call-to-action buttons
- **Image** - Images with alt text
- **Spacer** - Add vertical spacing
- **Divider** - Horizontal line separator
- **Social Links** - Social media icons
- **Footer** - Footer content

**To add a block:**
1. Click the **"+"** button in the sidebar
2. Select the block type you want
3. The block appears in your template

#### Step 3: Edit Block Content

**For Text Blocks:**
1. Double-click the text block
2. A rich text editor opens
3. Format text using the toolbar:
   - **Bold** (Ctrl+B / Cmd+B)
   - **Italic** (Ctrl+I / Cmd+I)
   - **Strikethrough**
   - **Bullet Lists**
   - **Numbered Lists**
   - **Text Alignment** (Left, Center, Right)
   - **Links**
   - **Variables** (Ctrl+K / Cmd+K)
4. Press **Escape** to exit edit mode

**For Other Blocks:**
1. Click the block to select it
2. Use the properties panel on the right to:
   - Edit content
   - Adjust styling (padding, colors, fonts)
   - Configure settings

#### Step 4: Customize Styling

Each block has style options:

- **Padding** - Space around content (top, right, bottom, left)
- **Background Color** - Block background
- **Text Color** - Text color
- **Font Size** - Text size
- **Font Weight** - Bold, normal, etc.
- **Text Alignment** - Left, center, right

**To adjust styles:**
1. Select a block
2. Open the **Properties Panel** (right sidebar)
3. Adjust style values
4. Changes apply instantly

#### Step 5: Reorder Blocks

**Using Drag & Drop:**
1. Hover over a block
2. Click and hold the **drag handle** (⋮⋮) on the left
3. Drag to the desired position
4. Release to drop

**Using Keyboard:**
- Select a block
- Use **Ctrl+↑/↓** (or **Cmd+↑/↓** on Mac) to move

#### Step 6: Add Variables

Variables allow dynamic content in your emails.

**Available Variables:**
- `{{user.name}}` - User's name
- `{{user.email}}` - User's email
- `{{user.company}}` - User's company
- Custom variables (defined in Settings)

**To insert a variable:**
1. Place cursor in a text block
2. Press **Ctrl+K** (or **Cmd+K** on Mac)
3. Search for the variable
4. Select it to insert

#### Step 7: Save Your Template

- **Auto-save** - Templates save automatically every 30 seconds
- **Manual save** - Click the **"Save"** button in the toolbar
- **Save as new** - Use **"Save As"** to create a copy

### Using Pre-built Templates

1. Go to **Templates** → **New Template**
2. Select **"Use Template"**
3. Browse available templates:
   - Welcome emails
   - Newsletter templates
   - Promotional emails
   - Transactional emails
4. Click **"Use This Template"**
5. Customize as needed

### Testing Templates

Before sending, always test your template:

1. Click **"Preview"** to see how it looks
2. Use **"Test Send"** to send to yourself
3. Check on different devices:
   - Desktop
   - Mobile
   - Tablet
4. Test with different email clients:
   - Gmail
   - Outlook
   - Apple Mail

---

## Managing Campaigns

### Creating a Campaign

#### Step 1: Campaign Setup

1. Go to **Campaigns** → **New Campaign**
2. Fill in campaign details:
   - **Name** - Internal campaign name
   - **Subject** - Email subject line
   - **From Name** - Sender name
   - **From Email** - Sender email address
   - **Reply-To** - Reply-to email (optional)

#### Step 2: Select Template

1. Choose a template from your library
2. Or create a new template on the fly
3. Preview the template
4. Click **"Next"**

#### Step 3: Configure Recipients

**Option 1: Select Contacts**
- Choose from existing contact lists
- Filter by tags or segments
- Preview recipient count

**Option 2: Upload CSV**
- Upload a CSV file with email addresses
- Map columns (email, name, etc.)
- Validate addresses

**Option 3: Manual Entry**
- Enter email addresses manually
- One per line or comma-separated

#### Step 4: Schedule

**Send Immediately:**
- Click **"Send Now"**

**Schedule for Later:**
- Select date and time
- Choose timezone
- Click **"Schedule"**

**Send as Drip Campaign:**
- Set up multiple emails
- Configure delays between sends
- Define conditions

#### Step 5: Review & Send

1. Review all settings
2. Check recipient count
3. Preview email
4. Click **"Send Campaign"** or **"Schedule"**

### Managing Active Campaigns

#### View Campaign Status

- **Draft** - Not sent yet
- **Scheduled** - Queued for sending
- **Sending** - Currently sending
- **Paused** - Temporarily stopped
- **Completed** - Finished sending
- **Failed** - Encountered errors

#### Campaign Actions

- **Pause** - Stop sending temporarily
- **Resume** - Continue sending
- **Cancel** - Stop and cancel campaign
- **Duplicate** - Create a copy
- **View Analytics** - See performance metrics

### A/B Testing

Create A/B tests to optimize your campaigns:

1. Create a campaign
2. Enable **"A/B Test"**
3. Create variants (different subjects, content, etc.)
4. Set test parameters:
   - Test size (percentage of recipients)
   - Winner metric (open rate, click rate, etc.)
   - Test duration
5. Launch the test
6. Review results and send winner to remaining recipients

---

## Contact Management

### Adding Contacts

#### Manual Entry

1. Go to **Contacts**
2. Click **"Add Contact"**
3. Enter contact details:
   - Email (required)
   - Name
   - Company
   - Tags
   - Custom fields
4. Click **"Save"**

#### Import from CSV

1. Click **"Import Contacts"**
2. Upload CSV file
3. Map columns:
   - Email → Email
   - First Name → Name
   - Company → Company
   - etc.
4. Preview import
5. Click **"Import"**

**CSV Format:**
```csv
email,name,company
user@example.com,John Doe,Acme Corp
jane@example.com,Jane Smith,Tech Inc
```

### Managing Contact Lists

- **Create Lists** - Organize contacts into lists
- **Add Tags** - Tag contacts for segmentation
- **Filter** - Filter by status, tags, or custom fields
- **Export** - Download contacts as CSV
- **Delete** - Remove contacts (with confirmation)

### Contact Status

- **Subscribed** - Active, receiving emails
- **Unsubscribed** - Opted out
- **Bounced** - Email bounced
- **Complained** - Marked as spam

---

## Analytics & Reporting

### Dashboard Metrics

The analytics dashboard shows:

- **Total Emails Sent** - All-time count
- **Open Rate** - Percentage of opened emails
- **Click Rate** - Percentage of clicked links
- **Bounce Rate** - Percentage of bounced emails
- **Unsubscribe Rate** - Percentage of unsubscribes

### Campaign Analytics

View detailed metrics for each campaign:

1. Go to **Campaigns**
2. Click on a campaign
3. View **Analytics** tab

**Metrics Include:**
- Emails sent
- Emails delivered
- Opens (total and unique)
- Clicks (total and unique)
- Bounces (hard and soft)
- Unsubscribes
- Complaints
- Conversion rate

### Email Logs

Track individual email status:

1. Go to **Email Logs**
2. View all sent emails
3. Filter by:
   - Campaign
   - Status (sent, failed, bounced)
   - Date range
   - Recipient
4. Click an email to see details:
   - Delivery status
   - Open tracking
   - Click tracking
   - Bounce reason (if any)

### Exporting Reports

1. Go to **Analytics**
2. Select date range
3. Choose metrics to include
4. Click **"Export"**
5. Download as CSV or Excel

---

## SMTP Configuration

### Setting Up SMTP

To send emails, configure your SMTP server:

1. Go to **Settings** → **SMTP**
2. Click **"Add SMTP Profile"**
3. Fill in details:

**Basic Settings:**
- **Profile Name** - Internal name
- **Host** - SMTP server (e.g., smtp.gmail.com)
- **Port** - Port number (587, 465, or 25)
- **Encryption** - TLS, SSL, or None
- **Username** - SMTP username
- **Password** - SMTP password

**Advanced Settings:**
- **From Name** - Default sender name
- **From Email** - Default sender email
- **Reply-To** - Default reply-to address
- **Rate Limit** - Emails per hour

4. Click **"Test Connection"**
5. If successful, click **"Save"**

### Testing SMTP

Before using in production:

1. Click **"Test SMTP"** on any profile
2. Enter a test email address
3. Click **"Send Test"**
4. Check your inbox
5. Review test results

### DNS Verification

For better deliverability, verify your domain:

1. Go to **Settings** → **DNS Check**
2. Enter your domain
3. View required DNS records:
   - **SPF** - Sender Policy Framework
   - **DKIM** - DomainKeys Identified Mail
   - **DMARC** - Domain-based Message Authentication
4. Add records to your DNS
5. Click **"Verify"**

---

## Multi-Language Support

### Adding Languages

1. Go to **Settings** → **Languages**
2. Click **"Add Language"**
3. Select language from list
4. Click **"Add"**

### Translating Templates

1. Open a template
2. Click the **language selector** (top right)
3. Select target language
4. Translate content:
   - Text blocks
   - Headings
   - Buttons
   - Variables
5. Save translations

### Sending Multi-Language Campaigns

1. Create a campaign
2. Select template
3. Choose language for each recipient
4. Or use auto-detection based on contact preferences

---

## Team Collaboration

### Inviting Team Members

1. Go to **Settings** → **Team**
2. Click **"Invite Member"**
3. Enter email address
4. Select role:
   - **Owner** - Full access
   - **Admin** - Manage everything except billing
   - **Editor** - Create and edit templates/campaigns
   - **Viewer** - Read-only access
5. Click **"Send Invitation"**

### Managing Roles

**Owner:**
- Full access to all features
- Manage organization settings
- Manage billing
- Delete organization

**Admin:**
- Manage templates and campaigns
- Manage team members
- View analytics
- Configure SMTP

**Editor:**
- Create and edit templates
- Create and manage campaigns
- View analytics
- Cannot delete or modify settings

**Viewer:**
- View templates
- View campaigns
- View analytics
- Cannot make changes

### Team Activity

View team activity in **Settings** → **Audit Log**:
- Who created/modified templates
- Campaign actions
- Settings changes
- Login history

---

## Settings & Preferences

### Organization Settings

**General:**
- Organization name
- Default language
- Timezone
- Date format

**Email Preferences:**
- Default from name
- Default from email
- Default reply-to
- Footer text

### User Preferences

**Account:**
- Name
- Email
- Password
- Profile picture

**Notifications:**
- Email notifications
- Campaign completion alerts
- Bounce alerts
- Weekly reports

### API Keys

Generate API keys for programmatic access:

1. Go to **Settings** → **API Keys**
2. Click **"Generate New Key"**
3. Enter key name
4. Set permissions
5. Click **"Generate"**
6. **Copy the key immediately** (it won't be shown again)

**Use API keys in:**
- Server actions
- Webhooks
- External integrations

---

## Keyboard Shortcuts

### Template Editor

- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + Y** - Redo
- **Ctrl/Cmd + C** - Copy block
- **Ctrl/Cmd + V** - Paste block
- **Ctrl/Cmd + D** - Duplicate block
- **Delete/Backspace** - Delete selected block
- **Escape** - Deselect block / Exit edit mode
- **Ctrl/Cmd + K** - Insert variable
- **Ctrl/Cmd + B** - Bold text
- **Ctrl/Cmd + I** - Italic text

### Navigation

- **/** - Search (when available)
- **G + D** - Go to Dashboard
- **G + T** - Go to Templates
- **G + C** - Go to Campaigns

---

## Troubleshooting

### Common Issues

#### Emails Not Sending

**Check:**
1. SMTP configuration is correct
2. SMTP credentials are valid
3. DNS records are verified
4. Rate limits aren't exceeded
5. Check email logs for errors

**Solutions:**
- Test SMTP connection
- Verify DNS records
- Check spam folder
- Contact SMTP provider

#### Templates Not Rendering Correctly

**Check:**
1. Preview in different email clients
2. Test on mobile devices
3. Check for unsupported CSS
4. Verify image URLs are accessible

**Solutions:**
- Use email-safe CSS
- Test images load correctly
- Use inline styles
- Test in multiple clients

#### High Bounce Rate

**Possible Causes:**
- Invalid email addresses
- Spam filters
- DNS not verified
- Poor sender reputation

**Solutions:**
- Clean contact list
- Verify DNS records
- Warm up sending domain
- Follow email best practices

#### Can't Login

**Solutions:**
- Reset password
- Check email for verification
- Clear browser cache
- Contact support

### Getting Help

- **Documentation** - Check this manual
- **Support Email** - support@mailcrafter.com
- **Community Forum** - forum.mailcrafter.com
- **Status Page** - status.mailcrafter.com

---

## Best Practices

### Email Design

1. **Keep it Simple** - Less is more
2. **Mobile First** - Design for mobile devices
3. **Clear CTAs** - Make buttons obvious
4. **Alt Text** - Always add alt text to images
5. **Test Thoroughly** - Test before sending

### Content

1. **Compelling Subject** - Write engaging subjects
2. **Personalization** - Use variables
3. **Value First** - Provide value to recipients
4. **Clear Message** - Get to the point quickly
5. **Unsubscribe Link** - Always include one

### Deliverability

1. **Verify DNS** - Set up SPF, DKIM, DMARC
2. **Clean Lists** - Remove bounces and unsubscribes
3. **Warm Up** - Gradually increase sending volume
4. **Monitor Reputation** - Track bounce rates
5. **Follow Regulations** - Comply with CAN-SPAM, GDPR

### Campaign Management

1. **Segment Lists** - Send relevant content
2. **A/B Test** - Test subject lines and content
3. **Schedule Wisely** - Send at optimal times
4. **Monitor Analytics** - Track performance
5. **Iterate** - Improve based on data

---

## Appendix

### Supported Email Clients

- Gmail (Web, iOS, Android)
- Outlook (Web, Desktop, Mobile)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Thunderbird
- And more...

### File Size Limits

- **Template Images:** 5MB max
- **CSV Import:** 10MB max
- **Campaign Recipients:** 10,000 per campaign (configurable)

### Rate Limits

- **Default:** 100 emails/hour per SMTP profile
- **Configurable** in SMTP settings
- **Queue-based** sending for reliability

---

**Need more help?** Contact support@mailcrafter.com or visit our documentation at docs.mailcrafter.com

