import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from '@/lib/audit'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        tickets: { select: { status: true } },
        jiraConfig: { select: { host: true, projectKey: true, updatedAt: true } },
      },
    })
    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(contract)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'canEditContract')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await params
    const body = await req.json()

    let startDate: Date | undefined
    let endDate: Date | undefined
    if (body.startDate) {
      startDate = new Date(body.startDate)
      if (isNaN(startDate.getTime())) return NextResponse.json({ error: 'Invalid startDate' }, { status: 400 })
    }
    if (body.endDate) {
      endDate = new Date(body.endDate)
      if (isNaN(endDate.getTime())) return NextResponse.json({ error: 'Invalid endDate' }, { status: 400 })
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        name: body.name,
        sector: body.sector,
        serviceType: body.serviceType,
        startDate,
        endDate,
      },
    })
    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: AUDIT_ACTION.UPDATE_CONTRACT,
      resource: AUDIT_RESOURCE.CONTRACT,
      resourceId: id,
      meta: { name: body.name },
    })
    return NextResponse.json(contract)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'canManageUsers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await params
    await prisma.contract.delete({ where: { id } })
    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: AUDIT_ACTION.DELETE_CONTRACT,
      resource: AUDIT_RESOURCE.CONTRACT,
      resourceId: id,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
