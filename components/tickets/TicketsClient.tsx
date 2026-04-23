'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { TicketTable } from '@/components/tickets/TicketTable'
import { Ticket } from '@/components/tickets/types'

type ContractSummary = {
  id: string
  name: string
  ticketCount: number
}

type Status = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export function TicketsClient({
  contracts,
  tickets,
  selectedContractId,
  locale,
}: {
  contracts: ContractSummary[]
  tickets: Ticket[]
  selectedContractId: string
  locale: string
}) {
  const router = useRouter()
  const tNav = useTranslations('nav')
  const tTicket = useTranslations('ticket')
  const tStatus = useTranslations('status')
  const tCommon = useTranslations('common')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status>('ALL')

  const filtered = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const statusButtons: Array<{ key: Status; label: string }> = [
    { key: 'ALL', label: tTicket('all') },
    { key: 'OPEN', label: tStatus('OPEN') },
    { key: 'IN_PROGRESS', label: tStatus('IN_PROGRESS') },
    { key: 'RESOLVED', label: tStatus('RESOLVED') },
    { key: 'CLOSED', label: tStatus('CLOSED') },
  ]

  return (
    <div className="flex h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Sidebar */}
      <aside
        className="w-[200px] flex-shrink-0 border-r overflow-y-auto"
        style={{ borderColor: 'var(--border-light)', background: 'var(--bg-sidebar)' }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-wider px-4 py-3"
          style={{ color: 'var(--text-muted)' }}
        >
          {tNav('contracts')}
        </div>
        {contracts.map((c) => {
          const active = c.id === selectedContractId
          return (
            <button
              key={c.id}
              onClick={() => router.push(`/${locale}/tickets?contractId=${c.id}`)}
              className="w-full text-left flex items-center justify-between px-4 py-2 text-[11.5px] transition-colors"
              style={
                active
                  ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)', fontWeight: 700 }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <span className="truncate">📁 {c.name}</span>
              <span
                className="ml-2 flex-shrink-0 rounded-full px-1.5 py-0 text-[9px]"
                style={
                  active
                    ? { background: 'rgba(255,255,255,0.25)', color: 'inherit' }
                    : { background: 'var(--tab-bg)', color: 'var(--text-muted)' }
                }
              >
                {c.ticketCount}
              </span>
            </button>
          )
        })}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`🔍 ${tCommon('search')}`}
            className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg text-[11.5px] outline-none"
            style={{ background: 'var(--tab-bg)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-1 flex-wrap">
            {statusButtons.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                style={
                  statusFilter === s.key
                    ? { background: '#3b82f6', color: '#fff' }
                    : { background: 'var(--tab-bg)', color: 'var(--text-muted)' }
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <TicketTable tickets={filtered} contractId={selectedContractId} locale={locale} />
      </div>
    </div>
  )
}
