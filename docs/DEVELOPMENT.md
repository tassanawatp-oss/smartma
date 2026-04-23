# SmartMA — คู่มือการพัฒนา

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [Tech Stack](#2-tech-stack)
3. [โครงสร้างโปรเจกต์](#3-โครงสร้างโปรเจกต์)
4. [เริ่มต้นพัฒนา (Local Setup)](#4-เริ่มต้นพัฒนา-local-setup)
5. [Data Models](#5-data-models)
6. [API Routes](#6-api-routes)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [Theming & Dark Mode](#9-theming--dark-mode)
10. [Jira Integration](#10-jira-integration)
11. [Layout System](#11-layout-system)
12. [การ Deploy](#12-การ-deploy)
13. [ข้อควรระวัง (Breaking Changes)](#13-ข้อควรระวัง-breaking-changes)

---

## 1. ภาพรวมระบบ

SmartMA คือระบบ Maintenance Management สำหรับบริษัท IT ที่บริหารหลายสัญญา (ภาครัฐ + เอกชน) รองรับ Jira Integration ช่วยให้ PM และ Staff ติดตาม Ticket ได้ในที่เดียว

**ฟีเจอร์หลัก:**
- บริหารสัญญา (Contract) หลายโปรเจกต์พร้อมกัน
- Ticket tracking พร้อม status flow: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`
- Sync สถานะ Ticket จาก Jira อัตโนมัติ
- รายงานสรุป Ticket ตามสัญญา
- ภาษาไทย / อังกฤษ
- Dark mode / Light mode
- Role-based access: Admin, PM, Staff

---

## 2. Tech Stack

| Layer | เทคโนโลยี | เวอร์ชัน |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.4 |
| Language | TypeScript | ^5.9 |
| Styling | Tailwind CSS | v4 |
| ORM | Prisma | v7 |
| Database | PostgreSQL | 14+ |
| Auth | NextAuth.js | v5 beta |
| i18n | next-intl | v4 |
| Server State | TanStack React Query | v5 |
| Runtime | Node.js | 18+ |

---

## 3. โครงสร้างโปรเจกต์

```
smartma/
├── app/
│   ├── layout.tsx                        # Root layout (<html><body>)
│   ├── page.tsx                          # Redirect → /th
│   ├── globals.css                       # CSS variables + Tailwind base
│   ├── [locale]/
│   │   ├── layout.tsx                    # NextIntlClientProvider
│   │   ├── (auth)/login/page.tsx         # Login page (ไม่มี AppShell)
│   │   └── (app)/
│   │       ├── layout.tsx                # Auth guard + AppShell
│   │       ├── contracts/
│   │       │   ├── page.tsx              # รายการสัญญา + stats
│   │       │   ├── new/page.tsx          # สร้างสัญญาใหม่
│   │       │   └── [id]/tickets/
│   │       │       ├── page.tsx          # รายการ Ticket
│   │       │       ├── new/page.tsx      # เปิด Ticket ใหม่
│   │       │       └── [ticketId]/page.tsx  # รายละเอียด Ticket
│   │       ├── reports/page.tsx
│   │       ├── jira-sync/page.tsx
│   │       ├── admin/users/page.tsx
│   │       └── settings/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── contracts/route.ts            # GET list, POST create
│       ├── contracts/[id]/route.ts       # GET, PATCH, DELETE
│       ├── tickets/route.ts              # GET list, POST create
│       ├── tickets/[id]/route.ts         # GET, PATCH, DELETE
│       ├── tickets/[id]/comments/route.ts
│       ├── reports/route.ts
│       ├── jira/sync/route.ts
│       ├── jira/config/route.ts
│       ├── jira/logs/route.ts
│       ├── users/route.ts
│       └── users/[id]/route.ts
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx                  # Wrapper: Sidebar + Topbar + main
│   │   ├── Sidebar.tsx                   # Desktop sidebar + mobile drawer
│   │   └── Topbar.tsx                    # Breadcrumb + lang toggle + dark mode
│   ├── contracts/
│   │   └── ContractCard.tsx
│   ├── tickets/
│   │   ├── TicketTable.tsx
│   │   └── StatusFlow.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Toggle.tsx
├── lib/
│   ├── auth.ts                           # NextAuth config
│   ├── prisma.ts                         # Prisma singleton (driver adapter)
│   ├── jira.ts                           # Jira REST API v3 client
│   └── permissions.ts                    # Role-based permission map
├── types/
│   └── next-auth.d.ts                    # Type augmentation: id, role
├── messages/
│   ├── th.json                           # ภาษาไทย
│   └── en.json                           # English
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── proxy.ts                              # next-intl middleware (ชื่อ proxy ไม่ใช่ middleware)
├── prisma.config.ts                      # Prisma 7 datasource config
└── .env
```

---

## 4. เริ่มต้นพัฒนา (Local Setup)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### ขั้นตอน

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. สร้าง database
createdb smartma

# 3. ตั้งค่า environment variables
# แก้ไข .env ตามนี้:
DATABASE_URL="postgresql://<user>@localhost:5432/smartma"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3456"
ENCRYPTION_KEY="your-32-char-key!!"

# 4. Run migration
npx prisma migrate dev

# 5. Seed ข้อมูลตัวอย่าง
npm run seed

# 6. Start dev server
npm run dev
```

### Test Accounts (หลัง seed)

| Email | Password | Role |
|-------|----------|------|
| admin@smartma.com | password123 | ADMIN |
| pm@smartma.com | password123 | PM |
| staff@smartma.com | password123 | STAFF |

---

## 5. Data Models

### Enums

```prisma
enum Role     { ADMIN PM STAFF }
enum Sector   { GOV PRIVATE }
enum TicketType { HW SW }
enum Priority { P1 P2 P3 P4 }   # P1 = ด่วนมาก, P4 = ต่ำ
enum Status   { OPEN IN_PROGRESS RESOLVED CLOSED }
```

### Models หลัก

**User** — ผู้ใช้งาน, มี `role` และ `active` flag  
**Contract** — สัญญา/โปรเจกต์, ผูกกับ PM ผ่าน `pmId`, optional `jiraProjectKey`  
**ContractMember** — ความสัมพันธ์ User ↔ Contract (many-to-many)  
**Ticket** — Ticket ภายใต้สัญญา, มี `jiraKey` สำหรับ sync  
**Comment** — ความคิดเห็นใน Ticket  
**JiraConfig** — Jira credentials ต่อ 1 Contract (1:1)  
**SyncLog** — บันทึก log การ sync Jira

### เพิ่ม field ใหม่

```bash
# แก้ไข prisma/schema.prisma แล้วรัน:
npx prisma migrate dev --name add_field_name
npx prisma generate
```

---

## 6. API Routes

API ทุก route ใช้ pattern เดียวกัน: ตรวจ session ก่อน, แล้วค่อย query DB

```ts
// ตัวอย่าง pattern
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await prisma.contract.findMany({ ... })
  return NextResponse.json(data)
}
```

### รายการ Endpoints

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/contracts` | ดึงรายการสัญญาทั้งหมด |
| POST | `/api/contracts` | สร้างสัญญาใหม่ |
| GET | `/api/contracts/[id]` | ดึงสัญญาเดี่ยว |
| PATCH | `/api/contracts/[id]` | แก้ไขสัญญา |
| DELETE | `/api/contracts/[id]` | ลบสัญญา |
| GET | `/api/tickets` | ดึง ticket (filter ด้วย `?contractId=`) |
| POST | `/api/tickets` | สร้าง ticket ใหม่ |
| GET | `/api/tickets/[id]` | ดึง ticket + comments |
| PATCH | `/api/tickets/[id]` | อัปเดต ticket |
| POST | `/api/tickets/[id]/comments` | เพิ่มความคิดเห็น |
| GET | `/api/reports` | ข้อมูล reports aggregate |
| POST | `/api/jira/sync` | Sync Jira (body: `{ contractId? }`) |
| GET/POST | `/api/jira/config` | จัดการ Jira credentials |
| GET | `/api/jira/logs` | Sync logs |
| GET | `/api/users` | รายการ users (ADMIN only) |
| PATCH | `/api/users/[id]` | แก้ไข role/active |

---

## 7. Authentication & Authorization

### NextAuth v5

ระบบใช้ Credentials provider — เช็ค email + bcrypt password แล้ว return `{ id, email, name, role }`

```ts
// lib/auth.ts — JWT callback ฝัง id + role ลง token
callbacks: {
  jwt({ token, user }) {
    if (user) { token.id = user.id; token.role = user.role }
    return token
  },
  session({ session, token }) {
    session.user.id   = token.id as string
    session.user.role = token.role as string
    return session
  },
}
```

### ดึง session ใน Server Component

```ts
import { auth } from '@/lib/auth'

const session = await auth()
// session.user.id, session.user.role
```

### Role-based Permission

```ts
import { can } from '@/lib/permissions'

if (!can(session.user.role as Role, 'canEditContract')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Permission matrix:**

| Action | ADMIN | PM | STAFF |
|--------|-------|----|-------|
| canManageUsers | ✅ | ❌ | ❌ |
| canEditContract | ✅ | ✅ | ❌ |
| canDeleteTicket | ✅ | ❌ | ❌ |
| canViewReports | ✅ | ✅ | ❌ |
| canConfigJira | ✅ | ✅ | ❌ |

เพิ่ม permission ใหม่: แก้ `lib/permissions.ts` เพิ่ม key ใน object ทุก role

---

## 8. Internationalization (i18n)

### โครงสร้าง

- `messages/th.json` — ภาษาไทย
- `messages/en.json` — ภาษาอังกฤษ
- `proxy.ts` — next-intl middleware routing (`/th/...`, `/en/...`)
- `i18n/routing.ts` — config locales + defaultLocale

> **หมายเหตุ:** ไฟล์ middleware ต้องชื่อ `proxy.ts` (ไม่ใช่ `middleware.ts`) เนื่องจาก project config ของ Next.js เวอร์ชันนี้

### การใช้งานใน Client Component

```tsx
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('nav')
  return <span>{t('contracts')}</span>
}
```

### การใช้งานใน Server Component

```tsx
import { getTranslations } from 'next-intl/server'

async function MyPage() {
  const t = await getTranslations('common')
  return <h1>{t('save')}</h1>
}
```

### เพิ่ม key ใหม่

เพิ่มใน `messages/th.json` **และ** `messages/en.json` พร้อมกัน — next-intl จะ throw error ถ้า key หายไปฝั่งใดฝั่งหนึ่ง

---

## 9. Theming & Dark Mode

### CSS Variables

ทุก color ใช้ CSS variable ใน `app/globals.css`:

```css
:root {
  --bg-main: #f8fafc;
  --bg-sidebar: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --nav-active-bg: #eff6ff;
  --nav-active-text: #2563eb;
}

[data-theme="dark"] {
  --bg-main: #0f172a;
  --bg-sidebar: #1e293b;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  /* ... */
}
```

### Toggle Dark Mode

Dark mode toggle อยู่ใน `components/layout/Topbar.tsx` — set `data-theme` attribute บน `<html>` และ persist ใน localStorage:

```ts
const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark')
localStorage.setItem('theme', isDark ? 'light' : 'dark')
```

---

## 10. Jira Integration

### Config ต่อ Contract

แต่ละสัญญาตั้งค่า Jira ได้อิสระผ่าน `JiraConfig` model:
- `host` — เช่น `company.atlassian.net`
- `email` — Jira account email
- `apiToken` — Jira API Token (สร้างที่ https://id.atlassian.com/manage-profile/security)
- `projectKey` — เช่น `PROJ`

### การ Sync

```ts
// lib/jira.ts
syncTicketFromJira(ticketId)  // sync ticket เดี่ยว
syncAllTickets(contractId?)   // sync ทุก ticket ที่มี jiraKey
```

**Status mapping** (Jira → SmartMA):

| Jira Status | SmartMA Status |
|-------------|---------------|
| To Do / Open | OPEN |
| In Progress | IN_PROGRESS |
| Done / Resolved | RESOLVED |
| Closed | CLOSED |

### เพิ่ม Jira Status ใหม่

แก้ไข `jiraStatusToLocal()` ใน `lib/jira.ts`:

```ts
const map: Record<string, string> = {
  'Review': 'IN_PROGRESS',  // เพิ่มตรงนี้
  // ...
}
```

---

## 11. Layout System

### AppShell

```
┌─────────────────────────────────────────┐
│              Topbar (fixed height)       │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │        <children>            │
│ (210px)  │     (overflow-y-auto)        │
│          │                              │
└──────────┴──────────────────────────────┘
```

- Container ใช้ `height: 100dvh` + `overflow: hidden`
- Sidebar: `hidden md:flex` — แสดงเฉพาะ md+ (768px ขึ้นไป)
- Mobile: hamburger button + overlay drawer

### การใช้ AppShell ในหน้าใหม่

AppShell inject อัตโนมัติผ่าน `app/[locale]/(app)/layout.tsx` — ทุกหน้าใต้ `(app)/` จะได้ sidebar + topbar โดยอัตโนมัติ ไม่ต้องใส่เอง

### หน้าที่ไม่ต้องการ AppShell

วางไว้ใต้ `(auth)/` แทน เช่น `(auth)/login/page.tsx`

---

## 12. การ Deploy

### Environment Variables (Production)

```bash
DATABASE_URL="postgresql://user:password@host:5432/smartma"
NEXTAUTH_SECRET="random-32-char-secret"          # สร้างด้วย: openssl rand -base64 32
NEXTAUTH_URL="https://your-domain.com"
ENCRYPTION_KEY="your-32-char-encryption-key!!"
```

### Build

```bash
npm run build
npm run start
```

### Database Migration (Production)

```bash
npx prisma migrate deploy    # deploy migrations ที่มีอยู่ (ไม่สร้างใหม่)
```

---

## 13. ข้อควรระวัง (Breaking Changes)

เนื่องจากโปรเจกต์ใช้ library เวอร์ชันล่าสุดที่มี breaking changes จาก training data ของ AI:

### Prisma 7

- **ไม่ใช้ `url` ใน `schema.prisma`** — datasource URL อยู่ใน `prisma.config.ts` เท่านั้น
- **ต้องใช้ Driver Adapter** — `lib/prisma.ts` ใช้ `PrismaPg` จาก `@prisma/adapter-pg`
- สำหรับ migration ใช้ `npx prisma migrate dev` ตามปกติ (อ่าน URL จาก `prisma.config.ts`)

```ts
// lib/prisma.ts — pattern ที่ถูกต้อง
import { PrismaPg } from '@prisma/adapter-pg'
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' })
const prisma = new PrismaClient({ adapter })
```

### NextAuth v5

- import จาก `lib/auth.ts` ที่ export `{ handlers, auth, signIn, signOut }`
- `auth()` ใช้ได้ทั้งใน Server Component และ API route โดยตรง
- Session type augmentation อยู่ใน `types/next-auth.d.ts`

### Next.js 16 / next-intl v4

- Middleware ต้องชื่อ `proxy.ts` (project config นี้)
- `params` ใน page/layout เป็น `Promise<{ locale: string }>` — ต้อง `await params`

```ts
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
}
```

### Tailwind CSS v4

- ไม่มี `tailwind.config.ts` — ตั้งค่าผ่าน CSS `@theme` directive ใน globals.css
- ใช้ `@tailwindcss/postcss` แทน `tailwindcss` ใน postcss.config

---

*อัปเดตล่าสุด: 2026-04-20*
