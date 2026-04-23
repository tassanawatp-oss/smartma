import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { syncAllTickets } from '@/lib/jira'
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const result = await syncAllTickets(body.contractId)
  writeAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTION.JIRA_SYNC,
    resource: AUDIT_RESOURCE.JIRA_CONFIG,
    resourceId: body.contractId ?? undefined,
    meta: { total: result.total, ok: result.ok },
  })
  return NextResponse.json(result)
}
