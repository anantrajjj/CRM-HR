'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { useAppStore } from '@/stores/app-store'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="flex h-screen bg-cream-parchment">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
