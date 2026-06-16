'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import {
  BarChart3, TrendingUp, Users, IndianRupee, Target,
  ArrowUpRight, ArrowDownRight, Calendar, Briefcase, FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'sales' | 'revenue' | 'hr' | 'pipeline'

interface Deal {
  id: string
  title: string
  amount: number
  status: 'open' | 'won' | 'lost'
  probability: number
  close_date?: string
  lost_reason?: string
  created_at: string
  stage_id: string
  organization_id?: string
  contact_id?: string
  employees?: { first_name: string; last_name: string }
  deal_stages?: { name: string; stage_order: number }
  organizations?: { name: string }
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  department_id: string
  status: string
  departments?: { name: string }
}

interface Attendance {
  employee_id: string
  date: string
  status: string
}

interface LeaveRequest {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  days: number
}

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  budget: number
  expected_revenue: number
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sales')
  const [deals, setDeals] = useState<Deal[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const supabase = createClient()
    const [dealsRes, empRes, attRes, leaveRes, campRes] = await Promise.all([
      supabase
        .from('deals')
        .select('*, deal_stages(name, stage_order), organizations(name), employees(first_name, last_name)'),
      supabase
        .from('employees')
        .select('*, departments(name)'),
      supabase
        .from('attendance')
        .select('employee_id, date, status')
        .eq('date', new Date().toISOString().split('T')[0]),
      supabase
        .from('leave_requests')
        .select('id, status, days'),
      supabase
        .from('campaigns')
        .select('*'),
    ])

    if (dealsRes.data) setDeals(dealsRes.data as Deal[])
    if (empRes.data) setEmployees(empRes.data as Employee[])
    if (attRes.data) setAttendance(attRes.data as Attendance[])
    if (leaveRes.data) setLeaves(leaveRes.data as LeaveRequest[])
    if (campRes.data) setCampaigns(campRes.data as Campaign[])
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // ---- Sales computed stats ----
  const openDeals = deals.filter(d => d.status === 'open')
  const wonDeals = deals.filter(d => d.status === 'won')
  const lostDeals = deals.filter(d => d.status === 'lost')
  const totalPipeline = openDeals.reduce((s, d) => s + d.amount, 0)
  const totalWon = wonDeals.reduce((s, d) => s + d.amount, 0)
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0
  const avgDealSize = deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.amount, 0) / deals.length) : 0

  // ---- Revenue by org ----
  const revenueByOrg = deals
    .filter(d => d.status === 'won')
    .reduce((acc, d) => {
      const org = d.organizations?.name || 'Unknown'
      acc[org] = (acc[org] || 0) + d.amount
      return acc
    }, {} as Record<string, number>)
  const revenueOrgList = Object.entries(revenueByOrg)
    .sort((a, b) => b[1] - a[1])

  // ---- Top deals ----
  const topDeals = [...deals].sort((a, b) => b.amount - a.amount).slice(0, 5)

  // ---- HR stats ----
  const activeEmployees = employees.filter(e => e.status === 'active')
  const deptCounts = employees.reduce((acc, e) => {
    const dept = e.departments?.name || 'Unknown'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const todayPresent = attendance.filter(a => a.status === 'present' || a.status === 'late').length
  const pendingLeaves = leaves.filter(l => l.status === 'pending')
  const approvedLeaves = leaves.filter(l => l.status === 'approved')

  // ---- Pipeline by stage ----
  const stageData = openDeals.reduce((acc, d) => {
    const stage = d.deal_stages?.name || 'Unknown'
    acc[stage] = (acc[stage] || 0) + d.amount
    return acc
  }, {} as Record<string, number>)
  const stageList = Object.entries(stageData).sort((a, b) => b[1] - a[1])
  const maxStageAmount = stageList.length > 0 ? stageList[0][1] : 1

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'sales', label: 'Sales', icon: BarChart3 },
    { key: 'revenue', label: 'Revenue', icon: IndianRupee },
    { key: 'hr', label: 'HR', icon: Users },
    { key: 'pipeline', label: 'Pipeline', icon: TrendingUp },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Reports</h1>
          <p className="text-sm text-pebble mt-1">Cross-module analytics and insights</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-sage-mist pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[9px] text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-charcoal text-pure-white'
                    : 'text-olive-slate hover:bg-bone hover:text-charcoal'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ====== SALES TAB ====== */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Pipeline" value={formatCurrency(totalPipeline)} icon={TrendingUp} color="mint" />
              <StatCard title="Won Revenue" value={formatCurrency(totalWon)} icon={IndianRupee} color="lilac" />
              <StatCard title="Win Rate" value={`${winRate}%`} icon={Target} color="sky" />
              <StatCard title="Avg Deal Size" value={formatCurrency(avgDealSize)} icon={Briefcase} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Deals by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <DealStatusBar label="Open" count={openDeals.length} total={deals.length} color="bg-mint-sprout" />
                    <DealStatusBar label="Won" count={wonDeals.length} total={deals.length} color="bg-forest-depths" />
                    <DealStatusBar label="Lost" count={lostDeals.length} total={deals.length} color="bg-rose-wash" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Deals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topDeals.map(deal => (
                      <div key={deal.id} className="flex items-center justify-between py-2 border-b border-bone last:border-0">
                        <div>
                          <p className="font-medium text-charcoal text-sm">{deal.title}</p>
                          <p className="text-xs text-pebble">{deal.deal_stages?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-charcoal text-sm">{formatCurrency(deal.amount)}</p>
                          <Badge variant={deal.status === 'won' ? 'success' : deal.status === 'lost' ? 'error' : 'default'}>
                            {deal.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {topDeals.length === 0 && <p className="text-sm text-pebble text-center py-4">No deals found</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { key: 'title', header: 'Deal', render: (d: Deal) => <span className="font-medium">{d.title}</span> },
                    { key: 'amount', header: 'Amount', render: (d: Deal) => formatCurrency(d.amount) },
                    { key: 'stage', header: 'Stage', render: (d: Deal) => d.deal_stages?.name || '-' },
                    { key: 'org', header: 'Organization', render: (d: Deal) => d.organizations?.name || '-' },
                    { key: 'rep', header: 'Owner', render: (d: Deal) => d.employees ? `${d.employees.first_name} ${d.employees.last_name}` : '-' },
                    { key: 'status', header: 'Status', render: (d: Deal) => (
                      <Badge variant={d.status === 'won' ? 'success' : d.status === 'lost' ? 'error' : 'default'}>{d.status}</Badge>
                    )},
                  ]}
                  data={deals}
                  loading={loading}
                  emptyMessage="No deals found"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ====== REVENUE TAB ====== */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total Revenue" value={formatCurrency(totalWon)} icon={IndianRupee} color="mint" />
              <StatCard title="Won Deals" value={String(wonDeals.length)} icon={Target} color="lilac" />
              <StatCard title="Lost Deals" value={String(lostDeals.length)} icon={ArrowDownRight} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Organization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revenueOrgList.length > 0 ? revenueOrgList.map(([org, amount]) => (
                      <div key={org} className="flex items-center justify-between py-2 border-b border-bone last:border-0">
                        <span className="text-sm font-medium text-charcoal">{org}</span>
                        <span className="text-sm font-bold text-forest-depths">{formatCurrency(amount)}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-pebble text-center py-4">No won deals yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns.map(camp => (
                      <div key={camp.id} className="flex items-center justify-between py-2 border-b border-bone last:border-0">
                        <div>
                          <p className="text-sm font-medium text-charcoal">{camp.name}</p>
                          <p className="text-xs text-pebble">{camp.type} &middot; {camp.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-pebble">Budget: {formatCurrency(camp.budget)}</p>
                          <p className="text-xs font-medium text-forest-depths">Expected: {formatCurrency(camp.expected_revenue)}</p>
                        </div>
                      </div>
                    ))}
                    {campaigns.length === 0 && <p className="text-sm text-pebble text-center py-4">No campaigns found</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Generating Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { key: 'title', header: 'Deal', render: (d: Deal) => <span className="font-medium">{d.title}</span> },
                    { key: 'amount', header: 'Amount', render: (d: Deal) => formatCurrency(d.amount) },
                    { key: 'org', header: 'Organization', render: (d: Deal) => d.organizations?.name || '-' },
                    { key: 'status', header: 'Status', render: (d: Deal) => (
                      <Badge variant={d.status === 'won' ? 'success' : d.status === 'lost' ? 'error' : 'default'}>{d.status}</Badge>
                    )},
                  ]}
                  data={[...wonDeals, ...lostDeals].sort((a, b) => b.amount - a.amount)}
                  loading={loading}
                  emptyMessage="No completed deals"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ====== HR TAB ====== */}
        {activeTab === 'hr' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Employees" value={String(employees.length)} icon={Users} color="mint" />
              <StatCard title="Active" value={String(activeEmployees.length)} icon={Users} color="lilac" />
              <StatCard title="Present Today" value={String(todayPresent)} icon={Calendar} color="sky" />
              <StatCard title="Pending Leaves" value={String(pendingLeaves.length)} icon={FileText} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Headcount by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between py-2 border-b border-bone last:border-0">
                        <span className="text-sm font-medium text-charcoal">{dept}</span>
                        <Badge variant="default">{count}</Badge>
                      </div>
                    ))}
                    {Object.keys(deptCounts).length === 0 && <p className="text-sm text-pebble text-center py-4">No employees found</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Leave Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-olive-slate">Pending Requests</span>
                      <Badge variant="warning">{pendingLeaves.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-olive-slate">Approved</span>
                      <Badge variant="success">{approvedLeaves.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-olive-slate">Total Days Requested</span>
                      <span className="font-bold text-charcoal">{leaves.reduce((s, l) => s + l.days, 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Employee Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { key: 'name', header: 'Name', render: (e: Employee) => <span className="font-medium">{e.first_name} {e.last_name}</span> },
                    { key: 'department', header: 'Department', render: (e: Employee) => e.departments?.name || '-' },
                    { key: 'status', header: 'Status', render: (e: Employee) => (
                      <Badge variant={e.status === 'active' ? 'success' : 'default'}>{e.status}</Badge>
                    )},
                  ]}
                  data={employees}
                  loading={loading}
                  emptyMessage="No employees found"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ====== PIPELINE TAB ====== */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Open Pipeline" value={formatCurrency(totalPipeline)} icon={TrendingUp} color="mint" />
              <StatCard title="Open Deals" value={String(openDeals.length)} icon={Briefcase} color="lilac" />
              <StatCard title="Avg Probability" value={`${openDeals.length > 0 ? Math.round(openDeals.reduce((s, d) => s + d.probability, 0) / openDeals.length) : 0}%`} icon={Target} color="sky" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stageList.length > 0 ? stageList.map(([stage, amount]) => (
                    <div key={stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-charcoal">{stage}</span>
                        <span className="text-sm font-bold text-forest-depths">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-3 bg-bone rounded-full overflow-hidden">
                        <div
                          className="h-full bg-forest-depths rounded-full transition-all"
                          style={{ width: `${(amount / maxStageAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-pebble text-center py-4">No open deals in pipeline</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Deals Closing This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {openDeals
                      .filter(d => {
                        if (!d.close_date) return false
                        const close = new Date(d.close_date)
                        const now = new Date()
                        return close.getMonth() === now.getMonth() && close.getFullYear() === now.getFullYear()
                      })
                      .sort((a, b) => b.amount - a.amount)
                      .map(deal => (
                        <div key={deal.id} className="flex items-center justify-between py-2 border-b border-bone last:border-0">
                          <div>
                            <p className="text-sm font-medium text-charcoal">{deal.title}</p>
                            <p className="text-xs text-pebble">{deal.deal_stages?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-charcoal">{formatCurrency(deal.amount)}</p>
                            <p className="text-xs text-pebble">{deal.close_date}</p>
                          </div>
                        </div>
                      ))
                    }
                    {openDeals.filter(d => {
                      if (!d.close_date) return false
                      const close = new Date(d.close_date)
                      const now = new Date()
                      return close.getMonth() === now.getMonth() && close.getFullYear() === now.getFullYear()
                    }).length === 0 && (
                      <p className="text-sm text-pebble text-center py-4">No deals closing this month</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lost Deal Reasons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lostDeals.map(deal => (
                      <div key={deal.id} className="flex items-center justify-between py-2 border-b border-bone last:border-0">
                        <div>
                          <p className="text-sm font-medium text-charcoal">{deal.title}</p>
                          <p className="text-xs text-pebble">{deal.lost_reason || 'No reason provided'}</p>
                        </div>
                        <span className="text-sm font-bold text-red-500">{formatCurrency(deal.amount)}</span>
                      </div>
                    ))}
                    {lostDeals.length === 0 && (
                      <p className="text-sm text-pebble text-center py-4">No lost deals</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

// ---- Reusable sub-components ----

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: 'mint' | 'lilac' | 'sky' | 'rose'
}) {
  return (
    <Card variant="pastel" pastelColor={color}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-olive-slate">{title}</p>
          <p className="text-2xl font-bold text-charcoal mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 bg-pure-white/60 rounded-[10px] flex items-center justify-center">
          <Icon className="w-5 h-5 text-charcoal" />
        </div>
      </div>
    </Card>
  )
}

function DealStatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-olive-slate">{label}</span>
        <span className="text-sm font-medium text-charcoal">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-bone rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
