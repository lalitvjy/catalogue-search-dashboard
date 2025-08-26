# Catalogue Similarity Search Dashboard

A production-ready MVP for a multi-tenant catalogue similarity search app used by internal B2B teams.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript and Tailwind CSS
- **Authentication**: NextAuth.js (Credentials + Google OAuth)
- **Database**: Neon PostgreSQL with Prisma ORM
- **Vector Search**: Qdrant
- **File Storage**: Vercel Blob
- **Hosting**: Vercel

## Features

- Multi-tenant isolation (brand-scoped data)
- Image similarity search via vector embeddings
- SKU management with attributes
- Filter results by type, category, occasion, diamond weight
- One-click SKU copying
- Admin CLI tools for brand and user management

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Copy `env.example` to `.env.local` and fill in your values:
```bash
cp env.example .env.local
```

Required environment variables:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random string for JWT signing
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for dev)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `QDRANT_URL` & `QDRANT_API_KEY`: Qdrant cloud instance credentials
- `EMBED_ENDPOINT` & `OPENAI_API_KEY`: Your embedding service
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token
- `BREVO_API_KEY`: Brevo API key for email sending (production)
- `BREVO_FROM_EMAIL`: Sender email address for transactional emails

### 3. Database Setup
```bash
npx prisma migrate dev
```

### 4. Email Setup (Production)
For production email sending, configure Brevo:

1. Get your Brevo API key from [Brevo Dashboard](https://app.brevo.com/settings/keys/api)
2. Add to your environment variables:
```bash
BREVO_API_KEY="xkeysib-your-api-key-here"
BREVO_FROM_EMAIL="noreply@yourdomain.com"
```

See `EMAIL_SETUP.md` for detailed setup instructions.

### 5. Development Server
```bash
npm run dev
```

## Admin Operations

### Create a Brand
```bash
npx tsx scripts/create-brand.ts "Brand Name" brand-slug 1024
```

### Tag User to Brand
```bash
npx tsx scripts/tag-user.ts user@company.com brand-slug
```

### Backfill Embeddings
```bash
npx tsx scripts/backfill-embeds.ts brand-slug
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with credentials
- `GET /api/me` - Get current user and brand info

### Search
- `POST /api/search/image` - Search similar images (brand-scoped)
  - Requires authentication
  - Automatically scoped to user's assigned brand collection
  - Parameters: `file` (image), `limit`, `score_threshold`
  - Returns results from user's brand collection only

### Ingestion
- `POST /api/ingest/sku` - Create/update SKU with attributes
- `POST /api/ingest/image` - Get signed upload URL
- `POST /api/ingest/embed` - Generate embeddings for SKU

### Search
- `POST /api/search/image` - Search similar images
- `GET /api/filters` - Get available filter options

## Multi-Tenant Architecture

- **Database**: All tables scoped by `brandId`
- **Vector Search**: Separate Qdrant collection per brand (`brand_${slug}`)
- **Authentication**: Users belong to one brand
- **API Routes**: All endpoints enforce brand isolation

## Deployment

1. Set environment variables in Vercel dashboard
2. Connect Neon database
3. Set up Qdrant cloud instance
4. Deploy to Vercel

## Acceptance Criteria

- ✅ Login works via Credentials and Google
- ✅ `/api/me` returns user + brand
- ✅ `/api/ingest/sku` upserts SKU + attributes
- ✅ `/api/ingest/embed` writes to brand's Qdrant collection
- ✅ `/api/search/image` returns results with confidence and filters
- ✅ UI shows grid with image, filename, SKU, confidence, Copy button
- ✅ Brand isolation enforced across all endpoints
