import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { makeSignedUploadPath } from '@/lib/uploads'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  
  const { fileName } = await req.json()
  const result = await makeSignedUploadPath(fileName)
  
  if (result.requiresDirectUrl) {
    return NextResponse.json({ 
      uploadUrl: null,
      message: result.message,
      requiresDirectUrl: true
    })
  }
  
  return NextResponse.json({ uploadUrl: result.uploadUrl })
}
