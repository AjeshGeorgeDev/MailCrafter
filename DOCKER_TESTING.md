# Docker Build and Testing Guide

Complete guide for building and testing MailCrafter with Docker.

## Quick Start

### Option 1: Use the Build Script (Recommended)

```bash
# Make script executable (if not already)
chmod +x docker-build.sh

# Run the build script
./docker-build.sh
```

The script will:
1. Check/create `.env` file
2. Build Docker images
3. Start all services
4. Wait for services to be healthy
5. Run database migrations
6. Display service information

### Option 2: Manual Steps

#### 1. Prepare Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your values (important!)
# At minimum, change:
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - ENCRYPTION_KEY (generate with: openssl rand -base64 32)
# - POSTGRES_PASSWORD (use a strong password)
```

#### 2. Build Docker Images

```bash
# Build all images
docker-compose build

# Or build specific service
docker-compose build app
docker-compose build worker
```

#### 3. Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Or start with logs visible
docker-compose up
```

#### 4. Check Service Status

```bash
# View service status
docker-compose ps

# Check service health
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

#### 5. Run Database Migrations

```bash
# Wait a few seconds for database to be ready
sleep 10

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

#### 6. Verify Services

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U admin

# Check Redis
docker-compose exec redis redis-cli ping

# Check Application Health
curl http://localhost:3000/api/health
```

## Testing the Application

### 1. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### 2. First-Time Setup

On first visit, you should be redirected to the setup page:
```
http://localhost:3000/setup
```

Fill in the form:
- **Name**: Your full name
- **Email**: Your email address (this will be your super admin)
- **Password**: Strong password (min 8 chars, uppercase, lowercase, number, special char)
- **Confirm Password**: Same password
- **Organization Name**: Your organization name

Click "Complete Setup"

### 3. Login

After setup, you'll be redirected to:
```
http://localhost:3000/login
```

Login with the credentials you just created.

### 4. Verify Dashboard

You should see:
- Dashboard home page
- Navigation menu
- Access to all features

## Monitoring and Debugging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f worker
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 app
```

### Check Resource Usage

```bash
# View resource usage
docker stats

# View specific container
docker stats mailcrafter-app
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U admin -d emailbuilder

# Run Prisma Studio (Database GUI)
docker-compose exec app npx prisma studio
# Then open http://localhost:5555 in your browser
```

### Redis Access

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Test Redis connection
docker-compose exec redis redis-cli ping
```

## Common Issues and Solutions

### Issue: Services won't start

**Solution:**
```bash
# Check logs
docker-compose logs

# Check if ports are already in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :5433
netstat -tulpn | grep :6379

# Stop conflicting services or change ports in .env
```

### Issue: Database connection errors

**Solution:**
```bash
# Check if database is ready
docker-compose exec postgres pg_isready -U admin

# Wait longer for database to initialize
sleep 20

# Check database logs
docker-compose logs postgres

# Verify DATABASE_URL in .env matches docker-compose.yml
```

### Issue: Migration fails

**Solution:**
```bash
# Check if database is accessible
docker-compose exec app npx prisma db pull

# Reset database (⚠️ WARNING: Deletes all data)
docker-compose exec app npx prisma migrate reset

# Or manually run migrations
docker-compose exec app npx prisma migrate deploy
```

### Issue: Application not responding

**Solution:**
```bash
# Check application logs
docker-compose logs app

# Restart application
docker-compose restart app

# Rebuild if needed
docker-compose up -d --build app
```

### Issue: Worker not processing jobs

**Solution:**
```bash
# Check worker logs
docker-compose logs worker

# Verify Redis connection
docker-compose exec worker redis-cli -h redis ping

# Restart worker
docker-compose restart worker
```

## Testing Checklist

- [ ] All services start successfully
- [ ] Database is accessible
- [ ] Redis is accessible
- [ ] Application health endpoint responds
- [ ] Setup page loads correctly
- [ ] Can create super admin account
- [ ] Can login with created account
- [ ] Dashboard loads after login
- [ ] Database migrations completed
- [ ] No errors in logs

## Cleanup

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ Deletes all data)
docker-compose down -v
```

### Remove Images

```bash
# Remove all images
docker-compose down --rmi all

# Remove specific image
docker rmi mailcrafter-app
```

### Complete Cleanup

```bash
# Stop, remove containers, volumes, and images
docker-compose down -v --rmi all

# Remove unused Docker resources
docker system prune -a
```

## Production Testing

For production-like testing:

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Note: Production config removes port mappings for security
# You'll need a reverse proxy to access the application
```

## Performance Testing

```bash
# Monitor resource usage
docker stats

# Check service response times
time curl http://localhost:3000/api/health

# Load test (requires Apache Bench or similar)
ab -n 1000 -c 10 http://localhost:3000/api/health
```

## Next Steps

After successful build and testing:

1. **Configure SMTP** - Set up email sending in the application
2. **Add Users** - Create additional users through the dashboard
3. **Create Templates** - Start building email templates
4. **Set up Campaigns** - Create your first email campaign
5. **Configure Segments** - Set up contact segmentation

## Support

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify environment variables: `docker-compose config`
3. Check service health: `docker-compose ps`
4. Review documentation in `/docs`
5. Check GitHub issues

