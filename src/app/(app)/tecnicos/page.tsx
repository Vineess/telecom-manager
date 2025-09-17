'use client'

import { useMemo, useState } from 'react'
import { useMiniDB } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

type Form = {
  id?: string
  name: string
  phone?: string
  skills: string[]
}

export default function TecnicosPage() {
  const { technicians, addTechnician, updateTechnician, removeTechnician } = useMiniDB()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return technicians
    return technicians.filter(tx =>
      [tx.name, tx.phone, ...(tx.skills ?? [])]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(t))
    )
  }, [q, technicians])

  // modal criar/editar
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>({ name: '', phone: '', skills: [] })
  const [skillInput, setSkillInput] = useState('')
  const isEdit = Boolean(form.id)

  function openNew() {
    setForm({ name: '', phone: '', skills: [] })
    setSkillInput('')
    setOpen(true)
  }
  function openEdit(id: string) {
    const t = technicians.find(x => x.id === id)
    if (!t) return
    setForm({ id: t.id, name: t.name, phone: t.phone, skills: t.skills ?? [] })
    setSkillInput('')
    setOpen(true)
  }

  function addSkill() {
    const s = skillInput.trim()
    if (!s) return
    if (!form.skills.includes(s)) setForm(f => ({ ...f, skills: [...f.skills, s] }))
    setSkillInput('')
  }
  function removeSkill(s: string) {
    setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))
  }
  function onSubmit() {
    if (!form.name.trim()) return
    if (isEdit && form.id) {
      updateTechnician(form.id, {
        name: form.name.trim(),
        phone: form.phone?.trim() || undefined,
        skills: form.skills,
      })
    } else {
      addTechnician({
        name: form.name.trim(),
        phone: form.phone?.trim() || undefined,
        skills: form.skills,
      })
    }
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Técnicos</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por nome, telefone ou skill..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-80"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>Novo técnico</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{isEdit ? 'Editar técnico' : 'Novo técnico'}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex.: João Pereira"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone ?? ''}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 98888-1111"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                      placeholder="Ex.: Fibra, OLT, Rádio…"
                    />
                    <Button type="button" onClick={addSkill}>Adicionar</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.skills.map(s => (
                      <Badge key={s} variant="secondary" className="flex items-center gap-1">
                        {s}
                        <button
                          aria-label={`Remover ${s}`}
                          className="ml-1 inline-flex"
                          onClick={() => removeSkill(s)}
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))}
                    {form.skills.length === 0 && (
                      <span className="text-xs text-muted-foreground">Nenhuma skill adicionada.</span>
                    )}
                  </div>
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
        <CardHeader><CardTitle>Lista de técnicos</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm table-skin">
            <thead className="text-left text-muted-foreground">
              <tr className="[&>th]:py-2 [&>th]:pr-3">
                <th>Nome</th>
                <th>Telefone</th>
                <th>Skills</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-t [&>td]:py-2 [&>td]:pr-3 align-top">
                  <td className="font-medium">{t.name}</td>
                  <td>{t.phone ?? '—'}</td>
                  <td className="max-w-[60ch]">
                    <div className="flex flex-wrap gap-1.5">
                      {(t.skills ?? []).length > 0 ? (
                        t.skills!.map(s => <Badge key={s} variant="secondary">{s}</Badge>)
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => openEdit(t.id)}>Editar</Button>
                      <ConfirmDelete onConfirm={() => removeTechnician(t.id)} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    Nenhum técnico encontrado.
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
          <AlertDialogTitle>Excluir técnico?</AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">
          Esta ação não pode ser desfeita. O técnico será removido e as OS atribuídas ficarão sem técnico.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
