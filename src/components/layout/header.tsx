'use client'

import { useEffect, useState, useRef } from 'react'
import { Menu, Bell, User, ChevronDown, LogOut, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface Notification {
  id: string
  title: string
  description: string
  type: 'ticket' | 'leave' | 'deal'
  href: string
  created_at: string
}

export function Header() {
  const { sidebarOpen, toggleSidebar, setCurrentUser, currentUser } = useAppStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'Admin',
        })
      }
    }

    getUser()

    const fetchNotifications = async () => {
      const notifs: Notification[] = []

      const { data: tickets } = await supabase
        .from('help_desk_tickets')
        .select('id, ticket_number, subject, priority, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (tickets) {
        tickets.forEach(t => {
          notifs.push({
            id: t.id,
            title: `${t.ticket_number}: ${t.subject}`,
            description: `Priority: ${t.priority} • Status: ${t.status.replace('_', ' ')}`,
            type: 'ticket',
            href: '/hr/tickets',
            created_at: t.created_at,
          })
        })
      }

      const { data: leaves } = await supabase
        .from('leave_requests')
        .select('id, start_date, end_date, status, employees(first_name, last_name), leave_types(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (leaves) {
        leaves.forEach((l: any) => {
          const empName = l.employees ? `${l.employees.first_name} ${l.employees.last_name}` : 'Someone'
          const leaveName = l.leave_types?.name || 'Leave'
          notifs.push({
            id: l.id,
            title: `${empName} — ${leaveName}`,
            description: `${new Date(l.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${l.status}`,
            type: 'leave',
            href: '/hr/leave',
            created_at: l.start_date,
          })
        })
      }

      notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setNotifications(notifs.slice(0, 8))
    }

    fetchNotifications()
  }, [setCurrentUser])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifications])

  return (
    <header className="coda-header">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-2"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-bone rounded-[9px] transition-colors"
          >
            <Bell className="w-5 h-5 text-olive-slate" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-pure-white border border-sage-mist rounded-[13px] shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-sage-mist">
                <h3 className="font-semibold text-charcoal text-sm">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-pebble hover:text-charcoal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-pebble text-center py-8">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-bone transition-colors border-b border-sage-mist/50 last:border-0"
                    >
                      <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                        n.type === 'ticket' ? 'bg-red-400' :
                        n.type === 'leave' ? 'bg-amber-400' :
                        'bg-green-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal truncate">{n.title}</p>
                        <p className="text-xs text-pebble truncate">{n.description}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-sage-mist text-center">
                  <Link
                    href="/hr/tickets"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-medium text-forest-depths hover:underline"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-4 border-l border-sage-mist hover:bg-bone rounded-[9px] p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-mint-sprout rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-forest-depths" />
            </div>
            <div className="text-sm text-left">
              <p className="font-medium text-charcoal">
                {currentUser?.fullName || 'Guest User'}
              </p>
              <p className="text-xs text-pebble">
                {currentUser?.role || 'No role assigned'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-pebble" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-pure-white border border-sage-mist rounded-[13px] shadow-lg z-50">
              <div className="p-2">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-bone rounded-[9px] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
