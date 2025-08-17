import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const brand = await db.brand.findUnique({ where: { id: (session as any).brandId } })
  return NextResponse.json({ user: session.user, brand })
}
