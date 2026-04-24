import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'canManageUsers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await params
    const body = await req.json()
    const user = await prisma.user.update({
      where: { id },
      data: {
        role: body.role,
        active: body.active,
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    })
    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: AUDIT_ACTION.UPDATE_USER,
      resource: AUDIT_RESOURCE.USER,
      resourceId: id,
      meta: { role: body.role, active: body.active },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
