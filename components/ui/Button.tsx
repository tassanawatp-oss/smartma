'use client'

import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'success'

const styles: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90',
  ghost:   'bg-slate-100 text-slate-600 hover:bg-slate-200',
  danger:  'bg-red-50 text-red-600 hover:bg-red-100',
  success: 'bg-green-500 text-white hover:bg-green-600',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  return (
    <button
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all cursor-pointer border-none ${sz} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
