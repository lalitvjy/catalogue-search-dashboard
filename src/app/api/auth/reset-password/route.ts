import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Find the reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await db.passwordResetToken.delete({
        where: { id: resetToken.id }
      })

      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update user's password
    await db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    })

    // Delete the used reset token
    await db.passwordResetToken.delete({
      where: { id: resetToken.id }
    })

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while resetting the password' },
      { status: 500 }
    )
  }
}
