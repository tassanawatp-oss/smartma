import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contracts = await prisma.contract.findMany({
    include: {
      tickets: { select: { status: true, type: true, priority: true } },
    },
  })

  const summary = contracts.map((c) => ({
    id: c.id,
    name: c.name,
    sector: c.sector,
    open: c.tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: c.tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: c.tickets.filter((t) => t.status === 'RESOLVED').length,
    closed: c.tickets.filter((t) => t.status === 'CLOSED').length,
    hw: c.tickets.filter((t) => t.type === 'HW').length,
    sw: c.tickets.filter((t) => t.type === 'SW').length,
    total: c.tickets.length,
  }))

  const totals = {
    open: summary.reduce((a, c) => a + c.open, 0),
    inProgress: summary.reduce((a, c) => a + c.inProgress, 0),
    resolved: summary.reduce((a, c) => a + c.resolved, 0),
    total: summary.reduce((a, c) => a + c.total, 0),
  }

  return NextResponse.json({ contracts: summary, totals })
}
