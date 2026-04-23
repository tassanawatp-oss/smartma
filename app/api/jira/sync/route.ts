import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { syncAllTickets } from '@/lib/jira'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const result = await syncAllTickets(body.contractId)
  return NextResponse.json(result)
}
