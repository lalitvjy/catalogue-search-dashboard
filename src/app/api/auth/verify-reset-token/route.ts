import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifyTokenSchema.parse(body)

    // Find the reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: 'Invalid reset token' },
        { status: 200 }
      )
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await db.passwordResetToken.delete({
        where: { id: resetToken.id }
      })

      return NextResponse.json(
        { valid: false, error: 'Reset token has expired' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { valid: true, email: resetToken.user.email },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Verify reset token error:', error)
    return NextResponse.json(
      { valid: false, error: 'An error occurred while verifying the token' },
      { status: 500 }
    )
  }
}
