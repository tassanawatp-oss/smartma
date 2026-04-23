# Security Knowledge Base — SmartMA

> อัปเดตล่าสุด: 2026-04-21

## ภาพรวม

เอกสารนี้รวบรวมมาตรการ security ที่ implement อยู่ในระบบ SmartMA ครอบคลุม Authorization (RBAC), SSRF Prevention, Token Encryption, Input Validation และ Error Handling

---

## 1. Role-Based Access Control (RBAC)

### Permission Matrix

**ไฟล์:** `lib/permissions.ts`

| Permission | ADMIN | PM | STAFF |
|------------|:-----:|:--:|:-----:|
| `canManageUsers` | ✅ | ❌ | ❌ |
| `canEditContract` | ✅ | ✅ | ❌ |
| `canDeleteTicket` | ✅ | ❌ | ❌ |
| `canViewReports` | ✅ | ✅ | ❌ |
| `canConfigJira` | ✅ | ✅ | ❌ |

### วิธีใช้งาน

```typescript
import { can } from '@/lib/permissions'

// ตัวอย่างใน API route
const session = await auth()
if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
if (!can(session.user.role, 'canManageUsers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

### Endpoint Protection Matrix

| Endpoint | Method | Permission ที่ต้องการ | Role ที่เข้าได้ |
|----------|--------|----------------------|----------------|
| `/api/users` | GET | `canManageUsers` | ADMIN |
| `/api/users` | POST | `canManageUsers` | ADMIN |
| `/api/users/[id]` | PATCH | `canManageUsers` | ADMIN |
| `/api/contracts` | POST | `canEditContract` | ADMIN, PM |
| `/api/contracts/[id]` | PATCH | `canEditContract` | ADMIN, PM |
| `/api/contracts/[id]` | DELETE | `canManageUsers` | ADMIN |
| `/api/reports` | GET | `canViewReports` | ADMIN, PM |
| `/api/jira/config` | GET | `canConfigJira` | ADMIN, PM |
| `/api/jira/config` | POST | `canConfigJira` | ADMIN, PM |

> **หมายเหตุ:** ทุก endpoint ต้องผ่าน authentication check (`session?.user`) ก่อนเสมอ — 401 ถ้าไม่มี session, 403 ถ้ามี session แต่ไม่มีสิทธิ์

### วิธีเพิ่ม Permission ใหม่

**1. เพิ่มใน `lib/permissions.ts`:**
```typescript
const PERMISSIONS: Record<Role, Record<string, boolean>> = {
  ADMIN: {
    // ... existing
    canDeleteTicket: true,   // เพิ่มตรงนี้
  },
  PM: {
    canDeleteTicket: false,
  },
  STAFF: {
    canDeleteTicket: false,
  },
}
```

**2. เรียกใช้ใน API route:**
```typescript
if (!can(session.user.role, 'canDeleteTicket')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## 2. SSRF Prevention (Jira Integration)

### ปัญหา
ผู้ใช้สามารถตั้งค่า Jira host เป็น `127.0.0.1` หรือ IP ภายในเพื่อ probe internal services ได้

### การแก้ไข

**ไฟล์:** `lib/jira.ts`

```typescript
const PRIVATE_IP_RE = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/

function validateJiraHost(host: string): void {
  let hostname: string
  try {
    hostname = new URL(`https://${host}`).hostname
  } catch {
    throw new Error('Invalid Jira host')
  }
  if (PRIVATE_IP_RE.test(hostname)) {
    throw new Error('Jira host must not be a private or loopback address')
  }
}
```

### IP Ranges ที่ถูก Block

| Range | ตัวอย่าง | ประเภท |
|-------|---------|--------|
| `localhost` | `localhost` | Loopback hostname |
| `127.x.x.x` | `127.0.0.1` | Loopback IP |
| `10.x.x.x` | `10.0.0.1` | Private Class A |
| `172.16–31.x.x` | `172.16.0.1` | Private Class B |
| `192.168.x.x` | `192.168.1.1` | Private Class C |

### จุดที่เรียก Validate

1. **`lib/jira.ts → fetchJira()`** — validate ทุกครั้งก่อน fetch
2. **`app/api/jira/config/route.ts → POST`** — validate ก่อน upsert ลง DB

> **Response เมื่อ host ไม่ถูกต้อง:** HTTP 400 `{ "error": "Invalid Jira host" }`

---

## 3. Jira API Token Encryption

### ปัญหา
Jira API token เดิมถูกเก็บใน database แบบ plain text — หาก database leak token สามารถนำไปใช้ได้ทันที

### Algorithm

| รายการ | ค่า |
|--------|-----|
| Algorithm | AES-256-GCM |
| Key derivation | SHA-256 จาก `ENCRYPTION_KEY` |
| IV size | 12 bytes (random) |
| Auth tag | 16 bytes |
| Format ที่เก็บ | `<iv_hex>:<tag_hex>:<ciphertext_hex>` |

### ไฟล์และ Functions

**ไฟล์:** `lib/jira.ts`

```typescript
// เข้ารหัสก่อน store
export function encryptToken(plaintext: string): string

// ถอดรหัสเมื่อใช้งาน
export function decryptToken(stored: string): string
```

### Flow การทำงาน

```
POST /api/jira/config
    │
    ├─→ validateJiraHost(body.host)
    │
    ├─→ encryptToken(body.apiToken)
    │       └─→ AES-256-GCM encrypt
    │
    └─→ prisma.jiraConfig.upsert({ apiToken: encryptedToken })

