import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const hash = await bcrypt.hash(body.password, 12)
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hash,
      role: body.role ?? 'STAFF',
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  return NextResponse.json(user, { status: 201 })
}
