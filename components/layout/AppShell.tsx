import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  children: React.ReactNode
  locale: string
  title: string
  breadcrumb?: string
  userName: string
  userRole: string
}

export function AppShell({ children, locale, title, breadcrumb, userName, userRole }: AppShellProps) {
  return (
    <div className="flex" style={{ height: '100dvh', overflow: 'hidden' }}>
      <Sidebar locale={locale} userName={userName} userRole={userRole} />
      <div className="flex flex-col overflow-hidden min-w-0" style={{ flex: 1 }}>
        <Topbar title={title} breadcrumb={breadcrumb} locale={locale} />
        <main className="flex-1 overflow-y-auto p-5" style={{ background: 'var(--bg-main)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
