// src/app/(app)/ordens/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { useMiniDB } from '@/lib/storage'
import { type Priority, type WorkOrderStatus } from '@/lib/types'
import { cn, uid } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const statuses: WorkOrderStatus[] = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada']
const priorities: Priority[] = ['Baixa', 'Média', 'Alta', 'Crítica']

export default function OrdersPage() {
  const { orders, customers, technicians, addOrder, updateOrderStatus, assignTechnician } = useMiniDB()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('Todos')

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const sOK = status === 'Todos' || o.status === status
      const text = (o.title + ' ' + (o.description ?? '')).toLowerCase()
      const qOK = q.trim().length === 0 || text.includes(q.toLowerCase())
      return sOK && qOK
    })
  }, [orders, q, status])

  // Form state (novo)
  const [openNew, setOpenNew] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '',
    customerId: '', technicianId: '',
    priority: 'Média' as Priority,
    dueDate: '',
  })
  const resetForm = () => setForm({ title: '', description: '', customerId: '', technicianId: '', priority: 'Média', dueDate: '' })

  function submitNew() {
    if (!form.title || !form.customerId) return
    addOrder({
      title: form.title,
      description: form.description || undefined,
      customerId: form.customerId,
      technicianId: form.technicianId || undefined,
      status: 'Pendente',
      priority: form.priority,
      dueDate: form.dueDate || undefined,
    })
    setOpenNew(false)
    resetForm()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Ordens de Serviço</h1>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button>Novo chamado</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>Criar OS</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex.: Instalação FTTH - Bloco B" />
              </div>
              <div className="grid gap-2">
                <Label>Cliente *</Label>
                <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Técnico (opcional)</Label>
                <Select value={form.technicianId} onValueChange={v => setForm(f => ({ ...f, technicianId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Atribuir técnico..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Sem atribuição —</SelectItem>
                    {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data limite (opcional)</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenNew(false)}>Cancelar</Button>
              <Button onClick={submitNew}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap gap-3 items-center justify-between">
            <span>Lista de OS</span>
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Buscar título/descrição..." value={q} onChange={e => setQ(e.target.value)} className="w-64" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos status</SelectItem>
                  {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="[&>th]:py-2 [&>th]:pr-3">
                <th>ID</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Aberta em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const customer = customers.find(c => c.id === o.customerId)?.name ?? '—'
                const tech = technicians.find(t => t.id === o.technicianId)?.name ?? '—'
                return (
                  <tr key={o.id} className="border-t [&>td]:py-2 [&>td]:pr-3">
                    <td className="font-mono text-xs">{o.id.slice(0, 6)}</td>
                    <td className="max-w-[28ch] truncate">{o.title}</td>
                    <td>{customer}</td>
                    <td>{tech}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><PriorityBadge priority={o.priority} /></td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="text-right">
                      <OrderActions orderId={o.id} />
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum resultado.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const map: Record<WorkOrderStatus, string> = {
    'Pendente': 'bg-yellow-100 text-yellow-800',
    'Em andamento': 'bg-blue-100 text-blue-800',
    'Concluída': 'bg-green-100 text-green-800',
    'Cancelada': 'bg-red-100 text-red-800',
  }
  return <Badge className={cn('font-normal', map[status])}>{status}</Badge>
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

function OrderActions({ orderId }: { orderId: string }) {
  const { orders, technicians, updateOrderStatus, assignTechnician } = useMiniDB()
  const order = orders.find(o => o.id === orderId)!
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">Detalhes</Button>
      </SheetTrigger>
      <SheetContent className="w-[480px] sm:w-[560px] overflow-y-auto">
        <SheetHeader><SheetTitle>OS • {order.title}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v as WorkOrderStatus)}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Pendente','Em andamento','Concluída','Cancelada'] as WorkOrderStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Técnico</span>
            <Select value={order.technicianId ?? ''} onValueChange={(v) => assignTechnician(order.id, v || undefined)}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Atribuir..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Sem atribuição —</SelectItem>
                {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Criada em</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>

          {order.description && (
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Descrição</span>
              <p className="text-sm">{order.description}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
