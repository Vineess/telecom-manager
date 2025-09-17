'use client'

import { useEffect, useState } from 'react'
import type { Customer, Technician, WorkOrder, WorkOrderStatus, Material, Unit } from './types'
import { uid } from './utils'

type Key = 'customers' | 'technicians' | 'orders' | 'materials'

function useLocalStorage<T>(key: Key, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : initial
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])
  return [state, setState] as const
}

// ------- Seeds -------
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
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    priority: 'Alta',
  },
  {
    id: uid(),
    title: 'Manutenção de rádio - Torre A',
    description: 'Ajuste de alinhamento e troca de PoE',
    customerId: customers[1].id,
    technicianId: techs[1].id,
    status: 'Em andamento',
    createdAt: new Date().toISOString(),
    priority: 'Média',
  },
]

const seedMaterials: Material[] = [
  { id: uid(), name: 'Cabo Drop 1FO', sku: 'DRP-1FO', unit: 'm',  qty: 500, minQty: 200, cost: 0.9,  price: 1.9,  location: 'Prateleira A1', updatedAt: new Date().toISOString() },
  { id: uid(), name: 'Conector SC/APC', sku: 'SC-APC', unit: 'un', qty: 150, minQty: 100, cost: 2.2,  price: 5.0,  location: 'Gaveta B2',     updatedAt: new Date().toISOString() },
  { id: uid(), name: 'ONU ZTE ZXHN F660', sku: 'ONU-F660', unit: 'un', qty: 12, minQty: 10, cost: 120.0, price: 220.0, location: 'Caixa C3', updatedAt: new Date().toISOString() },
]

// ------- Mini “DB” -------
export function useMiniDB() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', [])
  const [technicians, setTechnicians] = useLocalStorage<Technician[]>('technicians', [])
  const [orders, setOrders] = useLocalStorage<WorkOrder[]>('orders', [])
  const [materials, setMaterials] = useLocalStorage<Material[]>('materials', [])

  // Seed 1x
  useEffect(() => {
    const fresh =
      customers.length === 0 &&
      technicians.length === 0 &&
      orders.length === 0 &&
      materials.length === 0

    if (fresh) {
      const c = seedCustomers
      const t = seedTechs
      const o = seedOrders(c, t)
      const m = seedMaterials
      setCustomers(c)
      setTechnicians(t)
      setOrders(o)
      setMaterials(m)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    customers, setCustomers,
    technicians, setTechnicians,
    orders, setOrders,
    materials, setMaterials,

    // Customers
    addCustomer: (c: Omit<Customer, 'id'>) =>
      setCustomers(v => [...v, { id: uid(), ...c }]),
    updateCustomer: (id: string, patch: Partial<Omit<Customer, 'id'>>) =>
      setCustomers(v => v.map(c => (c.id === id ? { ...c, ...patch } : c))),
    removeCustomer: (id: string) =>
      setCustomers(v => v.filter(c => c.id !== id)),

    // Technicians
    addTechnician: (t: Omit<Technician, 'id'>) =>
      setTechnicians(v => [...v, { id: uid(), ...t }]),
    updateTechnician: (id: string, patch: Partial<Omit<Technician, 'id'>>) =>
      setTechnicians(v => v.map(tx => (tx.id === id ? { ...tx, ...patch } : tx))),
    removeTechnician: (id: string) => {
      setTechnicians(v => v.filter(tx => tx.id !== id))
      setOrders(v => v.map(o => (o.technicianId === id ? { ...o, technicianId: undefined } : o)))
    },

    // Orders
    addOrder: (o: Omit<WorkOrder, 'id' | 'createdAt'>) =>
      setOrders(v => [{ id: uid(), createdAt: new Date().toISOString(), ...o }, ...v]),
    updateOrderStatus: (id: string, status: WorkOrderStatus) =>
      setOrders(v => v.map(o => (o.id === id ? { ...o, status } : o))),
    assignTechnician: (id: string, technicianId?: string) =>
      setOrders(v => v.map(o => (o.id === id ? { ...o, technicianId } : o))),

    // Materials
    addMaterial: (m: Omit<Material, 'id' | 'updatedAt' | 'qty'> & { qty?: number }) =>
      setMaterials(v => [...v, { id: uid(), updatedAt: new Date().toISOString(), qty: m.qty ?? 0, ...m }]),
    updateMaterial: (id: string, patch: Partial<Omit<Material, 'id'>>) =>
      setMaterials(v => v.map(m => (m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m))),
    removeMaterial: (id: string) =>
      setMaterials(v => v.filter(m => m.id !== id)),
    adjustMaterialQty: (id: string, delta: number) =>
      setMaterials(v => v.map(m => {
        if (m.id !== id) return m
        const next = Math.max(0, (m.qty ?? 0) + delta)
        return { ...m, qty: next, updatedAt: new Date().toISOString() }
      })),
  }
}
