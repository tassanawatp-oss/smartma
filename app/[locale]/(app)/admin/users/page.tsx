import { prisma } from '@/lib/prisma'
import { UsersTable } from '@/components/admin/UsersTable'

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <UsersTable
        users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        locale={locale}
      />
    </div>
  )
}
