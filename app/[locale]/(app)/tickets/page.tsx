import { prisma } from '@/lib/prisma'
import { TicketsClient } from '@/components/tickets/TicketsClient'

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ contractId?: string }>
}) {
  const { locale } = await params
  const { contractId } = await searchParams

  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { tickets: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const contractSummaries = contracts.map((c) => ({
    id: c.id,
    name: c.name,
    ticketCount: c._count.tickets,
  }))

  const selectedId = contractId ?? contractSummaries[0]?.id ?? ''

  const tickets = selectedId
    ? await prisma.ticket.findMany({
        where: { contractId: selectedId },
        include: { assignee: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
      })
    : []

  const ticketData = tickets.map((t) => ({
    id: t.id,
    title: t.title,
    type: t.type,
    priority: t.priority,
    status: t.status,
    jiraKey: t.jiraKey,
    updatedAt: t.updatedAt.toISOString(),
    assignee: t.assignee ? { name: t.assignee.name } : null,
  }))

  return (
    <TicketsClient
      contracts={contractSummaries}
      tickets={ticketData}
      selectedContractId={selectedId}
      locale={locale}
    />
  )
}
