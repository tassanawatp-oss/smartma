'use client'

const STEPS = [
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
]

export function StatusFlow({ status }: { status: string }) {
  const currentIdx = STEPS.findIndex((s) => s.key === status)
  return (
    <div className="flex">
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx
        const isActive = i === currentIdx
        return (
          <div
            key={step.key}
            className={`flex-1 text-center py-2 text-[10.5px] font-semibold border-t-[3px] ${isDone ? 'border-green-500 text-green-600' : isActive ? 'border-blue-500 text-blue-600 rounded-b-md' : ''}`}
            style={!isDone && !isActive ? { borderColor: 'var(--border)', color: 'var(--text-muted)' } : isActive ? { background: 'rgba(59,130,246,0.06)' } : {}}
          >
            {step.label}
          </div>
        )
      })}
    </div>
  )
}
