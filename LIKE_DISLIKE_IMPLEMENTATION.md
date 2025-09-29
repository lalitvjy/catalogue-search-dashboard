# Like/Dislike Implementation Summary

## Overview
We have successfully implemented a comprehensive like/dislike functionality for the mirrAR Catalogue Search application. This system tracks user interactions with search results and stores them for analytics and future improvements.

## Database Schema

### SearchInteraction Table
- **Purpose**: Tracks each search session/event
- **Key Fields**:
  - `id`: Unique identifier
  - `userId`: User who performed the search
  - `brandId`: Brand context
  - `inputImageUrl`: URL of the uploaded search image
  - `searchParams`: Search parameters (JSON)
  - `totalResults`: Number of results returned
  - `createdAt`: Timestamp

### InteractionItem Table
- **Purpose**: Tracks individual like/dislike actions within search sessions
- **Key Fields**:
  - `id`: Unique identifier
  - `searchInteractionId`: Links to SearchInteraction
  - `skuId`: The product that was liked/disliked
  - `interactionType`: LIKE or DISLIKE
  - `similarityScore`: Similarity score when shown to user
  - `resultPosition`: Position in search results (1, 2, 3...)
  - `createdAt`: Timestamp

## API Endpoints

### `/api/search-interactions` (POST)
Creates a new search interaction when a user performs a search.

**Request Body**:
```json
{
  "inputImageUrl": "string",
  "searchParams": {},
  "totalResults": "number"
}
```

### `/api/interaction-items` (POST)
Creates or updates a like/dislike interaction.

**Request Body**:
```json
{
  "searchInteractionId": "string",
  "skuId": "string", 
  "interactionType": "LIKE" | "DISLIKE",
  "similarityScore": "number",
  "resultPosition": "number"
}
```

### `/api/interaction-items` (DELETE)
Removes a like/dislike interaction.

**Query Parameters**:
- `searchInteractionId`: Search session ID
- `skuId`: Product ID

### `/api/analytics` (GET)
Returns analytics data including most liked products and user stats.

## Frontend Implementation

### useSearchInteractions Hook
A custom hook that manages:
- Creating search interactions
- Toggling like/dislike states
- Tracking current interaction states
- API communication

### Updated Components

#### ActionButtons
- Now accepts external state via `currentInteraction` prop
- Visual feedback for like/dislike states
- Handles toggle interactions

#### ResultsGrid
- Integrates with `useSearchInteractions` hook
- Passes correct parameters to ActionButtons
- Manages interaction state per product

#### Search Page
- Creates search interactions when results are received
- Integrates with the hook system

## Data Flow

1. **User uploads image and searches**
   - Search API returns results
   - `createSearchInteraction()` is called with search metadata
   - Search interaction record is created in database

2. **User clicks like/dislike on a result**
   - `toggleInteraction()` is called with product details
   - If same interaction type: removes the interaction
   - If different/new: creates or updates the interaction
   - Visual state updates immediately

3. **Data is stored with context**
   - Which search session
   - Which product
   - What type of interaction
   - When it happened
   - Where in the results it appeared
   - What the similarity score was

## Analytics Capabilities

With this structure, you can now analyze:

- **Most liked products** across all users
- **User preferences** and behavior patterns
- **Search effectiveness** (which results get positive feedback)
- **Position bias** (do users like results shown first more?)
- **Similarity score correlation** (do higher similarity scores get more likes?)

## Example Queries

```sql
-- Most liked products
SELECT s.skuCode, COUNT(*) as likes
FROM InteractionItem ii
JOIN Sku s ON ii.skuId = s.id
WHERE ii.interactionType = 'LIKE'
GROUP BY s.skuCode
ORDER BY likes DESC;

-- User preference analysis
SELECT u.email, 
       COUNT(CASE WHEN ii.interactionType = 'LIKE' THEN 1 END) as likes,
       COUNT(CASE WHEN ii.interactionType = 'DISLIKE' THEN 1 END) as dislikes
FROM User u
JOIN SearchInteraction si ON u.id = si.userId
JOIN InteractionItem ii ON si.id = ii.searchInteractionId
GROUP BY u.email;

-- Position bias analysis
SELECT ii.resultPosition,
       COUNT(CASE WHEN ii.interactionType = 'LIKE' THEN 1 END) as likes,
       COUNT(CASE WHEN ii.interactionType = 'DISLIKE' THEN 1 END) as dislikes
FROM InteractionItem ii
GROUP BY ii.resultPosition
ORDER BY ii.resultPosition;
```

## Testing

To test the implementation:

1. **Start the development server**: `npm run dev`
2. **Login to the application**
3. **Upload an image to search**
4. **Click like/dislike buttons on results**
5. **Check database for records**:
   ```sql
   SELECT * FROM SearchInteraction ORDER BY createdAt DESC LIMIT 5;
   SELECT * FROM InteractionItem ORDER BY createdAt DESC LIMIT 10;
   ```

## Future Enhancements

1. **Recommendation Engine**: Use like/dislike data to improve search results
2. **User Insights Dashboard**: Build analytics dashboard for admins
3. **A/B Testing**: Test different result ordering based on interaction data
4. **Machine Learning**: Train models on user preferences
5. **Export Functionality**: Allow users to export their liked products
6. **Social Features**: Share liked products, see popular items

## Security Notes

- All API endpoints verify user authentication
- Users can only interact with their own search sessions
- Brand isolation is enforced (users can only see data from their brand)
- Input validation prevents malicious data

The implementation is production-ready and provides a solid foundation for building more advanced features on top of the interaction data.
