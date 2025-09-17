'use client'

import { useMemo, useState } from 'react'
import { useMiniDB } from '@/lib/storage'
import type { Priority, WorkOrderStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { downloadCSV } from '@/lib/export'

const STATUSES: WorkOrderStatus[] = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada']
const PRIORITIES: Priority[] = ['Baixa', 'Média', 'Alta', 'Crítica']

export default function RelatoriosPage() {
  const { orders, customers, technicians, materials } = useMiniDB()

  // filtros
  const [start, setStart] = useState<string>('') // YYYY-MM-DD
  const [end, setEnd] = useState<string>('')     // YYYY-MM-DD
  const [cust, setCust] = useState<string>('Todos')
  const [tech, setTech] = useState<string>('Todos')
  const [status, setStatus] = useState<string>('Todos')
  const [prio, setPrio] = useState<string>('Todas')

  // helpers date
  const startMs = start ? new Date(start + 'T00:00:00').getTime() : -Infinity
  const endMs   = end   ? new Date(end   + 'T23:59:59').getTime() : +Infinity

  // dataset filtrado
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const t = new Date(o.createdAt).getTime()
      if (t < startMs || t > endMs) return false
      if (cust !== 'Todos' && o.customerId !== cust) return false
      if (tech !== 'Todos' && o.technicianId !== tech) return false
      if (status !== 'Todos' && o.status !== status) return false
      if (prio !== 'Todas' && o.priority !== prio) return false
      return true
    })
  }, [orders, startMs, endMs, cust, tech, status, prio])

  // contagens por status
  const byStatus = useMemo(() => {
    const acc: Record<WorkOrderStatus, number> = { 'Pendente': 0, 'Em andamento': 0, 'Concluída': 0, 'Cancelada': 0 }
    for (const o of filteredOrders) acc[o.status]++
    return acc
  }, [filteredOrders])

  // por técnico
  type RowByTech = { tecnico: string; total: number } & Record<WorkOrderStatus, number>
  const rowsByTech: RowByTech[] = useMemo(() => {
    const map = new Map<string, RowByTech>()
    for (const o of filteredOrders) {
      const name = o.technicianId ? (technicians.find(t => t.id === o.technicianId)?.name ?? '—') : '—'
      if (!map.has(name)) map.set(name, { tecnico: name, total: 0, 'Pendente': 0, 'Em andamento': 0, 'Concluída': 0, 'Cancelada': 0 })
      const r = map.get(name)!
      r.total++
      r[o.status]++
    }
    return [...map.values()].sort((a,b) => b.total - a.total)
  }, [filteredOrders, technicians])

  // por cliente
  type RowByCust = { cliente: string; total: number } & Record<WorkOrderStatus, number>
  const rowsByCust: RowByCust[] = useMemo(() => {
    const map = new Map<string, RowByCust>()
    for (const o of filteredOrders) {
      const name = customers.find(c => c.id === o.customerId)?.name ?? '—'
      if (!map.has(name)) map.set(name, { cliente: name, total: 0, 'Pendente': 0, 'Em andamento': 0, 'Concluída': 0, 'Cancelada': 0 })
      const r = map.get(name)!
      r.total++
      r[o.status]++
    }
    return [...map.values()].sort((a,b) => b.total - a.total)
  }, [filteredOrders, customers])

  // materiais (estoque baixo + valoração)
  const lowStock = useMemo(() => {
    return materials.filter(m => m.minQty != null && m.qty <= m.minQty)
                    .sort((a,b) => (a.qty - (a.minQty ?? 0)) - (b.qty - (b.minQty ?? 0)))
  }, [materials])

  const valuation = useMemo(() => {
    const totalItems = materials.length
    const totalLow = lowStock.length
    const totalCost  = materials.reduce((s, m) => s + (m.qty * (m.cost ?? 0)), 0)
    const totalPrice = materials.reduce((s, m) => s + (m.qty * (m.price ?? 0)), 0)
    return { totalItems, totalLow, totalCost, totalPrice }
  }, [materials, lowStock])

  function brl(n: number) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // exports
  function exportOrders() {
    downloadCSV('os_filtradas.csv',
      filteredOrders.map(o => ({
        id: o.id,
        titulo: o.title,
        descricao: o.description ?? '',
        cliente: customers.find(c => c.id === o.customerId)?.name ?? '—',
        tecnico: o.technicianId ? (technicians.find(t => t.id === o.technicianId)?.name ?? '—') : '—',
        status: o.status,
        prioridade: o.priority,
        criada_em: new Date(o.createdAt).toLocaleString(),
        data_limite: o.dueDate ? new Date(o.dueDate).toLocaleDateString() : '',
      }))
    )
  }
  function exportByTech() {
    downloadCSV('os_por_tecnico.csv', rowsByTech, [
      { key: 'tecnico', label: 'Técnico' },
      { key: 'total', label: 'Total' },
      { key: 'Pendente', label: 'Pendente' },
      { key: 'Em andamento', label: 'Em andamento' },
      { key: 'Concluída', label: 'Concluída' },
      { key: 'Cancelada', label: 'Cancelada' },
    ])
  }
  function exportByCust() {
    downloadCSV('os_por_cliente.csv', rowsByCust, [
      { key: 'cliente', label: 'Cliente' },
      { key: 'total', label: 'Total' },
      { key: 'Pendente', label: 'Pendente' },
      { key: 'Em andamento', label: 'Em andamento' },
      { key: 'Concluída', label: 'Concluída' },
      { key: 'Cancelada', label: 'Cancelada' },
    ])
  }
  function exportLowStock() {
    downloadCSV('materiais_estoque_baixo.csv',
      lowStock.map(m => ({
        nome: m.name,
        sku: m.sku ?? '',
        unidade: m.unit,
        quantidade: m.qty,
        minimo: m.minQty ?? '',
        local: m.location ?? '',
        atualizado_em: new Date(m.updatedAt).toLocaleString(),
      }))
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Relatórios</h1>

      {/* Filtros */}
      <Card className="card-elev soft">
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Início</span>
            <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Fim</span>
            <Input type="date" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Cliente</span>
            <Select value={cust} onValueChange={setCust}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Técnico</span>
            <Select value={tech} onValueChange={setTech}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Prioridade</span>
            <Select value={prio} onValueChange={setPrio}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle>Total de OS</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{filteredOrders.length}</CardContent></Card>

        <Card><CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent className="space-x-2">
            <Badge className="bg-yellow-100 text-yellow-800 font-normal">P: {byStatus['Pendente']}</Badge>
            <Badge className="bg-blue-100 text-blue-800 font-normal">A: {byStatus['Em andamento']}</Badge>
            <Badge className="bg-green-100 text-green-800 font-normal">C: {byStatus['Concluída']}</Badge>
            <Badge className="bg-red-100 text-red-800 font-normal">X: {byStatus['Cancelada']}</Badge>
          </CardContent></Card>

        <Card><CardHeader><CardTitle>Materiais (itens)</CardTitle></CardHeader>
          <CardContent className="text-lg">
            Total: <b>{valuation.totalItems}</b> &nbsp;•&nbsp; Baixo estoque: <b>{valuation.totalLow}</b>
          </CardContent></Card>

        <Card><CardHeader><CardTitle>Valoração de estoque</CardTitle></CardHeader>
          <CardContent className="text-sm">
            Custo: <b>{brl(valuation.totalCost)}</b><br />
            Preço: <b>{brl(valuation.totalPrice)}</b>
          </CardContent></Card>
      </div>

      {/* OS por Técnico */}
      <Card className="card-elev soft">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>OS por Técnico</CardTitle>
          <Button size="sm" onClick={exportByTech}>Exportar CSV</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm table-skin">
            <thead className="text-left text-muted-foreground">
              <tr className="[&>th]:py-2 [&>th]:pr-3">
                <th>Técnico</th><th>Total</th>
                <th>Pendente</th><th>Em andamento</th><th>Concluída</th><th>Cancelada</th>
              </tr>
            </thead>
            <tbody>
              {rowsByTech.map(r => (
                <tr key={r.tecnico} className="border-t [&>td]:py-2 [&>td]:pr-3">
                  <td>{r.tecnico}</td>
                  <td>{r.total}</td>
                  <td>{r['Pendente']}</td>
                  <td>{r['Em andamento']}</td>
                  <td>{r['Concluída']}</td>
                  <td>{r['Cancelada']}</td>
                </tr>
              ))}
              {rowsByTech.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Sem dados.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* OS por Cliente */}
      <Card className="card-elev soft">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>OS por Cliente</CardTitle>
          <Button size="sm" onClick={exportByCust}>Exportar CSV</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm table-skin">
            <thead className="text-left text-muted-foreground">
              <tr className="[&>th]:py-2 [&>th]:pr-3">
                <th>Cliente</th><th>Total</th>
                <th>Pendente</th><th>Em andamento</th><th>Concluída</th><th>Cancelada</th>
              </tr>
            </thead>
            <tbody>
              {rowsByCust.map(r => (
                <tr key={r.cliente} className="border-t [&>td]:py-2 [&>td]:pr-3">
                  <td>{r.cliente}</td>
                  <td>{r.total}</td>
                  <td>{r['Pendente']}</td>
                  <td>{r['Em andamento']}</td>
                  <td>{r['Concluída']}</td>
                  <td>{r['Cancelada']}</td>
                </tr>
              ))}
              {rowsByCust.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Sem dados.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Materiais com baixo estoque */}
      <Card className="card-elev soft">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Materiais com estoque baixo</CardTitle>
          <Button size="sm" onClick={exportLowStock}>Exportar CSV</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm table-skin">
            <thead className="text-left text-muted-foreground">
              <tr className="[&>th]:py-2 [&>th]:pr-3">
                <th>Nome</th><th>SKU</th><th>Qtd</th><th>Mínimo</th><th>Un.</th><th>Local</th><th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map(m => (
                <tr key={m.id} className="border-t [&>td]:py-2 [&>td]:pr-3">
                  <td className="font-medium">{m.name}</td>
                  <td>{m.sku ?? '—'}</td>
                  <td>{m.qty}</td>
                  <td>{m.minQty ?? '—'}</td>
                  <td>{m.unit}</td>
                  <td>{m.location ?? '—'}</td>
                  <td className="whitespace-nowrap">{new Date(m.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {lowStock.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum item abaixo do mínimo.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Exportar OS filtradas */}
      <div className="flex justify-end">
        <Button onClick={exportOrders}>Exportar OS (filtradas)</Button>
      </div>
    </div>
  )
}
