'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { NOTIFICATIONS, getReadIds, markAsRead } from '@/lib/notifications'

export function Topbar({ title, breadcrumb, locale }: { title: string; breadcrumb?: string; locale: string }) {
  const [dark, setDark] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [readIds, setReadIds] = useState<Set<number>>(new Set())
  const notifRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const unreadCount = NOTIFICATIONS.filter(n => !readIds.has(n.id)).length

  useEffect(() => {
    setReadIds(getReadIds())
    const sync = () => setReadIds(getReadIds())
    window.addEventListener('notif-update', sync)
    return () => window.removeEventListener('notif-update', sync)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      setDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  function switchLocale(newLocale: string) {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <header
      className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
      style={{ background: 'var(--topbar-bg)', borderColor: 'var(--border)' }}
    >
      <div className="flex-1">
        <div className="text-[15px] font-black" style={{ color: 'var(--text-primary)' }}>{title}</div>
        {breadcrumb && (
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{breadcrumb}</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Lang toggle */}
        <div className="flex rounded-md overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {(['th', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`px-2 py-1 text-[10px] font-bold cursor-pointer border-none transition-colors ${
                locale === l ? 'bg-blue-500 text-white' : ''
              }`}
              style={locale !== l ? { background: 'var(--tab-bg)', color: 'var(--text-muted)' } : {}}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Notification */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-sm border-none"
            style={{ background: 'var(--tab-bg)' }}
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div
              className="absolute top-10 right-0 w-72 rounded-xl shadow-xl border z-50 overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                การแจ้งเตือน
              </div>
              <ul>
                {NOTIFICATIONS.map(n => {
                  const isRead = readIds.has(n.id)
                  return (
                    <li
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className="flex items-start gap-3 px-4 py-3 border-b hover:bg-black/[0.03] cursor-pointer"
                      style={{ borderColor: 'var(--border-light)' }}
                    >
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isRead ? '' : 'bg-blue-500'}`}
                        style={isRead ? { background: 'var(--border)' } : {}} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] leading-snug" style={{ color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.text}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <button
                onClick={() => { setShowNotif(false); router.push(`/${locale}/notifications`) }}
                className="w-full px-4 py-2.5 text-center text-[12px] font-medium border-none cursor-pointer"
                style={{ background: 'transparent', color: 'var(--nav-active-text)' }}
              >
                ดูทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-sm border-none"
          style={{ background: 'var(--tab-bg)' }}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
