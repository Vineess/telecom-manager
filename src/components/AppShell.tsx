// src/components/AppShell.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Menu, BadgeCheck, ClipboardList, Users, Wrench, CalendarDays, Boxes, BarChart3, Settings } from 'lucide-react'

import { useState } from 'react'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: BadgeCheck },
  { href: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/tecnicos', label: 'Técnicos', icon: Wrench },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/materiais', label: 'Materiais', icon: Boxes },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/config', label: 'Configurações', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-dvh flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "fixed z-40 inset-y-0 left-0 w-72 border-r bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-transform",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-16 flex items-center gap-2 px-4">
          <Badge variant="secondary" className="text-xs">TELCO</Badge>
          <span className="font-semibold">Telecom Manager</span>
        </div>
        <Separator />
        <nav className="p-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition',
                  active && 'bg-muted font-medium'
                )}>
                  <Icon className="size-4" />
                  <span>{label}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 md:pl-72">
        <header className="h-16 border-b flex items-center justify-between px-4 sticky top-0 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-30">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(v => !v)}>
              <Menu className="size-5" />
            </Button>
            <span className="text-sm text-muted-foreground hidden md:inline">Sistema de Telecomunicações</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span>v0.1 • UI Mock</span>
          </div>
        </header>
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
