'use client'

type Variant = 'open' | 'in_progress' | 'resolved' | 'closed' | 'gov' | 'private' | 'hw' | 'sw' | 'p1' | 'p2' | 'p3' | 'p4' | 'admin' | 'pm' | 'staff'

const styles: Record<Variant, string> = {
  open:        'bg-red-100 text-red-600',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-slate-100 text-slate-500',
  gov:         'bg-blue-100 text-blue-700',
  private:     'bg-green-100 text-green-800',
  hw:          'bg-purple-100 text-purple-700',
  sw:          'bg-sky-100 text-sky-700',
  p1:          'bg-red-100 text-red-600',
  p2:          'bg-amber-100 text-amber-700',
  p3:          'bg-blue-100 text-blue-700',
  p4:          'bg-slate-100 text-slate-500',
  admin:       'bg-pink-100 text-pink-800',
  pm:          'bg-blue-100 text-blue-700',
  staff:       'bg-green-100 text-green-800',
}

export function Badge({ variant, label }: { variant: Variant; label: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${styles[variant]}`}>
      {label}
    </span>
  )
}
