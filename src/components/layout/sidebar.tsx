'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  Briefcase,
  Calendar,
  Clock,
  GraduationCap,
  BarChart3,
  Settings,
  HelpCircle,
  FileText,
  Target,
  DollarSign,
  Contact,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  module: 'dashboard' | 'masters' | 'crm' | 'hr' | 'reports' | 'settings'
}

const navItems: NavItem[] = [
  // Dashboard
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  // Masters
  { label: 'Departments', href: '/masters/departments', icon: Building2, module: 'masters' },
  { label: 'Designations', href: '/masters/designations', icon: Briefcase, module: 'masters' },
  { label: 'Leave Types', href: '/masters/leave-types', icon: Calendar, module: 'masters' },
  { label: 'Shift Types', href: '/masters/shift-types', icon: Clock, module: 'masters' },
  { label: 'Roles', href: '/masters/roles', icon: Settings, module: 'masters' },
  // CRM
  { label: 'Leads', href: '/crm/leads', icon: UserPlus, module: 'crm' },
  { label: 'Contacts', href: '/crm/contacts', icon: Contact, module: 'crm' },
  { label: 'Organizations', href: '/crm/organizations', icon: Building2, module: 'crm' },
  { label: 'Deals', href: '/crm/deals', icon: DollarSign, module: 'crm' },
  { label: 'Campaigns', href: '/crm/campaigns', icon: BarChart3, module: 'crm' },
  // HR
  { label: 'Employees', href: '/hr/employees', icon: Users, module: 'hr' },
  { label: 'Attendance', href: '/hr/attendance', icon: Clock, module: 'hr' },
  { label: 'Leave', href: '/hr/leave', icon: Calendar, module: 'hr' },
  { label: 'Timesheets', href: '/hr/timesheets', icon: FileText, module: 'hr' },
  { label: 'Training', href: '/hr/training', icon: GraduationCap, module: 'hr' },
  { label: 'Goals', href: '/hr/goals', icon: Target, module: 'hr' },
  // Reports
  { label: 'Reports', href: '/reports', icon: BarChart3, module: 'reports' },
  // Settings
  { label: 'Settings', href: '/settings', icon: Settings, module: 'settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen } = useAppStore()

  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.module]) {
      acc[item.module] = []
    }
    acc[item.module].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const moduleLabels: Record<string, string> = {
    dashboard: 'Overview',
    masters: 'Masters',
    crm: 'CRM',
    hr: 'Human Resources',
    reports: 'Reports',
    settings: 'Settings',
  }

  if (!sidebarOpen) return null

  return (
    <aside className="coda-sidebar flex flex-col h-screen overflow-y-auto">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-charcoal rounded-[9px] flex items-center justify-center">
            <span className="text-pure-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-xl text-charcoal tracking-tight">
            CRM<span className="text-olive-slate">+</span>HR
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6">
        {Object.entries(groupedItems).map(([module, items]) => (
          <div key={module}>
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className="font-mono text-xs uppercase tracking-wider text-pebble">
                {moduleLabels[module]}
              </span>
              <div className="flex-1 h-px bg-sage-mist" />
            </div>
            <ul className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-[9px] text-sm transition-colors',
                        isActive
                          ? 'bg-charcoal text-pure-white'
                          : 'text-olive-slate hover:bg-bone hover:text-charcoal'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-sage-mist">
        <Link
          href="/help"
          className="flex items-center gap-2 text-sm text-olive-slate hover:text-charcoal transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </Link>
      </div>
    </aside>
  )
}
