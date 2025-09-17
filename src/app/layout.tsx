import './globals.css'
import type { Metadata } from 'next'
import ThemeWatcher from '@/components/ThemeWatcher'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = { title: 'Telecom Manager', description: 'Sistema de telecomunicações' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" className={inter.variable}>
      <body className="font-sans antialiased">{/* fonte + suavização */}
        <ThemeWatcher />
        {children}
      </body>
    </html>
  )
}
