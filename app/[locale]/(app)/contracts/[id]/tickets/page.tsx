import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TicketTable } from '@/components/tickets/TicketTable'
import { getTranslations } from 'next-intl/server'

export default async function TicketsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const t = await getTranslations('ticket')

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      tickets: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })
  if (!contract) notFound()

  const open = contract.tickets.filter((t) => t.status === 'OPEN').length
  const inProg = contract.tickets.filter((t) => t.status === 'IN_PROGRESS').length
  const done = contract.tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length

  const ticketData = contract.tickets.map((tk) => ({
    ...tk,
    updatedAt: tk.updatedAt.toISOString(),
  }))

  return (
    <div>
      {/* Back */}
      <Link href={`/${locale}/contracts`} className="inline-flex items-center gap-1 text-[11.5px] mb-3 no-underline" style={{ color: 'var(--text-muted)' }}>
        ← {locale === 'th' ? 'กลับไปรายการสัญญา' : 'Back to Contracts'}
      </Link>

      {/* Contract banner */}
      <div className="rounded-xl p-4 mb-4 border-l-4 border-blue-500 border flex items-center gap-4" style={{ background: 'var(--bg-card)', borderRightColor: 'var(--border-light)', borderTopColor: 'var(--border-light)', borderBottomColor: 'var(--border-light)' }}>
        <div className="flex-1">
          <div className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>📁 {contract.name}</div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {contract.sector} · {contract.serviceType}
          </div>
        </div>
        <div className="flex gap-4">
          {[{ label: 'Open', val: open, color: '#ef4444' }, { label: 'In Progress', val: inProg, color: '#f59e0b' }, { label: 'Done', val: done, color: '#10b981' }].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg font-black" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px] flex-1 min-w-[140px]" style={{ background: 'var(--tab-bg)', color: 'var(--text-muted)' }}>
          🔍 {locale === 'th' ? 'ค้นหา Ticket...' : 'Search tickets...'}
        </div>
        <div className="flex gap-1">
          {[t('all'), 'Open', 'In Progress', 'Done'].map((label, i) => (
            <span key={label} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${i === 0 ? 'bg-blue-500 text-white' : ''}`} style={i !== 0 ? { background: 'var(--tab-bg)', color: 'var(--text-muted)' } : {}}>
              {label}
            </span>
          ))}
        </div>
        <Link
          href={`/${locale}/contracts/${id}/tickets/new`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 no-underline"
        >
          + {t('new')}
        </Link>
      </div>

      <TicketTable tickets={ticketData} contractId={id} locale={locale} />
    </div>
  )
}
