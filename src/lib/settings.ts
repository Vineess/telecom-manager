// src/lib/settings.ts
'use client'

import { useEffect, useState } from 'react'
import type { Priority, WorkOrderStatus } from './types'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Settings {
  company: {
    name: string
    doc?: string
    phone?: string
    email?: string
    address?: string
  }
  theme: ThemeMode
  sla: {
    hoursByPriority: Record<Priority, number> // ex.: {'Baixa':48,'Média':24,'Alta':8,'Crítica':4}
  }
  kanban: {
    wip: Record<WorkOrderStatus, number | null> // limite por coluna (null = sem limite)
  }
  notifications: {
    enableDesktop: boolean
    enableEmail: boolean
    dailyDigest: boolean
  }
  labels: {
    // rótulos customizados (apenas visuais)
    status: Partial<Record<WorkOrderStatus, string>>
    priority: Partial<Record<Priority, string>>
  }
}

const DEFAULT_SETTINGS: Settings = {
  company: { name: 'Minha Telecom' },
  theme: 'system',
  sla: {
    hoursByPriority: { 'Baixa': 72, 'Média': 24, 'Alta': 8, 'Crítica': 4 },
  },
  kanban: {
    wip: { 'Pendente': null, 'Em andamento': 10, 'Concluída': null, 'Cancelada': null },
  },
  notifications: { enableDesktop: false, enableEmail: false, dailyDigest: false },
  labels: { status: {}, priority: {} },
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    const raw = localStorage.getItem('settings')
    return raw ? (JSON.parse(raw) as Settings) : DEFAULT_SETTINGS
  })

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings))
  }, [settings])

  function patchSettings(patch: Partial<Settings>) {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  return { settings, setSettings, patchSettings }
}

/** Aplica/retira a classe 'dark' no <html> conforme preferências. */
export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', isDark)
}
