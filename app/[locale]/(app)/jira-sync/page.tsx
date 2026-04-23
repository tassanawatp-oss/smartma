'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

type Log = { id: string; action: string; status: string; message: string; createdAt: string; contractId?: string }

export default function JiraSyncPage() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ total: number; ok: number } | null>(null)
  const [logs, setLogs] = useState<Log[]>([])

  useEffect(() => {
    fetch('/api/jira/logs').then((r) => r.ok ? r.json() : []).then((data) => {
      if (Array.isArray(data)) setLogs(data)
    }).catch(() => {})
  }, [])

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    const res = await fetch('/api/jira/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const data = await res.json()
    setResult(data)
    setSyncing(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-2 gap-4 mb-5">
        <Card>
          <CardBody>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Sync Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-bold text-green-600">Connected</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>Last Sync</div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>—</div>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader>
          <span className="text-[12.5px] font-bold" style={{ color: 'var(--text-primary)' }}>🔄 Manual Sync</span>
        </CardHeader>
        <CardBody>
          <p className="text-[11.5px] mb-4" style={{ color: 'var(--text-secondary)' }}>
            ดึงข้อมูล Status และ Comment จาก Jira มาอัปเดต Ticket ทั้งหมดที่มี Jira Key
          </p>
          <div className="flex items-center gap-4">
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? '⏳ กำลัง sync...' : '🔄 Sync Now'}
            </Button>
            {result && (
              <span className="text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
                ✓ Synced {result.ok}/{result.total} tickets
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <span className="text-[12.5px] font-bold" style={{ color: 'var(--text-primary)' }}>📋 Sync Log</span>
        </CardHeader>
        <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
          {logs.length === 0 && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>ยังไม่มี sync log</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3 text-[11px]">
              <span className="w-[70px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {new Date(log.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                log.status === 'OK' ? 'bg-green-100 text-green-700' : log.status === 'WARN' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
              }`}>{log.status}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{log.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
