import { put } from '@vercel/blob'

export async function makeSignedUploadPath(fileName: string) {
  // Check if Vercel Blob is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Return a placeholder URL for direct image URL uploads
    return { 
      uploadUrl: null,
      message: 'Vercel Blob not configured. Please use direct image URLs instead.',
      requiresDirectUrl: true
    }
  }

  try {
    const { url } = await put(fileName, new Blob([]), { 
      access: 'public', 
      token: process.env.BLOB_READ_WRITE_TOKEN 
    })
    return { uploadUrl: url }
  } catch (error) {
    console.error('Vercel Blob upload error:', error)
    return { 
      uploadUrl: null,
      message: 'Upload service error. Please use direct image URLs instead.',
      requiresDirectUrl: true
    }
  }
}
