'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Toggle } from '@/components/ui/Toggle'
import { useParams } from 'next/navigation'

const SUB_SECTIONS = [
  { key: 'general', label: 'ทั่วไป', icon: '⚙️' },
  { key: 'notifications', label: 'การแจ้งเตือน', icon: '🔔' },
  { key: 'jira', label: 'Jira API', icon: '🔗' },
  { key: 'logs', label: 'System Log', icon: '📋' },
  { key: 'danger', label: 'Danger Zone', icon: '⚠️' },
]

type AuditLog = {
  id: string
  userId: string | null
  userEmail: string
  action: string
  resource: string
  resourceId: string | null
  meta: Record<string, unknown> | null
  createdAt: string
}

const ALL_ACTIONS = [
  'LOGIN', 'LOGOUT',
  'CREATE_USER', 'UPDATE_USER',
  'CREATE_CONTRACT', 'UPDATE_CONTRACT', 'DELETE_CONTRACT',
  'CREATE_TICKET', 'UPDATE_TICKET',
  'CONFIG_JIRA', 'JIRA_SYNC', 'CLEAR_SYNC_LOG',
]

function exportToCsv(logs: AuditLog[]) {
  const header = 'วันเวลา,ผู้ใช้,Action,Resource,Resource ID,รายละเอียด'
  const rows = logs.map((l) => {
    const meta = l.meta ? JSON.stringify(l.meta).replace(/"/g, '""') : ''
    return [
      new Date(l.createdAt).toLocaleString('th-TH'),
      l.userEmail,
      l.action,
      l.resource,
      l.resourceId ?? '',
      `"${meta}"`,
    ].join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `system-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const { locale } = useParams() as { locale: string }
  const [active, setActive] = useState('general')
  const [notifs, setNotifs] = useState({ ticketOpen: true, ticketDone: true, jiraSync: false })

  // System Log state
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [logLoading, setLogLoading] = useState(false)
  const [logFrom, setLogFrom] = useState('')
  const [logTo, setLogTo] = useState('')
  const [logAction, setLogAction] = useState('')

  const fetchLogs = useCallback(async (isExport = false) => {
    setLogLoading(true)
    try {
      const params = new URLSearchParams()
      if (logFrom) params.set('from', logFrom)
      if (logTo) params.set('to', logTo)
      if (logAction) params.set('action', logAction)
      if (isExport) params.set('export', '1')
      const res = await fetch(`/api/audit-logs?${params}`)
      const data: AuditLog[] = await res.json()
      if (isExport) {
        exportToCsv(data)
      } else {
        setLogs(data)
      }
    } finally {
      setLogLoading(false)
    }
  }, [logFrom, logTo, logAction])

  useEffect(() => {
    if (active === 'logs') fetchLogs()
  }, [active, fetchLogs])

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

        {active === 'logs' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-[12.5px] font-bold" style={{ color: 'var(--text-primary)' }}>System Log</h3>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>จาก</label>
                <input type="date" value={logFrom} onChange={(e) => setLogFrom(e.target.value)}
                  className="h-8 px-2 rounded-lg border text-xs"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>ถึง</label>
                <input type="date" value={logTo} onChange={(e) => setLogTo(e.target.value)}
                  className="h-8 px-2 rounded-lg border text-xs"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
              </div>
              <select value={logAction} onChange={(e) => setLogAction(e.target.value)}
                className="h-8 px-2 rounded-lg border text-xs"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
                <option value="">ทุก Action</option>
                {ALL_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button onClick={() => fetchLogs(false)}
                className="h-8 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 border-none cursor-pointer">
                ค้นหา
              </button>
              <button onClick={() => fetchLogs(true)}
                className="h-8 px-3 rounded-lg text-xs font-bold border cursor-pointer"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                Export CSV
              </button>
            </div>

            {/* Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr style={{ background: 'var(--tab-bg)', borderBottom: '1px solid var(--border-light)' }}>
                      {['วันเวลา', 'ผู้ใช้', 'Action', 'Resource', 'รายละเอียด'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-bold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logLoading ? (
                      <tr><td colSpan={5} className="px-3 py-6 text-center" style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</td></tr>
                    ) : logs.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-6 text-center" style={{ color: 'var(--text-muted)' }}>ไม่มีข้อมูล</td></tr>
                    ) : logs.map((log, i) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)', background: i % 2 === 0 ? 'transparent' : 'var(--tab-bg)' }}>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(log.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>{log.userEmail || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === 'LOGIN' ? 'bg-green-100 text-green-700' :
                            log.action === 'LOGOUT' ? 'bg-gray-100 text-gray-600' :
                            log.action.startsWith('DELETE') ? 'bg-red-100 text-red-600' :
                            log.action.startsWith('CREATE') ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{log.action}</span>
                        </td>
                        <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{log.resource}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {log.meta ? JSON.stringify(log.meta) : log.resourceId ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {logs.length > 0 && (
                <div className="px-3 py-2 text-[10px] border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-light)' }}>
                  แสดง {logs.length} รายการ
                </div>
              )}
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
