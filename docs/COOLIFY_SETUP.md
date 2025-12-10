# Coolify Deployment Guide

Complete guide for deploying MailCrafter on Coolify with health check configuration.

## Prerequisites

- Coolify instance running
- Git repository with MailCrafter code
- Database service (PostgreSQL) available in Coolify

## Step-by-Step Deployment

### 1. Create a New Application in Coolify

1. Log in to your Coolify dashboard
2. Navigate to your project/server
3. Click **"New Resource"** or **"Add Application"**
4. Select **"Docker Compose"** or **"Dockerfile"** deployment type

### 2. Configure Your Application

#### Source Configuration
- **Repository URL**: Your Git repository URL
- **Branch**: `main` (or your production branch)
- **Build Pack**: Docker or Docker Compose

#### Environment Variables
Add the following environment variables in Coolify:

```
DATABASE_URL=postgresql://user:password@postgres:5432/mailcrafter
NEXTAUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_URL=https://your-domain.com
ENCRYPTION_KEY=your-32-character-encryption-key-here
REDIS_URL=redis://redis:6379
NODE_ENV=production
```

**Important**: Generate secure secrets:
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32
```

### 3. Configure Health Check in Coolify

This is the **critical step** to resolve the "No health check configured" warning:

1. In your application settings, scroll down to the **"Health Check"** section
2. Enable the health check toggle (if available)
3. Configure the following settings:

   **Health Check Path**: `/api/health`
   
   **Health Check Port**: `3000` (or your application port)
   
   **Health Check Interval**: `30` seconds
   
   **Health Check Timeout**: `10` seconds
   
   **Health Check Retries**: `3`
   
   **Start Period**: `40` seconds (gives the app time to start)

4. **Save** the configuration

### 4. Alternative: Health Check via Dockerfile

If Coolify doesn't have a dedicated health check UI section, you can configure it in your `Dockerfile`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### 5. Deploy the Application

1. Click **"Deploy"** or **"Save & Deploy"**
2. Monitor the deployment logs
3. Wait for the health check to pass

### 6. Verify Health Check

#### Check in Coolify Dashboard
- Look for a green health status indicator
- The "No health check configured" warning should disappear

#### Test Manually
```bash
# Test the health check endpoint
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": true
  }
}
```

## Health Check Endpoint Details

The health check endpoint is available at: **`/api/health`**

### Response Codes
- **200 OK**: Application and database are healthy
- **503 Service Unavailable**: Application or database has issues

### Response Format

**Healthy Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": true
  }
}
```

**Unhealthy Response:**
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": false
  }
}
```

## Troubleshooting

### Health Check Failing

1. **Check Application Logs**:
   - In Coolify, go to your application
   - Click on "Logs" tab
   - Look for errors related to database connection

2. **Verify Database Connection**:
   - Ensure `DATABASE_URL` is correctly set
   - Verify database service is running
   - Check network connectivity between services

3. **Test Health Check Manually**:
   ```bash
   curl -v https://your-domain.com/api/health
   ```

4. **Check Application Status**:
   - Verify the application is running
   - Check if port 3000 is accessible
   - Ensure environment variables are set correctly

### Health Check Not Detected

If Coolify still shows "No health check configured":

1. **Check Dockerfile**: Ensure `HEALTHCHECK` instruction is present
2. **Verify Path**: Confirm `/api/health` is accessible
3. **Check Port**: Ensure health check is configured for the correct port
4. **Restart Application**: Sometimes a restart helps Coolify detect the health check

### Database Connection Issues

If the health check shows `"database": false`:

1. Verify `DATABASE_URL` format:
   ```
   postgresql://username:password@host:port/database
   ```

2. Check database service:
   - Ensure PostgreSQL is running
   - Verify credentials are correct
   - Check network connectivity

3. Run database migrations:
   ```bash
   # In Coolify terminal or via SSH
   npx prisma migrate deploy
   ```

## Advanced Configuration

### Custom Health Check Interval

For faster detection of issues, you can reduce the interval:
- **Interval**: 15 seconds (faster detection, more requests)
- **Timeout**: 5 seconds
- **Retries**: 3

### Health Check with Authentication

If you need to protect the health check endpoint (not recommended for Coolify), you can add authentication, but this may prevent Coolify from accessing it.

## Best Practices

1. **Keep Health Check Simple**: Don't add heavy operations to the health check
2. **Monitor Health Status**: Set up alerts if health check fails
3. **Test Regularly**: Periodically test the health check endpoint
4. **Document Changes**: Update health check configuration if you change endpoints

## Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Docker Health Check Documentation](https://docs.docker.com/engine/reference/builder/#healthcheck)
- MailCrafter Deployment Guide: See `DEPLOYMENT.md`
