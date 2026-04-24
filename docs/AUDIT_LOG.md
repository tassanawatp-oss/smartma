# Audit Log — Knowledge Base

> อัปเดตล่าสุด: 2026-04-21

## ภาพรวม

Audit Log คือระบบบันทึกกิจกรรมทุกอย่างในระบบ SmartMA แบบ **fire-and-forget** (บันทึกแบบไม่กั้น response) เพื่อให้สามารถติดตามได้ว่า **ใคร ทำอะไร เมื่อไหร่** โดยครอบคลุม Login/Logout, การสร้าง/แก้ไข/ลบ Contract, Ticket, User และการ sync Jira

---

## สถาปัตยกรรม

```
User action
    │
    ▼
API Route ──→ Prisma (main operation) ──→ response
    │
    └──→ writeAudit() ──→ prisma.auditLog.create() (async, never throws)
```

---

## Database Schema

**ไฟล์:** `prisma/schema.prisma`

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String?                        -- null ถ้า user ถูกลบแล้ว
  userEmail  String   @default("")          -- snapshot email ณ เวลาที่เกิด event
  action     String                         -- ดู Action Constants ด้านล่าง
  resource   String                         -- ดู Resource Constants ด้านล่าง
  resourceId String?                        -- id ของสิ่งที่ถูกกระทำ (เช่น ticket id)
  meta       Json?                          -- ข้อมูลเพิ่มเติม เช่น { title, status }
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

> **หมายเหตุ:** `onDelete: SetNull` หมาย ถึงถ้า User ถูกลบออกจากระบบ `userId` จะกลายเป็น `null` แต่ log ยังคงอยู่ โดย `userEmail` ยังคงแสดง email เดิมได้

---

## Action Constants

**ไฟล์:** `lib/audit.ts` — `AUDIT_ACTION`

| Constant | ค่า | เกิดเมื่อ |
|----------|-----|----------|
| `LOGIN` | `"LOGIN"` | ผู้ใช้ login สำเร็จ |
| `LOGOUT` | `"LOGOUT"` | ผู้ใช้ logout |
| `CREATE_USER` | `"CREATE_USER"` | Admin สร้างผู้ใช้ใหม่ |
| `UPDATE_USER` | `"UPDATE_USER"` | Admin แก้ไข role หรือสถานะผู้ใช้ |
| `CREATE_CONTRACT` | `"CREATE_CONTRACT"` | สร้าง Contract ใหม่ |
| `UPDATE_CONTRACT` | `"UPDATE_CONTRACT"` | แก้ไขข้อมูล Contract |
| `DELETE_CONTRACT` | `"DELETE_CONTRACT"` | ลบ Contract |
| `CREATE_TICKET` | `"CREATE_TICKET"` | สร้าง Ticket ใหม่ |
| `UPDATE_TICKET` | `"UPDATE_TICKET"` | แก้ไข Ticket (status, priority ฯลฯ) |
| `CONFIG_JIRA` | `"CONFIG_JIRA"` | บันทึกหรืออัปเดต Jira config |
| `JIRA_SYNC` | `"JIRA_SYNC"` | trigger Jira sync |
| `CLEAR_SYNC_LOG` | `"CLEAR_SYNC_LOG"` | ล้าง Sync Log ใน Danger Zone |

---

## Resource Constants

**ไฟล์:** `lib/audit.ts` — `AUDIT_RESOURCE`

| Constant | ค่า | หมายถึง |
|----------|-----|--------|
| `AUTH` | `"AUTH"` | เหตุการณ์ authentication |
| `USER` | `"USER"` | การจัดการผู้ใช้ |
| `CONTRACT` | `"CONTRACT"` | Contract |
| `TICKET` | `"TICKET"` | Ticket |
| `JIRA_CONFIG` | `"JIRA_CONFIG"` | การตั้งค่า Jira |
| `SYSTEM` | `"SYSTEM"` | การกระทำระดับ system |

---

## Helper Function

**ไฟล์:** `lib/audit.ts`

```typescript
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from '@/lib/audit'

// วิธีใช้งาน
writeAudit({
  userId: session.user.id,        // optional
  userEmail: session.user.email,  // optional แต่ควรใส่เสมอ
  action: AUDIT_ACTION.CREATE_TICKET,
  resource: AUDIT_RESOURCE.TICKET,
  resourceId: ticket.id,          // optional
  meta: { title: ticket.title },  // optional — ข้อมูลเพิ่มเติมที่เป็นประโยชน์
})
```

**สำคัญ:** `writeAudit()` ไม่ throw error ไม่ต้อง await และไม่กั้น response — เรียกได้ตรงๆ หลัง Prisma operation สำเร็จ

---

## จุดบันทึก Log

### Authentication — `lib/auth.ts`

```typescript
events: {
  signIn: async ({ user }) => { writeAudit({ action: 'LOGIN', ... }) },
  signOut: async (message) => { writeAudit({ action: 'LOGOUT', ... }) },
}
```

### API Routes

| Route | Method | Action ที่บันทึก |
|-------|--------|----------------|
| `app/api/users/route.ts` | POST | `CREATE_USER` |
| `app/api/users/[id]/route.ts` | PATCH | `UPDATE_USER` |
| `app/api/contracts/route.ts` | POST | `CREATE_CONTRACT` |
| `app/api/contracts/[id]/route.ts` | PATCH | `UPDATE_CONTRACT` |
| `app/api/contracts/[id]/route.ts` | DELETE | `DELETE_CONTRACT` |
| `app/api/tickets/route.ts` | POST | `CREATE_TICKET` |
| `app/api/tickets/[id]/route.ts` | PATCH | `UPDATE_TICKET` |
| `app/api/jira/config/route.ts` | POST | `CONFIG_JIRA` |
| `app/api/jira/sync/route.ts` | POST | `JIRA_SYNC` |

