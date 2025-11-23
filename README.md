# MailCrafter 📧

> Professional email template builder and campaign management platform built with Next.js, TypeScript, and Prisma.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

MailCrafter is a comprehensive email marketing platform that enables you to create beautiful email templates, manage campaigns, track analytics, and automate your email workflows. Built with modern web technologies, it provides a powerful yet intuitive interface for both technical and non-technical users.

## ✨ Features

### 🎨 Email Template Builder
- **Drag & Drop Editor** - Intuitive visual editor with no coding required
- **Custom HTML/CSS** - Advanced customization for power users
- **Template Library** - Pre-built templates and reusable snippets
- **Multi-Language Support** - Translate templates into multiple languages
- **Version Control** - Track template versions and rollback changes
- **Responsive Design** - Mobile-friendly templates out of the box

### 📊 Campaign Management
- **Campaign Creation** - Create and manage email campaigns with ease
- **Scheduling** - Schedule campaigns for optimal delivery times
- **A/B Testing** - Test different variants to optimize performance
- **Drip Campaigns** - Automated email sequences with delays and conditions
- **Contact Segmentation** - Target specific audiences with advanced segmentation
- **CSV Import** - Bulk import contacts from CSV files

### 📈 Analytics & Reporting
- **Real-time Analytics** - Track opens, clicks, conversions, and more
- **Performance Metrics** - Comprehensive dashboards with visualizations
- **Email Logs** - Detailed logs of all sent emails
- **Bounce Management** - Track and manage bounced emails
- **Export Reports** - Export analytics data for external analysis

### 🔐 Security & Deliverability
- **SPF/DKIM/DMARC** - DNS verification for email authentication
- **Bounce Handling** - Automatic bounce detection and suppression
- **Unsubscribe Management** - Compliant unsubscribe handling
- **API Keys** - Secure API access with key management
- **Audit Logs** - Track all system actions for compliance

### 👥 Team Collaboration
- **Multi-User Support** - Work together with your team
- **Role-Based Access** - OWNER, ADMIN, EDITOR, and VIEWER roles
- **Organization Management** - Manage multiple organizations
- **White Label** - Customize branding for your organization

### 🔌 Integrations
- **SMTP Profiles** - Configure multiple SMTP providers
- **Webhooks** - Real-time event notifications
- **API Access** - RESTful API for programmatic access
- **Third-Party Integrations** - HubSpot, Salesforce, Shopify, WooCommerce, Zapier

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn** 1.22+
- **PostgreSQL** 14+ (or Docker)
- **Redis** 6+ (optional, for queue management)
- **Docker** & **Docker Compose** (recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/mailcrafter.git
   cd mailcrafter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/mailcrafter"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Redis (optional)
   REDIS_URL="redis://localhost:6379"
   
   # Encryption (optional)
   ENCRYPTION_KEY="your-encryption-key"
   ```

4. **Start Docker services:**
   ```bash
   docker-compose up -d
   ```
   
   This starts:
   - PostgreSQL database
   - Redis (if configured)

5. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

7. **Start development server:**
   ```bash
   npm run dev
   ```

8. **Access the application:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with default credentials:
     - **Email:** `admin@mailcrafter.com`
     - **Password:** `Admin123!@#`

## 📁 Project Structure

```
mailcrafter/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (public)/          # Public pages
│   ├── dashboard/         # Protected dashboard pages
│   ├── api/               # API routes
│   └── actions/           # Server actions
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── email-builder/    # Email builder components
│   ├── campaigns/        # Campaign components
│   └── ...
├── lib/                   # Utility libraries
│   ├── db/               # Database utilities
│   ├── auth/             # Authentication utilities
│   ├── email/            # Email sending logic
│   ├── queue/            # Queue management
│   └── ...
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── tests/                # Test files
└── docs/                 # Documentation
```

## 🛠️ Tech Stack

### Core
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Prisma](https://www.prisma.io/)** - Database ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Database

### UI & Styling
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library

### Email & Queue
- **[Nodemailer](https://nodemailer.com/)** - Email sending
- **[Bull](https://github.com/OptimalBits/bull)** - Queue management
- **[ioredis](https://github.com/luin/ioredis)** - Redis client

### Authentication & Security
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Password hashing
- **[Zod](https://zod.dev/)** - Schema validation

### Editor
- **[TipTap](https://tiptap.dev/)** - Rich text editor
- **[@dnd-kit](https://dndkit.com/)** - Drag and drop

### Testing
- **[Vitest](https://vitest.dev/)** - Test framework
- **[Testing Library](https://testing-library.com/)** - React testing utilities

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[User Manual](./docs/USER_MANUAL.md)** - Complete guide for end users
- **[Developer Manual](./docs/DEVELOPER_MANUAL.md)** - Guide for developers
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - API reference
- **[Testing Guide](./docs/TESTING.md)** - Testing documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions

## 🧪 Testing

Run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🚢 Deployment

MailCrafter can be deployed using Docker Compose. See the [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

### Quick Docker Deployment

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## 📝 Available Scripts

- `npm run dev` - Start development server with worker
- `npm run dev:next` - Start Next.js development server only
- `npm run worker` - Start email worker process
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma db seed` - Seed database

## 🔒 Security

- Passwords are hashed using bcrypt (12 rounds)
- Session management uses JWT strategy
- API keys are hashed before storage
- SMTP passwords are encrypted
- Audit logs track all system actions
- CSRF protection enabled
- SQL injection prevention via Prisma

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Email editor powered by [TipTap](https://tiptap.dev/)

## 📧 Support

For support, email support@mailcrafter.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Advanced workflow automation
- [ ] More third-party integrations
- [ ] Enhanced analytics and reporting
- [ ] Mobile app (iOS/Android)
- [ ] Advanced personalization features
- [ ] AI-powered content suggestions

---

**Made with ❤️ by the MailCrafter team**
