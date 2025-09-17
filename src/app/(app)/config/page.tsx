'use client'

import { useRef, useState } from 'react'
import { useMiniDB } from '@/lib/storage'
import { useSettings, applyTheme, type Settings, type ThemeMode } from '@/lib/settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export default function ConfigPage() {
  const { settings, setSettings } = useSettings()
  const { customers, technicians, orders, materials, setCustomers, setTechnicians, setOrders, setMaterials } = useMiniDB()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importPayload, setImportPayload] = useState<any | null>(null)

  function updateCompany<K extends keyof Settings['company']>(key: K, value: Settings['company'][K]) {
    setSettings(prev => ({ ...prev, company: { ...prev.company, [key]: value } }))
  }

  function updateTheme(v: ThemeMode) {
    setSettings(prev => ({ ...prev, theme: v }))
    applyTheme(v)
  }

  function updateSLA(priority: keyof Settings['sla']['hoursByPriority'], hours: number) {
    setSettings(prev => ({
      ...prev,
      sla: { ...prev.sla, hoursByPriority: { ...prev.sla.hoursByPriority, [priority]: Math.max(0, Math.floor(hours)) } },
    }))
  }

  function updateWIP(status: keyof Settings['kanban']['wip'], value: number | null) {
    setSettings(prev => ({
      ...prev,
      kanban: { ...prev.kanban, wip: { ...prev.kanban.wip, [status]: value } },
    }))
  }

  function updateNotify<K extends keyof Settings['notifications']>(key: K, value: boolean) {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }))
  }

  // Backup (JSON)
  function doExport() {
    const backup = {
      meta: { app: 'telecom-manager', version: 1, exportedAt: new Date().toISOString() },
      settings,
      data: { customers, technicians, orders, materials },
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `telecom-backup-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function onChooseFile() {
    fileRef.current?.click()
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    try {
      const json = JSON.parse(text)
      setImportPayload(json)
    } catch {
      alert('Arquivo inválido. Selecione um JSON exportado pelo sistema.')
      e.target.value = ''
    }
  }

  function confirmImport() {
    if (!importPayload) return
    try {
      const { settings: s, data } = importPayload
      if (s) localStorage.setItem('settings', JSON.stringify(s))
      if (data?.customers) setCustomers(data.customers)
      if (data?.technicians) setTechnicians(data.technicians)
      if (data?.orders) setOrders(data.orders)
      if (data?.materials) setMaterials(data.materials)
      setImportPayload(null)
      // força aplicar tema do backup
      const theme = (s?.theme ?? 'system') as ThemeMode
      applyTheme(theme)
      alert('Importação concluída.')
    } catch (err) {
      console.error(err)
      alert('Falha ao importar. Verifique o arquivo.')
    }
  }

  function resetAll() {
    // Limpa e deixa o efeito de seed do useMiniDB repopular na próxima carga
    localStorage.removeItem('customers')
    localStorage.removeItem('technicians')
    localStorage.removeItem('orders')
    localStorage.removeItem('materials')
    localStorage.removeItem('settings')
    location.reload()
  }

  const hp = settings.sla.hoursByPriority
  const wip = settings.kanban.wip

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Configurações</h1>

      {/* Perfil da empresa */}
      <Card>
        <CardHeader><CardTitle>Perfil da empresa</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={settings.company.name} onChange={e => updateCompany('name', e.target.value)} placeholder="Ex.: Minha Telecom" />
          </div>
          <div className="grid gap-2">
            <Label>Documento (CNPJ/CPF)</Label>
            <Input value={settings.company.doc ?? ''} onChange={e => updateCompany('doc', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Telefone</Label>
            <Input value={settings.company.phone ?? ''} onChange={e => updateCompany('phone', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>E-mail</Label>
            <Input type="email" value={settings.company.email ?? ''} onChange={e => updateCompany('email', e.target.value)} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Endereço</Label>
            <Textarea value={settings.company.address ?? ''} onChange={e => updateCompany('address', e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Aparência / Tema */}
      <Card>
        <CardHeader><CardTitle>Aparência</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Tema</span>
            <Select value={settings.theme} onValueChange={v => updateTheme(v as ThemeMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* SLA por prioridade */}
      <Card>
        <CardHeader><CardTitle>SLA (horas alvo por prioridade)</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {(['Baixa','Média','Alta','Crítica'] as const).map(p => (
            <div key={p} className="grid gap-2">
              <Label>{p}</Label>
              <Input type="number" min={0} value={hp[p]} onChange={e => updateSLA(p, Number(e.target.value || 0))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Kanban */}
      <Card>
        <CardHeader><CardTitle>Kanban</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {(['Pendente','Em andamento','Concluída','Cancelada'] as const).map(s => (
            <div key={s} className="grid gap-2">
              <Label>WIP • {s} (0 = ilimitado)</Label>
              <Input
                type="number"
                min={0}
                value={wip[s] == null ? 0 : wip[s]!}
                onChange={e => {
                  const n = Number(e.target.value || 0)
                  updateWIP(s, n > 0 ? n : null)
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notificações (placeholders) */}
      <Card>
        <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <ToggleRow
            label="Notificações desktop"
            checked={settings.notifications.enableDesktop}
            onChange={v => updateNotify('enableDesktop', v)}
          />
          <ToggleRow
            label="E-mail de eventos"
            checked={settings.notifications.enableEmail}
            onChange={v => updateNotify('enableEmail', v)}
          />
          <ToggleRow
            label="Resumo diário"
            checked={settings.notifications.dailyDigest}
            onChange={v => updateNotify('dailyDigest', v)}
          />
        </CardContent>
      </Card>

      {/* Backup & Restauração */}
      <Card>
        <CardHeader><CardTitle>Dados • Backup & Restauração</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={doExport}>Exportar backup (JSON)</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onFileChange} />
            <Button variant="outline" onClick={onChooseFile}>Importar backup (JSON)</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Resetar tudo (limpar dados)</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                </AlertDialogHeader>
                <p className="text-sm text-muted-foreground">
                  Isso vai limpar configurações e dados locais (clientes, técnicos, OS, materiais) e recarregar a página.
                </p>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={resetAll}>Resetar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {importPayload && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Arquivo pronto para importar</div>
                  <div className="text-sm text-muted-foreground">Isso substituirá dados atuais.</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { setImportPayload(null); if (fileRef.current) fileRef.current.value = '' }}>Cancelar</Button>
                  <Button onClick={confirmImport}>Confirmar importação</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }:{
  label: string
  checked: boolean
  onChange: (v:boolean)=>void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border rounded-lg p-3">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">Sem envio real (mock)</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
