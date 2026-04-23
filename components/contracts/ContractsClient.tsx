'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ContractCard } from './ContractCard'

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

export function ContractsClient({
  contracts,
  locale,
}: {
  contracts: ContractWithTickets[]
  locale: string
}) {
  const t = useTranslations('contract')
  const tCommon = useTranslations('common')

  const [search, setSearch] = useState('')
  const [sector, setSector] = useState<'ALL' | 'GOV' | 'PRIVATE'>('ALL')

  const filtered = contracts.filter((c) => {
    const matchesSector = sector === 'ALL' || c.sector === sector
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.serviceType.toLowerCase().includes(q)
    return matchesSector && matchesSearch
  })

  const filters: Array<{ key: 'ALL' | 'GOV' | 'PRIVATE'; label: string }> = [
    { key: 'ALL', label: t('all') },
    { key: 'GOV', label: t('gov') },
    { key: 'PRIVATE', label: t('private') },
  ]

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`🔍 ${tCommon('search')}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px] flex-1 min-w-[160px] outline-none"
          style={{ background: 'var(--tab-bg)', color: 'var(--text-primary)' }}
        />
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setSector(f.key)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
              style={
                sector === f.key
                  ? { background: '#3b82f6', color: '#fff' }
                  : { background: 'var(--tab-bg)', color: 'var(--text-muted)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Link
            href={`/${locale}/contracts/new`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 no-underline"
          >
            + {t('new')}
          </Link>
        </div>
      </div>

      {/* Contract grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((c) => (
          <ContractCard key={c.id} contract={c} locale={locale} />
        ))}
        <Link
          href={`/${locale}/contracts/new`}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer no-underline hover:border-blue-400 transition-colors min-h-[140px]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <div className="text-3xl mb-1">＋</div>
          <div className="text-xs">{t('new')}</div>
        </Link>
      </div>
    </>
  )
}
