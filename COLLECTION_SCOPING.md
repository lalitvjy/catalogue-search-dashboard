# Collection Scoping for Multi-Tenant Search

This document explains how the search API ensures proper collection scoping to maintain data isolation between brands..

## Overview

The search API automatically scopes all searches to the user's assigned brand collection, ensuring that:
- Users can only search within their own brand's data
- No cross-brand data leakage occurs
- Each brand's data remains isolated in separate vector collections

## How It Works

### 1. User Authentication & Brand Assignment
When a user logs in, they are assigned to a specific brand: -
```typescript
// User session contains brand information
const session = await getServerSession(authOptions)
const brandId = session.brandId // User's assigned brand
```

### 2. Brand Collection Verification
The API verifies the user's brand assignment:
```typescript
// Verify user belongs to this brand
const user = await db.user.findUnique({ 
  where: { id: userId },
  select: { brandId: true }
})

if (!user || user.brandId !== brandId) {
  return new NextResponse('Access denied: User not assigned to this brand', { status: 403 })
}
```

### 3. Collection Scoping in Search
The search API automatically adds brand collection information to external API calls:
```typescript
// Add brand collection information to ensure proper scoping
externalFormData.append('collection', brand.qdrantCollection)
externalFormData.append('brand_id', brand.id)
externalFormData.append('brand_slug', brand.slug)
```

## Brand Collection Structure

Each brand has its own vector collection named `brand_{slug}`:

| Brand | Collection Name | Users |
|-------|----------------|-------|
| Achal Jewel Demo | `brand_achal-jewel-demo` | lalit@styledotme.com |

## API Parameters

When making a search request, the API automatically includes:

### Required Parameters
- `file`: Image file to search for
- `limit`: Number of results to return
- `score_threshold`: Minimum confidence score

### Automatically Added Parameters
- `collection`: Brand's vector collection name
- `brand_id`: Brand's unique identifier
- `brand_slug`: Brand's slug for identification

## Security Features

### 1. Authentication Required
All search requests require valid authentication:
```http
POST /api/search/image
Authorization: Bearer <session_token>
```

### 2. Brand Assignment Verification
Users must be assigned to a brand to search:
```typescript
if (!brandId) {
  return new NextResponse('User not assigned to any brand', { status: 403 })
}
```

### 3. Collection Isolation
Each brand's data is stored in separate vector collections:
- `brand_achal-jewel-demo` for Achal Jewel Demo
- `brand_other-brand` for other brands
- No cross-collection access possible

## Example Search Request

```bash
curl -X POST http://localhost:3000/api/search/image \
  -H "Content-Type: multipart/form-data" \
  -F "file=@image.jpg" \
  -F "limit=20" \
  -F "score_threshold=0.1"
```

### What Gets Sent to External API
```typescript
FormData {
  file: <image_blob>,
  limit: "20",
  score_threshold: "0.1",
  collection: "brand_achal-jewel-demo",      // Auto-added
  brand_id: "cmes7umkk0000z4sd368h0t22",    // Auto-added
  brand_slug: "achal-jewel-demo"            // Auto-added
}
```

## Testing Collection Scoping

Use the test script to verify collection assignments:
```bash
npx tsx scripts/test-search-scoping.ts
```

This will show:
- All brands and their collections
- User-brand assignments
- Collection isolation status

## Monitoring & Logging

Search requests are logged with collection information:
```typescript
db.searchLog.create({ 
  data: { 
    userId,
    brandId,
    queryType: 'image',
    filters: {
      collection: brand.qdrantCollection,
      brand_slug: brand.slug
    }
  } 
})
```

## Troubleshooting

### Common Issues

1. **"User not assigned to any brand"**
   - User needs to be assigned to a brand by admin
   - Use: `npx tsx scripts/tag-user.ts <email> <brand-slug>`

2. **"Access denied: User not assigned to this brand"**
   - User's brand assignment doesn't match session
   - Check user's brand assignment in database

3. **No search results**
   - Verify brand collection exists in vector database
   - Check if collection has data
   - Verify external API is filtering by collection parameter

### Debug Commands

```bash
# Check user assignments
npx tsx scripts/test-search-scoping.ts

# Check brand collections
npx tsx -e "import { db } from './src/lib/db'; db.brand.findMany().then(console.log)"

# Check user-brand relationships
npx tsx -e "import { db } from './src/lib/db'; db.user.findMany({include:{brand:true}}).then(console.log)"
```

## Best Practices

1. **Always verify brand assignment** before allowing search
2. **Log collection information** for audit trails
3. **Test collection isolation** regularly
4. **Monitor search logs** for unusual patterns
5. **Use separate collections** for each brand
