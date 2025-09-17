// src/lib/storage.ts
'use client'

import { useEffect, useState } from 'react'
import type { Customer, Technician, WorkOrder, Priority, WorkOrderStatus } from './types'
import { uid } from './utils'

type Key = 'customers' | 'technicians' | 'orders'

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : initial
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])
  return [state, setState] as const
}

// Seeds iniciais para primeira carga
const seedCustomers: Customer[] = [
  { id: uid(), name: 'ACME Telecom', doc: '12.345.678/0001-90', phone: '(11) 3333-0000', address: 'Av. Paulista, 1000 - SP' },
  { id: uid(), name: 'Condomínio Solaris', phone: '(11) 99999-1234', address: 'Rua das Flores, 321 - SP' },
]

const seedTechs: Technician[] = [
  { id: uid(), name: 'João Pereira', phone: '(11) 98888-1111', skills: ['Fibra', 'OLT', 'Rede'] },
  { id: uid(), name: 'Maria Souza', phone: '(11) 97777-2222', skills: ['Rádio', 'Backbone'] },
]

const seedOrders = (customers: Customer[], techs: Technician[]): WorkOrder[] => [
  {
    id: uid(),
    title: 'Instalação FTTH - Sala 205',
    description: 'Passagem de drop + fusão + teste de sinal',
    customerId: customers[0].id,
    technicianId: techs[0].id,
    status: 'Pendente',
    priority: 'Alta',
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: uid(),
    title: 'Manutenção de rádio - Torre A',
    description: 'Ajuste de alinhamento e troca de PoE',
    customerId: customers[1].id,
    technicianId: techs[1].id,
    status: 'Em andamento',
    priority: 'Média',
    createdAt: new Date().toISOString(),
  },
]

/** “Mini DB” em localStorage */
export function useMiniDB() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', [])
  const [technicians, setTechnicians] = useLocalStorage<Technician[]>('technicians', [])
  const [orders, setOrders] = useLocalStorage<WorkOrder[]>('orders', [])

  // Seed 1x
  useEffect(() => {
    const fresh = customers.length === 0 && technicians.length === 0 && orders.length === 0
    if (fresh) {
      const c = seedCustomers
      const t = seedTechs
      const o = seedOrders(c, t)
      setCustomers(c)
      setTechnicians(t)
      setOrders(o)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    customers, setCustomers,
    technicians, setTechnicians,
    orders, setOrders,
    addCustomer: (c: Omit<Customer, 'id'>) => setCustomers(v => [...v, { id: uid(), ...c }]),
    addTechnician: (t: Omit<Technician, 'id'>) => setTechnicians(v => [...v, { id: uid(), ...t }]),
    addOrder: (o: Omit<WorkOrder, 'id' | 'createdAt'>) =>
      setOrders(v => [{ id: uid(), createdAt: new Date().toISOString(), ...o }, ...v]),
    updateOrderStatus: (id: string, status: WorkOrderStatus) =>
      setOrders(v => v.map(o => o.id === id ? { ...o, status } : o)),
    assignTechnician: (id: string, technicianId?: string) =>
      setOrders(v => v.map(o => o.id === id ? { ...o, technicianId } : o)),
  }
}
