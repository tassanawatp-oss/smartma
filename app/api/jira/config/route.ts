import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { encryptToken } from '@/lib/jira'
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from '@/lib/audit'

const PRIVATE_IP_RE = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/

function validateHost(host: string): boolean {
  try {
    const { hostname } = new URL(`https://${host}`)
    return !PRIVATE_IP_RE.test(hostname)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'canConfigJira')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(req.url)
    const contractId = searchParams.get('contractId')
    if (!contractId) return NextResponse.json({ error: 'contractId required' }, { status: 400 })

    const config = await prisma.jiraConfig.findUnique({
      where: { contractId },
      select: { id: true, host: true, email: true, projectKey: true, updatedAt: true },
      // Note: apiToken intentionally excluded — never returned to client
    })
    return NextResponse.json(config)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'canConfigJira')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()

    if (!validateHost(body.host)) {
      return NextResponse.json({ error: 'Invalid Jira host' }, { status: 400 })
    }

    const encryptedToken = encryptToken(body.apiToken)

    const config = await prisma.jiraConfig.upsert({
      where: { contractId: body.contractId },
      update: {
        host: body.host,
        email: body.email,
        apiToken: encryptedToken,
        projectKey: body.projectKey,
      },
      create: {
        contractId: body.contractId,
        host: body.host,
        email: body.email,
        apiToken: encryptedToken,
        projectKey: body.projectKey,
      },
    })
    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: AUDIT_ACTION.CONFIG_JIRA,
      resource: AUDIT_RESOURCE.JIRA_CONFIG,
      resourceId: body.contractId,
      meta: { host: body.host, projectKey: body.projectKey },
    })
    return NextResponse.json({ id: config.id, ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
