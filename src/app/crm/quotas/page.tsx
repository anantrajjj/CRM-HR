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
import { Plus, Search, Edit2, Trash2, Target, Award } from 'lucide-react'

interface Employee {
  id: string
  first_name: string
  last_name: string
  hire_date: string
}

interface CapacityPlan {
  id: string
  name: string
  period_type: string
  period_start: string
  period_end: string
  team_quota: number
  avg_productivity: number
  ramp_month_1: number
  ramp_month_2: number
  ramp_month_3: number
  ramp_month_4: number
  is_active: boolean
}

interface CapacityPlanRep {
  id: string
  plan_id: string
  employee_id: string
  quota_override: number | null
  ramp_override: number | null
  employees?: Employee
}

interface Quota {
  id: string
  employee_id: string
  period_type: string
  period_start: string
  period_end: string
  target_amount: number
  achieved_amount: number
  attainment_pct: number
  employees?: Employee
}

export default function QuotasPage() {
  const [capacityPlans, setCapacityPlans] = useState<CapacityPlan[]>([])
  const [planReps, setPlanReps] = useState<CapacityPlanRep[]>([])
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<CapacityPlan | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    period_type: 'monthly',
    period_start: '',
    period_end: '',
    team_quota: '',
    avg_productivity: '',
    ramp_month_1: '50',
    ramp_month_2: '75',
    ramp_month_3: '90',
    ramp_month_4: '100',
    is_active: true,
  })

  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState<Quota | null>(null)
  const [quotaForm, setQuotaForm] = useState({
    employee_id: '',
    period_type: 'monthly',
    period_start: '',
    period_end: '',
    target_amount: '',
  })

  const [isRepModalOpen, setIsRepModalOpen] = useState(false)
  const [repForm, setRepForm] = useState({
    plan_id: '',
    employee_id: '',
    quota_override: '',
    ramp_override: '',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchCapacityPlans(),
      fetchPlanReps(),
      fetchQuotas(),
      fetchEmployees(),
    ])
    setLoading(false)
  }

  const fetchCapacityPlans = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('capacity_plans')
      .select('*')
      .order('period_start', { ascending: false })
    if (data) setCapacityPlans(data)
  }

  const fetchPlanReps = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('capacity_plan_reps')
      .select('*, employees(id, first_name, last_name, hire_date)')
      .order('created_at', { ascending: false })
    if (data) setPlanReps(data)
  }

  const fetchQuotas = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('quotas')
      .select('*, employees(id, first_name, last_name)')
      .order('period_start', { ascending: false })
    if (data) setQuotas(data)
  }

  const fetchEmployees = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name, hire_date')
      .order('first_name')
    if (data) setEmployees(data)
  }

  const handleOpenPlanModal = (plan?: CapacityPlan) => {
    if (plan) {
      setEditingPlan(plan)
      setPlanForm({
        name: plan.name,
        period_type: plan.period_type,
        period_start: plan.period_start,
        period_end: plan.period_end,
        team_quota: plan.team_quota.toString(),
        avg_productivity: plan.avg_productivity.toString(),
        ramp_month_1: plan.ramp_month_1.toString(),
        ramp_month_2: plan.ramp_month_2.toString(),
        ramp_month_3: plan.ramp_month_3.toString(),
        ramp_month_4: plan.ramp_month_4.toString(),
        is_active: plan.is_active,
      })
    } else {
      setEditingPlan(null)
      setPlanForm({
        name: '',
        period_type: 'monthly',
        period_start: '',
        period_end: '',
        team_quota: '',
        avg_productivity: '',
        ramp_month_1: '50',
        ramp_month_2: '75',
        ramp_month_3: '90',
        ramp_month_4: '100',
        is_active: true,
      })
    }
    setIsPlanModalOpen(true)
  }

  const handleSavePlan = async () => {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: planForm.name,
      period_type: planForm.period_type,
      period_start: planForm.period_start,
      period_end: planForm.period_end,
      team_quota: parseFloat(planForm.team_quota),
      avg_productivity: parseFloat(planForm.avg_productivity),
      ramp_month_1: parseFloat(planForm.ramp_month_1),
      ramp_month_2: parseFloat(planForm.ramp_month_2),
      ramp_month_3: parseFloat(planForm.ramp_month_3),
      ramp_month_4: parseFloat(planForm.ramp_month_4),
      is_active: planForm.is_active,
    }

    if (editingPlan) {
      const { error } = await supabase
        .from('capacity_plans')
        .update(payload)
        .eq('id', editingPlan.id)
      if (!error) {
        await fetchCapacityPlans()
        setIsPlanModalOpen(false)
      }
    } else {
      const { error } = await supabase
        .from('capacity_plans')
        .insert(payload)
      if (!error) {
        await fetchCapacityPlans()
        setIsPlanModalOpen(false)
      }
    }
    setSaving(false)
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this capacity plan?')) return
    const supabase = createClient()
    const { error } = await supabase.from('capacity_plans').delete().eq('id', id)
    if (!error) await fetchCapacityPlans()
  }

  const handleOpenQuotaModal = (quota?: Quota) => {
    if (quota) {
      setEditingQuota(quota)
      setQuotaForm({
        employee_id: quota.employee_id,
        period_type: quota.period_type,
        period_start: quota.period_start,
        period_end: quota.period_end,
        target_amount: quota.target_amount.toString(),
      })
    } else {
      setEditingQuota(null)
      setQuotaForm({
        employee_id: '',
        period_type: 'monthly',
        period_start: '',
        period_end: '',
        target_amount: '',
      })
    }
    setIsQuotaModalOpen(true)
  }

  const handleSaveQuota = async () => {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      employee_id: quotaForm.employee_id,
      period_type: quotaForm.period_type,
      period_start: quotaForm.period_start,
      period_end: quotaForm.period_end,
      target_amount: parseFloat(quotaForm.target_amount),
      achieved_amount: 0,
      attainment_pct: 0,
    }

    if (editingQuota) {
      const { error } = await supabase
        .from('quotas')
        .update(payload)
        .eq('id', editingQuota.id)
      if (!error) {
        await fetchQuotas()
        setIsQuotaModalOpen(false)
      }
    } else {
      const { error } = await supabase
        .from('quotas')
        .insert(payload)
      if (!error) {
        await fetchQuotas()
        setIsQuotaModalOpen(false)
      }
    }
    setSaving(false)
  }

  const handleDeleteQuota = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quota?')) return
    const supabase = createClient()
    const { error } = await supabase.from('quotas').delete().eq('id', id)
    if (!error) await fetchQuotas()
  }

  const handleOpenRepModal = (planId: string) => {
    setRepForm({ plan_id: planId, employee_id: '', quota_override: '', ramp_override: '' })
    setIsRepModalOpen(true)
  }

  const handleSaveRep = async () => {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      plan_id: repForm.plan_id,
      employee_id: repForm.employee_id,
      quota_override: repForm.quota_override ? parseFloat(repForm.quota_override) : null,
      ramp_override: repForm.ramp_override ? parseFloat(repForm.ramp_override) : null,
    }
    const { error } = await supabase.from('capacity_plan_reps').insert(payload)
    if (!error) {
      await fetchPlanReps()
      setIsRepModalOpen(false)
    }
    setSaving(false)
  }

  const handleDeleteRep = async (id: string) => {
    if (!confirm('Remove this rep from the plan?')) return
    const supabase = createClient()
    const { error } = await supabase.from('capacity_plan_reps').delete().eq('id', id)
    if (!error) await fetchPlanReps()
  }

  const calculateMonthsElapsed = (hireDate: string) => {
    const hire = new Date(hireDate)
    const now = new Date()
    return Math.max(0, (now.getFullYear() - hire.getFullYear()) * 12 + now.getMonth() - hire.getMonth())
  }

  const getRampPct = (plan: CapacityPlan, hireDate: string, rampOverride: number | null) => {
    if (rampOverride !== null) return rampOverride
    const months = calculateMonthsElapsed(hireDate)
    if (months >= 4) return plan.ramp_month_4
    if (months === 3) return plan.ramp_month_3
    if (months === 2) return plan.ramp_month_2
    return plan.ramp_month_1
  }

  const getAttainmentBadge = (pct: number) => {
    if (pct >= 100) return <Badge variant="success">On Track</Badge>
    if (pct >= 70) return <Badge variant="warning">Behind</Badge>
    return <Badge variant="error">At Risk</Badge>
  }

  const totalTeamQuota = capacityPlans.filter(p => p.is_active).reduce((sum, p) => sum + p.team_quota, 0)
  const totalAchieved = quotas.reduce((sum, q) => sum + q.achieved_amount, 0)
  const avgAttainment = quotas.length > 0
    ? Math.round(quotas.reduce((sum, q) => sum + q.attainment_pct, 0) / quotas.length)
    : 0
  const activePlanReps = planReps.length

  const quotaColumns: Column<Quota>[] = [
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
            <p className="font-medium text-charcoal">{item.employees?.first_name} {item.employees?.last_name}</p>
            <p className="text-xs text-pebble">{item.period_type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'target_amount',
      header: 'Target (₹)',
      render: (item) => <span className="text-sm font-medium text-charcoal">₹{item.target_amount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'achieved_amount',
      header: 'Achieved (₹)',
      render: (item) => <span className="text-sm font-medium text-forest-depths">₹{item.achieved_amount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'attainment_pct',
      header: 'Attainment %',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${item.attainment_pct >= 100 ? 'bg-green-500' : item.attainment_pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(item.attainment_pct, 100)}%` }}
            />
          </div>
          <span className="text-sm text-charcoal">{item.attainment_pct}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getAttainmentBadge(item.attainment_pct),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenQuotaModal(item)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteQuota(item.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredQuotas = quotas.filter((q) => {
    const matchesSearch = searchTerm === '' ||
      `${q.employees?.first_name} ${q.employees?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPeriod = periodFilter === '' || q.period_type === periodFilter
    return matchesSearch && matchesPeriod
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Capacity & Quota Management
            </h1>
            <p className="text-olive-slate mt-1">
              Plan team capacity and track quota attainment
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => handleOpenQuotaModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Quota
            </Button>
            <Button onClick={() => handleOpenPlanModal()}>
              <Plus className="w-4 h-4 mr-2" />
              New Capacity Plan
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Team Quota</p>
              <p className="text-2xl font-bold text-forest-depths">₹{totalTeamQuota.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Achieved</p>
              <p className="text-2xl font-bold text-cobalt-ink">₹{totalAchieved.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Avg Attainment %</p>
              <p className="text-2xl font-bold text-plum-depth">{avgAttainment}%</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Reps on Plan</p>
              <p className="text-2xl font-bold text-wine-shadow">{activePlanReps}</p>
            </CardContent>
          </Card>
        </div>

        {/* Capacity Plans */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
            <Target className="w-5 h-5 text-cobalt-ink" />
            Capacity Plans
          </h2>
          {capacityPlans.length === 0 && !loading && (
            <Card>
              <CardContent>
                <p className="text-pebble text-center py-8">No capacity plans yet. Create one to get started.</p>
              </CardContent>
            </Card>
          )}
          {capacityPlans.map((plan) => {
            const reps = planReps.filter((r) => r.plan_id === plan.id)
            return (
              <Card key={plan.id}>
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-charcoal">{plan.name}</h3>
                        {plan.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="default">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-pebble mt-1">
                        {plan.period_type} • {plan.period_start} to {plan.period_end} • Team Quota: ₹{plan.team_quota.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenRepModal(plan.id)}>
                        <Plus className="w-4 h-4 mr-1" /> Add Rep
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenPlanModal(plan)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {reps.map((rep) => {
                      const emp = rep.employees
                      const monthsElapsed = emp ? calculateMonthsElapsed(emp.hire_date) : 0
                      const rampPct = emp ? getRampPct(plan, emp.hire_date, rep.ramp_override) : 0
                      const adjustedQuota = rep.quota_override !== null
                        ? rep.quota_override
                        : Math.round(plan.avg_productivity * rampPct / 100)
                      return (
                        <div key={rep.id} className="bg-bone rounded-lg p-4 border border-sage-mist">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-mint-sprout rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-forest-depths">
                                  {emp?.first_name?.[0]}{emp?.last_name?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-charcoal text-sm">{emp?.first_name} {emp?.last_name}</p>
                                <p className="text-xs text-pebble">Hired: {emp?.hire_date}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRep(rep.id)}>
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                            <div>
                              <p className="text-xs text-pebble">Months</p>
                              <p className="text-sm font-semibold text-charcoal">{monthsElapsed}</p>
                            </div>
                            <div>
                              <p className="text-xs text-pebble">Ramp</p>
                              <p className="text-sm font-semibold text-cobalt-ink">{rampPct}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-pebble">Adj Quota</p>
                              <p className="text-sm font-semibold text-forest-depths">₹{adjustedQuota.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {reps.length === 0 && (
                      <p className="text-sm text-pebble col-span-full py-4 text-center">No reps assigned to this plan yet.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-sage-mist text-sm text-pebble">
                    <span>Avg Productivity: ₹{plan.avg_productivity.toLocaleString('en-IN')}</span>
                    <span>Ramp: {plan.ramp_month_1}% → {plan.ramp_month_2}% → {plan.ramp_month_3}% → {plan.ramp_month_4}%</span>
                    <span>Reps: {reps.length}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quota Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
            <Award className="w-5 h-5 text-plum-depth" />
            Quota Tracking
          </h2>
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
                <Select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Periods' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'annual', label: 'Annual' },
                  ]}
                  placeholder="Filter by period"
                />
              </div>
            </CardContent>
          </Card>
          <DataTable
            columns={quotaColumns}
            data={filteredQuotas}
            loading={loading}
            emptyMessage="No quotas found"
          />
        </div>
      </div>

      {/* Capacity Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? 'Edit Capacity Plan' : 'New Capacity Plan'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Plan Name"
            placeholder="e.g. Q3 2026 Sales Plan"
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
          />
          <Select
            label="Period Type"
            value={planForm.period_type}
            onChange={(e) => setPlanForm({ ...planForm, period_type: e.target.value })}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'annual', label: 'Annual' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Period Start"
              type="date"
              value={planForm.period_start}
              onChange={(e) => setPlanForm({ ...planForm, period_start: e.target.value })}
            />
            <Input
              label="Period End"
              type="date"
              value={planForm.period_end}
              onChange={(e) => setPlanForm({ ...planForm, period_end: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Team Quota (₹)"
              type="number"
              placeholder="1000000"
              value={planForm.team_quota}
              onChange={(e) => setPlanForm({ ...planForm, team_quota: e.target.value })}
            />
            <Input
              label="Avg Productivity (₹)"
              type="number"
              placeholder="200000"
              value={planForm.avg_productivity}
              onChange={(e) => setPlanForm({ ...planForm, avg_productivity: e.target.value })}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-charcoal mb-2">Ramp Percentages (%)</p>
            <div className="grid grid-cols-4 gap-4">
              <Input
                label="Month 1"
                type="number"
                value={planForm.ramp_month_1}
                onChange={(e) => setPlanForm({ ...planForm, ramp_month_1: e.target.value })}
              />
              <Input
                label="Month 2"
                type="number"
                value={planForm.ramp_month_2}
                onChange={(e) => setPlanForm({ ...planForm, ramp_month_2: e.target.value })}
              />
              <Input
                label="Month 3"
                type="number"
                value={planForm.ramp_month_3}
                onChange={(e) => setPlanForm({ ...planForm, ramp_month_3: e.target.value })}
              />
              <Input
                label="Month 4+"
                type="number"
                value={planForm.ramp_month_4}
                onChange={(e) => setPlanForm({ ...planForm, ramp_month_4: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsPlanModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={saving || !planForm.name || !planForm.period_start}>
              {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quota Modal */}
      <Modal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        title={editingQuota ? 'Edit Quota' : 'Add Quota'}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Employee"
            value={quotaForm.employee_id}
            onChange={(e) => setQuotaForm({ ...quotaForm, employee_id: e.target.value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
            }))}
            placeholder="Select employee..."
          />
          <Select
            label="Period Type"
            value={quotaForm.period_type}
            onChange={(e) => setQuotaForm({ ...quotaForm, period_type: e.target.value })}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'annual', label: 'Annual' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Period Start"
              type="date"
              value={quotaForm.period_start}
              onChange={(e) => setQuotaForm({ ...quotaForm, period_start: e.target.value })}
            />
            <Input
              label="Period End"
              type="date"
              value={quotaForm.period_end}
              onChange={(e) => setQuotaForm({ ...quotaForm, period_end: e.target.value })}
            />
          </div>
          <Input
            label="Target Amount (₹)"
            type="number"
            placeholder="500000"
            value={quotaForm.target_amount}
            onChange={(e) => setQuotaForm({ ...quotaForm, target_amount: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsQuotaModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuota} disabled={saving || !quotaForm.employee_id || !quotaForm.target_amount}>
              {saving ? 'Saving...' : editingQuota ? 'Update Quota' : 'Create Quota'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Rep Modal */}
      <Modal
        isOpen={isRepModalOpen}
        onClose={() => setIsRepModalOpen(false)}
        title="Add Rep to Plan"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Employee"
            value={repForm.employee_id}
            onChange={(e) => setRepForm({ ...repForm, employee_id: e.target.value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
            }))}
            placeholder="Select employee..."
          />
          <Input
            label="Quota Override (₹) — optional"
            type="number"
            placeholder="Leave blank to use plan default"
            value={repForm.quota_override}
            onChange={(e) => setRepForm({ ...repForm, quota_override: e.target.value })}
          />
          <Input
            label="Ramp Override (%) — optional"
            type="number"
            placeholder="Leave blank to use plan ramp schedule"
            value={repForm.ramp_override}
            onChange={(e) => setRepForm({ ...repForm, ramp_override: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsRepModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRep} disabled={saving || !repForm.employee_id}>
              {saving ? 'Saving...' : 'Add Rep'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
