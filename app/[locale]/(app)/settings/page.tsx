'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Toggle } from '@/components/ui/Toggle'
import { useParams } from 'next/navigation'

const SUB_SECTIONS = [
  { key: 'general', label: 'ทั่วไป', icon: '⚙️' },
  { key: 'notifications', label: 'การแจ้งเตือน', icon: '🔔' },
  { key: 'jira', label: 'Jira API', icon: '🔗' },
  { key: 'danger', label: 'Danger Zone', icon: '⚠️' },
]

export default function SettingsPage() {
  const { locale } = useParams() as { locale: string }
  const [active, setActive] = useState('general')
  const [notifs, setNotifs] = useState({ ticketOpen: true, ticketDone: true, jiraSync: false })

  return (
    <div className="flex gap-0 -m-5 h-[calc(100vh-130px)]">
      {/* Sub nav */}
      <div className="w-44 flex-shrink-0 border-r p-2 overflow-y-auto" style={{ background: 'var(--tab-bg)', borderColor: 'var(--border)' }}>
        {SUB_SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] mb-0.5 cursor-pointer border-none text-left transition-all ${active === s.key ? 'font-bold' : ''}`}
            style={active === s.key ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)' } : { background: 'transparent', color: 'var(--text-secondary)' }}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {active === 'general' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-[12.5px] font-bold" style={{ color: 'var(--text-primary)' }}>ตั้งค่าทั่วไป</h3>
            <Card>
              <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {[
                  { label: 'ชื่อบริษัท', value: 'บริษัท SmartIT จำกัด' },
                  { label: 'ภาษาเริ่มต้น', value: locale === 'th' ? 'ภาษาไทย' : 'English' },
                  { label: 'Timezone', value: 'Asia/Bangkok (UTC+7)' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</div>
                    </div>
                    <div className="text-[11px] px-3 py-1.5 rounded-lg border" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-secondary)' }}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {active === 'notifications' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-[12.5px] font-bold" style={{ color: 'var(--text-primary)' }}>การแจ้งเตือน</h3>
            <Card>
              <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {[
                  { key: 'ticketOpen' as const, label: 'มี Ticket ใหม่', desc: 'แจ้งเตือนเมื่อมีการเปิด Ticket ใหม่' },
                  { key: 'ticketDone' as const, label: 'Ticket เสร็จสิ้น', desc: 'แจ้งเตือนเมื่อ Ticket ถูก Resolve' },
                  { key: 'jiraSync' as const, label: 'Jira Sync Error', desc: 'แจ้งเตือนเมื่อ Jira sync ล้มเหลว' },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{n.label}</div>
                      <div className="text-[10.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.desc}</div>
                    </div>
                    <Toggle checked={notifs[n.key]} onChange={(v) => setNotifs({ ...notifs, [n.key]: v })} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {active === 'jira' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-[12.5px] font-bold" style={{ color: 'var(--text-primary)' }}>Jira API Configuration</h3>
            <Card>
              <CardBody className="flex flex-col gap-3">
                {[
                  { label: 'Jira Host', placeholder: 'company.atlassian.net' },
                  { label: 'Email', placeholder: 'you@company.com' },
                  { label: 'API Token', placeholder: '••••••••••' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                    <input type={f.label === 'API Token' ? 'password' : 'text'} placeholder={f.placeholder}
                      className="w-full h-9 px-3 rounded-lg border text-sm"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
                  </div>
                ))}
                <button className="w-fit px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 border-none cursor-pointer mt-1">
                  บันทึก
                </button>
              </CardBody>
            </Card>
          </div>
        )}

        {active === 'danger' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-[12.5px] font-bold text-red-600">Danger Zone</h3>
            <div className="rounded-xl border border-red-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-red-100" style={{ background: '#fff5f5' }}>
                <div className="text-[12px] font-semibold text-red-800">ล้างข้อมูล Sync Log</div>
                <div className="text-[10.5px] text-red-500 mt-0.5">ลบ Sync Log ทั้งหมด ไม่สามารถกู้คืนได้</div>
              </div>
              <div className="px-4 py-3" style={{ background: 'var(--bg-card)' }}>
                <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-600 border-none cursor-pointer">
                  ล้าง Log
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
