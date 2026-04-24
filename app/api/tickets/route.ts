import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from '@/lib/audit'

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const contractId = searchParams.get('contractId')
    const status = searchParams.get('status')

    if (status && !(VALID_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(contractId ? { contractId } : {}),
        ...(status ? { status: status as typeof VALID_STATUSES[number] } : {}),
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(tickets)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const ticket = await prisma.ticket.create({
      data: {
        contractId: body.contractId,
        title: body.title,
        description: body.description ?? '',
        type: body.type,
        priority: body.priority,
        assigneeId: body.assigneeId || null,
        jiraKey: body.jiraKey || null,
      },
    })
    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: AUDIT_ACTION.CREATE_TICKET,
      resource: AUDIT_RESOURCE.TICKET,
      resourceId: ticket.id,
      meta: { title: ticket.title, contractId: ticket.contractId },
    })
    return NextResponse.json(ticket, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
