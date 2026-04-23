import { prisma } from './prisma'
import crypto from 'crypto'

// ---- Jira host validation (SSRF prevention) ----
const PRIVATE_IP_RE = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/

function validateJiraHost(host: string): void {
  let hostname: string
  try {
    hostname = new URL(`https://${host}`).hostname
  } catch {
    throw new Error('Invalid Jira host')
  }
  if (PRIVATE_IP_RE.test(hostname)) {
    throw new Error('Jira host must not be a private or loopback address')
  }
}

// ---- Jira token encryption (AES-256-GCM) ----
const ALGO = 'aes-256-gcm' as const
const KEY_LEN = 32

function getEncKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? ''
  // Derive a fixed-length key via SHA-256 so any string length works
  return crypto.createHash('sha256').update(raw).digest()
}

export function encryptToken(plaintext: string): string {
  const key = getEncKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv(12):tag(16):ciphertext — all hex
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function decryptToken(stored: string): string {
  const parts = stored.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted token format')
  const [ivHex, tagHex, encHex] = parts
  const key = getEncKey()
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const enc = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(enc).toString('utf8') + decipher.final('utf8')
}

// Detect whether a stored value is already encrypted (contains ':')
function isEncrypted(value: string): boolean {
  return value.split(':').length === 3
}

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
  validateJiraHost(host)
  const plainToken = isEncrypted(token) ? decryptToken(token) : token
  const res = await fetch(`https://${host}/rest/api/3${path}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${plainToken}`).toString('base64')}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`Jira API error ${res.status}`)
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
