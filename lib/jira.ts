import { prisma } from './prisma'

type JiraIssue = {
  key: string
  fields: {
    summary: string
    status: { name: string }
    priority: { name: string }
    issuetype: { name: string }
    assignee: { displayName: string } | null
    updated: string
    comment: {
      comments: Array<{
        id: string
        author: { displayName: string }
        body: { content: Array<{ content: Array<{ text: string }> }> }
        created: string
      }>
    }
  }
}

function jiraStatusToLocal(jiraStatus: string): string {
  const map: Record<string, string> = {
    'To Do': 'OPEN',
    'Open': 'OPEN',
    'In Progress': 'IN_PROGRESS',
    'Done': 'RESOLVED',
    'Closed': 'CLOSED',
    'Resolved': 'RESOLVED',
  }
  return map[jiraStatus] ?? 'OPEN'
}

async function fetchJira(host: string, email: string, token: string, path: string) {
  const res = await fetch(`https://${host}/rest/api/3${path}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Jira API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getJiraIssue(
  host: string,
  email: string,
  token: string,
  key: string
): Promise<JiraIssue> {
  return fetchJira(host, email, token, `/issue/${key}?fields=summary,status,priority,issuetype,assignee,updated,comment`)
}

export async function syncTicketFromJira(ticketId: string): Promise<{ ok: boolean; message: string }> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { contract: { include: { jiraConfig: true } } },
  })
  if (!ticket?.jiraKey) return { ok: false, message: 'No Jira key' }
  const cfg = ticket.contract.jiraConfig
  if (!cfg) return { ok: false, message: 'No Jira config for contract' }

  try {
    const issue = await getJiraIssue(cfg.host, cfg.email, cfg.apiToken, ticket.jiraKey)
    const newStatus = jiraStatusToLocal(issue.fields.status.name)

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: newStatus as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
        jiraSyncAt: new Date(),
      },
    })

    await prisma.syncLog.create({
      data: {
        contractId: ticket.contractId,
        ticketId,
        action: 'sync',
        status: 'OK',
        message: `Synced ${ticket.jiraKey} → ${newStatus}`,
      },
    })

    return { ok: true, message: `Synced ${ticket.jiraKey}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await prisma.syncLog.create({
      data: {
        contractId: ticket.contractId,
        ticketId,
        action: 'sync',
        status: 'ERROR',
        message: msg,
      },
    })
    return { ok: false, message: msg }
  }
}

export async function syncAllTickets(contractId?: string) {
  const tickets = await prisma.ticket.findMany({
    where: {
      jiraKey: { not: null },
      ...(contractId ? { contractId } : {}),
    },
    select: { id: true },
  })

  const results = await Promise.allSettled(tickets.map((t) => syncTicketFromJira(t.id)))
  const ok = results.filter((r) => r.status === 'fulfilled' && (r.value as { ok: boolean }).ok).length
  return { total: tickets.length, ok }
}
