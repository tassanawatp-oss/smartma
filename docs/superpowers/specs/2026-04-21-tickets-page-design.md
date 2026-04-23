# Tickets Page Design

**Date:** 2026-04-21  
**Status:** Approved

## Overview

สร้างหน้า `/tickets` ที่แสดง tickets แบ่งตาม contract โดยใช้ Sidebar layout — ผู้ใช้เลือก contract ทางซ้าย ตารางทางขวาแสดง tickets ของ contract นั้น

## Architecture

- **Route:** `app/[locale]/(app)/tickets/page.tsx`
- **Pattern:** Server Component — รับ `searchParams.contractId` แล้ว query Prisma โดยตรง ไม่มี client-side fetch
- **Navigation:** กดแถว ticket → ไปหน้า `/contracts/[contractId]/tickets/[ticketId]` (หน้า detail เดิม)

## Components

### Page (`tickets/page.tsx`)
Server Component ดึง contracts ทั้งหมด และ tickets ของ `contractId` ที่เลือก (จาก `searchParams`) แล้ว pass ให้ `TicketsClient`

### `TicketsClient` (client component ใหม่)
รับ `contracts` และ `tickets` เป็น props ทำหน้าที่:
- Sidebar: รายชื่อ contracts พร้อมจำนวน tickets แต่ละสัญญา
- Filter bar: ช่องค้นหาชื่อ + ปุ่ม filter สถานะ (ทั้งหมด / OPEN / IN_PROGRESS / RESOLVED)
- ตาราง: ใช้ `TicketTable` component ที่มีอยู่แล้ว

### Sidebar contract selection
กดชื่อ contract → `router.push(`/[locale]/tickets?contractId=xxx`)` → page reload พร้อม contractId ใหม่

## Data Flow

```
URL: /th/tickets?contractId=abc123&status=OPEN
         ↓
page.tsx (Server Component)
  - prisma.contract.findMany() → รายชื่อทั้งหมด + จำนวน tickets
  - prisma.ticket.findMany({ where: { contractId } }) → tickets ที่เลือก
         ↓
TicketsClient (props: contracts, tickets, selectedContractId, locale)
  - Sidebar แสดง contracts
  - Filter + search กรอง tickets ฝั่ง client (ไม่ reload)
  - TicketTable แสดงผล
```

## Filter Behavior

- **Contract selection:** เปลี่ยน URL (`?contractId=xxx`) → server reload ดึง tickets ใหม่
- **Status filter + Search:** กรองฝั่ง client จาก tickets ที่โหลดมาแล้ว (ไม่ reload)
- **Default state:** ถ้าไม่มี `contractId` ใน URL → เลือก contract แรกโดยอัตโนมัติ

## Files to Create/Modify

| File | Action |
|------|--------|
| `app/[locale]/(app)/tickets/page.tsx` | สร้างใหม่ |
| `components/tickets/TicketsClient.tsx` | สร้างใหม่ |
| `components/layout/Sidebar.tsx` | แก้ไขแล้ว (link ถูกต้อง) |

## Out of Scope

- Stats summary (ไม่ต้องการ)
- Detail panel ในหน้าเดียวกัน (ใช้หน้า detail เดิม)
- สร้าง ticket ใหม่จากหน้านี้
