import type { ReactNode } from 'react'

export const AdminPanelCard = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => <div className={`rounded-xl border border-white/5 bg-[#18181b] ${className}`}>{children}</div>

export const AdminPanelHeader = ({
  title,
  description,
}: {
  title: string
  description?: string
}) => (
  <div>
    <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
    {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
  </div>
)

export const AdminSectionTitle = ({
  title,
  description,
}: {
  title: string
  description?: string
}) => (
  <div>
    <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
    {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
  </div>
)

export const AdminInput = ({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`rounded-lg border border-white/10 bg-[#1f1f23] px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-[#C5A073]/50 focus:ring-1 focus:ring-[#C5A073]/30 ${className}`}
  />
)

export const AdminSelect = ({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`rounded-lg border border-white/10 bg-[#1f1f23] px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-[#C5A073]/50 focus:ring-1 focus:ring-[#C5A073]/30 ${className}`}
  >
    {children}
  </select>
)

export const AdminTabClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-[#C5A073] text-[#121212]'
      : 'border border-white/10 bg-[#1f1f23] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
  }`

export const AdminStatCard = ({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: 'green' | 'red'
}) => (
  <div className="rounded-xl border border-white/5 bg-[#18181b] p-5">
    <p className="text-sm text-zinc-500">{label}</p>
    <p
      className={`mt-2 text-2xl font-bold ${
        tone === 'red' ? 'text-red-400' : tone === 'green' ? 'text-emerald-400' : 'text-zinc-100'
      }`}
    >
      {value}
    </p>
  </div>
)
