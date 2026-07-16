import React, { type ReactNode, useState, useRef, useEffect } from 'react'

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
  value,
  onChange,
  className = '',
  children,
  disabled,
}: {
  value?: string | number | string[]
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
  children: React.ReactNode
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Extract options from children
  const options: { value: string; label: string }[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const optionElement = child as React.ReactElement<any>
      options.push({
        value: String(optionElement.props.value ?? ''),
        label: String(optionElement.props.children ?? ''),
      })
    }
  })

  // Determine current active label
  const currentValueStr = value !== undefined ? String(value) : ''
  const selectedOption = options.find((opt) => opt.value === currentValueStr) || options[0]

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (val: string) => {
    if (disabled) return
    if (onChange) {
      const mockEvent = {
        target: {
          value: val,
          name: '',
        },
      } as unknown as React.ChangeEvent<HTMLSelectElement>
      onChange(mockEvent)
    }
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#1f1f23] px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-[#C5A073]/50 focus:ring-1 focus:ring-[#C5A073]/30 disabled:opacity-50"
      >
        <span>{selectedOption?.label || ''}</span>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Animated Dropdown Menu */}
      <div
        className={`absolute right-0 z-50 mt-1.5 w-full min-w-[220px] origin-top-right rounded-lg border border-white/10 bg-[#1f1f23] p-1 shadow-xl transition-all duration-200 ${
          isOpen
            ? 'visible scale-100 opacity-100 translate-y-0'
            : 'invisible scale-95 opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="max-h-60 overflow-y-auto space-y-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === currentValueStr
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#C5A073] text-[#121212] font-semibold'
                    : 'text-zinc-300 hover:bg-[#C5A073]/10 hover:text-[#C5A073]'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

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
