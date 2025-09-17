'use client'

import { Moon, Sun, Laptop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettings, applyTheme } from '@/lib/settings'

export default function ThemeToggle() {
  const { settings, setSettings } = useSettings()
  function set(v: 'light'|'dark'|'system') {
    setSettings(prev => ({ ...prev, theme: v }))
    applyTheme(v)
  }
  const t = settings.theme
  return (
    <div className="inline-flex gap-1">
      <Button size="icon" variant={t==='light'?'default':'outline'} onClick={()=>set('light')} title="Claro"><Sun className="h-4 w-4"/></Button>
      <Button size="icon" variant={t==='dark'?'default':'outline'}  onClick={()=>set('dark')}  title="Escuro"><Moon className="h-4 w-4"/></Button>
      <Button size="icon" variant={t==='system'?'default':'outline'} onClick={()=>set('system')} title="Sistema"><Laptop className="h-4 w-4"/></Button>
    </div>
  )
}
