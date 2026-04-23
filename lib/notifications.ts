export const NOTIFICATIONS = [
  { id: 1, text: 'Ticket #TK-001 ถูกอัปเดตเป็น In Progress', time: '5 นาทีที่แล้ว' },
  { id: 2, text: 'Contract ABC ใกล้หมดอายุใน 7 วัน', time: '1 ชั่วโมงที่แล้ว' },
  { id: 3, text: 'Jira sync สำเร็จ 12 tickets', time: '3 ชั่วโมงที่แล้ว' },
  { id: 4, text: 'ผู้ใช้ใหม่ถูกเพิ่มในระบบ', time: 'เมื่อวาน' },
  { id: 5, text: 'Ticket #TK-005 ถูก resolve แล้ว', time: 'เมื่อวาน' },
]

const KEY = 'readNotifIds'

export function getReadIds(): Set<number> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? JSON.parse(raw) : [1, 2, 3, 4, 5].slice(2))
  } catch {
    return new Set([3, 4, 5])
  }
}

export function markAsRead(id: number) {
  const ids = getReadIds()
  ids.add(id)
  localStorage.setItem(KEY, JSON.stringify([...ids]))
  window.dispatchEvent(new Event('notif-update'))
}

export function markAllAsRead() {
  localStorage.setItem(KEY, JSON.stringify(NOTIFICATIONS.map(n => n.id)))
  window.dispatchEvent(new Event('notif-update'))
}
