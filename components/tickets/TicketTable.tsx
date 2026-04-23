'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/Badge'
import { Ticket } from '@/components/tickets/types'

const statusVariant: Record<string, string> = {
  OPEN: 'open', IN_PROGRESS: 'in_progress', RESOLVED: 'resolved', CLOSED: 'closed',
}
const priorityVariant: Record<string, string> = { P1: 'p1', P2: 'p2', P3: 'p3', P4: 'p4' }

export function TicketTable({ tickets, contractId, locale }: { tickets: Ticket[]; contractId: string; locale: string }) {
  const tStatus = useTranslations('status')
  const tPriority = useTranslations('priority')
  const tType = useTranslations('type')
  const tTicket = useTranslations('ticket')

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px] border-collapse">
          <thead>
            <tr style={{ background: 'var(--tab-bg)', borderBottom: '1px solid var(--border-light)' }}>
              {['#', tTicket('subject'), tTicket('type'), tTicket('priority'), tTicket('status'), tTicket('assignee'), 'Jira', tTicket('updated')].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr
                key={t.id}
                className="cursor-pointer hover:bg-black/[0.02] border-b last:border-0"
                style={{ borderColor: 'var(--border-light)' }}
                onClick={() => { window.location.href = `/${locale}/contracts/${contractId}/tickets/${t.id}` }}
              >
                <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>#{String(i + 1).padStart(3, '0')}</td>
                <td className="px-3 py-2.5 font-semibold max-w-[200px] truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={t.type.toLowerCase() as 'hw' | 'sw'} label={tType(t.type)} />
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={priorityVariant[t.priority] as 'p1' | 'p2' | 'p3' | 'p4'} label={tPriority(t.priority)} />
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={statusVariant[t.status] as 'open' | 'in_progress' | 'resolved' | 'closed'} label={tStatus(t.status)} />
                </td>
                <td className="px-3 py-2.5" style={{ color: 'var(--text-secondary)' }}>{t.assignee?.name ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: t.jiraKey ? '#1d4ed8' : 'var(--text-muted)' }}>{t.jiraKey ?? '—'}</td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {new Date(t.updatedAt).toLocaleDateString('th-TH')}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  ไม่มี ticket
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
