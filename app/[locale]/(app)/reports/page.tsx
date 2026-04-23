import { prisma } from '@/lib/prisma'

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const contracts = await prisma.contract.findMany({
    include: { tickets: { select: { status: true, type: true } } },
  })

  const summary = contracts.map((c) => ({
    id: c.id,
    name: c.name.length > 25 ? c.name.slice(0, 25) + '…' : c.name,
    open: c.tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: c.tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: c.tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length,
    total: c.tickets.length,
  }))

  const totals = {
    open: summary.reduce((a, c) => a + c.open, 0),
    inProgress: summary.reduce((a, c) => a + c.inProgress, 0),
    resolved: summary.reduce((a, c) => a + c.resolved, 0),
    total: summary.reduce((a, c) => a + c.total, 0),
  }

  const maxTotal = Math.max(...summary.map((c) => c.total), 1)

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Tickets ทั้งหมด', value: totals.total, color: undefined },
          { label: 'Open', value: totals.open, color: '#ef4444' },
          { label: 'In Progress', value: totals.inProgress, color: '#f59e0b' },
          { label: 'แก้ไขแล้ว', value: totals.resolved, color: '#10b981' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="text-2xl font-black" style={{ color: s.color ?? 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl p-5 border mb-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
        <div className="text-[12.5px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {locale === 'th' ? 'Tickets ตามสัญญา' : 'Tickets by Contract'}
        </div>
        <div className="flex items-end gap-3" style={{ height: 120 }}>
          {summary.map((c) => (
            <div key={c.id} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 90 }}>
                {/* stacked bar */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {c.open > 0 && (
                    <div style={{ height: `${(c.open / maxTotal) * 80}px`, background: '#ef4444', borderRadius: 3 }} />
                  )}
                  {c.inProgress > 0 && (
                    <div style={{ height: `${(c.inProgress / maxTotal) * 80}px`, background: '#f59e0b', borderRadius: 3 }} />
                  )}
                  {c.resolved > 0 && (
                    <div style={{ height: `${(c.resolved / maxTotal) * 80}px`, background: '#10b981', borderRadius: 3 }} />
                  )}
                  {c.total === 0 && (
                    <div style={{ height: 4, background: 'var(--tab-bg)', borderRadius: 3 }} />
                  )}
                </div>
              </div>
              <div className="text-[9px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>{c.name}</div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-3">
          {[{ label: 'Open', color: '#ef4444' }, { label: 'In Progress', color: '#f59e0b' }, { label: 'Done', color: '#10b981' }].map((l) => (
            <div key={l.label} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
        <table className="w-full text-[11.5px] border-collapse">
          <thead>
            <tr style={{ background: 'var(--tab-bg)' }}>
              {['สัญญา', 'Open', 'In Progress', 'Done', 'รวม'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-light)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.map((c) => (
              <tr key={c.id} className="border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
                <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                <td className="px-4 py-3 font-bold text-red-500">{c.open}</td>
                <td className="px-4 py-3 font-bold text-amber-600">{c.inProgress}</td>
                <td className="px-4 py-3 font-bold text-green-600">{c.resolved}</td>
                <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{c.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
