// src/components/ThemeWatcher.tsx
'use client'

import { useEffect } from 'react'
import { applyTheme } from '@/lib/settings'

export default function ThemeWatcher() {
  useEffect(() => {
    // aplica o tema ao carregar
    const raw = localStorage.getItem('settings')
    const theme = raw ? (JSON.parse(raw)?.theme ?? 'system') : 'system'
    applyTheme(theme)

    // reage à mudança do sistema quando em 'system'
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const handler = () => {
      const raw2 = localStorage.getItem('settings')
      const t = raw2 ? (JSON.parse(raw2)?.theme ?? 'system') : 'system'
      if (t === 'system') applyTheme(t)
    }
    mq?.addEventListener?.('change', handler)
    return () => mq?.removeEventListener?.('change', handler)
  }, [])

  return null
}
