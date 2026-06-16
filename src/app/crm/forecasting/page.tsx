'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, TrendingUp, Target, DollarSign, BarChart3 } from 'lucide-react'

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface Quota {
  id: string
  employee_id: string
  target_amount: number
}

interface ForecastSubmission {
  id: string
  employee_id: string
  period_type: string
  period_start: string
  period_end: string
  commit_amount: number
  best_case_amount: number
  closed_won_amount: number
  notes: string
  submitted_at: string
  employees?: Employee
  quotas?: Quota
}

function formatINR(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`
  }
  return `₹${value.toLocaleString('en-IN')}`
}

function getCurrentQuarter() {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  const year = now.getFullYear()
  const start = new Date(year, quarter * 3, 1)
  const end = new Date(year, (quarter + 1) * 3, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: `Q${quarter + 1} ${year}`,
  }
}

export default function ForecastingPage() {
  const [submissions, setSubmissions] = useState<ForecastSubmission[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    commit_amount: '',
    best_case_amount: '',
    notes: '',
  })

  const quarter = getCurrentQuarter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    const [submissionsRes, employeesRes, quotasRes, dealsRes] = await Promise.all([
      supabase
        .from('forecast_submissions')
        .select('*, employees(id, first_name, last_name)')
        .eq('period_start', quarter.start)
        .eq('period_end', quarter.end)
        .order('submitted_at', { ascending: false }),
      supabase.from('employees').select('id, first_name, last_name').order('first_name'),
      supabase.from('quotas').select('id, employee_id, target_amount'),
      supabase.from('deals').select('owner_id, amount').eq('status', 'won'),
    ])

    if (employeesRes.data) setEmployees(employeesRes.data)
    if (submissionsRes.data) setSubmissions(submissionsRes.data as ForecastSubmission[])

    // Calculate closed won per employee from deals
    const closedWonMap: Record<string, number> = {}
    if (dealsRes.data) {
      dealsRes.data.forEach((deal) => {
        closedWonMap[deal.owner_id] = (closedWonMap[deal.owner_id] || 0) + deal.amount
      })
    }

    // Attach quotas and computed closed won
    if (submissionsRes.data && quotasRes.data) {
      const enriched = submissionsRes.data.map((sub) => ({
        ...sub,
        quotas: quotasRes.data.find((q) => q.employee_id === sub.employee_id) || null,
        closed_won_amount: closedWonMap[sub.employee_id] || 0,
      }))
      setSubmissions(enriched as ForecastSubmission[])
    }

    setLoading(false)
  }

  const handleOpenModal = () => {
    setFormData({ commit_amount: '', best_case_amount: '', notes: '' })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({ commit_amount: '', best_case_amount: '', notes: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const closedWon = 0

    const record = {
      employee_id: user.id,
      period_type: 'quarterly',
      period_start: quarter.start,
      period_end: quarter.end,
      commit_amount: parseFloat(formData.commit_amount) || 0,
      best_case_amount: parseFloat(formData.best_case_amount) || 0,
      closed_won_amount: closedWon,
      notes: formData.notes || null,
      submitted_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('forecast_submissions')
      .select('id')
      .eq('employee_id', user.id)
      .eq('period_start', quarter.start)
      .eq('period_end', quarter.end)
      .single()

    if (existing) {
      await supabase.from('forecast_submissions').update(record).eq('id', existing.id)
    } else {
      await supabase.from('forecast_submissions').insert(record)
    }

    await fetchData()
    handleCloseModal()
    setSaving(false)
  }

  const totalCommit = submissions.reduce((sum, s) => sum + (s.commit_amount || 0), 0)
  const totalBestCase = submissions.reduce((sum, s) => sum + (s.best_case_amount || 0), 0)
  const totalClosedWon = submissions.reduce((sum, s) => sum + (s.closed_won_amount || 0), 0)
  const totalQuota = submissions.reduce((sum, s) => sum + (s.quotas?.target_amount || 0), 0)

  const filteredSubmissions = submissions.filter((s) => {
    if (!searchTerm) return true
    const name = `${s.employees?.first_name} ${s.employees?.last_name}`.toLowerCase()
    return name.includes(searchTerm.toLowerCase())
  })

  const columns: Column<ForecastSubmission>[] = [
    {
      key: 'employee_id',
      header: 'Rep',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mint-sprout rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-forest-depths">
              {item.employees?.first_name?.[0]}{item.employees?.last_name?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-charcoal">
              {item.employees?.first_name} {item.employees?.last_name}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'period_start',
      header: 'Period',
      render: (item) => (
        <span className="text-sm text-charcoal">{quarter.label}</span>
      ),
    },
    {
      key: 'commit_amount',
      header: 'Commit',
      render: (item) => (
        <span className="text-sm font-medium text-cobalt-ink">{formatINR(item.commit_amount)}</span>
      ),
    },
    {
      key: 'best_case_amount',
      header: 'Best Case',
      render: (item) => (
        <span className="text-sm font-medium text-plum-depth">{formatINR(item.best_case_amount)}</span>
      ),
    },
    {
      key: 'closed_won_amount',
      header: 'Closed Won',
      render: (item) => (
        <span className="text-sm font-medium text-forest-depths">{formatINR(item.closed_won_amount)}</span>
      ),
    },
    {
      key: 'quotas',
      header: 'Quota',
      render: (item) => (
        <span className="text-sm text-olive-slate">
          {item.quotas ? formatINR(item.quotas.target_amount) : '-'}
        </span>
      ),
    },
    {
      key: 'attainment',
      header: 'Attainment %',
      render: (item) => {
        const quota = item.quotas?.target_amount || 0
        const pct = quota > 0 ? Math.round((item.closed_won_amount / quota) * 100) : 0
        const variant = pct >= 100 ? 'success' : pct >= 70 ? 'warning' : 'error'
        return (
          <Badge variant={variant}>{pct}%</Badge>
        )
      },
    },
    {
      key: 'submitted_at',
      header: 'Submitted',
      render: (item) => (
        <span className="text-xs text-pebble">
          {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('en-IN') : '-'}
        </span>
      ),
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Forecasting
            </h1>
            <p className="text-olive-slate mt-1">
              Track and manage sales forecasts for {quarter.label}
            </p>
          </div>
          <Button onClick={handleOpenModal}>
            <Plus className="w-4 h-4 mr-2" />
            Submit Forecast
          </Button>
        </div>

        {/* Team Rollup Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-cobalt-ink" />
                <p className="text-sm text-cobalt-ink">Total Commit</p>
              </div>
              <p className="text-2xl font-bold text-cobalt-ink">{formatINR(totalCommit)}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-plum-depth" />
                <p className="text-sm text-plum-depth">Total Best Case</p>
              </div>
              <p className="text-2xl font-bold text-plum-depth">{formatINR(totalBestCase)}</p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-forest-depths" />
                <p className="text-sm text-forest-depths">Closed Won</p>
              </div>
              <p className="text-2xl font-bold text-forest-depths">{formatINR(totalClosedWon)}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-wine-shadow" />
                <p className="text-sm text-wine-shadow">Team Quota</p>
              </div>
              <p className="text-2xl font-bold text-wine-shadow">{formatINR(totalQuota)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
                <input
                  type="text"
                  placeholder="Search by rep name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coda-input pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredSubmissions}
          loading={loading}
          emptyMessage="No forecast submissions found for this period"
        />
      </div>

      {/* Submit Forecast Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Submit Forecast"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-olive-slate">
            Submit your forecast for <strong>{quarter.label}</strong> ({quarter.start} to {quarter.end})
          </p>
          <Input
            label="Commit Amount (₹)"
            type="number"
            placeholder="e.g. 500000"
            value={formData.commit_amount}
            onChange={(e) => setFormData({ ...formData, commit_amount: e.target.value })}
          />
          <Input
            label="Best Case Amount (₹)"
            type="number"
            placeholder="e.g. 750000"
            value={formData.best_case_amount}
            onChange={(e) => setFormData({ ...formData, best_case_amount: e.target.value })}
          />
          <Input
            label="Notes"
            placeholder="Optional notes about your forecast..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.commit_amount}>
              {saving ? 'Saving...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
