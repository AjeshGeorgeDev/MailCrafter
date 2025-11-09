# MailCrafter API Documentation

## Email Sending APIs

### 1. Send Email to Multiple Recipients

**Endpoint:** `POST /api/email/send`

**Authentication:** Required (Session-based)

**Description:** Sends HTML email to multiple recipients using the organization's default SMTP profile.

**Request Payload:**
```json
{
  "html": "<html><body><h1>Hello {{user.name}}</h1><p>Your email is {{user.email}}</p></body></html>",
  "subject": "Welcome to MailCrafter",
  "recipients": [
    "user1@example.com",
    "user2@example.com"
  ],
  "fromEmail": "sender@example.com",  // Optional - uses SMTP profile default if not provided
  "fromName": "MailCrafter Team",      // Optional
  "templateId": "template-id-123"     // Optional - for tracking/logging
}
```

**Required Fields:**
- `html` (string): HTML content of the email
- `subject` (string): Email subject line
- `recipients` (array of strings): List of recipient email addresses

**Optional Fields:**
- `fromEmail` (string): Sender email address (defaults to SMTP profile's fromEmail)
- `fromName` (string): Sender display name
- `templateId` (string): Template ID for tracking in email logs

**Response:**
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
  "errors": []  // Only present if there are failures
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid email addresses
- `401 Unauthorized`: User not authenticated
- `400 Bad Request`: No active SMTP profile found
- `500 Internal Server Error`: Server error

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "html": "<h1>Hello {{user.name}}</h1>",
    "subject": "Test Email",
    "recipients": ["user@example.com"]
  }'
```

---

### 2. Send Test/Preview Email

**Endpoint:** `POST /api/email/preview`

**Authentication:** Required (Session-based)

**Description:** Sends a test email to a single recipient. The subject will be prefixed with "[TEST]".

**Request Payload:**
```json
{
  "html": "<html><body><h1>Hello {{user.name}}</h1></body></html>",
  "subject": "Welcome Email",
  "recipientEmail": "test@example.com",
  "fromEmail": "sender@example.com",  // Optional
  "fromName": "MailCrafter Team",      // Optional
  "templateId": "template-id-123"     // Optional
}
```

**Required Fields:**
- `html` (string): HTML content of the email
- `subject` (string): Email subject line (will be prefixed with "[TEST]")
- `recipientEmail` (string): Single recipient email address

**Optional Fields:**
- `fromEmail` (string): Sender email address
- `fromName` (string): Sender display name
- `templateId` (string): Template ID for tracking

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
curl -X POST http://localhost:3000/api/email/preview \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "html": "<h1>Test Email</h1>",
    "subject": "Test",
    "recipientEmail": "test@example.com"
  }'
```

---

## Template APIs

### 3. Get Template

**Endpoint:** `GET /api/templates/[id]`

**Authentication:** Required

**Response:** Returns template structure (EmailBuilderDocument format)

### 4. Save Template

**Endpoint:** `POST /api/templates/[id]/save`

**Authentication:** Required

**Request Payload:**
```json
{
  "structure": {
    // EmailBuilderDocument structure
  }
}
```

### 5. Upload Image

**Endpoint:** `POST /api/templates/[id]/upload-image`

**Authentication:** Required

**Request:** Multipart form data with `file` field

**Response:**
```json
{
  "url": "/uploads/images/filename.jpg"
}
```

---

## Variable Replacement

### Current Implementation

The current API endpoints accept HTML directly. To use variables:

1. **Render template with variables** before sending:
   - Use `renderEmailTemplate()` from `lib/email/template-renderer.ts`
   - Pass sample data object with variable values

2. **Example with variables:**
```javascript
import { renderEmailTemplate } from '@/lib/email/template-renderer';

// Get template document
const template = await getTemplate(templateId);

// Prepare variable data
const variableData = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe"
  }
};

// Render template with variables
const { html } = await renderEmailTemplate(template.structure, {
  sampleData: variableData,
  replaceVariables: true
});

// Send email
await fetch('/api/email/send', {
  method: 'POST',
  body: JSON.stringify({
    html: html,
    subject: "Welcome {{user.name}}",
    recipients: [variableData.user.email]
  })
});
```

### Variable Syntax

Variables use double curly braces: `{{variable.path}}`

**Examples:**
- `{{user.name}}` - User's full name
- `{{user.email}}` - User's email
- `{{user.firstName}}` - User's first name
- `{{custom.discountCode}}` - Custom variable

**Conditionals:**
```
{{#if user.isPremium}}
  <p>Welcome Premium Member!</p>
{{/if}}
```

**Loops:**
```
{{#each order.items}}
  <p>{{name}} - ${{price}}</p>
{{/each}}
```

---

## Enhanced API (Recommended Implementation)

For a more complete API, consider adding an endpoint that accepts template ID and variables:

**Proposed Endpoint:** `POST /api/email/send-with-template`

```json
{
  "templateId": "template-id-123",
  "subject": "Welcome {{user.name}}",
  "recipients": [
    {
      "email": "user1@example.com",
      "variables": {
        "user": {
          "name": "John Doe",
          "email": "user1@example.com"
        }
      }
    }
  ],
  "fromEmail": "sender@example.com",
  "fromName": "MailCrafter"
}
```

This would:
1. Load the template
2. Render HTML for each recipient with their specific variables
3. Send personalized emails

---

## Authentication

All API endpoints require authentication via NextAuth session cookies. Make sure to include the session cookie in your requests.

**For external API access**, consider implementing API keys:
- Create API keys via `/api/api-keys` (if implemented)
- Include `Authorization: Bearer <api-key>` header

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding:
- Per-user rate limits
- Per-organization rate limits
- SMTP profile hourly rate limits

---

## Error Handling

All endpoints return standard HTTP status codes:
- `200 OK`: Success
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "error": "Error message description"
}
```

