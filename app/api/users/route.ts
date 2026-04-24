import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'canManageUsers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'canManageUsers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
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
    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: AUDIT_ACTION.CREATE_USER,
      resource: AUDIT_RESOURCE.USER,
      resourceId: user.id,
      meta: { name: user.name, email: user.email, role: user.role },
    })
    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
