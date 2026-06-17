'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Search,
  X,
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
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const updated: Record<string, boolean> = {}
    for (const group of navGroups) {
      if (group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))) {
        updated[group.key] = true
      }
    }
    updated['dashboard'] = true
    setExpanded(prev => ({ ...updated, ...prev }))
  }, [pathname])

  const toggleGroup = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const allNavItems = useMemo(() => {
    return navGroups.flatMap(group =>
      group.items.map(item => ({
        ...item,
        groupLabel: group.label,
      }))
    )
  }, [])

  const isSearching = searchQuery.trim().length > 0
  const filteredItems = isSearching
    ? allNavItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.groupLabel.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleSearchSelect = (href: string) => {
    setSearchQuery('')
    router.push(href)
    if (isMobile) setSidebarOpen(false)
  }

  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false)
  }

  if (!sidebarOpen) return null

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={handleNavClick}>
          <div className="w-8 h-8 bg-charcoal rounded-[9px] flex items-center justify-center">
            <span className="text-pure-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-xl text-charcoal tracking-tight">
            CRM<span className="text-olive-slate">+</span>HR
          </span>
        </Link>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-pebble hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
        <input
          type="text"
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-9 text-sm border border-sage-mist rounded-[9px] bg-pure-white text-charcoal placeholder:text-pebble focus:outline-none focus:ring-2 focus:ring-forest-depths/20 focus:border-forest-depths transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-pebble hover:text-charcoal"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="mb-4">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-pebble text-center py-6">No modules found</p>
          ) : (
            <ul className="space-y-1">
              {filteredItems.map(item => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => handleSearchSelect(item.href)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-[9px] text-sm text-olive-slate hover:bg-bone hover:text-charcoal transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{item.label}</span>
                        <span className="text-[10px] text-pebble">{item.groupLabel}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="h-px bg-sage-mist mt-4" />
        </div>
      )}

      {/* Navigation */}
      {!isSearching && (
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navGroups.map(group => {
            const isExpanded = expanded[group.key] ?? false
            const isActiveGroup = group.items.some(
              item => pathname === item.href || pathname.startsWith(item.href + '/')
            )

            return (
              <div key={group.key}>
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

                {isExpanded && (
                  <ul className="space-y-1 mt-1 mb-2 pl-2">
                    {group.items.map(item => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={handleNavClick}
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
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-sage-mist">
        <Link
          href="/help"
          onClick={handleNavClick}
          className="flex items-center gap-2 text-sm text-olive-slate hover:text-charcoal transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </Link>
      </div>
    </>
  )

  // Mobile: overlay drawer
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
        {/* Drawer */}
        <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-cream-parchment flex flex-col h-screen overflow-y-auto p-4 lg:hidden shadow-xl">
          {sidebarContent}
        </aside>
      </>
    )
  }

  // Desktop: static sidebar
  return (
    <aside className="coda-sidebar flex flex-col h-screen overflow-y-auto w-64 shrink-0">
      {sidebarContent}
    </aside>
  )
}
