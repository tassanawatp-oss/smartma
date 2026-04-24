import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from '@/lib/audit'

const VALID_SECTORS = ['GOV', 'PRIVATE'] as const

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const sector = searchParams.get('sector')

    if (sector && !(VALID_SECTORS as readonly string[]).includes(sector)) {
      return NextResponse.json({ error: 'Invalid sector' }, { status: 400 })
    }

    const contracts = await prisma.contract.findMany({
      where: sector ? { sector: sector as 'GOV' | 'PRIVATE' } : {},
      include: {
        _count: { select: { tickets: true } },
        tickets: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contracts)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'canEditContract')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()

    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 })
    }

    const contract = await prisma.contract.create({
      data: {
        name: body.name,
        sector: body.sector,
        serviceType: body.serviceType,
        startDate,
        endDate,
        pmId: session.user.id!,
      },
    })
    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: AUDIT_ACTION.CREATE_CONTRACT,
      resource: AUDIT_RESOURCE.CONTRACT,
      resourceId: contract.id,
      meta: { name: contract.name, sector: contract.sector },
    })
    return NextResponse.json(contract, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
