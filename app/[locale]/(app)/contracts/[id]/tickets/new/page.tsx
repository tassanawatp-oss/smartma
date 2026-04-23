'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const PRIORITIES = [
  { value: 'P1', label: 'P1 ด่วนมาก', style: 'border-red-500 bg-red-50 text-red-600' },
  { value: 'P2', label: 'P2 ด่วน', style: 'border-amber-500 bg-amber-50 text-amber-700' },
  { value: 'P3', label: 'P3 ปกติ', style: 'border-blue-500 bg-blue-50 text-blue-700' },
  { value: 'P4', label: 'P4 ต่ำ', style: 'border-slate-400 bg-slate-50 text-slate-500' },
]

export default function NewTicketPage() {
  const { locale, id } = useParams() as { locale: string; id: string }
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', description: '', type: 'SW', priority: 'P3', assigneeId: '', jiraKey: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, contractId: id }),
    })
    router.push(`/${locale}/contracts/${id}/tickets`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-base font-black mb-5" style={{ color: 'var(--text-primary)' }}>
        {locale === 'th' ? 'เปิด Ticket ใหม่' : 'Open New Ticket'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl p-5 border flex flex-col gap-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
          <Field label="หัวข้อ *">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border text-sm" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
          </Field>

          <Field label="รายละเอียด">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
          </Field>

          <Field label="ประเภท">
            <div className="flex gap-3">
              {(['SW', 'HW'] as const).map((v) => (
                <button type="button" key={v}
                  onClick={() => setForm({ ...form, type: v })}
                  className={`flex-1 py-2 rounded-lg border-2 text-center cursor-pointer transition-all ${form.type === v ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}
                  style={form.type !== v ? { borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' } : {}}
                >
                  <div className="text-lg">{v === 'SW' ? '💻' : '🔧'}</div>
                  <div className="text-[10px] font-bold mt-0.5">{v === 'SW' ? 'Software' : 'Hardware'}</div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Priority">
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button type="button" key={p.value}
                  onClick={() => setForm({ ...form, priority: p.value })}
                  className={`flex-1 py-1.5 rounded-lg border-2 text-[10px] font-bold cursor-pointer transition-all ${form.priority === p.value ? p.style : ''}`}
                  style={form.priority !== p.value ? { borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' } : {}}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Jira Key (optional)">
            <input value={form.jiraKey} onChange={(e) => setForm({ ...form, jiraKey: e.target.value })}
              placeholder="e.g. PROJ-123"
              className="w-full h-9 px-3 rounded-lg border text-sm font-mono" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
          </Field>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>ยกเลิก</Button>
          <Button type="submit" disabled={saving}>{saving ? '...' : 'บันทึก'}</Button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}
