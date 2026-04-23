# Tickets Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างหน้า `/tickets` ที่แสดง sidebar รายชื่อ contracts ทางซ้าย และตาราง tickets ของ contract ที่เลือกทางขวา พร้อม filter ค้นหาและกรองสถานะ

**Architecture:** Server Component (`page.tsx`) รับ `searchParams.contractId` แล้ว query Prisma โดยตรง ส่งข้อมูลให้ `TicketsClient` (Client Component) ที่จัดการ sidebar + filter ฝั่ง client โดยไม่ต้อง fetch ใหม่เมื่อ filter

**Tech Stack:** Next.js App Router, Prisma, next-intl, Tailwind CSS, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/[locale]/(app)/tickets/page.tsx` | สร้างใหม่ | Server Component — fetch data, pass props |
| `components/tickets/TicketsClient.tsx` | สร้างใหม่ | Client Component — sidebar, filter, ตาราง |

---

### Task 1: สร้าง `TicketsClient` component

**Files:**
- Create: `components/tickets/TicketsClient.tsx`

- [ ] **Step 1: สร้างไฟล์ `components/tickets/TicketsClient.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { TicketTable } from '@/components/tickets/TicketTable'

type ContractSummary = {
  id: string
  name: string
  ticketCount: number
}

type Ticket = {
  id: string
  title: string
  type: string
  priority: string
  status: string
  jiraKey: string | null
  updatedAt: string
  assignee: { name: string } | null
}

type Status = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export function TicketsClient({
  contracts,
  tickets,
  selectedContractId,
  locale,
}: {
  contracts: ContractSummary[]
  tickets: Ticket[]
  selectedContractId: string
  locale: string
}) {
  const router = useRouter()
  const tTicket = useTranslations('ticket')
  const tStatus = useTranslations('status')
  const tCommon = useTranslations('common')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status>('ALL')

  const filtered = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const statusButtons: Array<{ key: Status; label: string }> = [
    { key: 'ALL', label: tTicket('all') },
    { key: 'OPEN', label: tStatus('OPEN') },
    { key: 'IN_PROGRESS', label: tStatus('IN_PROGRESS') },
    { key: 'RESOLVED', label: tStatus('RESOLVED') },
    { key: 'CLOSED', label: tStatus('CLOSED') },
  ]

  return (
    <div className="flex h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Sidebar */}
      <aside
        className="w-[200px] flex-shrink-0 border-r overflow-y-auto"
        style={{ borderColor: 'var(--border-light)', background: 'var(--bg-sidebar)' }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-wider px-4 py-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Contracts
        </div>
        {contracts.map((c) => {
          const active = c.id === selectedContractId
          return (
            <button
              key={c.id}
              onClick={() => router.push(`/${locale}/tickets?contractId=${c.id}`)}
              className="w-full text-left flex items-center justify-between px-4 py-2 text-[11.5px] transition-colors"
              style={
                active
                  ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)', fontWeight: 700 }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <span className="truncate">📁 {c.name}</span>
              <span
                className="ml-2 flex-shrink-0 rounded-full px-1.5 py-0 text-[9px]"
                style={
                  active
                    ? { background: 'rgba(255,255,255,0.25)', color: 'inherit' }
                    : { background: 'var(--tab-bg)', color: 'var(--text-muted)' }
                }
              >
                {c.ticketCount}
              </span>
            </button>
          )
        })}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`🔍 ${tCommon('search')}`}
            className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg text-[11.5px] outline-none"
            style={{ background: 'var(--tab-bg)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-1 flex-wrap">
            {statusButtons.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                style={
                  statusFilter === s.key
                    ? { background: '#3b82f6', color: '#fff' }
                    : { background: 'var(--tab-bg)', color: 'var(--text-muted)' }
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <TicketTable tickets={filtered} contractId={selectedContractId} locale={locale} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/tickets/TicketsClient.tsx
git commit -m "feat: add TicketsClient component with sidebar and filter"
```

---

### Task 2: สร้าง `tickets/page.tsx`

**Files:**
- Create: `app/[locale]/(app)/tickets/page.tsx`

- [ ] **Step 1: สร้างไฟล์ `app/[locale]/(app)/tickets/page.tsx`**

```tsx
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
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

  const session = await auth()
  if (!session?.user) redirect(`/${locale}/login`)

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
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      })
    : []

  const ticketData = tickets.map((t) => ({
    ...t,
    updatedAt: t.updatedAt.toISOString(),
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
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/\(app\)/tickets/page.tsx
git commit -m "feat: add tickets page with sidebar contract selection"
```

---

### Task 3: ทดสอบในเบราว์เซอร์

- [ ] **Step 1: เปิด** `http://localhost:3456/th/tickets` ตรวจสอบ:
  - Sidebar แสดงรายชื่อ contracts พร้อมจำนวน tickets
  - Contract แรกถูก highlight และตารางแสดง tickets ของ contract นั้น

- [ ] **Step 2: ทดสอบ sidebar** — กดเปลี่ยน contract ตรวจสอบว่าตารางอัปเดตถูกต้อง

- [ ] **Step 3: ทดสอบ filter** — พิมพ์ค้นหาและกดปุ่มสถานะ ตรวจสอบว่ากรองได้ถูกต้องโดยไม่ reload หน้า

- [ ] **Step 4: ทดสอบ click ticket** — กดแถวใดแถวหนึ่งตรวจสอบว่านำทางไปหน้า detail ถูกต้อง (`/contracts/[id]/tickets/[ticketId]`)

- [ ] **Step 5: ทดสอบเมนู Sidebar** — กดเมนู "Tickets" ใน sidebar ของแอปตรวจสอบว่ามาหน้า `/tickets` ไม่ใช่ `/contracts`
