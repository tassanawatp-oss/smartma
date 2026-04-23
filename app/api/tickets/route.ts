import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contractId')
  const status = searchParams.get('status')

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(contractId ? { contractId } : {}),
      ...(status ? { status: status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  return NextResponse.json(ticket, { status: 201 })
}