---

## API Endpoint

**Route:** `GET /api/audit-logs`

**Authentication:** ต้อง login ก่อนเสมอ (401 ถ้าไม่มี session)

### Query Parameters

| Parameter | Type | ตัวอย่าง | คำอธิบาย |
|-----------|------|---------|----------|
| `from` | `string` (date) | `2026-01-01` | กรอง log ตั้งแต่วันที่นี้ |
| `to` | `string` (date) | `2026-04-30` | กรอง log ถึงวันที่นี้ (ถึง 23:59:59) |
| `action` | `string` | `LOGIN` | กรองตาม action |
| `resource` | `string` | `TICKET` | กรองตาม resource |
| `export` | `"1"` | `?export=1` | คืน log ทั้งหมด (ไม่จำกัด 200 รายการ) |

### Role-Based Access

| Role | เห็น Log ของ |
|------|-------------|
| `ADMIN` | ทุก log ในระบบ |
| `PM` | ทุก log ในระบบ |
| `STAFF` | เฉพาะ log ที่ `userId === session.user.id` |

### ตัวอย่าง Response

```json
[
  {
    "id": "clxyz123",
    "userId": "cluser456",
    "userEmail": "admin@company.com",
    "action": "CREATE_TICKET",
    "resource": "TICKET",
    "resourceId": "clticket789",
    "meta": { "title": "Server down", "contractId": "clcon001" },
    "createdAt": "2026-04-21T10:23:00.000Z"
  }
]
```

---

## UI — System Log Tab

**ไฟล์:** `app/[locale]/(app)/settings/page.tsx`

เข้าถึงได้ที่: **Settings → 📋 System Log**

### ฟีเจอร์

| ฟีเจอร์ | รายละเอียด |
|--------|-----------|
| Filter วันที่ | เลือก from/to แล้วกด "ค้นหา" |
| Filter action | dropdown เลือก action ที่ต้องการ |
| แสดงสูงสุด | 200 รายการต่อครั้ง |
| Export CSV | ดาวน์โหลดตาม filter ที่เลือก พร้อม BOM (รองรับ Excel ภาษาไทย) |

### สีของ Action Badge

| สี | Action |
|----|--------|
| 🟢 เขียว | `LOGIN` |
| ⬜ เทา | `LOGOUT` |
| 🔴 แดง | `DELETE_*` |
| 🔵 น้ำเงิน | `CREATE_*` |
| 🟡 เหลือง | `UPDATE_*`, `CONFIG_*`, `JIRA_*` |

---

## วิธีเพิ่ม Action ใหม่

เมื่อต้องการบันทึก event ใหม่:

**1. เพิ่ม constant ใน `lib/audit.ts`**
```typescript
export const AUDIT_ACTION = {
  // ... existing
  DELETE_TICKET: 'DELETE_TICKET',   // เพิ่มตรงนี้
} as const
```

**2. เพิ่ม resource ถ้าจำเป็น**
```typescript
export const AUDIT_RESOURCE = {
  // ... existing
  ATTACHMENT: 'ATTACHMENT',   // เพิ่มถ้า resource ใหม่
} as const
```

**3. เรียก `writeAudit()` ใน API route**
```typescript
// หลัง prisma operation สำเร็จ
writeAudit({
  userId: session.user.id,
  userEmail: session.user.email,
  action: AUDIT_ACTION.DELETE_TICKET,
  resource: AUDIT_RESOURCE.TICKET,
  resourceId: id,
})
```

**4. เพิ่ม action ใน dropdown ของ Settings UI**

ใน `app/[locale]/(app)/settings/page.tsx`:
```typescript
const ALL_ACTIONS = [
  // ... existing
  'DELETE_TICKET',   // เพิ่มตรงนี้
]
```

---

## ข้อควรระวัง

1. **ไม่บันทึก sensitive data ใน `meta`** — เช่น password, API token, encryption key
2. **`writeAudit()` ไม่มี transaction** — ถ้า main operation rollback, log ยังคงถูกบันทึก
3. **log ไม่มีการลบอัตโนมัติ** — ควรกำหนด retention policy หากข้อมูลมีขนาดใหญ่
4. **STAFF ไม่เห็น log ของคนอื่น** — enforce ที่ API layer ใน `app/api/audit-logs/route.ts`

---

## ไฟล์ที่เกี่ยวข้องทั้งหมด

```
prisma/
  schema.prisma                         -- AuditLog model
  migrations/
    20260421112158_add_audit_log/       -- migration สำหรับ AuditLog

lib/
  audit.ts                              -- writeAudit(), AUDIT_ACTION, AUDIT_RESOURCE

app/
  api/
    audit-logs/
      route.ts                          -- GET /api/audit-logs
    users/route.ts                      -- writeAudit CREATE_USER
    users/[id]/route.ts                 -- writeAudit UPDATE_USER
    contracts/route.ts                  -- writeAudit CREATE_CONTRACT
    contracts/[id]/route.ts             -- writeAudit UPDATE/DELETE_CONTRACT
    tickets/route.ts                    -- writeAudit CREATE_TICKET
    tickets/[id]/route.ts               -- writeAudit UPDATE_TICKET
    jira/config/route.ts                -- writeAudit CONFIG_JIRA
    jira/sync/route.ts                  -- writeAudit JIRA_SYNC
  [locale]/(app)/settings/page.tsx      -- System Log tab UI

lib/
  auth.ts                               -- LOGIN/LOGOUT events
```
