import type { ReactNode } from "react";

type SidebarHoverLabelProps = {
  label: string
  isCollapsed: boolean
  children: ReactNode
  className?: string
  variant?: 'light' | 'dark'
}

const SidebarHoverLabel = ({
  label,
  isCollapsed,
  children,
  className = '',
  variant = 'dark',
}: SidebarHoverLabelProps) => (
  <div className={`relative group ${className}`}>
    {children}
    {isCollapsed && (
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[60] -translate-y-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${
          variant === 'dark'
            ? 'border border-white/10 bg-zinc-800 text-white'
            : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
        }`}
      >
        {label}
      </span>
    )}
  </div>
)

export default SidebarHoverLabel
