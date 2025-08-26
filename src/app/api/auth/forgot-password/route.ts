import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { sendEmail, createPasswordResetEmail } from '@/lib/email'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a reset link has been sent' },
        { status: 200 }
      )
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Delete any existing reset tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })

    // Create new reset token
    await db.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      }
    })

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    const emailOptions = createPasswordResetEmail(email, resetUrl)
    await sendEmail(emailOptions)

    return NextResponse.json(
      { message: 'If an account with that email exists, a reset link has been sent' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
