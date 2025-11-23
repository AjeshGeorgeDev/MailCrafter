# MailCrafter Deployment Guide

Complete guide for deploying MailCrafter using Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- At least 10GB disk space

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MailCrafter
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```env
# Database Configuration
POSTGRES_DB=mailcrafter
POSTGRES_USER=mailcrafter_user
POSTGRES_PASSWORD=your-secure-password-here

# NextAuth Configuration
NEXTAUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_URL=https://your-domain.com

# Encryption Key (32 characters minimum)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Redis Password (for production)
REDIS_PASSWORD=your-redis-password-here

# Application Port
APP_PORT=3000
```

**Important:** Generate secure secrets:
- `NEXTAUTH_SECRET`: Run `openssl rand -base64 32`
- `ENCRYPTION_KEY`: Run `openssl rand -base64 32`
- Use strong passwords for database and Redis

### 3. Build and Start Services

For development:
```bash
docker-compose up -d
```

For production:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Run Database Migrations

```bash
docker-compose exec app npx prisma migrate deploy
```

Or for production:
```bash
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

### 5. Seed Database (Optional)

```bash
docker-compose exec app npx prisma db seed
```

### 6. Access the Application

- Application: http://localhost:3000
- Default credentials: `admin@mailcrafter.com` / `Admin123!@#`

## Services

The Docker Compose setup includes:

1. **postgres** - PostgreSQL 15 database
2. **redis** - Redis 7 for caching and queues
3. **app** - Next.js application server
4. **worker** - Background email processing worker

## Health Checks

All services include health checks. Check service status:

```bash
docker-compose ps
```

## Logs

View logs for all services:
```bash
docker-compose logs -f
```

View logs for a specific service:
```bash
docker-compose logs -f app
docker-compose logs -f worker
```

## Database Management

### Access PostgreSQL

```bash
docker-compose exec postgres psql -U admin -d emailbuilder
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U admin emailbuilder > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U admin emailbuilder < backup.sql
```

### Run Prisma Studio

```bash
docker-compose exec app npx prisma studio
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes Data)

```bash
docker-compose down -v
```

## Production Considerations

### 1. Use Production Compose File

Always use `docker-compose.prod.yml` in production:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Security

- Change all default passwords
- Use strong secrets (32+ characters)
- Remove port mappings for database and Redis in production
- Use reverse proxy (nginx/traefik) for HTTPS
- Set up firewall rules
- Regularly update images: `docker-compose pull`

### 3. Reverse Proxy Setup (Nginx Example)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. SSL/TLS

Use Let's Encrypt with Certbot:

```bash
sudo certbot --nginx -d your-domain.com
```

### 5. Monitoring

- Set up log aggregation (ELK, Loki, etc.)
- Monitor resource usage: `docker stats`
- Set up alerts for service failures
- Monitor database size and performance

### 6. Backups

Set up automated backups:

```bash
# Add to crontab
0 2 * * * docker-compose exec postgres pg_dump -U admin emailbuilder | gzip > /backups/mailcrafter-$(date +\%Y\%m\%d).sql.gz
```

### 7. Scaling

To scale the worker:

```bash
docker-compose up -d --scale worker=3
```

## Troubleshooting

### Services Won't Start

1. Check logs: `docker-compose logs`
2. Verify environment variables: `docker-compose config`
3. Check port conflicts: `netstat -tulpn | grep :3000`
4. Ensure Docker has enough resources

### Database Connection Issues

1. Verify database is healthy: `docker-compose ps postgres`
2. Check DATABASE_URL format
3. Verify network connectivity: `docker-compose exec app ping postgres`

### Worker Not Processing Jobs

1. Check worker logs: `docker-compose logs worker`
2. Verify Redis connection: `docker-compose exec worker redis-cli -h redis ping`
3. Check queue status in application

### Application Errors

1. Check application logs: `docker-compose logs app`
2. Verify all environment variables are set
3. Check database migrations: `docker-compose exec app npx prisma migrate status`
4. Restart services: `docker-compose restart`

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `POSTGRES_DB` | Yes | Database name | `emailbuilder` |
| `POSTGRES_USER` | Yes | Database user | `admin` |
| `POSTGRES_PASSWORD` | Yes | Database password | `password` |
| `POSTGRES_PORT` | No | External DB port | `5433` |
| `REDIS_PORT` | No | External Redis port | `6379` |
| `REDIS_PASSWORD` | Production | Redis password | - |
| `APP_PORT` | No | Application port | `3000` |
| `DATABASE_URL` | Yes | Full DB connection string | Auto-generated |
| `NEXTAUTH_SECRET` | Yes | NextAuth secret (32+ chars) | - |
| `NEXTAUTH_URL` | Yes | Application URL | `http://localhost:3000` |
| `REDIS_URL` | Yes | Redis connection string | Auto-generated |
| `ENCRYPTION_KEY` | Yes | Encryption key (32+ chars) | - |
| `NODE_ENV` | No | Node environment | `production` |

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review documentation in `/docs`
- Check GitHub issues

