import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sector = searchParams.get('sector')

  const contracts = await prisma.contract.findMany({
    where: sector ? { sector: sector as 'GOV' | 'PRIVATE' } : {},
    include: {
      _count: { select: { tickets: true } },
      tickets: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(contracts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const contract = await prisma.contract.create({
    data: {
      name: body.name,
      sector: body.sector,
      serviceType: body.serviceType,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      pmId: session.user.id!,
    },
  })
  return NextResponse.json(contract, { status: 201 })
}
