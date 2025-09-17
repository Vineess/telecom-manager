'use client'

import { useMemo, useState } from 'react'
import { useMiniDB } from '@/lib/storage'
import type { Unit } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'

const UNITS: Unit[] = ['un', 'm', 'm²', 'm³', 'kg']

type Form = {
  id?: string
  name: string
  sku?: string
  unit: Unit
  qty: string
  minQty?: string
  cost?: string
  price?: string
  location?: string
  notes?: string
}

export default function MateriaisPage() {
  const { materials, addMaterial, updateMaterial, removeMaterial, adjustMaterialQty } = useMiniDB()
  const [q, setQ] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return materials.filter(m => {
      if (onlyLow && !(m.minQty != null && m.qty <= m.minQty)) return false
      if (!term) return true
      return [m.name, m.sku, m.location, m.notes]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(term))
    })
  }, [materials, q, onlyLow])

  // criar/editar
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>({ name: '', sku: '', unit: 'un', qty: '0', minQty: '', cost: '', price: '', location: '', notes: '' })
  const isEdit = Boolean(form.id)

  function openNew() {
    setForm({ name: '', sku: '', unit: 'un', qty: '0', minQty: '', cost: '', price: '', location: '', notes: '' })
    setOpen(true)
  }
  function openEdit(id: string) {
    const m = materials.find(x => x.id === id)
    if (!m) return
    setForm({
      id: m.id,
      name: m.name,
      sku: m.sku ?? '',
      unit: m.unit,
      qty: String(m.qty ?? 0),
      minQty: m.minQty != null ? String(m.minQty) : '',
      cost: m.cost != null ? String(m.cost) : '',
      price: m.price != null ? String(m.price) : '',
      location: m.location ?? '',
      notes: m.notes ?? '',
    })
    setOpen(true)
  }

  function onSubmit() {
    if (!form.name.trim()) return
    const patch = {
      name: form.name.trim(),
      sku: form.sku?.trim() || undefined,
      unit: form.unit as Unit,
      qty: Math.max(0, Number(form.qty || 0)),
      minQty: form.minQty ? Math.max(0, Number(form.minQty)) : undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      price: form.price ? Number(form.price) : undefined,
      location: form.location?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    }
    if (isEdit && form.id) {
      const { qty, ...rest } = patch
      updateMaterial(form.id, { ...rest, qty })
    } else {
      addMaterial(patch)
    }
    setOpen(false)
  }

  // entrada/saída
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveId, setMoveId] = useState<string | null>(null)
  const [mode, setMode] = useState<'in' | 'out'>('in')
  const [moveQty, setMoveQty] = useState('')

  function openMove(id: string, m: 'in' | 'out') {
    setMoveId(id)
    setMode(m)
    setMoveQty('')
    setMoveOpen(true)
  }
  function submitMove() {
    if (!moveId) return
    const delta = Number(moveQty || 0)
    if (!delta || delta <= 0) return
    adjustMaterialQty(moveId, mode === 'in' ? delta : -delta)
    setMoveOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Materiais</h1>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar por nome, SKU, localização..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-80"
          />
          <Button
            variant={onlyLow ? 'default' : 'outline'}
            onClick={() => setOnlyLow(v => !v)}
            title="Mostrar apenas itens com estoque baixo"
          >
            {onlyLow ? 'Exibindo: Estoque baixo' : 'Filtrar: Estoque baixo'}
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>Novo material</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEdit ? 'Editar material' : 'Novo material'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Cabo Drop 1FO" />
                </div>
                <div className="grid gap-2">
                  <Label>SKU</Label>
                  <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ex.: DRP-1FO" />
                </div>

                <div className="grid gap-2">
                  <Label>Unidade</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm(f => ({ ...f, unit: v as Unit }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Quantidade</Label>
                  <Input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} min={0} />
                </div>

                <div className="grid gap-2">
                  <Label>Mínimo desejado</Label>
                  <Input type="number" value={form.minQty ?? ''} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} min={0} />
                </div>
                <div className="grid gap-2">
                  <Label>Custo (R$)</Label>
                  <Input type="number" step="0.01" value={form.cost ?? ''} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
                </div>

                <div className="grid gap-2">
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" value={form.price ?? ''} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Localização</Label>
                  <Input value={form.location ?? ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex.: Prateleira A1" />
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label>Notas</Label>
                  <Textarea rows={3} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={onSubmit} disabled={!form.name.trim()}>
                  {isEdit ? 'Salvar alterações' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="card-elev soft">
        <CardHeader><CardTitle>Catálogo de materiais</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm table-skin">
            <thead className="text-left text-muted-foreground">
              <tr className="[&>th]:py-2 [&>th]:pr-3">
                <th>Nome</th>
                <th>SKU</th>
                <th>Un.</th>
                <th className="text-right">Qtd</th>
                <th className="text-right">Mín.</th>
                <th className="text-right">Custo</th>
                <th className="text-right">Preço</th>
                <th>Local</th>
                <th>Atualizado</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const low = m.minQty != null && m.qty <= m.minQty
                return (
                  <tr key={m.id} className="border-t [&>td]:py-2 [&>td]:pr-3 align-middle">
                    <td className="font-medium">{m.name}</td>
                    <td>{m.sku ?? '—'}</td>
                    <td>{m.unit}</td>
                    <td className="text-right">
                      <span className="font-mono">{m.qty.toLocaleString('pt-BR')}</span>
                    </td>
                    <td className="text-right">{m.minQty != null ? m.minQty.toLocaleString('pt-BR') : '—'}</td>
                    <td className="text-right">{m.cost != null ? m.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</td>
                    <td className="text-right">{m.price != null ? m.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</td>
                    <td>{m.location ?? '—'}</td>
                    <td className="whitespace-nowrap">{new Date(m.updatedAt).toLocaleString()}</td>
                    <td className="text-right">
                      <div className="flex flex-wrap gap-2 justify-end">
                        {low && <Badge className="bg-red-100 text-red-800 font-normal">Estoque baixo</Badge>}
                        <Button size="sm" variant="outline" onClick={() => openMove(m.id, 'in')}>Entrada</Button>
                        <Button size="sm" variant="outline" onClick={() => openMove(m.id, 'out')}>Saída</Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(m.id)}>Editar</Button>
                        <ConfirmDelete onConfirm={() => removeMaterial(m.id)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    Nenhum material encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Dialog de ajuste de estoque */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === 'in' ? 'Entrada de estoque' : 'Saída de estoque'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min={0}
              value={moveQty}
              onChange={e => setMoveQty(e.target.value)}
              placeholder="Ex.: 10"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMoveOpen(false)}>Cancelar</Button>
            <Button onClick={submitMove} disabled={!Number(moveQty || 0)}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ConfirmDelete({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">Excluir</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir material?</AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">
          Esta ação não pode ser desfeita. O material será removido do armazenamento local.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
