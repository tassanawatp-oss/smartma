import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contractId')
  if (!contractId) return NextResponse.json({ error: 'contractId required' }, { status: 400 })

  const config = await prisma.jiraConfig.findUnique({
    where: { contractId },
    select: { id: true, host: true, email: true, projectKey: true, updatedAt: true },
  })
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const config = await prisma.jiraConfig.upsert({
    where: { contractId: body.contractId },
    update: {
      host: body.host,
      email: body.email,
      apiToken: body.apiToken,
      projectKey: body.projectKey,
    },
    create: {
      contractId: body.contractId,
      host: body.host,
      email: body.email,
      apiToken: body.apiToken,
      projectKey: body.projectKey,
    },
  })
  return NextResponse.json({ id: config.id, ok: true })
}
