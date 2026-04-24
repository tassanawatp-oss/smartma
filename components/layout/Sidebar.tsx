'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

const navItems = [
  { key: 'contracts', icon: '📁', href: '/contracts' },
  { key: 'tickets',   icon: '🎫', href: '/tickets' },
  { key: 'reports',   icon: '📊', href: '/reports' },
  { key: 'jiraSync',  icon: '🔗', href: '/jira-sync' },
]

const adminItems = [
  { key: 'users',    icon: '👥', href: '/admin/users' },
  { key: 'settings', icon: '⚙️', href: '/settings' },
]

export function Sidebar({ locale, userName, userRole }: { locale: string; userName: string; userRole: string }) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => pathname.includes(href)
  const linkHref = (href: string) => `/${locale}${href}`

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-sidebar)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-light)' }}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm flex-shrink-0">
          ⚡
        </div>
        <div>
          <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>SmartMA</div>
          <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>v1.0.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider px-2 mb-2" style={{ color: 'var(--text-muted)' }}>
          {locale === 'th' ? 'เมนูหลัก' : 'Main'}
        </div>
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={linkHref(item.href)}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] mb-0.5 transition-all no-underline ${isActive(item.href) ? 'font-bold' : 'hover:bg-indigo-50/50'}`}
            style={isActive(item.href) ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)' } : { color: 'var(--text-secondary)' }}
          >
            <span className="w-4 text-center text-sm">{item.icon}</span>
            {t(item.key)}
          </Link>
        ))}

        <div className="text-[10px] font-bold uppercase tracking-wider px-2 mt-4 mb-2" style={{ color: 'var(--text-muted)' }}>
          {locale === 'th' ? 'จัดการ' : 'Admin'}
        </div>
        {adminItems.map((item) => (
          <Link
            key={item.key}
            href={linkHref(item.href)}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] mb-0.5 transition-all no-underline ${isActive(item.href) ? 'font-bold' : 'hover:bg-indigo-50/50'}`}
            style={isActive(item.href) ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)' } : { color: 'var(--text-secondary)' }}
          >
            <span className="w-4 text-center text-sm">{item.icon}</span>
            {t(item.key)}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-2 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{userName}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{userRole}</div>
          </div>
          <button
            onClick={() => signOut({ redirectTo: `${window.location.origin}/${locale}/login` })}
            title="Logout"
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm border-none cursor-pointer flex-shrink-0 hover:bg-red-50"
            style={{ background: 'var(--tab-bg)', color: 'var(--text-muted)' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — always in document flow */}
      <aside
        className="hidden md:flex flex-col w-[210px] flex-shrink-0 border-r h-full"
        style={{ borderColor: 'var(--border)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center text-lg border-none cursor-pointer"
      >
        ☰
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-[210px] z-50 md:hidden border-r" style={{ borderColor: 'var(--border)' }}>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
