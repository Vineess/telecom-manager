import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = { title: 'Telecom Manager', description: '...' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
