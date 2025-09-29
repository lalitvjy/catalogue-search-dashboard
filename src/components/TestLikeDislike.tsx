'use client'
import { useState } from 'react'

export default function TestLikeDislike() {
  const [testResults, setTestResults] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    setTestResults('Running tests...\n')
    
    try {
      // Test 1: Create search interaction
      setTestResults(prev => prev + '1. Testing search interaction creation...\n')
      const searchResponse = await fetch('/api/search-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputImageUrl: 'test-image-url.jpg',
          searchParams: { threshold: 0.8 },
          totalResults: 5
        })
      })
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        setTestResults(prev => prev + `✅ Search interaction created: ${searchData.searchInteractionId}\n`)
        
        // Test 2: Create interaction item
        setTestResults(prev => prev + '2. Testing like interaction...\n')
        const likeResponse = await fetch('/api/interaction-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchInteractionId: searchData.searchInteractionId,
            skuId: 'test-sku-id',
            interactionType: 'LIKE',
            similarityScore: 0.95,
            resultPosition: 1
          })
        })
        
        if (likeResponse.ok) {
          setTestResults(prev => prev + '✅ Like interaction created successfully\n')
          
          // Test 3: Update to dislike
          setTestResults(prev => prev + '3. Testing dislike interaction...\n')
          const dislikeResponse = await fetch('/api/interaction-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              searchInteractionId: searchData.searchInteractionId,
              skuId: 'test-sku-id',
              interactionType: 'DISLIKE',
              similarityScore: 0.95,
              resultPosition: 1
            })
          })
          
          if (dislikeResponse.ok) {
            setTestResults(prev => prev + '✅ Dislike interaction created successfully\n')
            
            // Test 4: Delete interaction
            setTestResults(prev => prev + '4. Testing interaction deletion...\n')
            const deleteResponse = await fetch(
              `/api/interaction-items?searchInteractionId=${searchData.searchInteractionId}&skuId=test-sku-id`,
              { method: 'DELETE' }
            )
            
            if (deleteResponse.ok) {
              setTestResults(prev => prev + '✅ Interaction deleted successfully\n')
            } else {
              setTestResults(prev => prev + '❌ Failed to delete interaction\n')
            }
          } else {
            setTestResults(prev => prev + '❌ Failed to create dislike\n')
          }
        } else {
          setTestResults(prev => prev + '❌ Failed to create like\n')
        }
      } else {
        setTestResults(prev => prev + '❌ Failed to create search interaction\n')
      }
      
      // Test 5: Analytics endpoint
      setTestResults(prev => prev + '5. Testing analytics endpoint...\n')
      const analyticsResponse = await fetch('/api/analytics')
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setTestResults(prev => prev + `✅ Analytics retrieved: ${JSON.stringify(analyticsData, null, 2)}\n`)
      } else {
        setTestResults(prev => prev + '❌ Failed to get analytics\n')
      }
      
      setTestResults(prev => prev + '\n🎉 All tests completed!')
      
    } catch (error) {
      setTestResults(prev => prev + `❌ Error: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Like/Dislike API Test</h2>
      <button
        onClick={runTests}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Running Tests...' : 'Run API Tests'}
      </button>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <pre className="whitespace-pre-wrap text-sm font-mono">
          {testResults || 'Click "Run API Tests" to test the implementation'}
        </pre>
      </div>
    </div>
  )
}
