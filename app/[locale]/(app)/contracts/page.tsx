import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ContractsClient } from '@/components/contracts/ContractsClient'
import { getTranslations } from 'next-intl/server'

export default async function ContractsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth()
  const t = await getTranslations('contract')
  const contracts = await prisma.contract.findMany({
    include: {
      tickets: { select: { status: true } },
      jiraConfig: { select: { host: true, projectKey: true, updatedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const allTickets = contracts.flatMap((c) => c.tickets)
  const openCount = allTickets.filter((t) => t.status === 'OPEN').length
  const inProgCount = allTickets.filter((t) => t.status === 'IN_PROGRESS').length

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: t('totalContracts'), value: contracts.length, sub: null, color: undefined },
          { label: t('openTickets'), value: openCount, sub: null, color: '#3b82f6' },
          { label: t('inProgress'), value: inProgCount, sub: null, color: '#f59e0b' },
          { label: t('jiraSync'), value: '✓', sub: null, color: '#10b981' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3.5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="text-2xl font-black" style={{ color: s.color ?? 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ContractsClient
        contracts={contracts.map((c) => ({
          ...c,
          startDate: c.startDate.toISOString(),
          endDate: c.endDate.toISOString(),
          jiraConfig: c.jiraConfig
            ? { ...c.jiraConfig, updatedAt: c.jiraConfig.updatedAt.toISOString() }
            : null,
        }))}
        locale={locale}
      />
    </div>
  )
}
