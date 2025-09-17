// src/lib/types.ts
export type WorkOrderStatus = 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada'
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Crítica'

export interface Customer {
  id: string
  name: string
  doc?: string
  phone?: string
  address?: string
}

export interface Technician {
  id: string
  name: string
  phone?: string
  skills?: string[]
}

export interface WorkOrder {
  id: string
  title: string
  description?: string
  customerId: string
  technicianId?: string
  status: WorkOrderStatus
  priority: Priority
  createdAt: string // ISO
  dueDate?: string  // ISO
}

export type Unit = 'un' | 'm' | 'm²' | 'm³' | 'kg'

export interface Material {
  id: string
  name: string
  sku?: string
  unit: Unit
  qty: number          // quantidade em estoque
  minQty?: number      // mínimo desejado
  cost?: number        // custo médio
  price?: number       // preço de venda
  location?: string    // localização no almoxarifado
  notes?: string
  updatedAt: string    // ISO
}
