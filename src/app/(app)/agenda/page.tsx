'use client'

import { useMemo, useState } from 'react'
import { useMiniDB } from '@/lib/storage'
import { type Priority, type WorkOrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const STATUSES: WorkOrderStatus[] = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada']
const PRIORITIES: Priority[] = ['Baixa', 'Média', 'Alta', 'Crítica']

export default function AgendaKanbanPage() {
  const { orders, customers, technicians, updateOrderStatus } = useMiniDB()

  // filtros
  const [q, setQ] = useState('')
  const [tech, setTech] = useState<string>('Todos')
  const [cust, setCust] = useState<string>('Todos')
  const [prio, setPrio] = useState<string>('Todas')

  // filtra
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return orders.filter(o => {
      if (tech !== 'Todos' && o.technicianId !== tech) return false
      if (cust !== 'Todos' && o.customerId !== cust) return false
      if (prio !== 'Todas' && o.priority !== prio) return false

      if (term.length) {
        const customerName = customers.find(c => c.id === o.customerId)?.name ?? ''
        const techName = technicians.find(t => t.id === o.technicianId)?.name ?? ''
        const text = `${o.title} ${o.description ?? ''} ${customerName} ${techName}`.toLowerCase()
        if (!text.includes(term)) return false
      }
      return true
    })
  }, [orders, q, tech, cust, prio, customers, technicians])

  // monta colunas
  const columns = useMemo(() => {
    const map: Record<WorkOrderStatus, typeof filtered> = {
      'Pendente': [],
      'Em andamento': [],
      'Concluída': [],
      'Cancelada': []
    }
    for (const o of filtered) map[o.status].push(o)
    // ordena por dueDate asc (quando existir), senão por createdAt desc
    for (const s of STATUSES) {
      map[s].sort((a, b) => {
        const ad = a.dueDate ? +new Date(a.dueDate) : Infinity
        const bd = b.dueDate ? +new Date(b.dueDate) : Infinity
        if (ad !== bd) return ad - bd
        return +new Date(b.createdAt) - +new Date(a.createdAt)
      })
    }
    return map
  }, [filtered])

  // DnD handlers (HTML5)
  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDrop(e: React.DragEvent, status: WorkOrderStatus) {
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    updateOrderStatus(id, status)
  }
  function allowDrop(e: React.DragEvent) {
    e.preventDefault() // necessário para permitir drop
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Agenda • Kanban</h1>

      {/* filtros */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por título, cliente, técnico..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-64"
        />
        <Select value={tech} onValueChange={setTech}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Técnico" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos técnicos</SelectItem>
            {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={cust} onValueChange={setCust}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos clientes</SelectItem>
            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={prio} onValueChange={setPrio}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas prioridades</SelectItem>
            {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* board */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map(status => (
          <Card
            key={status}
            onDragOver={allowDrop}
            onDrop={(e) => onDrop(e, status)}
            className="min-h-[60vh] border-dashed hover:bg-muted/40 transition-colors"
          >
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{status}</CardTitle>
              <span className="text-sm text-muted-foreground">{columns[status].length}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {columns[status].map(o => {
                const customer = customers.find(c => c.id === o.customerId)?.name ?? '—'
                const techName = technicians.find(t => t.id === o.technicianId)?.name ?? '—'
                const overdue = o.dueDate ? +new Date(o.dueDate) < Date.now() && o.status !== 'Concluída' && o.status !== 'Cancelada' : false

                return (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, o.id)}
                    className={cn(
                      "rounded-lg border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing",
                      "hover:shadow-md transition-shadow"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium leading-snug">{o.title}</div>
                      <PriorityBadge priority={o.priority} />
                    </div>

                    {o.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{o.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="secondary" className="font-normal">Cliente: {customer}</Badge>
                      <Badge variant="secondary" className="font-normal">Técnico: {techName}</Badge>
                      {o.dueDate && (
                        <Badge className={cn("font-normal", overdue ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800")}>
                          {overdue ? 'Vencida: ' : 'Até: '}{new Date(o.dueDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Criada em {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>
                )
              })}

              {columns[status].length === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center select-none">
                  Arraste OS para cá
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, string> = {
    'Baixa': 'bg-slate-100 text-slate-800',
    'Média': 'bg-emerald-100 text-emerald-800',
    'Alta': 'bg-orange-100 text-orange-800',
    'Crítica': 'bg-red-100 text-red-800',
  }
  return <Badge className={cn('font-normal', map[priority])}>{priority}</Badge>
}
