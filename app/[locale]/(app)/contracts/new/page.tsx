'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

export default function NewContractPage() {
  const t = useTranslations('common')
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const [form, setForm] = useState({ name: '', sector: 'GOV', serviceType: 'SOFTWARE', startDate: '', endDate: '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.push(`/${locale}/contracts`)
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-base font-black mb-5" style={{ color: 'var(--text-primary)' }}>
        {locale === 'th' ? 'เพิ่มสัญญาใหม่' : 'New Contract'}
      </h2>
      <div className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label={locale === 'th' ? 'ชื่อสัญญา' : 'Contract Name'}>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border text-sm"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            />
          </Field>
          <Field label={locale === 'th' ? 'ภาค' : 'Sector'}>
            <select
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border text-sm"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            >
              <option value="GOV">{locale === 'th' ? 'ภาครัฐ' : 'Government'}</option>
              <option value="PRIVATE">{locale === 'th' ? 'เอกชน' : 'Private'}</option>
            </select>
          </Field>
          <Field label={locale === 'th' ? 'ประเภทบริการ' : 'Service Type'}>
            <select
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border text-sm"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            >
              <option value="SOFTWARE">Software</option>
              <option value="HARDWARE">Hardware</option>
              <option value="BOTH">Software + Hardware</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={locale === 'th' ? 'วันเริ่ม' : 'Start Date'}>
              <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border text-sm"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
            </Field>
            <Field label={locale === 'th' ? 'วันสิ้นสุด' : 'End Date'}>
              <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border text-sm"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
            </Field>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>{t('cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? '...' : t('save')}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
