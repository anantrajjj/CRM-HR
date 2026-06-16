'use client'

import { useState, useEffect } from 'react'
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
  TrendingUp,
  MapPin,
  Award,
  Video,
  Filter,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  key: string
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    key: 'dashboard',
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    key: 'masters',
    label: 'Masters',
    items: [
      { label: 'Departments', href: '/masters/departments', icon: Building2 },
      { label: 'Designations', href: '/masters/designations', icon: Briefcase },
      { label: 'Leave Types', href: '/masters/leave-types', icon: Calendar },
      { label: 'Shift Types', href: '/masters/shift-types', icon: Clock },
      { label: 'Roles', href: '/masters/roles', icon: Settings },
    ],
  },
  {
    key: 'crm',
    label: 'CRM',
    items: [
      { label: 'Leads', href: '/crm/leads', icon: UserPlus },
      { label: 'Contacts', href: '/crm/contacts', icon: Contact },
      { label: 'Organizations', href: '/crm/organizations', icon: Building2 },
      { label: 'Deals', href: '/crm/deals', icon: DollarSign },
      { label: 'Products', href: '/crm/products', icon: Briefcase },
      { label: 'Quotes', href: '/crm/quotes', icon: FileText },
      { label: 'Campaigns', href: '/crm/campaigns', icon: BarChart3 },
      { label: 'Analytics', href: '/crm/analytics', icon: BarChart3 },
      { label: 'Forecasting', href: '/crm/forecasting', icon: TrendingUp },
      { label: 'Territories', href: '/crm/territories', icon: MapPin },
      { label: 'Quotas', href: '/crm/quotas', icon: Target },
      { label: 'Compensation', href: '/crm/compensation', icon: DollarSign },
      { label: 'Methodology', href: '/crm/methodology', icon: CheckCircle },
      { label: 'Scorecards', href: '/crm/scorecards', icon: Award },
      { label: 'Support', href: '/crm/support', icon: HelpCircle },
      { label: 'Meetings', href: '/crm/meetings', icon: Video },
      { label: 'Partners', href: '/crm/partners', icon: Users },
      { label: 'Enablement', href: '/crm/enablement', icon: GraduationCap },
      { label: 'Segments', href: '/crm/segments', icon: Filter },
    ],
  },
  {
    key: 'hr',
    label: 'Human Resources',
    items: [
      { label: 'Employees', href: '/hr/employees', icon: Users },
      { label: 'Attendance', href: '/hr/attendance', icon: Clock },
      { label: 'Leave', href: '/hr/leave', icon: Calendar },
      { label: 'Timesheets', href: '/hr/timesheets', icon: FileText },
      { label: 'Training', href: '/hr/training', icon: GraduationCap },
      { label: 'Goals', href: '/hr/goals', icon: Target },
      { label: 'Tickets', href: '/hr/tickets', icon: HelpCircle },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen } = useAppStore()

  // Auto-expand group that contains current route, plus always show dashboard
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const updated: Record<string, boolean> = {}
    for (const group of navGroups) {
      if (group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))) {
        updated[group.key] = true
      }
    }
    // Always keep dashboard expanded
    updated['dashboard'] = true
    setExpanded(prev => ({ ...updated, ...prev }))
  }, [pathname])

  const toggleGroup = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
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
      <nav className="flex-1 space-y-1">
        {navGroups.map(group => {
          const isExpanded = expanded[group.key] ?? false
          const isActiveGroup = group.items.some(
            item => pathname === item.href || pathname.startsWith(item.href + '/')
          )

          return (
            <div key={group.key}>
              {/* Group header — clickable dropdown */}
              <button
                onClick={() => toggleGroup(group.key)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-[9px] text-sm transition-colors',
                  isActiveGroup
                    ? 'text-charcoal font-medium'
                    : 'text-olive-slate hover:bg-bone hover:text-charcoal'
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="font-mono text-xs uppercase tracking-wider">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-sage-mist ml-2" />
                {group.key !== 'dashboard' && group.key !== 'reports' && group.key !== 'settings' && (
                  <span className="text-[10px] text-pebble font-mono mr-1">{group.items.length}</span>
                )}
              </button>

              {/* Group items — collapsible */}
              {isExpanded && (
                <ul className="space-y-1 mt-1 mb-2 pl-2">
                  {group.items.map(item => {
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
              )}
            </div>
          )
        })}
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
