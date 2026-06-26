import { useCallback, useState } from 'react'

const readStoredCollapsed = (storageKey: string): boolean => {
  try {
    return localStorage.getItem(storageKey) === 'true'
  } catch {
    return false
  }
}

export const usePersistedSidebarCollapsed = (storageKey: string) => {
  const [isCollapsed, setIsCollapsedState] = useState(() => readStoredCollapsed(storageKey))

  const setIsCollapsed = useCallback(
    (value: boolean | ((previous: boolean) => boolean)) => {
      setIsCollapsedState((previous) => {
        const next = typeof value === 'function' ? value(previous) : value
        try {
          localStorage.setItem(storageKey, String(next))
        } catch {
          // Ignore storage errors
        }
        return next
      })
    },
    [storageKey],
  )

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((previous) => !previous)
  }, [setIsCollapsed])

  return { isCollapsed, setIsCollapsed, toggleCollapsed }
}
