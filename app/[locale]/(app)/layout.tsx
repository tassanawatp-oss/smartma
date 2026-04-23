import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}/login`)

  return (
    <AppShell
      locale={locale}
      title=""
      userName={session.user.name ?? ''}
      userRole={session.user.role as string}
    >
      {children}
    </AppShell>
  )
}
