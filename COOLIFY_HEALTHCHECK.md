# Quick Guide: Setting Up Health Check in Coolify

## Quick Steps

1. **Deploy your application** in Coolify (if not already deployed)

2. **Configure Health Check in Coolify UI**:
   - Go to your application → **Settings** → **Health Check** section
   - **Health Check Path**: `/api/health`
   - **Port**: `3000`
   - **Interval**: `30` seconds
   - **Timeout**: `10` seconds
   - **Retries**: `3`
   - **Start Period**: `40` seconds
   - Click **Save**

3. **Verify**:
   - The "No health check configured" warning should disappear
   - Health status should show as green/healthy

## Alternative: If Health Check UI is Not Available

The Dockerfile already includes a `HEALTHCHECK` instruction, so Docker will automatically perform health checks. Coolify should detect this automatically.

## Test Your Health Check

```bash
# Test locally (if running locally)
curl http://localhost:3000/api/health

# Test in production
curl https://your-domain.com/api/health
```

**Expected Response** (HTTP 200):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": true
  }
}
```

## Troubleshooting

- **Health check still not detected?** Restart the application in Coolify
- **Health check failing?** Check application logs and verify database connection
- **Need more details?** See `docs/COOLIFY_SETUP.md` for complete guide
