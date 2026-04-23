'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { StatusFlow } from '@/components/tickets/StatusFlow'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

type Ticket = {
  id: string; title: string; description: string; type: string; priority: string; status: string
  jiraKey: string | null; jiraSyncAt: string | null; updatedAt: string
  assignee: { id: string; name: string } | null
  contract: { id: string; name: string; jiraConfig: { host: string; projectKey: string } | null }
  comments: Array<{ id: string; body: string; createdAt: string; author: { name: string } }>
}

const STATUS_ACTIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
}

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'รับงาน', RESOLVED: 'แก้ไขแล้ว', CLOSED: 'ปิด', OPEN: 'เปิด',
}

const priorityVariant: Record<string, 'p1'|'p2'|'p3'|'p4'> = { P1: 'p1', P2: 'p2', P3: 'p3', P4: 'p4' }
const statusVariant: Record<string, 'open'|'in_progress'|'resolved'|'closed'> = {
  OPEN: 'open', IN_PROGRESS: 'in_progress', RESOLVED: 'resolved', CLOSED: 'closed',
}

export default function TicketDetailPage() {
  const { locale, id, ticketId } = useParams() as { locale: string; id: string; ticketId: string }
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/tickets/${ticketId}`).then((r) => r.json()).then(setTicket)
  }, [ticketId])

  async function updateStatus(status: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setTicket((prev) => prev ? { ...prev, status } : prev)
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: comment }),
    })
    const newComment = await res.json()
    setTicket((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev)
    setComment('')
    setSubmitting(false)
  }

  if (!ticket) return <div className="text-sm p-4" style={{ color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div>
      <Link href={`/${locale}/contracts/${id}/tickets`} className="inline-flex items-center gap-1 text-[11.5px] mb-3 no-underline" style={{ color: 'var(--text-muted)' }}>
        ← กลับ
      </Link>

      <div className="flex gap-4">
        {/* Main */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <Card>
            <CardBody>
              <h1 className="text-base font-black mb-2" style={{ color: 'var(--text-primary)' }}>{ticket.title}</h1>
              <StatusFlow status={ticket.status} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <span className="text-[12.5px] font-bold" style={{ color: 'var(--text-primary)' }}>รายละเอียด</span>
            </CardHeader>
            <CardBody>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {ticket.description || <span style={{ color: 'var(--text-muted)' }}>ไม่มีรายละเอียด</span>}
              </p>
            </CardBody>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <span className="text-[12.5px] font-bold" style={{ color: 'var(--text-primary)' }}>ความคิดเห็น ({ticket.comments.length})</span>
            </CardHeader>
            <CardBody className="flex flex-col gap-3">
              {ticket.comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {c.author.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 rounded-lg px-3 py-2" style={{ background: 'var(--tab-bg)' }}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{c.author.name}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString('th-TH')}</span>
                    </div>
                    <p className="text-[11.5px] mt-1" style={{ color: 'var(--text-secondary)' }}>{c.body}</p>
                  </div>
                </div>
              ))}
              <form onSubmit={addComment} className="flex gap-2 mt-1">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="เพิ่มความคิดเห็น..."
                  className="flex-1 h-9 px-3 rounded-lg border text-sm"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                />
                <Button type="submit" size="sm" disabled={submitting}>ส่ง</Button>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-3">
          {/* Meta */}
          <Card>
            <CardBody className="flex flex-col gap-0">
              {[
                { label: 'Status', value: <Badge variant={statusVariant[ticket.status]} label={ticket.status.replace('_', ' ')} /> },
                { label: 'Priority', value: <Badge variant={priorityVariant[ticket.priority]} label={ticket.priority} /> },
                { label: 'Type', value: <Badge variant={ticket.type.toLowerCase() as 'hw'|'sw'} label={ticket.type} /> },
                { label: 'Assignee', value: <span className="text-[11.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>{ticket.assignee?.name ?? '—'}</span> },
                { label: 'Updated', value: <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{new Date(ticket.updatedAt).toLocaleDateString('th-TH')}</span> },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-1.5 border-b last:border-0 text-[11.5px]" style={{ borderColor: 'var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  {row.value}
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Status actions */}
          {STATUS_ACTIONS[ticket.status].length > 0 && (
            <Card>
              <CardBody className="flex flex-col gap-2">
                <div className="text-[11px] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>เปลี่ยน Status</div>
                {STATUS_ACTIONS[ticket.status].map((s) => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className="w-full py-2 rounded-lg text-[11px] font-bold cursor-pointer border-2 transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Jira */}
          {ticket.jiraKey && (
            <Card>
              <CardBody>
                <div className="text-[11px] font-bold text-blue-700 mb-2">🔗 Jira</div>
                <div className="flex justify-between text-[10.5px] py-1 border-b" style={{ borderColor: '#dbeafe' }}>
                  <span className="text-slate-500">Key</span>
                  <span className="text-blue-700 font-bold">{ticket.jiraKey}</span>
                </div>
                {ticket.jiraSyncAt && (
                  <div className="flex justify-between text-[10.5px] py-1">
                    <span className="text-slate-500">Last sync</span>
                    <span className="text-green-600 font-bold">✓ {new Date(ticket.jiraSyncAt).toLocaleDateString('th-TH')}</span>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
