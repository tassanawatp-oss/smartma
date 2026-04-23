'use client'

import { useEffect, useState } from 'react'
import { NOTIFICATIONS, getReadIds, markAsRead, markAllAsRead } from '@/lib/notifications'

export default function NotificationsPage() {
  const [readIds, setReadIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    setReadIds(getReadIds())
    const sync = () => setReadIds(getReadIds())
    window.addEventListener('notif-update', sync)
    return () => window.removeEventListener('notif-update', sync)
  }, [])

  const unread = NOTIFICATIONS.filter(n => !readIds.has(n.id))
  const read = NOTIFICATIONS.filter(n => readIds.has(n.id))

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>การแจ้งเตือน</h1>
        {unread.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[12px] border-none cursor-pointer"
            style={{ background: 'transparent', color: 'var(--nav-active-text)' }}
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>

      {unread.length > 0 && (
        <section className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            ยังไม่ได้อ่าน ({unread.length})
          </p>
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
            {unread.map((n, i) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-black/[0.03] ${i < unread.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border-light)' }}
              >
                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{n.text}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            อ่านแล้ว
          </p>
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
            {read.map((n, i) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 ${i < read.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border-light)' }}
              >
                <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--border)' }} />
                <div>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{n.text}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {unread.length === 0 && read.length === 0 && (
        <p className="text-center text-[13px] mt-10" style={{ color: 'var(--text-muted)' }}>ไม่มีการแจ้งเตือน</p>
      )}
    </div>
  )
}
