'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'

type User = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

const ROLES = ['ADMIN', 'PM', 'STAFF'] as const
const roleLabel: Record<string, string> = { ADMIN: 'ผู้ดูแลระบบ', PM: 'Project Manager', STAFF: 'Staff' }
const roleVariant: Record<string, 'admin' | 'pm' | 'staff'> = { ADMIN: 'admin', PM: 'pm', STAFF: 'staff' }

const EMPTY_NEW = { name: '', email: '', password: '', role: 'STAFF' }

export function UsersTable({ users, locale = 'th' }: { users: User[]; locale?: string }) {
  const router = useRouter()

  const [editing, setEditing] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ role: '', active: true })
  const [saving, setSaving] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_NEW)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  function openEdit(u: User) {
    setEditing(u)
    setEditForm({ role: u.role, active: u.active })
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    await fetch(`/api/users/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setSaving(false)
    setEditing(null)
    router.refresh()
  }

  async function handleToggleActive(u: User) {
    await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: u.role, active: !u.active }),
    })
    router.refresh()
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setAddError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    setAdding(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setAddError(err.error ?? 'เกิดข้อผิดพลาด')
      return
    }
    setShowAdd(false)
    setAddForm(EMPTY_NEW)
    router.refresh()
  }

  const inputCls = 'w-full h-9 px-3 rounded-lg border text-xs'
  const inputStyle = { background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
          {locale === 'th' ? 'จัดการผู้ใช้งาน' : 'User Management'}
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 border-none cursor-pointer"
        >
          + {locale === 'th' ? 'เพิ่มผู้ใช้' : 'Add User'}
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
        <table className="w-full text-[11.5px] border-collapse">
          <thead>
            <tr style={{ background: 'var(--tab-bg)' }}>
              {['ชื่อ', 'อีเมล', 'Role', 'Status', 'สมัครเมื่อ', 'จัดการ'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-light)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={roleVariant[u.role]} label={roleLabel[u.role]} />
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                  {new Date(u.createdAt).toLocaleDateString('th-TH')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer border-none" style={{ background: 'var(--tab-bg)', color: 'var(--text-secondary)' }}>
                      แก้ไข
                    </button>
                    <button onClick={() => handleToggleActive(u)} className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer border-none ${u.active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {u.active ? 'ปิด' : 'เปิด'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <form
            className="rounded-2xl border p-6 w-96 shadow-xl flex flex-col gap-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAdd}
          >
            <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>เพิ่มผู้ใช้งาน</h3>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>ชื่อ *</label>
              <input required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className={inputCls} style={inputStyle} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>อีเมล *</label>
              <input required type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className={inputCls} style={inputStyle} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>รหัสผ่าน *</label>
              <input required type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} className={inputCls} style={inputStyle} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Role</label>
              <div className="flex flex-col gap-1.5">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="add-role" value={r} checked={addForm.role === r} onChange={() => setAddForm({ ...addForm, role: r })} className="accent-blue-500" />
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{roleLabel[r]}</span>
                  </label>
                ))}
              </div>
            </div>

            {addError && <p className="text-xs text-red-500">{addError}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => { setShowAdd(false); setAddForm(EMPTY_NEW); setAddError('') }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border"
                style={{ background: 'var(--tab-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                ยกเลิก
              </button>
              <button type="submit" disabled={adding}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-500 cursor-pointer border-none disabled:opacity-50">
                {adding ? '...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="rounded-2xl border p-6 w-80 shadow-xl" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>แก้ไข — {editing.name}</h3>

            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Role</label>
              <div className="flex flex-col gap-1.5">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="edit-role" value={r} checked={editForm.role === r} onChange={() => setEditForm({ ...editForm, role: r })} className="accent-blue-500" />
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{roleLabel[r]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} className="accent-blue-500 w-4 h-4" />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Active</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border" style={{ background: 'var(--tab-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-500 cursor-pointer border-none disabled:opacity-50">
                {saving ? '...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
