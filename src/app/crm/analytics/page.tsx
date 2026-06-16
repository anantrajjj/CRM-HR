'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { BarChart3, TrendingUp, Users, IndianRupee } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Deal {
  id: string
  status: string
  amount: number
  stage_id: string
  created_at: string
  owner_id: string
  employees?: { first_name: string; last_name: string }
  deal_stages?: { name: string }
}

interface Lead {
  id: string
  status: string
  source: string
  lead_sources?: { name: string }
}

interface Stage {
  id: string
  name: string
}

interface Source {
  id: string
  name: string
}

interface Employee {
  id: string
  first_name: string
  last_name: string
}

export default function AnalyticsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    const [dealsRes, leadsRes, stagesRes, sourcesRes, employeesRes] = await Promise.all([
      supabase
        .from('deals')
        .select('*, employees(owner_id:first_name, last_name), deal_stages(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('leads')
        .select('*, lead_sources(name)')
        .order('created_at', { ascending: false }),
      supabase.from('deal_stages').select('*').order('sort_order'),
      supabase.from('lead_sources').select('*'),
      supabase.from('employees').select('id, first_name, last_name'),
    ])

    if (dealsRes.data) setDeals(dealsRes.data)
    if (leadsRes.data) setLeads(leadsRes.data)
    if (stagesRes.data) setStages(stagesRes.data)
    if (sourcesRes.data) setSources(sourcesRes.data)
    if (employeesRes.data) setEmployees(employeesRes.data)
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const closedDeals = deals.filter((d) => d.status === 'closed_won' || d.status === 'closed_lost')
  const wonDeals = deals.filter((d) => d.status === 'closed_won')
  const lostDeals = deals.filter((d) => d.status === 'closed_lost')
  const openDeals = deals.filter((d) => d.status === 'open')
  const qualifiedLeads = leads.filter((l) => l.status === 'qualified')
  const totalPipeline = deals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const wonAmount = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0
  const avgDealSize = wonDeals.length > 0 ? wonAmount / wonDeals.length : 0
  const pipelineCoverage = openDeals.length > 0 ? totalPipeline / openDeals.length : 0

  const stats = [
    { label: 'Total Pipeline', value: formatCurrency(totalPipeline), icon: IndianRupee, color: 'mint' as const },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, icon: TrendingUp, color: 'sky' as const },
    { label: 'Total Leads', value: leads.length.toString(), icon: Users, color: 'lilac' as const },
    { label: 'Avg Deal Size', value: formatCurrency(avgDealSize), icon: BarChart3, color: 'rose' as const },
  ]

  const dealsByStage = stages.map((stage) => ({
    stage: stage.name,
    count: deals.filter((d) => d.stage_id === stage.id).length,
  }))

  const maxStageCount = Math.max(...dealsByStage.map((s) => s.count), 1)

  const leadsBySource = sources.map((source) => ({
    name: source.name,
    total: leads.filter((l) => l.source === source.id).length,
    converted: leads.filter((l) => l.source === source.id && l.status === 'qualified').length,
  }))

  const repMap = new Map<string, { name: string; dealsWon: number; totalAmount: number; totalDeals: number }>()
  deals.forEach((deal) => {
    if (deal.owner_id && deal.employees) {
      const existing = repMap.get(deal.owner_id)
      const won = deal.status === 'closed_won' ? 1 : 0
      repMap.set(deal.owner_id, {
        name: `${deal.employees.first_name} ${deal.employees.last_name}`,
        dealsWon: existing ? existing.dealsWon + won : won,
        totalAmount: existing ? existing.totalAmount + (deal.status === 'closed_won' ? deal.amount || 0 : 0) : deal.status === 'closed_won' ? deal.amount || 0 : 0,
        totalDeals: existing ? existing.totalDeals + 1 : 1,
      })
    }
  })

  const reps = Array.from(repMap.values())
    .map((r) => ({
      ...r,
      winRate: r.totalDeals > 0 ? (r.dealsWon / r.totalDeals) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)

  const repColumns: Column<typeof reps[0]>[] = [
    { key: 'name', header: 'Rep', render: (item) => <span className="font-medium text-charcoal">{item.name}</span> },
    { key: 'dealsWon', header: 'Deals Won', render: (item) => <span className="font-medium text-forest-depths">{item.dealsWon}</span> },
    { key: 'totalAmount', header: 'Total Amount Won', render: (item) => <span className="font-medium text-charcoal">{formatCurrency(item.totalAmount)}</span> },
    { key: 'winRate', header: 'Win Rate', render: (item) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-bone rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.winRate}%` }} />
        </div>
        <span className="text-sm text-charcoal">{item.winRate.toFixed(1)}%</span>
      </div>
    )},
    { key: 'totalDeals', header: 'Total Deals', render: (item) => <span className="text-sm text-olive-slate">{item.totalDeals}</span> },
  ]

  const funnelSteps = [
    { label: 'Leads', count: leads.length },
    { label: 'Qualified Leads', count: qualifiedLeads.length },
    { label: 'Opportunities', count: openDeals.length },
    { label: 'Closed Won', count: wonDeals.length },
  ]

  const sourceColumns: Column<typeof leadsBySource[0]>[] = [
    { key: 'name', header: 'Source', render: (item) => <span className="font-medium text-charcoal">{item.name}</span> },
    { key: 'total', header: 'Total Leads', render: (item) => <span className="text-charcoal">{item.total}</span> },
    { key: 'converted', header: 'Converted', render: (item) => <span className="font-medium text-forest-depths">{item.converted}</span> },
    { key: 'name', header: 'Conversion Rate', render: (item) => {
      const rate = item.total > 0 ? (item.converted / item.total) * 100 : 0
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-bone rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${rate}%` }} />
          </div>
          <span className="text-sm text-charcoal">{rate.toFixed(1)}%</span>
        </div>
      )
    }},
  ]

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-olive-slate">Loading analytics...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">Sales Analytics</h1>
            <p className="text-olive-slate mt-1">Comprehensive sales performance insights</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} pastelColor={stat.color}>
              <CardContent>
                <div className="flex items-center gap-3">
                  <stat.icon className="w-5 h-5 text-charcoal" />
                  <div>
                    <p className="text-sm text-forest-depths">{stat.label}</p>
                    <p className="text-2xl font-bold text-forest-depths">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Win Rate Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Won', count: wonDeals.length, color: 'bg-green-500', pct: closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0 },
                  { label: 'Lost', count: lostDeals.length, color: 'bg-red-500', pct: closedDeals.length > 0 ? (lostDeals.length / closedDeals.length) * 100 : 0 },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-charcoal">{item.label}</span>
                      <span className="text-sm text-olive-slate">{item.count} ({item.pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-8 bg-bone rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-lg transition-all duration-500`}
                        style={{ width: `${Math.max(item.pct, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {closedDeals.length === 0 && (
                  <p className="text-sm text-pebble text-center py-4">No closed deals yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dealsByStage.map((item) => (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-charcoal">{item.stage}</span>
                      <span className="text-sm font-medium text-charcoal">{item.count}</span>
                    </div>
                    <div className="w-full h-6 bg-bone rounded-md overflow-hidden">
                      <div
                        className="h-full bg-cobalt-ink rounded-md transition-all duration-500"
                        style={{ width: `${maxStageCount > 0 ? (item.count / maxStageCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                {dealsByStage.length === 0 && (
                  <p className="text-sm text-pebble text-center py-4">No stage data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-4">
              {funnelSteps.map((step, index) => {
                const widthPct = funnelSteps[0].count > 0
                  ? Math.max((step.count / funnelSteps[0].count) * 100, 10)
                  : 10
                const convRate = index > 0 && funnelSteps[index - 1].count > 0
                  ? (step.count / funnelSteps[index - 1].count) * 100
                  : 100
                return (
                  <div key={step.label} className="flex flex-col items-center w-full">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-pure-white rounded-lg py-3 text-center font-medium transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    >
                      {step.label}: {step.count}
                    </div>
                    {index < funnelSteps.length - 1 && (
                      <div className="flex flex-col items-center py-1">
                        <div className="text-xs text-pebble">↓ {convRate.toFixed(1)}% conversion</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Source Attribution</CardTitle>
            </CardHeader>
            <CardContent>
              {leadsBySource.length > 0 ? (
                <DataTable columns={sourceColumns} data={leadsBySource} emptyMessage="No source data" />
              ) : (
                <p className="text-sm text-pebble text-center py-8">No lead sources configured</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rep Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {reps.length > 0 ? (
                <DataTable columns={repColumns} data={reps} emptyMessage="No rep data" />
              ) : (
                <p className="text-sm text-pebble text-center py-8">No deal owners found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
