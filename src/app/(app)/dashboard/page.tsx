// src/app/(app)/dashboard/page.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMiniDB } from '@/lib/storage'

export default function DashboardPage() {
  const { orders, customers, technicians } = useMiniDB()
  const pend = orders.filter(o => o.status === 'Pendente').length
  const andamento = orders.filter(o => o.status === 'Em andamento').length
  const concl = orders.filter(o => o.status === 'Concluída').length

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-elev soft">
          <CardHeader><CardTitle>Ordens</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{orders.length}</CardContent>
        </Card>
        <Card className="card-elev soft">
          <CardHeader><CardTitle>Clientes</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{customers.length}</CardContent>
        </Card>
        <Card className="card-elev soft">
          <CardHeader><CardTitle>Técnicos</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{technicians.length}</CardContent>
        </Card>
        <Card className="card-elev soft">
          <CardHeader><CardTitle>Pendentes / Andamento / Concluídas</CardTitle></CardHeader>
          <CardContent className="text-lg">{pend} / {andamento} / {concl}</CardContent>
        </Card>
      </div>
    </div>
  )
}
