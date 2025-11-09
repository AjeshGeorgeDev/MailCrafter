# MailCrafter - Email Template Builder

Professional email template builder and campaign management platform built with Next.js, TypeScript, and Prisma.

## Phase 01 - Setup Complete ✅

This project has completed Phase 01 setup with the following features:

### ✅ Completed Features

1. **Project Setup**
   - Next.js 16 with App Router
   - TypeScript configuration
   - Tailwind CSS with shadcn/ui components
   - ESLint and Prettier configured

2. **Database Schema**
   - Complete Prisma schema with all models
   - PostgreSQL database support
   - All relationships and indexes configured

3. **Authentication**
   - NextAuth.js integration
   - User registration and login
   - Password hashing with bcrypt
   - Protected routes with middleware
   - Session management

4. **Database Utilities**
   - Prisma client singleton
   - User management functions
   - Organization management functions
   - Template management functions
   - Query helpers and utilities

### 📦 Dependencies

- Next.js 16
- React 19
- TypeScript
- Prisma
- NextAuth.js
- Tailwind CSS
- shadcn/ui components
- Zod for validation
- bcrypt for password hashing
- And more...

### 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. **Start Docker services:**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

7. **Access the application:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with: `admin@mailcrafter.com` / `Admin123!@#`

### 📁 Project Structure

```
/app
  /(auth)          # Authentication pages
  /(dashboard)     # Protected dashboard pages
  /api             # API routes
/components        # React components
  /ui              # shadcn/ui components
/lib
  /db              # Database utilities
  /auth            # Authentication utilities
/prisma            # Database schema and migrations
/public            # Static assets
```

### 🔐 Default Credentials

- **Email:** admin@mailcrafter.com
- **Password:** Admin123!@#

### 🎯 Next Steps

After completing Phase 01, proceed to:
- **Phase 02:** Email Template Builder Integration
- **Phase 03:** Multi-Language System
- **Phase 04:** SMTP Management

See `.cursor/phases_index.txt` for the complete development roadmap.

### 📝 Development Notes

- All passwords are hashed with bcrypt (12 rounds)
- Session management uses JWT strategy
- Database uses PostgreSQL (via Docker)
- Redis is available for queue management (future phases)

### 🛠️ Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma db seed` - Seed database

### ⚠️ Important

- Never commit `.env` file
- Always hash passwords before storing
- Use server actions for mutations
- Follow TypeScript strict mode
- Test thoroughly before proceeding to next phase

