'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MainLayout } from '@/components/layout/main-layout'
import { ClockWidget } from '@/components/clock-widget'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  Clock,
  Calendar,
  UserPlus,
  FileText,
} from 'lucide-react'

interface Stats {
  contacts: number
  deals: number
  organizations: number
  revenue: number
  openDeals: number
}

interface Activity {
  id: string
  subject: string
  time: string
  status: string
  type: string
}

interface LeaveRequest {
  id: string
  employee: string
  type: string
  dates: string
  status: string
}

interface Ticket {
  id: string
  subject: string
  priority: string
  status: string
  ticket_number: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ contacts: 0, deals: 0, organizations: 0, revenue: 0, openDeals: 0 })
  const [recentDeals, setRecentDeals] = useState<Activity[]>([])
  const [upcomingLeaves, setUpcomingLeaves] = useState<LeaveRequest[]>([])
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const supabase = createClient()

    // Fetch stats in parallel
    const [contactsRes, dealsRes, orgsRes, ticketsRes] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }),
      supabase.from('deals').select('id, amount, status'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('help_desk_tickets').select('*').order('created_at', { ascending: false }).limit(5),
    ])

    const deals = dealsRes.data || []
    const totalRevenue = deals.filter((d: any) => d.status === 'won').reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
    const openDeals = deals.filter((d: any) => d.status === 'open')

    setStats({
      contacts: contactsRes.count || 0,
      deals: deals.length,
      organizations: orgsRes.count || 0,
      revenue: totalRevenue,
      openDeals: openDeals.length,
    })

    // Fetch recent deals as activities
    const { data: recentDealsData } = await supabase
      .from('deals')
      .select('id, title, status, amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentDealsData) {
      setRecentDeals(recentDealsData.map((d: any) => ({
        id: d.id,
        subject: d.title,
        time: new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        status: d.status,
        type: 'deal',
      })))
    }

    // Fetch upcoming leaves
    const { data: leavesData } = await supabase
      .from('leave_requests')
      .select('*, employees(first_name, last_name), leave_types(name)')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date')
      .limit(5)

    if (leavesData) {
      setUpcomingLeaves(leavesData.map((l: any) => ({
        id: l.id,
        employee: l.employees ? `${l.employees.first_name} ${l.employees.last_name}` : 'Unknown',
        type: l.leave_types?.name || 'Leave',
        dates: `${new Date(l.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(l.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        status: l.status,
      })))
    }

    // Fetch recent tickets
    if (ticketsRes.data) {
      setRecentTickets(ticketsRes.data.map((t: any) => ({
        id: t.id,
        subject: t.subject,
        priority: t.priority,
        status: t.status,
        ticket_number: t.ticket_number,
      })))
    }

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount}`
  }

  const dashboardStats = [
    { label: 'Total Contacts', value: stats.contacts.toLocaleString('en-IN'), icon: Users, change: '+12%', href: '/crm/contacts' },
    { label: 'Open Deals', value: stats.openDeals.toString(), icon: Briefcase, change: '+8%', href: '/crm/deals' },
    { label: 'Organizations', value: stats.organizations.toLocaleString('en-IN'), icon: Building2, change: '+5%', href: '/crm/organizations' },
    { label: 'Revenue Won', value: formatCurrency(stats.revenue), icon: TrendingUp, change: '+15%', href: '/crm/deals' },
  ]

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="coda-heading-monument text-2xl sm:text-4xl text-charcoal mb-2">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-olive-slate">
            Welcome back! Here&apos;s an overview of your business.
          </p>
        </div>

        <ClockWidget />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href}>
                <Card variant="bordered" className="hover:border-charcoal transition-colors cursor-pointer">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-pebble">{stat.label}</p>
                        <p className="text-lg sm:text-2xl font-bold text-charcoal mt-1">
                          {loading ? '...' : stat.value}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-mint-sprout rounded-[9px] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-forest-depths" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Badge variant="success">{stat.change}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Deals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Deals</CardTitle>
                <Link href="/crm/deals" className="text-sm text-cobalt-ink hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                      <div className="w-8 h-8 bg-bone rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-bone rounded w-3/4" />
                        <div className="h-2 bg-bone rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentDeals.length === 0 ? (
                <p className="text-sm text-pebble text-center py-4">No deals yet</p>
              ) : (
                <div className="space-y-4">
                  {recentDeals.map((deal) => (
                    <Link
                      key={deal.id}
                      href="/crm/deals"
                      className="flex items-center gap-4 p-3 rounded-[9px] hover:bg-bone transition-colors"
                    >
                      <div className="w-8 h-8 bg-mint-sprout rounded-full flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-forest-depths" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-charcoal">{deal.subject}</p>
                        <p className="text-xs text-pebble">{deal.time}</p>
                      </div>
                      <Badge
                        variant={
                          deal.status === 'won' ? 'success' :
                          deal.status === 'lost' ? 'error' :
                          deal.status === 'open' ? 'info' : 'default'
                        }
                      >
                        {deal.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Leaves */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Leaves</CardTitle>
                <Link href="/hr/leave" className="text-sm text-cobalt-ink hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse p-3 border border-sage-mist rounded-lg">
                      <div className="h-3 bg-bone rounded w-1/2 mb-2" />
                      <div className="h-2 bg-bone rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : upcomingLeaves.length === 0 ? (
                <p className="text-sm text-pebble text-center py-4">No upcoming leaves</p>
              ) : (
                <div className="space-y-4">
                  {upcomingLeaves.map((leave) => (
                    <div key={leave.id} className="p-3 rounded-[9px] border border-sage-mist">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-olive-slate" />
                        <span className="text-sm font-medium text-charcoal">{leave.employee}</span>
                      </div>
                      <p className="text-xs text-pebble">{leave.type}</p>
                      <p className="text-xs text-olive-slate">{leave.dates}</p>
                      <div className="mt-2">
                        <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'error' : 'warning'}>
                          {leave.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Tickets</CardTitle>
              <Link href="/hr/tickets" className="text-sm text-cobalt-ink hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-3 border border-sage-mist rounded-lg">
                    <div className="h-3 bg-bone rounded w-1/3 mb-2" />
                    <div className="h-2 bg-bone rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : recentTickets.length === 0 ? (
              <p className="text-sm text-pebble text-center py-4">No tickets</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href="/hr/tickets"
                    className="p-3 rounded-[9px] border border-sage-mist hover:border-charcoal transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-cobalt-ink">{ticket.ticket_number}</span>
                      <Badge
                        variant={
                          ticket.priority === 'urgent' ? 'error' :
                          ticket.priority === 'high' ? 'warning' :
                          ticket.priority === 'medium' ? 'info' : 'default'
                        }
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-charcoal line-clamp-1">{ticket.subject}</p>
                    <div className="mt-2">
                      <Badge
                        variant={
                          ticket.status === 'open' ? 'info' :
                          ticket.status === 'in_progress' ? 'warning' :
                          ticket.status === 'resolved' ? 'success' : 'default'
                        }
                      >
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card pastelColor="mint">
          <CardHeader>
            <CardTitle className="text-forest-depths">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Link href="/crm/contacts">
                <button className="w-full p-4 rounded-[13px] bg-pure-white border border-sage-mist hover:border-obsidian transition-colors text-left">
                  <Users className="w-5 h-5 text-charcoal mb-2" />
                  <p className="text-sm font-medium text-charcoal">Add Contact</p>
                </button>
              </Link>
              <Link href="/crm/deals">
                <button className="w-full p-4 rounded-[13px] bg-pure-white border border-sage-mist hover:border-obsidian transition-colors text-left">
                  <Briefcase className="w-5 h-5 text-charcoal mb-2" />
                  <p className="text-sm font-medium text-charcoal">Create Deal</p>
                </button>
              </Link>
              <Link href="/crm/organizations">
                <button className="w-full p-4 rounded-[13px] bg-pure-white border border-sage-mist hover:border-obsidian transition-colors text-left">
                  <Building2 className="w-5 h-5 text-charcoal mb-2" />
                  <p className="text-sm font-medium text-charcoal">Add Organization</p>
                </button>
              </Link>
              <Link href="/hr/leave">
                <button className="w-full p-4 rounded-[13px] bg-pure-white border border-sage-mist hover:border-obsidian transition-colors text-left">
                  <Calendar className="w-5 h-5 text-charcoal mb-2" />
                  <p className="text-sm font-medium text-charcoal">Request Leave</p>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
