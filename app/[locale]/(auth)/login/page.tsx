'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError(t('loginError'))
    } else {
      router.push(`/${locale}/contracts`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl mx-auto mb-3">
            ⚡
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>SmartMA</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Maintenance Management System</p>
        </div>

        <div className="rounded-xl p-6 shadow-sm border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
          <h2 className="text-sm font-bold mb-5" style={{ color: 'var(--text-primary)' }}>{t('login')}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-60"
            >
              {loading ? '...' : t('loginBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
