'use client'

import { useMemo, useState } from 'react'
import { useMiniDB } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'

type Form = {
  id?: string
  name: string
  doc?: string
  phone?: string
  address?: string
}

export default function ClientesPage() {
  const { customers, addCustomer, updateCustomer, removeCustomer } = useMiniDB()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return customers
    return customers.filter(c =>
      [c.name, c.doc, c.phone, c.address]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(term))
    )
  }, [q, customers])

  // Dialog (criar/editar)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>({ name: '', doc: '', phone: '', address: '' })
  const isEdit = Boolean(form.id)

  function openNew() {
    setForm({ name: '', doc: '', phone: '', address: '' })
    setOpen(true)
  }
  function openEdit(id: string) {
    const c = customers.find(x => x.id === id)
    if (!c) return
    setForm({ id: c.id, name: c.name, doc: c.doc, phone: c.phone, address: c.address })
    setOpen(true)
  }
  function onSubmit() {
    if (!form.name.trim()) return
    if (isEdit && form.id) {
      updateCustomer(form.id, {
        name: form.name.trim(),
        doc: form.doc?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
      })
    } else {
      addCustomer({
        name: form.name.trim(),
        doc: form.doc?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
      })
    }
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por nome, doc, telefone, endereço..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-80"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>Novo cliente</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{isEdit ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex.: Condomínio Alfa"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Documento (CNPJ/CPF)</Label>
                    <Input
                      value={form.doc ?? ''}
                      onChange={e => setForm(f => ({ ...f, doc: e.target.value }))}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Telefone</Label>
                    <Input
                      value={form.phone ?? ''}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="(11) 99999-0000"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Endereço</Label>
                  <Textarea
                    value={form.address ?? ''}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    rows={3}
                  />
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
        <CardHeader><CardTitle>Lista de clientes</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm table-skin">
            <thead className="text-left text-muted-foreground">
              <tr className="[&>th]:py-2 [&>th]:pr-3">
                <th>Nome</th>
                <th>Documento</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t [&>td]:py-2 [&>td]:pr-3 align-top">
                  <td className="font-medium">{c.name}</td>
                  <td>{c.doc ?? '—'}</td>
                  <td>{c.phone ?? '—'}</td>
                  <td className="max-w-[50ch] whitespace-pre-wrap">{c.address ?? '—'}</td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c.id)}>Editar</Button>
                      <ConfirmDelete onConfirm={() => removeCustomer(c.id)} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
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
          <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">
          Esta ação não pode ser desfeita. Os dados serão removidos do armazenamento local.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
