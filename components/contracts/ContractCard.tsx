'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/Badge'

type ContractWithTickets = {
  id: string
  name: string
  sector: 'GOV' | 'PRIVATE'
  serviceType: string
  startDate: string
  endDate: string
  tickets: Array<{ status: string }>
  jiraConfig?: { host: string; projectKey: string; updatedAt: string } | null
}

export function ContractCard({ contract, locale }: { contract: ContractWithTickets; locale: string }) {
  const tSector = useTranslations('sector')

  const open = contract.tickets.filter((t) => t.status === 'OPEN').length
  const inProg = contract.tickets.filter((t) => t.status === 'IN_PROGRESS').length
  const done = contract.tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length
  const total = contract.tickets.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const start = new Date(contract.startDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const end = new Date(contract.endDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <Link
      href={`/${locale}/contracts/${contract.id}/tickets`}
      className="block rounded-xl p-4 border-[1.5px] transition-all hover:-translate-y-0.5 no-underline cursor-pointer"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="text-[13px] font-bold pr-2" style={{ color: 'var(--text-primary)' }}>{contract.name}</div>
        <Badge variant={contract.sector === 'GOV' ? 'gov' : 'private'} label={tSector(contract.sector)} />
      </div>
      <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
        📅 {start} – {end} · {contract.serviceType}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-3" style={{ background: 'var(--tab-bg)' }}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Ticket counts */}
      <div className="flex gap-3 mb-2">
        <div className="flex items-center gap-1 text-[10.5px] font-semibold text-red-500">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />{open} Open
        </div>
        <div className="flex items-center gap-1 text-[10.5px] font-semibold text-amber-600">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />{inProg} In Progress
        </div>
        <div className="flex items-center gap-1 text-[10.5px] font-semibold text-green-600">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />{done} Done
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t text-[10.5px]" style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
        <span>{total} tickets total</span>
        <span className={contract.jiraConfig ? 'text-green-600' : 'text-slate-400'}>
          🔗 Jira {contract.jiraConfig ? '✓' : '—'}
        </span>
      </div>
    </Link>
  )
}
