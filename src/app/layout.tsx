// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import ThemeWatcher from '@/components/ThemeWatcher'

export const metadata: Metadata = {
  title: 'Telecom Manager',
  description: 'Sistema de telecomunicações',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>
        <ThemeWatcher />
        {children}
      </body>
    </html>
  )
}