GET /api/jira/* (Jira sync)
    │
    └─→ fetchJira(host, email, cfg.apiToken)
            └─→ isEncrypted(token) ? decryptToken(token) : token
            └─→ fetch(`https://${host}/rest/api/3...`)
```

### Environment Variable

```bash
# .env — ต้องไม่ว่างเปล่าในทุก environment
ENCRYPTION_KEY="your-secret-key-at-least-32-chars"
```

> **ข้อควรระวัง:** เปลี่ยน `ENCRYPTION_KEY` ในภายหลังจะทำให้ decrypt token เดิมไม่ได้ — ต้องบันทึก Jira config ใหม่ทุก contract หากเปลี่ยน key

---

## 4. Input Validation

### Enum Validation

**ปัญหาเดิม:** ส่ง `status` ที่ไม่ถูกต้องผ่าน type cast โดยตรง → ข้อมูล corrupt

**การแก้ไข:** validate ก่อน Prisma ใน tickets routes

**ไฟล์:** `app/api/tickets/route.ts`, `app/api/tickets/[id]/route.ts`

```typescript
const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const

if (status && !(VALID_STATUSES as readonly string[]).includes(status)) {
  return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
}
```

### Date Validation

**ปัญหาเดิม:** `new Date(undefined)` → `Invalid Date` ทำให้ Prisma error

**การแก้ไข:**

**ไฟล์:** `app/api/contracts/route.ts`, `app/api/contracts/[id]/route.ts`

```typescript
const startDate = new Date(body.startDate)
const endDate = new Date(body.endDate)

if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
  return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
}
if (endDate <= startDate) {
  return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 })
}
```

### Sector Validation

**ไฟล์:** `app/api/contracts/route.ts`

```typescript
const VALID_SECTORS = ['GOV', 'PRIVATE'] as const

if (sector && !(VALID_SECTORS as readonly string[]).includes(sector)) {
  return NextResponse.json({ error: 'Invalid sector' }, { status: 400 })
}
```

---

## 5. Error Handling

### แนวทาง

ทุก API route ห่อ logic หลักด้วย `try/catch` เพื่อป้องกัน stack trace หรือ schema ของ DB รั่วไหลไปยัง client

```typescript
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // ... logic
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

> **สำคัญ:** `catch` block ต้องคืน generic message เสมอ — ห้าม re-throw หรือ return error detail ไปให้ client

---

## 6. Session Type Safety

### ปัญหาเดิม
`session.user.role` ถูก type เป็น `string` ทำให้ TypeScript ไม่ตรวจสอบว่า role ที่ส่งไป `can()` ถูกต้องหรือไม่

### การแก้ไข

**ไฟล์:** `types/next-auth.d.ts`

```typescript
import type { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role   // ← เปลี่ยนจาก string เป็น Role enum
    }
  }
}
```

**ผลที่ได้:** TypeScript จะ error ทันทีหาก role ที่ส่งเข้า `can()` ไม่ใช่ `'ADMIN' | 'PM' | 'STAFF'`

---

## 7. สรุป HTTP Status Codes

| สถานการณ์ | Status | Body |
|----------|--------|------|
| ไม่มี session | 401 | `{ "error": "Unauthorized" }` |
| มี session แต่ไม่มีสิทธิ์ | 403 | `{ "error": "Forbidden" }` |
| Input ไม่ถูกต้อง | 400 | `{ "error": "<รายละเอียด>" }` |
| ไม่พบ resource | 404 | `{ "error": "Not found" }` |
| Server/DB error | 500 | `{ "error": "Internal server error" }` |

---

## 8. ไฟล์ที่เกี่ยวข้องทั้งหมด

```
lib/
  permissions.ts                     -- PERMISSIONS matrix + can()
  jira.ts                            -- validateJiraHost(), encryptToken(), decryptToken()

types/
  next-auth.d.ts                     -- Role type ใน session

app/
  api/
    users/route.ts                   -- RBAC: canManageUsers
    users/[id]/route.ts              -- RBAC: canManageUsers
    contracts/route.ts               -- RBAC: canEditContract, sector/date validation
    contracts/[id]/route.ts          -- RBAC: canEditContract/canManageUsers, date validation
    tickets/route.ts                 -- enum status validation
    tickets/[id]/route.ts            -- enum status validation
    reports/route.ts                 -- RBAC: canViewReports
    jira/config/route.ts             -- RBAC: canConfigJira, SSRF validation, token encryption
    jira/sync/route.ts               -- authentication check
```

---

## 9. Checklist สำหรับ API Route ใหม่

เมื่อสร้าง API route ใหม่ ให้ตรวจสอบตาม checklist นี้:

- [ ] มี `const session = await auth()` และ check `session?.user` → 401
- [ ] มี `can(session.user.role, '...')` สำหรับ operation ที่ต้องการสิทธิ์ → 403
- [ ] validate input enum/date ก่อนส่งให้ Prisma → 400
- [ ] ครอบ logic ด้วย `try/catch` และ return generic 500
- [ ] ไม่ return sensitive data (password, token, encryption key)
- [ ] เพิ่ม `writeAudit()` สำหรับ mutation (POST/PATCH/DELETE)
