import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sign } from 'jsonwebtoken'

const SSO_SECRET = process.env.NEXTAUTH_SECRET!

interface ExtendedSession {
  user?: {
    email?: string | null
    name?: string | null
    image?: string | null
  }
  microsoftSub?: string
  googleSub?: string
}

export async function POST() {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Access extended session data
    const extendedSession = session as ExtendedSession
    
    // Create SSO token payload
    const ssoPayload = {
      email: session.user.email,
      name: session.user.name || '',
      microsoft_id: extendedSession.microsoftSub || null,
      avatar_url: session.user.image || '',
      exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
      type: 'sso'
    }

    // Sign the token
    const ssoToken = sign(ssoPayload, SSO_SECRET, { algorithm: 'HS256' })

    // Return the token and redirect URL
    return NextResponse.json({
      sso_token: ssoToken,
      redirect_url: `${process.env.SPARK_STUDIO_URL || 'http://localhost:8083'}/auth/external?token=${ssoToken}`
    })

  } catch (error) {
    console.error('SSO token creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create SSO token' },
      { status: 500 }
    )
  }
}
