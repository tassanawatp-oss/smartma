import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from '@/lib/audit'

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true } },
        contract: { select: { id: true, name: true, jiraConfig: { select: { host: true, projectKey: true } } } },
        comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
        attachments: true,
      },
    })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(ticket)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    if (body.status !== undefined && !(VALID_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        assigneeId: body.assigneeId,
        jiraKey: body.jiraKey,
      },
    })
    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: AUDIT_ACTION.UPDATE_TICKET,
      resource: AUDIT_RESOURCE.TICKET,
      resourceId: id,
      meta: { status: body.status, priority: body.priority },
    })
    return NextResponse.json(ticket)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
