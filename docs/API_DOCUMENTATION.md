# MailCrafter API Documentation

Complete API reference for MailCrafter email marketing platform.

**Base URL:** `https://your-domain.com` (or `http://localhost:3000` for development)

**API Version:** v1

**Last Updated:** 2024-12-19

---

## Table of Contents

1. [Authentication](#authentication)
2. [REST API Endpoints](#rest-api-endpoints)
   - [Email APIs](#email-apis)
   - [Template APIs](#template-apis)
   - [Tracking APIs](#tracking-apis)
   - [Unsubscribe API](#unsubscribe-api)
3. [Server Actions](#server-actions)
   - [Templates](#templates-server-actions)
   - [Campaigns](#campaigns-server-actions)
   - [Email Queue](#email-queue-server-actions)
   - [Analytics](#analytics-server-actions)
   - [Email Logs](#email-logs-server-actions)
   - [SMTP Profiles](#smtp-profiles-server-actions)
   - [Organizations](#organizations-server-actions)
   - [Team Management](#team-management-server-actions)
   - [API Keys](#api-keys-server-actions)
   - [Languages](#languages-server-actions)
   - [Audit Logs](#audit-logs-server-actions)
   - [DNS Verification](#dns-verification-server-actions)
   - [Notifications](#notifications-server-actions)
   - [Bounces](#bounces-server-actions)
   - [Translations](#translations-server-actions)
   - [Custom Variables](#custom-variables-server-actions)
4. [API Key Authentication](#api-key-authentication)
5. [Variable Replacement](#variable-replacement)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

---

## Authentication

MailCrafter supports two authentication methods:

### 1. Session-Based Authentication (Web UI)

Uses NextAuth.js session cookies. Automatically handled by the web interface.

**Headers:**
```
Cookie: next-auth.session-token=<session-token>
```

**NextAuth Endpoint:** `GET/POST /api/auth/[...nextauth]`

This endpoint handles all NextAuth.js authentication flows including:
- Sign in (`/api/auth/signin`)
- Sign out (`/api/auth/signout`)
- Session (`/api/auth/session`)
- Callbacks (`/api/auth/callback/[provider]`)

**Supported Providers:**
- Credentials (email/password)

### 2. API Key Authentication (Programmatic Access)

For external API access, use API keys generated in Settings → Integrations → API Keys.

**Headers:**
```
Authorization: Bearer <api-key>
```

**API Key Format:** `mc_<32-character-random-string>`

**Note:** API key authentication is available for server actions. REST API endpoints currently use session-based authentication.

---

## REST API Endpoints

### Email APIs

#### 1. Send Email

Send emails to multiple recipients using templates or raw HTML.

**Endpoint:** `POST /api/email/send`

**Authentication:** Required (Session-based)

**Request Body:**

**Template-Based Email (Recommended):**
```json
{
  "subject": "Welcome {{user.name}}",
  "recipients": ["user@example.com"],
  "templateId": "template-id-123",
  "variables": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "languageCode": "en"
}
```

**Legacy HTML Email:**
```json
{
  "html": "<html><body><h1>Hello {{user.name}}</h1></body></html>",
  "subject": "Welcome Email",
  "recipients": ["user@example.com"],
  "fromEmail": "sender@example.com",
  "fromName": "MailCrafter Team",
  "templateId": "optional-template-id"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | Yes | Email subject line |
| `recipients` | string[] | Yes | Array of recipient email addresses |
| `templateId` | string | Conditional | Required for template-based emails |
| `variables` | object | No | Variable data for template rendering |
| `languageCode` | string | No | Language code (default: "en") |
| `html` | string | Conditional | Required for legacy mode (when no templateId) |
| `fromEmail` | string | No | Sender email (defaults to SMTP profile) |
| `fromName` | string | No | Sender display name |
| `useQueue` | boolean | No | Force queue usage (default: false) |

**Response (Template-Based):**
```json
{
  "success": true,
  "queued": 2,
  "jobIds": ["job-id-1", "job-id-2"],
  "message": "Emails queued for processing"
}
```

**Response (Legacy HTML):**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "results": [
    {
      "email": "user1@example.com",
      "messageId": "<message-id-1>",
      "status": "sent"
    },
    {
      "email": "user2@example.com",
      "messageId": "<message-id-2>",
      "status": "sent"
    }
  ],
  "errors": []
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields, invalid email addresses, or template not found
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

**Example cURL:**
```bash
curl -X POST https://your-domain.com/api/email/send \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "subject": "Welcome Email",
    "recipients": ["user@example.com"],
    "templateId": "template-id-123",
    "variables": {
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    },
    "languageCode": "en"
  }'
```

---

#### 2. Send Preview/Test Email

Send a test email to a single recipient. Subject is automatically prefixed with "[TEST]".

**Endpoint:** `POST /api/email/preview`

**Authentication:** Required (Session-based)

**Request Body:**
```json
{
  "html": "<html><body><h1>Hello {{user.name}}</h1></body></html>",
  "subject": "Welcome Email",
  "recipientEmail": "test@example.com",
  "fromEmail": "sender@example.com",
  "fromName": "MailCrafter Team",
  "templateId": "template-id-123"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `html` | string | Yes | HTML content of the email |
| `subject` | string | Yes | Email subject (will be prefixed with "[TEST]") |
| `recipientEmail` | string | Yes | Single recipient email address |
| `fromEmail` | string | No | Sender email (defaults to SMTP profile) |
| `fromName` | string | No | Sender display name |
| `templateId` | string | No | Template ID for tracking |

**Response:**
```json
{
  "success": true,
  "messageId": "<message-id>",
  "message": "Test email sent successfully"
}
```

**Example cURL:**
```bash
curl -X POST https://your-domain.com/api/email/preview \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "html": "<h1>Test Email</h1>",
    "subject": "Test",
    "recipientEmail": "test@example.com"
  }'
```

---

### Template APIs

#### 3. Get Template

Retrieve a template by ID with all language structures.

**Endpoint:** `GET /api/templates/[id]`

**Authentication:** Required (Session-based)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Template ID |

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "template-id-123",
    "name": "Welcome Email",
    "description": "Welcome email template",
    "defaultLanguage": "en",
    "structure": {
      "backdropColor": "#F8F8F8",
      "canvasColor": "#FFFFFF",
      "textColor": "#242424",
      "fontFamily": "MODERN_SANS",
      "childrenIds": ["block-1", "block-2"],
      "block-1": {
        "type": "Container",
        "data": {
          "style": {
            "padding": { "top": 20, "right": 20, "bottom": 20, "left": 20 },
            "backgroundColor": "#FFFFFF"
          },
          "props": {
            "childrenIds": ["block-2"]
          }
        }
      },
      "block-2": {
        "type": "Text",
        "data": {
          "style": {
            "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 },
            "fontSize": 16
          },
          "props": {
            "text": "Hello {{user.name}}"
          }
        }
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found`: Template not found or access denied
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

**Example cURL:**
```bash
curl -X GET https://your-domain.com/api/templates/template-id-123 \
  -H "Cookie: next-auth.session-token=your-session-token"
```

---

#### 4. Save Template

Save or update a template structure for a specific language.

**Endpoint:** `POST /api/templates/[id]/save`

**Authentication:** Required (Session-based)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Template ID |

**Request Body:**
```json
{
  "structure": {
    "backdropColor": "#F8F8F8",
    "canvasColor": "#FFFFFF",
    "textColor": "#242424",
    "fontFamily": "MODERN_SANS",
    "childrenIds": ["block-1"],
    "block-1": {
      "type": "Text",
      "data": {
        "style": {
          "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 }
        },
        "props": {
          "text": "Hello World"
        }
      }
    }
  },
  "languageCode": "en"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `structure` | EmailBuilderDocument | Yes | Template structure in EmailBuilderDocument format |
| `languageCode` | string | No | Language code (defaults to template's default language) |

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "template-id-123",
    "name": "Welcome Email",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing structure or invalid format
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Template not found or access denied
- `500 Internal Server Error`: Server error

**Example cURL:**
```bash
curl -X POST https://your-domain.com/api/templates/template-id-123/save \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "structure": {
      "backdropColor": "#F8F8F8",
      "canvasColor": "#FFFFFF",
      "textColor": "#242424",
      "fontFamily": "MODERN_SANS",
      "childrenIds": []
    }
  }'
```

---

#### 5. Upload Image

Upload an image for use in templates.

**Endpoint:** `POST /api/templates/[id]/upload-image`

**Authentication:** Required (Session-based)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Template ID |

**Request:** Multipart form data

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file (JPEG, PNG, GIF, WebP, SVG) |

**File Constraints:**

- **Max Size:** 5MB
- **Allowed Types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`

**Response:**
```json
{
  "success": true,
  "url": "https://your-domain.com/uploads/images/1234567890-abc123.jpg",
  "assetId": "asset-id-123"
}
```

**Error Responses:**

- `400 Bad Request`: No file provided, invalid file type, or file size exceeds limit
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Template not found or access denied
- `500 Internal Server Error`: Server error

**Example cURL:**
```bash
curl -X POST https://your-domain.com/api/templates/template-id-123/upload-image \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -F "file=@/path/to/image.jpg"
```

---

### Tracking APIs

#### 6. Track Email Click

Tracks email link clicks and redirects to the original URL.

**Endpoint:** `GET /api/track/click/[encryptedData]`

**Authentication:** Not required (public endpoint)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `encryptedData` | string | Encrypted tracking data containing email log ID and URL |

**Response:** HTTP 302 Redirect to the original URL

**Headers:**

- `Location`: Original URL from the email link

**Behavior:**

- Decrypts tracking data
- Logs click event with metadata (user agent, IP address, referer)
- Redirects to original URL (302 temporary redirect)

**Example:**
```
GET /api/track/click/encrypted-tracking-data-here
→ Redirects to: https://example.com/original-link
```

**Note:** This endpoint is automatically used by email links when click tracking is enabled. The encrypted data is generated by the email sending system.

---

#### 7. Track Email Open

Tracks email opens via a 1x1 transparent pixel.

**Endpoint:** `GET /api/track/open/[encryptedId]`

**Authentication:** Not required (public endpoint)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `encryptedId` | string | Encrypted email log ID |

**Response:** 1x1 transparent PNG image

**Headers:**

- `Content-Type: image/png`
- `Cache-Control: no-cache, no-store, must-revalidate`

**Behavior:**

- Decrypts email log ID
- Respects Do Not Track (DNT) header
- Logs open event with metadata (user agent, IP address)
- Returns 1x1 transparent PNG

**Privacy:**

- Respects `DNT: 1` header (does not log if DNT is enabled)
- IP addresses are anonymized if configured

**Example:**
```html
<img src="https://your-domain.com/api/track/open/encrypted-id-here" width="1" height="1" style="display:none;" />
```

**Note:** This endpoint is automatically embedded in emails when open tracking is enabled. The encrypted ID is generated by the email sending system.

---

### Unsubscribe API

#### 8. One-Click Unsubscribe

Handles one-click unsubscribe requests (List-Unsubscribe-Post).

**Endpoint:** `POST /api/unsubscribe/[token]`

**Authentication:** Not required (public endpoint)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | string | Encrypted unsubscribe token |

**Request Body:** Empty (POST request with token in URL)

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**

- `400 Bad Request`: Invalid or expired unsubscribe token
- `500 Internal Server Error`: Server error

**Behavior:**

- Decrypts unsubscribe token
- Unsubscribes email from campaign or all emails
- Returns success response

**Example:**
```bash
curl -X POST https://your-domain.com/api/unsubscribe/encrypted-token-here
```

**Note:** This endpoint is used by email clients for one-click unsubscribe functionality. The token is included in email headers as `List-Unsubscribe-Post`.

---

## Server Actions

Server Actions are Next.js server functions that can be called from client components or used as API endpoints. They provide a type-safe way to interact with the backend.

### Authentication

All server actions require authentication via session or API key (where supported).

### Response Format

All server actions return either:
- `{ success: true, ...data }` on success
- `{ error: "error message" }` on failure

---

### Templates Server Actions

#### `createTemplate(data)`

Create a new email template.

**Parameters:**
```typescript
{
  name: string;                    // Required, max 255 chars
  description?: string;            // Optional
  structure?: EmailBuilderDocument; // Optional, template structure
  defaultLanguage?: string;         // Optional, defaults to "en"
}
```

**Returns:**
```typescript
{
  success: true;
  template: {
    id: string;
    name: string;
    description: string | null;
    defaultLanguage: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
// OR
{
  error: string;
}
```

**Example:**
```typescript
import { createTemplate } from '@/app/actions/templates';

const result = await createTemplate({
  name: "Welcome Email",
  description: "Welcome new users",
  defaultLanguage: "en",
  structure: { /* EmailBuilderDocument */ }
});

if (result.success) {
  console.log('Template created:', result.template.id);
} else {
  console.error('Error:', result.error);
}
```

---

#### `getTemplateById(id)`

Get a template by ID with all language structures.

**Parameters:**
- `id: string` - Template ID

**Returns:**
```typescript
{
  success: true;
  template: {
    id: string;
    name: string;
    description: string | null;
    defaultLanguage: string;
    structure: EmailBuilderDocument; // Merged structure from all languages
    createdAt: Date;
    updatedAt: Date;
  };
}
// OR
{
  error: string;
}
```

---

#### `getTemplates(filters?)`

List templates with optional filters.

**Parameters:**
```typescript
{
  search?: string;      // Search by name or description
  category?: string;    // Filter by category
  status?: string;      // Filter by status
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 50)
}
```

**Returns:**
```typescript
{
  success: true;
  templates: Template[];
  total: number;
  page: number;
  limit: number;
}
// OR
{
  error: string;
}
```

---

#### `saveTemplate(id, structure, languageCode?)`

Save template structure for a specific language.

**Parameters:**
- `id: string` - Template ID
- `structure: EmailBuilderDocument` - Template structure
- `languageCode?: string` - Language code (defaults to template's default language)

**Returns:**
```typescript
{
  success: true;
  template: {
    id: string;
    name: string;
    updatedAt: Date;
  };
}
// OR
{
  error: string;
}
```

---

#### `updateTemplate(id, data)`

Update template metadata.

**Parameters:**
- `id: string` - Template ID
- `data: { name?: string; description?: string; defaultLanguage?: string }`

**Returns:**
```typescript
{
  success: true;
  template: Template;
}
// OR
{
  error: string;
}
```

---

#### `deleteTemplate(id)`

Delete a template.

**Parameters:**
- `id: string` - Template ID

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

#### `duplicateTemplate(id, newLanguage?)`

Duplicate a template, optionally for a different language.

**Parameters:**
- `id: string` - Template ID to duplicate
- `newLanguage?: string` - New default language (optional)

**Returns:**
```typescript
{
  success: true;
  template: Template;
}
// OR
{
  error: string;
}
```

---

### Campaigns Server Actions

#### `createCampaign(data)`

Create a new email campaign.

**Parameters:**
```typescript
{
  name: string;              // Required, max 255 chars
  templateId: string;        // Required
  subject: string;           // Required, max 255 chars
  smtpProfileId?: string;    // Optional
  scheduledAt?: string;      // Optional, ISO datetime string
}
```

**Returns:**
```typescript
{
  success: true;
  campaign: Campaign;
}
// OR
{
  error: string;
}
```

---

#### `getCampaigns(filters)`

List campaigns with filters.

**Parameters:**
```typescript
{
  status?: CampaignStatus;   // "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "PAUSED" | "CANCELLED"
  search?: string;           // Search by name
  page?: number;             // Page number (default: 1)
  limit?: number;            // Items per page (default: 20)
}
```

**Returns:**
```typescript
{
  success: true;
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}
// OR
{
  error: string;
}
```

---

#### `getCampaignById(id)`

Get campaign by ID with full details.

**Parameters:**
- `id: string` - Campaign ID

**Returns:**
```typescript
{
  success: true;
  campaign: Campaign & {
    template: Template;
    smtpProfile: SmtpProfile;
    recipients: CampaignRecipient[];
  };
}
// OR
{
  error: string;
}
```

---

#### `updateCampaign(id, data)`

Update campaign.

**Parameters:**
- `id: string` - Campaign ID
- `data: { name?: string; subject?: string; smtpProfileId?: string; scheduledAt?: string | null }`

**Returns:**
```typescript
{
  success: true;
  campaign: Campaign;
}
// OR
{
  error: string;
}
```

---

#### `addCampaignRecipients(campaignId, recipients)`

Add recipients to a campaign.

**Parameters:**
- `campaignId: string` - Campaign ID
- `recipients: Array<{ email: string; name?: string; variables?: Record<string, any> }>`

**Returns:**
```typescript
{
  success: true;
  added: number;
}
// OR
{
  error: string;
}
```

---

#### `duplicateCampaign(id)`

Duplicate a campaign.

**Parameters:**
- `id: string` - Campaign ID to duplicate

**Returns:**
```typescript
{
  success: true;
  campaign: Campaign;
}
// OR
{
  error: string;
}
```

---

#### `deleteCampaign(id)`

Delete a campaign.

**Parameters:**
- `id: string` - Campaign ID

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

#### Campaign Service Actions

- `sendCampaignAction(campaignId: string)` - Send a campaign
- `pauseCampaignAction(campaignId: string)` - Pause a running campaign
- `resumeCampaignAction(campaignId: string)` - Resume a paused campaign
- `cancelCampaignAction(campaignId: string)` - Cancel a campaign

**Returns:**
```typescript
{
  success: true;
  campaign: Campaign;
}
// OR
{
  error: string;
}
```

---

### Email Queue Server Actions

#### `queueEmail(data)`

Queue a single email for processing.

**Parameters:**
```typescript
{
  templateId: string;              // Required
  recipientEmail: string;           // Required
  recipientName?: string;           // Optional
  variables?: Record<string, any>;  // Optional
  languageCode?: string;            // Optional, defaults to "en"
  smtpProfileId?: string;          // Optional
  organizationId: string;           // Required
  campaignId?: string;              // Optional
  emailLogId?: string;              // Optional
  priority?: number;                // Optional, higher = higher priority
  subject?: string;                 // Optional, override template subject
  fromEmail?: string;               // Optional, override profile fromEmail
  fromName?: string;                // Optional, override profile fromName
}
```

**Returns:**
```typescript
{
  success: true;
  jobId: string;
}
// OR
{
  error: string;
}
```

---

#### `queueBulkEmails(data)`

Queue multiple emails for processing.

**Parameters:**
```typescript
{
  templateId: string;              // Required
  recipients: Array<{              // Required
    email: string;
    name?: string;
    variables?: Record<string, any>;
  }>;
  languageCode?: string;            // Optional, defaults to "en"
  subject?: string;                 // Optional
  priority?: number;                // Optional
  delay?: number;                   // Optional, delay in milliseconds
  queue?: "immediate" | "scheduled" | "bulk"; // Optional, defaults to "immediate"
}
```

**Returns:**
```typescript
{
  success: true;
  count: number;
  jobIds: string[];
}
// OR
{
  error: string;
}
```

---

#### `getQueueStatistics()`

Get email queue statistics.

**Returns:**
```typescript
{
  success: true;
  statistics: {
    immediate: { waiting: number; active: number; completed: number; failed: number };
    scheduled: { waiting: number; active: number; completed: number; failed: number };
    bulk: { waiting: number; active: number; completed: number; failed: number };
  };
}
// OR
{
  error: string;
}
```

---

#### `getEmailJobStatus(jobId, queueName?)`

Get status of an email job.

**Parameters:**
- `jobId: string` - Job ID
- `queueName?: "immediate" | "scheduled" | "bulk"` - Queue name (default: "immediate")

**Returns:**
```typescript
{
  success: true;
  job: Job<EmailJob> | null;
}
// OR
{
  error: string;
}
```

---

#### `cancelEmailJob(jobId, queueName?)`

Cancel an email job.

**Parameters:**
- `jobId: string` - Job ID
- `queueName?: "immediate" | "scheduled" | "bulk"` - Queue name (default: "immediate")

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

#### `retryEmailJob(jobId, queueName?)`

Retry a failed email job.

**Parameters:**
- `jobId: string` - Job ID
- `queueName?: "immediate" | "scheduled" | "bulk"` - Queue name (default: "immediate")

**Returns:**
```typescript
{
  success: true;
  jobId: string;
}
// OR
{
  error: string;
}
```

---

### Analytics Server Actions

#### `getOrganizationStatsAction()`

Get organization-wide email statistics.

**Returns:**
```typescript
{
  success: true;
  stats: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalUnsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    deliveryRate: number;
  };
}
// OR
{
  error: string;
}
```

---

#### `getTopCampaignsAction(limit)`

Get top performing campaigns.

**Parameters:**
- `limit: number` - Number of campaigns to return (default: 10)

**Returns:**
```typescript
{
  success: true;
  campaigns: Array<{
    id: string;
    name: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
}
// OR
{
  error: string;
}
```

---

#### `getCampaignStatsAction(campaignId)`

Get statistics for a specific campaign.

**Parameters:**
- `campaignId: string` - Campaign ID

**Returns:**
```typescript
{
  success: true;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    deliveryRate: number;
  };
}
// OR
{
  error: string;
}
```

---

#### `getEngagementTrendsAction(campaignId, days)`

Get engagement trends over time for a campaign.

**Parameters:**
- `campaignId: string` - Campaign ID
- `days: number` - Number of days to analyze (default: 30)

**Returns:**
```typescript
{
  success: true;
  trends: Array<{
    date: string;
    opens: number;
    clicks: number;
    bounces: number;
  }>;
}
// OR
{
  error: string;
}
```

---

### Email Logs Server Actions

#### `getEmailLogsAction(filters)`

Get email logs with filters.

**Parameters:**
```typescript
{
  campaignId?: string;       // Filter by campaign
  templateId?: string;       // Filter by template
  recipientEmail?: string;  // Search by recipient email
  status?: EmailStatus;      // Filter by status
  startDate?: string;        // ISO date string
  endDate?: string;          // ISO date string
  page?: number;             // Page number (default: 1)
  limit?: number;            // Items per page (default: 50)
}
```

**Returns:**
```typescript
{
  success: true;
  logs: EmailLog[];
  total: number;
  page: number;
  limit: number;
}
// OR
{
  error: string;
}
```

---

#### `getEmailStatistics(filters)`

Get email statistics with filters.

**Parameters:**
```typescript
{
  campaignId?: string;
  templateId?: string;
  startDate?: string;
  endDate?: string;
}
```

**Returns:**
```typescript
{
  success: true;
  statistics: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    deliveryRate: number;
  };
}
// OR
{
  error: string;
}
```

---

### SMTP Profiles Server Actions

#### `createSMTPProfile(data)`

Create a new SMTP profile.

**Parameters:**
```typescript
{
  name: string;                    // Required
  host: string;                     // Required
  port: number;                     // Required (587, 465, 25, etc.)
  username: string;                 // Required
  password: string;                  // Required
  encryption: "TLS" | "SSL" | "NONE"; // Required
  fromEmail: string;                // Required
  fromName?: string;                // Optional
  replyTo?: string;                 // Optional
  isDefault?: boolean;              // Optional, defaults to false
  maxHourlyRate?: number;           // Optional, emails per hour limit
}
```

**Returns:**
```typescript
{
  success: true;
  profile: SmtpProfile;
}
// OR
{
  error: string;
}
```

---

#### `getSMTPProfiles()`

Get all SMTP profiles for the organization.

**Returns:**
```typescript
{
  success: true;
  profiles: SmtpProfile[];
}
// OR
{
  error: string;
}
```

---

#### `getSMTPProfile(id)`

Get a specific SMTP profile by ID.

**Parameters:**
- `id: string` - SMTP profile ID

**Returns:**
```typescript
{
  success: true;
  profile: SmtpProfile;
}
// OR
{
  error: string;
}
```

---

#### `updateSMTPProfile(id, data)`

Update an SMTP profile.

**Parameters:**
- `id: string` - SMTP profile ID
- `data: Partial<CreateSMTPProfileInput>` - Fields to update

**Returns:**
```typescript
{
  success: true;
  profile: SmtpProfile;
}
// OR
{
  error: string;
}
```

---

#### `deleteSMTPProfile(id)`

Delete an SMTP profile.

**Parameters:**
- `id: string` - SMTP profile ID

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

#### `setDefaultSMTPProfile(id)`

Set an SMTP profile as the default.

**Parameters:**
- `id: string` - SMTP profile ID

**Returns:**
```typescript
{
  success: true;
  profile: SmtpProfile;
}
// OR
{
  error: string;
}
```

---

#### SMTP Testing Actions

- `testSMTPConnectionByProfile(profileId: string)` - Test SMTP connection using a profile
- `testSMTPConfig(config: SMTPConfig)` - Test SMTP connection with custom config
- `sendSMTPTestEmail(profileId: string, testEmailAddress: string)` - Send a test email

**Returns:**
```typescript
{
  success: true;
  message?: string;
}
// OR
{
  error: string;
}
```

---

### Organizations Server Actions

#### `getOrganization()`

Get current user's organization.

**Returns:**
```typescript
{
  success: true;
  organization: {
    id: string;
    name: string;
    defaultLanguage: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
// OR
{
  error: string;
}
```

---

#### `updateOrganization(data)`

Update organization settings.

**Parameters:**
```typescript
{
  name?: string;            // Optional
  defaultLanguage?: string; // Optional
}
```

**Returns:**
```typescript
{
  success: true;
  organization: Organization;
}
// OR
{
  error: string;
}
```

---

#### `deleteOrganization()`

Delete the organization (Owner only).

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

### Team Management Server Actions

#### `getTeamMembers()`

Get all team members for the organization.

**Returns:**
```typescript
{
  success: true;
  members: Array<{
    id: string;
    userId: string;
    role: Role;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    createdAt: Date;
  }>;
}
// OR
{
  error: string;
}
```

---

#### `inviteTeamMember(data)`

Invite a new team member.

**Parameters:**
```typescript
{
  email: string;           // Required
  role: Role;              // Required: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER"
}
```

**Returns:**
```typescript
{
  success: true;
  member: OrganizationMember;
}
// OR
{
  error: string;
}
```

---

#### `updateTeamMemberRole(memberId, role)`

Update a team member's role.

**Parameters:**
- `memberId: string` - Organization member ID
- `role: Role` - New role

**Returns:**
```typescript
{
  success: true;
  member: OrganizationMember;
}
// OR
{
  error: string;
}
```

---

#### `removeTeamMember(memberId)`

Remove a team member from the organization.

**Parameters:**
- `memberId: string` - Organization member ID

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

### API Keys Server Actions

#### `createApiKey(data)`

Create a new API key.

**Parameters:**
```typescript
{
  name: string;                    // Required, max 100 chars
  permissions?: string[];           // Optional, array of permission strings
  expiresAt?: string | null;        // Optional, ISO datetime string or null
}
```

**Returns:**
```typescript
{
  success: true;
  apiKey: {
    id: string;
    name: string;
    key: string;                    // Only returned once on creation
    permissions: string[];
    createdAt: Date;
    expiresAt: Date | null;
  };
}
// OR
{
  error: string;
}
```

**Important:** The API key value is only returned once when created. Store it securely.

---

#### `getApiKeys()`

Get all API keys for the organization.

**Returns:**
```typescript
{
  success: true;
  apiKeys: Array<{
    id: string;
    name: string;
    permissions: string[];
    lastUsedAt: Date | null;
    createdAt: Date;
    expiresAt: Date | null;
    isExpired: boolean;
  }>;
}
// OR
{
  error: string;
}
```

**Note:** API keys are masked in the response (only first 8 and last 4 characters shown).

---

#### `updateApiKey(id, data)`

Update an API key.

**Parameters:**
- `id: string` - API key ID
- `data: { name?: string; permissions?: string[]; expiresAt?: string | null }`

**Returns:**
```typescript
{
  success: true;
  apiKey: {
    id: string;
    name: string;
    permissions: string[];
    expiresAt: Date | null;
  };
}
// OR
{
  error: string;
}
```

---

#### `revokeApiKey(id)`

Revoke (delete) an API key.

**Parameters:**
- `id: string` - API key ID

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

#### `validateApiKey(apiKey)`

Validate an API key and get organization info.

**Parameters:**
- `apiKey: string` - API key to validate

**Returns:**
```typescript
{
  success: true;
  organizationId: string;
  permissions: string[];
  apiKeyId: string;
}
// OR
{
  error: string;
}
```

---

### Languages Server Actions

#### `getLanguages()`

Get all available languages.

**Returns:**
```typescript
{
  success: true;
  languages: Array<{
    code: string;
    name: string;
    isActive: boolean;
  }>;
}
// OR
{
  error: string;
}
```

---

#### `getDefaultLanguage()`

Get the organization's default language.

**Returns:**
```typescript
{
  success: true;
  defaultLanguage: string;
}
// OR
{
  error: string;
}
```

---

#### `createLanguage(data)`

Create a new language (Admin only).

**Parameters:**
```typescript
{
  code: string;    // Required, ISO 639-1 code (e.g., "en", "fr")
  name: string;    // Required, display name
}
```

**Returns:**
```typescript
{
  success: true;
  language: Language;
}
// OR
{
  error: string;
}
```

---

#### `updateLanguage(code, data)`

Update a language (Admin only).

**Parameters:**
- `code: string` - Language code
- `data: { name?: string }`

**Returns:**
```typescript
{
  success: true;
  language: Language;
}
// OR
{
  error: string;
}
```

---

#### `toggleLanguage(code)`

Toggle language active status.

**Parameters:**
- `code: string` - Language code

**Returns:**
```typescript
{
  success: true;
  language: Language;
}
// OR
{
  error: string;
}
```

---

### Audit Logs Server Actions

#### `getAuditLogsAction(filters?)`

Get audit logs (Admin/Owner only).

**Parameters:**
```typescript
{
  userId?: string;          // Filter by user
  action?: AuditAction;      // Filter by action type
  resource?: AuditResource;  // Filter by resource type
  startDate?: string;        // ISO date string
  endDate?: string;          // ISO date string
  page?: number;             // Page number (default: 1)
  limit?: number;            // Items per page (default: 50)
}
```

**Returns:**
```typescript
{
  success: true;
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
// OR
{
  error: string;
}
```

---

### DNS Verification Server Actions

#### `verifyDNSAction(emailOrDomain, dkimSelector?)`

Verify DNS records (SPF, DKIM, DMARC) for an email or domain.

**Parameters:**
- `emailOrDomain: string` - Email address or domain name
- `dkimSelector?: string` - DKIM selector (optional)

**Returns:**
```typescript
{
  success: true;
  result: {
    domain: string;
    spf: { valid: boolean; record?: string; error?: string };
    dkim: { valid: boolean; record?: string; error?: string };
    dmarc: { valid: boolean; record?: string; error?: string };
  };
}
// OR
{
  error: string;
}
```

---

#### `checkSPFAction(domain)`

Check SPF record for a domain.

**Parameters:**
- `domain: string` - Domain name

**Returns:**
```typescript
{
  success: true;
  result: {
    valid: boolean;
    record?: string;
    error?: string;
  };
}
// OR
{
  error: string;
}
```

---

#### `checkDKIMAction(domain, selector?)`

Check DKIM record for a domain.

**Parameters:**
- `domain: string` - Domain name
- `selector?: string` - DKIM selector (optional)

**Returns:**
```typescript
{
  success: true;
  result: {
    valid: boolean;
    record?: string;
    error?: string;
  };
}
// OR
{
  error: string;
}
```

---

#### `checkDMARCAction(domain)`

Check DMARC record for a domain.

**Parameters:**
- `domain: string` - Domain name

**Returns:**
```typescript
{
  success: true;
  result: {
    valid: boolean;
    record?: string;
    error?: string;
  };
}
// OR
{
  error: string;
}
```

---

### Notifications Server Actions

#### `getNotifications(limit?)`

Get notifications for the current user.

**Parameters:**
- `limit?: number` - Maximum number of notifications (default: 10)

**Returns:**
```typescript
{
  success: true;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
  }>;
  unreadCount: number;
}
// OR
{
  error: string;
}
```

---

#### `markNotificationAsRead(notificationId)`

Mark a notification as read.

**Parameters:**
- `notificationId: string` - Notification ID

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

#### `markAllNotificationsAsRead()`

Mark all notifications as read.

**Returns:**
```typescript
{
  success: true;
  count: number;
}
// OR
{
  error: string;
}
```

---

#### `createNotification(data)`

Create a notification (internal use).

**Parameters:**
```typescript
{
  userId: string;           // Required
  organizationId?: string;  // Optional
  type: string;             // Required
  title: string;            // Required
  message: string;          // Required
}
```

**Returns:**
```typescript
{
  success: true;
  notification: Notification;
}
// OR
{
  error: string;
}
```

---

### Bounces Server Actions

#### `getBounceRecords(filters?)`

Get bounce records.

**Parameters:**
```typescript
{
  bounceType?: "HARD" | "SOFT";  // Filter by bounce type
  page?: number;                  // Page number (default: 1)
  limit?: number;                 // Items per page (default: 50)
}
```

**Returns:**
```typescript
{
  success: true;
  bounces: Array<{
    id: string;
    emailLogId: string;
    recipientEmail: string;
    bounceType: "HARD" | "SOFT";
    bounceReason: string;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}
// OR
{
  error: string;
}
```

---

### Translations Server Actions

#### `extractTranslatableTextAction(templateId)`

Extract all translatable text from a template.

**Parameters:**
- `templateId: string` - Template ID

**Returns:**
```typescript
{
  success: true;
  items: Array<{
    blockId: string;
    translationKey: string;
    blockType: string;
    originalText: string;
    context: string;
  }>;
}
// OR
{
  error: string;
}
```

---

#### `getTranslations(templateId, languageCode)`

Get translations for a template in a specific language.

**Parameters:**
- `templateId: string` - Template ID
- `languageCode: string` - Language code

**Returns:**
```typescript
{
  success: true;
  translations: Record<string, string>; // Key-value pairs of translationKey -> translated text
}
// OR
{
  error: string;
}
```

---

#### `saveTranslations(templateId, languageCode, translations)`

Save translations for a template.

**Parameters:**
- `templateId: string` - Template ID
- `languageCode: string` - Language code
- `translations: Record<string, string>` - Key-value pairs of translations

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

### Custom Variables Server Actions

#### `getCustomVariables()`

Get all custom variables for the organization.

**Returns:**
```typescript
{
  success: true;
  variables: Array<{
    id: string;
    name: string;
    key: string;
    defaultValue: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
// OR
{
  error: string;
}
```

---

#### `createCustomVariable(data)`

Create a custom variable.

**Parameters:**
```typescript
{
  name: string;              // Required
  key: string;               // Required, unique identifier
  defaultValue?: string;    // Optional
  description?: string;       // Optional
}
```

**Returns:**
```typescript
{
  success: true;
  variable: CustomVariable;
}
// OR
{
  error: string;
}
```

---

#### `updateCustomVariable(id, data)`

Update a custom variable.

**Parameters:**
- `id: string` - Variable ID
- `data: { name?: string; defaultValue?: string; description?: string }`

**Returns:**
```typescript
{
  success: true;
  variable: CustomVariable;
}
// OR
{
  error: string;
}
```

---

#### `deleteCustomVariable(id)`

Delete a custom variable.

**Parameters:**
- `id: string` - Variable ID

**Returns:**
```typescript
{
  success: true;
}
// OR
{
  error: string;
}
```

---

## API Key Authentication

### Creating API Keys

API keys can be created via the web interface: Settings → Integrations → API Keys

**Required Permissions:**

- `api_keys.create` - Create API keys (Owner, Admin)
- `api_keys.view` - View API keys (Owner, Admin, Editor, Viewer)
- `api_keys.edit` - Edit API keys (Owner, Admin)
- `api_keys.delete` - Delete API keys (Owner, Admin)

### Using API Keys

API keys can be used to authenticate server actions programmatically. When calling server actions from external systems, you can validate the API key first:

```typescript
import { validateApiKey } from '@/app/actions/api-keys';

const result = await validateApiKey('mc_your-api-key-here');

if (result.success) {
  const { organizationId, permissions } = result;
  // Use organizationId and permissions
  // All subsequent server actions will be scoped to this organization
}
```

### API Key Format

- **Prefix:** `mc_`
- **Length:** 32 characters after prefix
- **Example:** `mc_abcdefghijklmnopqrstuvwxyz123456`

### API Key Properties

- **Name:** Human-readable identifier
- **Permissions:** Array of permission strings
- **Expires At:** Optional expiration date
- **Last Used:** Timestamp of last use
- **Created At:** Creation timestamp

### Security Best Practices

1. **Never commit API keys to version control**
2. **Store API keys in environment variables**
3. **Rotate API keys regularly**
4. **Use different keys for different environments**
5. **Set expiration dates for temporary access**
6. **Monitor API key usage via audit logs**

---

## Variable Replacement

### Variable Syntax

Variables use double curly braces: `{{variable.path}}`

**Examples:**

- `{{user.name}}` - User's full name
- `{{user.email}}` - User's email address
- `{{user.firstName}}` - User's first name
- `{{order.total}}` - Order total amount
- `{{custom.discountCode}}` - Custom variable

### Nested Variables

Access nested object properties using dot notation:

```html
<p>Hello {{user.profile.firstName}}</p>
<p>Your order {{order.id}} total is ${{order.items.0.price}}</p>
```

### Default Values

Provide default values using pipe syntax:

```html
<p>Hello {{user.name|Guest}}</p>
<p>Discount: {{order.discount|0}}%</p>
```

### Conditional Rendering

Use `#if` for conditionals:

```html
{{#if user.isPremium}}
  <p>Welcome Premium Member!</p>
{{/if}}
```

### Loops

Use `#each` for arrays:

```html
{{#each order.items}}
  <p>{{name}} - ${{price}}</p>
{{/each}}
```

### Using Variables in API Calls

When sending template-based emails, pass variables in the request:

```json
{
  "templateId": "template-id-123",
  "subject": "Welcome {{user.name}}",
  "recipients": ["user@example.com"],
  "variables": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "order": {
      "id": "ORD-123",
      "total": 99.99,
      "items": [
        { "name": "Product 1", "price": 49.99 },
        { "name": "Product 2", "price": 50.00 }
      ]
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid input or missing required fields |
| `401` | Unauthorized | Authentication required or invalid |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `500` | Internal Server Error | Server error |

### Common Error Messages

- `"Unauthorized"` - User not authenticated
- `"User is not part of an organization"` - User organization not found
- `"No active SMTP profile found"` - SMTP configuration required
- `"Template not found or access denied"` - Template doesn't exist or user lacks access
- `"Invalid email addresses"` - One or more email addresses are invalid
- `"Insufficient permissions"` - User lacks required permissions
- `"Invalid API key format"` - API key format is incorrect
- `"API key has expired"` - API key expiration date has passed
- `"Permission denied"` - User role doesn't have required permission

### Error Handling Example

```typescript
try {
  const result = await createTemplate({
    name: "Welcome Email",
    defaultLanguage: "en"
  });

  if (result.error) {
    console.error("Error:", result.error);
    // Handle error
    return;
  }

  console.log("Template created:", result.template.id);
} catch (error) {
  console.error("Unexpected error:", error);
}
```

---

## Rate Limiting

Currently, rate limiting is not implemented at the API level. However, SMTP profiles have hourly rate limits that are enforced during email sending.

### SMTP Profile Rate Limits

Each SMTP profile can have a `maxHourlyRate` setting that limits the number of emails sent per hour.

**Recommendations:**

- Implement per-user rate limits
- Implement per-organization rate limits
- Respect SMTP profile hourly rate limits
- Consider implementing API-level rate limiting for external API access

---

## Best Practices

### 1. Use Template-Based Emails

Prefer template-based emails over raw HTML:

```json
{
  "templateId": "template-id",
  "variables": { "user": { "name": "John" } }
}
```

Instead of:

```json
{
  "html": "<html>...</html>"
}
```

### 2. Use Queue for Bulk Emails

For sending to multiple recipients, use the queue system:

```json
{
  "templateId": "template-id",
  "recipients": ["user1@example.com", "user2@example.com"],
  "useQueue": true
}
```

### 3. Handle Errors Gracefully

Always check for errors in responses:

```typescript
const result = await createTemplate({
  name: "Welcome Email",
  defaultLanguage: "en"
});

if (result.error) {
  console.error('Error:', result.error);
  // Handle error appropriately
  return;
}

// Use result.template
```

### 4. Validate Email Addresses

Validate email addresses before sending:

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  // Invalid email
  return { error: "Invalid email address" };
}
```

### 5. Use Appropriate Authentication

- Use session-based authentication for web UI
- Use API keys for programmatic access
- Store API keys securely (never commit to version control)

### 6. Monitor Email Logs

Check email logs regularly to monitor delivery status:

```typescript
const logs = await getEmailLogsAction({
  status: 'FAILED',
  startDate: '2024-01-01'
});

if (logs.success) {
  console.log('Failed emails:', logs.logs);
}
```

### 7. Use Language Codes

Always specify language codes when working with multi-language templates:

```typescript
const result = await saveTemplate(templateId, structure, "en");
```

### 8. Batch Operations

For bulk operations, use batch endpoints when available:

```typescript
// Good: Use queueBulkEmails for multiple recipients
await queueBulkEmails({
  templateId: "template-id",
  recipients: [
    { email: "user1@example.com", variables: { name: "User 1" } },
    { email: "user2@example.com", variables: { name: "User 2" } }
  ]
});

// Avoid: Looping over queueEmail
for (const recipient of recipients) {
  await queueEmail({ /* ... */ }); // Less efficient
}
```

---

## Examples

### Complete Example: Send Welcome Email

```typescript
// 1. Create template (via UI or API)
const template = await createTemplate({
  name: "Welcome Email",
  defaultLanguage: "en",
  structure: {
    backdropColor: "#F8F8F8",
    canvasColor: "#FFFFFF",
    textColor: "#242424",
    fontFamily: "MODERN_SANS",
    childrenIds: ["block-1"],
    "block-1": {
      type: "Text",
      data: {
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
        props: { text: "Welcome {{user.name}}!" }
      }
    }
  }
});

if (!template.success) {
  console.error("Failed to create template:", template.error);
  return;
}

// 2. Send email to new user
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `next-auth.session-token=${sessionToken}`
  },
  body: JSON.stringify({
    templateId: template.template.id,
    subject: "Welcome {{user.name}}!",
    recipients: ["newuser@example.com"],
    variables: {
      user: {
        name: "John Doe",
        email: "newuser@example.com",
        firstName: "John"
      }
    },
    languageCode: "en"
  })
});

const result = await response.json();
if (result.success) {
  console.log('Emails queued:', result.queued);
} else {
  console.error('Error:', result.error);
}
```

---

### Example: Track Campaign Performance

```typescript
import { getCampaignStatsAction } from '@/app/actions/analytics';

const stats = await getCampaignStatsAction('campaign-id-123');

if (stats.success) {
  console.log('Sent:', stats.stats.sent);
  console.log('Delivered:', stats.stats.delivered);
  console.log('Opened:', stats.stats.opened);
  console.log('Clicked:', stats.stats.clicked);
  console.log('Bounced:', stats.stats.bounced);
  console.log('Open Rate:', (stats.stats.openRate * 100).toFixed(2) + '%');
  console.log('Click Rate:', (stats.stats.clickRate * 100).toFixed(2) + '%');
} else {
  console.error('Error:', stats.error);
}
```

---

### Example: Use API Key Authentication

```typescript
import { validateApiKey, getTemplates } from '@/app/actions/api-keys';

// Validate API key
const validation = await validateApiKey('mc_your-api-key-here');

if (validation.success) {
  const { organizationId, permissions } = validation;
  console.log('Organization ID:', organizationId);
  console.log('Permissions:', permissions);

  // Use server actions with validated organization
  const templates = await getTemplates({ limit: 10 });
  if (templates.success) {
    console.log('Templates:', templates.templates);
  }
} else {
  console.error('Invalid API key:', validation.error);
}
```

---

### Example: Create and Send Campaign

```typescript
import { createCampaign, addCampaignRecipients, sendCampaignAction } from '@/app/actions/campaigns';

// 1. Create campaign
const campaign = await createCampaign({
  name: "Product Launch",
  templateId: "template-id-123",
  subject: "Check out our new product!",
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
});

if (!campaign.success) {
  console.error('Failed to create campaign:', campaign.error);
  return;
}

// 2. Add recipients
const recipients = await addCampaignRecipients(campaign.campaign.id, [
  { email: "user1@example.com", variables: { name: "User 1" } },
  { email: "user2@example.com", variables: { name: "User 2" } }
]);

if (!recipients.success) {
  console.error('Failed to add recipients:', recipients.error);
  return;
}

console.log(`Added ${recipients.added} recipients`);

// 3. Send campaign (or it will send at scheduled time)
const sendResult = await sendCampaignAction(campaign.campaign.id);
if (sendResult.success) {
  console.log('Campaign sent successfully');
} else {
  console.error('Failed to send campaign:', sendResult.error);
}
```

---

### Example: Multi-Language Template

```typescript
import { createTemplate, saveTemplate, getTemplateById } from '@/app/actions/templates';

// 1. Create template with default language (English)
const template = await createTemplate({
  name: "Welcome Email",
  defaultLanguage: "en",
  structure: {
    backdropColor: "#F8F8F8",
    canvasColor: "#FFFFFF",
    textColor: "#242424",
    fontFamily: "MODERN_SANS",
    childrenIds: ["block-1"],
    "block-1": {
      type: "Text",
      data: {
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
        props: { text: "Welcome {{user.name}}!" }
      }
    }
  }
});

if (!template.success) {
  console.error('Error:', template.error);
  return;
}

// 2. Save French translation
const frenchStructure = {
  ...template.template.structure,
  "block-1": {
    ...template.template.structure["block-1"],
    data: {
      ...template.template.structure["block-1"].data,
      props: {
        text: "Bienvenue {{user.name}}!"
      }
    }
  }
};

const frenchResult = await saveTemplate(
  template.template.id,
  frenchStructure,
  "fr"
);

if (frenchResult.success) {
  console.log('French translation saved');
}

// 3. Get template with all languages
const fullTemplate = await getTemplateById(template.template.id);
if (fullTemplate.success) {
  console.log('Template structure:', fullTemplate.template.structure);
}
```

---

### Example: Monitor Email Queue

```typescript
import { getQueueStatistics, getEmailJobStatus } from '@/app/actions/email-queue';

// Get queue statistics
const stats = await getQueueStatistics();
if (stats.success) {
  console.log('Immediate queue:', stats.statistics.immediate);
  console.log('Scheduled queue:', stats.statistics.scheduled);
  console.log('Bulk queue:', stats.statistics.bulk);
}

// Check specific job status
const jobStatus = await getEmailJobStatus('job-id-123', 'bulk');
if (jobStatus.success && jobStatus.job) {
  console.log('Job state:', jobStatus.job.state);
  console.log('Job progress:', jobStatus.job.progress);
}
```

---

## Support

For API support and questions:

- **Documentation:** See `/docs` folder
- **Issues:** Report via GitHub Issues
- **Email:** support@mailcrafter.com (if configured)

---

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- Template-based email sending
- Click and open tracking
- One-click unsubscribe
- API key authentication
- Server actions for all major operations
- Multi-language template support
- Email queue system
- Comprehensive analytics

---

**Last Updated:** 2024-12-19
