# GitHub Copilot Instructions for mirrAR Catalogue Search Dashboard

## Project Overview

This is a production-ready Next.js application for multi-tenant catalogue similarity search used by internal B2B teams. The application enables jewellery businesses to search their catalogues using image similarity powered by vector embeddings.

### Domain-Specific Context
- **Industry**: Jewelry and fashion accessories
- **Search Filters**: Type, category, occasion, diamond weight ranges, gemstone weight
- **SKU Attributes**: Custom attributes per brand (materials, weights, dimensions, etc.)
- **Image Processing**: Upload, crop, and vector embedding generation
- **Business Model**: B2B SaaS with brand isolation

## Tech Stack & Architecture

- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth.js (Credentials + Google OAuth + Azure AD)
- **Database**: PostgreSQL with Prisma ORM
- **Vector Search**: Qdrant vector database
- **File Storage**: Vercel Blob
- **Email**: Brevo API
- **Hosting**: Vercel

## Key Architectural Concepts

### Multi-Tenant Architecture
- **Brand Isolation**: All data is scoped by `brandId` 
- **Vector Collections**: Each brand has its own collection (`brand_{slug}`)
- **Database Schema**: All tables include brand scoping
- **API Security**: All endpoints enforce brand isolation

### File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authenticated routes
│   ├── api/               # API routes
│   └── (public)/          # Public pages
├── components/            # Reusable React components
├── lib/                   # Utilities and configurations
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   └── qdrant.ts         # Vector database client
└── __tests__/            # Test files
```

## Development Guidelines

### Code Style & Standards
- Use TypeScript strictly - no `any` types
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Implement proper error handling with try-catch blocks
- Use Zod for runtime type validation
- Follow the existing naming conventions

### Database & Prisma
- Always include `brandId` in queries for multi-tenant isolation
- Use Prisma transactions for multi-step operations
- Run `npx prisma generate` after schema changes
- Use `npx prisma migrate dev` for development migrations

### API Routes
- All API routes must enforce brand isolation
- Use proper HTTP status codes
- Implement rate limiting where appropriate
- Always validate request data with Zod schemas
- Return consistent error response formats

### Authentication & Authorization
- Use `getServerSession` for server-side auth checks
- Implement proper role-based access control (SUPER_ADMIN, BRAND_ADMIN, BRAND_USER, VIEWER)
- Always verify user belongs to the correct brand
- Handle unauthenticated and unauthorized states gracefully

### User Roles
- **SUPER_ADMIN**: Can manage all brands, users, and system settings
- **BRAND_ADMIN**: Can manage users within their brand
- **BRAND_USER**: Can use search features within their brand  
- **VIEWER**: Can only view, no modifications

### Vector Search Implementation
- Each brand has its own Qdrant collection
- Collection names follow the pattern: `brand_{slug}`
- Always pass the correct collection name in search requests
- Implement proper error handling for vector operations
- Search supports filters: type, category, occasion, diamond_wt_min/max
- Default embedding model: "dinov2" (configurable per brand)
- Search results include confidence scores and metadata

## Common Patterns

### API Route Structure
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.brandId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Your logic here - always scope by brandId
    
  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Database Queries with Brand Isolation
```typescript
// Always include brandId in queries
const results = await db.sku.findMany({
  where: {
    brandId: session.user.brandId,
    // other conditions
  }
})
```

### Component Error Handling
```typescript
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  try {
    setLoading(true)
    setError(null)
    
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Request failed')
    }
    
    const result = await response.json()
    // Handle success
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred')
  } finally {
    setLoading(false)
  }
}
```

## Environment Variables

Required environment variables (see `env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: JWT signing secret
- `NEXTAUTH_URL`: Application URL
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` & `AZURE_AD_TENANT_ID`: Azure AD OAuth credentials
- `VECTOR_DB_URL` & `VECTOR_DB_API_KEY`: Qdrant credentials
- `EMBED_ENDPOINT` & `OPENAI_API_KEY`: Embedding service
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token
- `EMAIL_API_KEY` & `EMAIL_FROM_ADDRESS`: Email service

## Testing & Quality

### Running Tests
```bash
npm run test        # Run existing tests
npm run lint        # ESLint
npm run build       # Production build
npm run validate    # Build + test
npm run dev         # Development server with Turbopack
```

### Common Development Commands
```bash
# Database operations
npx prisma generate              # Generate Prisma client
npx prisma migrate dev          # Create and apply migration
npx prisma studio              # Open database GUI
npx prisma db push            # Push schema changes without migration

# Admin operations  
npx tsx scripts/create-brand.ts "Brand Name" "brand-slug"
npx tsx scripts/create-user.ts user@example.com "User Name" 
npx tsx scripts/assign-brand.ts user@example.com brand-slug
npx tsx scripts/test-search-scoping.ts
```

### Key Testing Areas
- API endpoints with proper brand isolation
- Authentication flows
- Vector search functionality
- File upload and processing
- Multi-tenant data separation

## Security Considerations

1. **Brand Isolation**: Always verify users can only access their brand's data
2. **Input Validation**: Use Zod schemas for all user inputs
3. **File Uploads**: Validate file types and sizes
4. **Rate Limiting**: Implement for search and upload endpoints
5. **Error Messages**: Don't leak sensitive information

## Common Tasks

### Image Upload & Processing
```typescript
// File upload with validation
const handleFileUpload = async (file: File) => {
  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file')
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File size must be less than 10MB')
  }
  
  // Upload to Vercel Blob
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) throw new Error('Upload failed')
  return await response.json()
}
```

### Adding New API Routes
1. Create route in `src/app/api/`
2. Implement proper authentication checks
3. Add brand isolation logic
4. Use consistent error handling
5. Add input validation with Zod

### Adding New Components
1. Create in `src/components/`
2. Use TypeScript interfaces for props
3. Implement proper loading and error states
4. Follow existing Tailwind patterns
5. Make components reusable when possible

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive-name`
3. Update related TypeScript types
4. Test with existing data

## Debugging Tips

- Check browser console for client-side errors
- Use `console.log` strategically (remove before committing)
- Verify brand isolation in all database queries
- Test with multiple brands to ensure isolation
- Use Prisma Studio for database inspection
- Check Vercel logs for production issues

## Important Files

- `src/lib/auth.ts`: Authentication configuration
- `src/lib/db.ts`: Database client setup  
- `src/lib/qdrant.ts`: Vector database operations
- `src/lib/validation.ts`: Zod schemas for input validation
- `middleware.ts`: Next.js middleware for auth
- `prisma/schema.prisma`: Database schema
- `COLLECTION_SCOPING.md`: Multi-tenant search documentation
- `scripts/`: Admin CLI tools for brand/user management

### Admin Scripts
- `scripts/create-brand.ts`: Create new brand with vector collection
- `scripts/create-user.ts`: Create new user and assign to brand
- `scripts/assign-brand.ts`: Assign existing user to brand
- `scripts/test-search-scoping.ts`: Verify multi-tenant isolation
- `scripts/backfill-embeds.ts`: Regenerate embeddings for existing SKUs

## When Working on This Codebase

1. **Always consider multi-tenancy**: Every database query and API should be brand-scoped
2. **Test with real data**: Use the provided test brands and users
3. **Follow existing patterns**: Look at similar implementations before creating new ones
4. **Prioritize security**: Brand isolation is critical for this B2B application
5. **Document complex logic**: Especially around vector search and multi-tenancy
6. **Test edge cases**: What happens with no results, network errors, etc.

Remember: This is a production application serving real businesses. Code quality, security, and reliability are paramount.

Remember: This is a production application serving real businesses. Code quality, security, and reliability are paramount.