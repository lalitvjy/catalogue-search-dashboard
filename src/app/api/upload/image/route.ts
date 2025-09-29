import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadBufferToR2 } from '@/lib/uploads-r2'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    console.log('[R2 Upload] Request received')
    const contentType = req.headers.get('content-type') || ''

    if (contentType.startsWith('application/json')) {
      const body = await req.json() as { imageBase64?: string, fileName?: string, imageUrl?: string }
      const { imageBase64, fileName, imageUrl } = body
      console.log('[R2 Upload] JSON mode, fileName:', fileName, 'imageUrl provided:', !!imageUrl)

      const bucket = process.env.R2_BUCKET_NAME || "bucket-for-development-and-testing"
      if (!bucket) return NextResponse.json({ error: 'R2_BUCKET_NAME not set' }, { status: 500 })

      if (imageUrl) {
        console.log('[R2 Upload] Fetching image from URL')
        const fetched = await fetch(imageUrl)
        if (!fetched.ok) {
          console.error('[R2 Upload] Failed to fetch image URL:', fetched.status, fetched.statusText)
          return NextResponse.json({ error: 'Failed to fetch imageUrl' }, { status: 400 })
        }
        const arrayBuffer = await fetched.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mime = fetched.headers.get('content-type') || 'image/jpeg'
        const urlName = (() => { try { return new URL(imageUrl).pathname.split('/').pop() || 'upload' } catch { return 'upload' } })()
        const key = `${Date.now()}-${(urlName).replace(/[^a-zA-Z0-9._-]/g, '_')}`
        console.log('[R2 Upload] Uploading to bucket:', bucket, 'key:', key)
        const result = await uploadBufferToR2({ bucket, key, contentType: mime, body: buffer })
        console.log('[R2 Upload] Success URL:', result.url)
        return NextResponse.json({ url: result.url, key: result.key })
      }

      if (imageBase64) {
        const matches = imageBase64.match(/^data:(.*?);base64,(.*)$/)
        const mime = matches ? matches[1] : 'image/jpeg'
        const b64 = matches ? matches[2] : imageBase64
        const buffer = Buffer.from(b64, 'base64')

        const key = `${Date.now()}-${(fileName || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_')}`
        console.log('[R2 Upload] Uploading to bucket:', bucket, 'key:', key)
        const result = await uploadBufferToR2({ bucket, key, contentType: mime, body: buffer })
        console.log('[R2 Upload] Success URL:', result.url)
        return NextResponse.json({ url: result.url, key: result.key })
      }

      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    if (!contentType.startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'multipart/form-data or JSON expected' }, { status: 415 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    console.log('[R2 Upload] Multipart mode, has file:', !!file)
    if (!file) return NextResponse.json({ error: 'file field required' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const bucket = process.env.R2_BUCKET_NAME || "bucket-for-development-and-testing"
    if (!bucket) return NextResponse.json({ error: 'R2_BUCKET_NAME not set' }, { status: 500 })

    const key = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    console.log('[R2 Upload] Uploading to bucket:', bucket, 'key:', key)
    const result = await uploadBufferToR2({ bucket, key, contentType: file.type || 'application/octet-stream', body: buffer })
    console.log('[R2 Upload] Success URL:', result.url)
    return NextResponse.json({ url: result.url, key: result.key })
  } catch (err) {
    console.error('[R2 Upload] Failed', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


