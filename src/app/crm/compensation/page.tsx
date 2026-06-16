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
}

interface CommissionPlan {
  id: string
  name: string
  period_type: string
  base_rate_bps: number
  accelerator_rate_bps: number
  threshold_pct: number
  is_active: boolean
}

interface CommissionAssignment {
  id: string
  plan_id: string
  employee_id: string
  base_rate_override_bps: number | null
  accelerator_rate_override_bps: number | null
  employees?: Employee
  commission_plans?: CommissionPlan
}

interface CommissionEvent {
  id: string
  assignment_id: string
  opportunity_id: string
  deal_amount: number
  commission_amount: number
  base_amount: number
  accelerator_amount: number
  rate_bps_applied: number
  status: 'pending' | 'approved' | 'paid' | 'disputed'
  commission_assignments?: CommissionAssignment
}

export default function CompensationPage() {
  const [plans, setPlans] = useState<CommissionPlan[]>([])
  const [assignments, setAssignments] = useState<CommissionAssignment[]>([])
  const [events, setEvents] = useState<CommissionEvent[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<CommissionPlan | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    period_type: 'monthly',
    base_rate_bps: '',
    accelerator_rate_bps: '',
    threshold_pct: '100',
    is_active: true,
  })

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    plan_id: '',
    employee_id: '',
    base_rate_override_bps: '',
    accelerator_rate_override_bps: '',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchPlans(),
      fetchAssignments(),
      fetchEvents(),
      fetchEmployees(),
    ])
    setLoading(false)
  }

  const fetchPlans = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('commission_plans')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setPlans(data)
  }

  const fetchAssignments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('commission_assignments')
      .select('*, employees(id, first_name, last_name), commission_plans(id, name)')
      .order('created_at', { ascending: false })
    if (data) setAssignments(data)
  }

  const fetchEvents = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('commission_events')
      .select('*, commission_assignments(id, employee_id, employees(first_name, last_name), commission_plans(name))')
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  const fetchEmployees = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .order('first_name')
    if (data) setEmployees(data)
  }

  const handleOpenPlanModal = (plan?: CommissionPlan) => {
    if (plan) {
      setEditingPlan(plan)
      setPlanForm({
        name: plan.name,
        period_type: plan.period_type,
        base_rate_bps: plan.base_rate_bps.toString(),
        accelerator_rate_bps: plan.accelerator_rate_bps.toString(),
        threshold_pct: plan.threshold_pct.toString(),
        is_active: plan.is_active,
      })
    } else {
      setEditingPlan(null)
      setPlanForm({
        name: '',
        period_type: 'monthly',
        base_rate_bps: '',
        accelerator_rate_bps: '',
        threshold_pct: '100',
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
      base_rate_bps: parseInt(planForm.base_rate_bps),
      accelerator_rate_bps: parseInt(planForm.accelerator_rate_bps),
      threshold_pct: parseFloat(planForm.threshold_pct),
      is_active: planForm.is_active,
    }

    if (editingPlan) {
      const { error } = await supabase
        .from('commission_plans')
        .update(payload)
        .eq('id', editingPlan.id)
      if (!error) {
        await fetchPlans()
        setIsPlanModalOpen(false)
      }
    } else {
      const { error } = await supabase
        .from('commission_plans')
        .insert(payload)
      if (!error) {
        await fetchPlans()
        setIsPlanModalOpen(false)
      }
    }
    setSaving(false)
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commission plan?')) return
    const supabase = createClient()
    const { error } = await supabase.from('commission_plans').delete().eq('id', id)
    if (!error) await fetchPlans()
  }

  const handleOpenAssignmentModal = (planId: string) => {
    setAssignmentForm({ plan_id: planId, employee_id: '', base_rate_override_bps: '', accelerator_rate_override_bps: '' })
    setIsAssignmentModalOpen(true)
  }

  const handleSaveAssignment = async () => {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      plan_id: assignmentForm.plan_id,
      employee_id: assignmentForm.employee_id,
      base_rate_override_bps: assignmentForm.base_rate_override_bps ? parseInt(assignmentForm.base_rate_override_bps) : null,
      accelerator_rate_override_bps: assignmentForm.accelerator_rate_override_bps ? parseInt(assignmentForm.accelerator_rate_override_bps) : null,
    }
    const { error } = await supabase.from('commission_assignments').insert(payload)
    if (!error) {
      await fetchAssignments()
      setIsAssignmentModalOpen(false)
    }
    setSaving(false)
  }

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Remove this assignment?')) return
    const supabase = createClient()
    const { error } = await supabase.from('commission_assignments').delete().eq('id', id)
    if (!error) await fetchAssignments()
  }

  const getStatusBadge = (status: CommissionEvent['status']) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      pending: 'warning',
      approved: 'info',
      paid: 'success',
      disputed: 'error',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const bpsToPercent = (bps: number) => (bps / 100).toFixed(1)

  const totalCommissions = events.reduce((sum, e) => sum + e.commission_amount, 0)
  const pendingPayouts = events.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.commission_amount, 0)
  const activePlans = plans.filter(p => p.is_active).length
  const totalEvents = events.length

  const eventColumns: Column<CommissionEvent>[] = [
    {
      key: 'opportunity_id',
      header: 'Deal',
      render: (item) => (
        <div>
          <p className="font-medium text-charcoal text-sm">{item.opportunity_id}</p>
          <p className="text-xs text-pebble">{item.commission_assignments?.commission_plans?.name}</p>
        </div>
      ),
    },
    {
      key: 'deal_amount',
      header: 'Amount',
      render: (item) => <span className="text-sm font-medium text-charcoal">₹{item.deal_amount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'commission_amount',
      header: 'Commission',
      render: (item) => (
        <div>
          <p className="text-sm font-semibold text-forest-depths">₹{item.commission_amount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-pebble">
            Base: ₹{item.base_amount.toLocaleString('en-IN')} + Accel: ₹{item.accelerator_amount.toLocaleString('en-IN')}
          </p>
        </div>
      ),
    },
    {
      key: 'rate_bps_applied',
      header: 'Rate Applied',
      render: (item) => (
        <span className="text-sm text-cobalt-ink">{bpsToPercent(item.rate_bps_applied)}%</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status),
    },
  ]

  const filteredEvents = events.filter((e) => {
    const matchesSearch = searchTerm === '' ||
      e.opportunity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${e.commission_assignments?.employees?.first_name} ${e.commission_assignments?.employees?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Sales Compensation
            </h1>
            <p className="text-olive-slate mt-1">
              Manage commission plans and track payouts
            </p>
          </div>
          <Button onClick={() => handleOpenPlanModal()}>
            <Plus className="w-4 h-4 mr-2" />
            New Commission Plan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Commissions</p>
              <p className="text-2xl font-bold text-forest-depths">₹{totalCommissions.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Pending Payouts</p>
              <p className="text-2xl font-bold text-wine-shadow">₹{pendingPayouts.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Active Plans</p>
              <p className="text-2xl font-bold text-cobalt-ink">{activePlans}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Total Events</p>
              <p className="text-2xl font-bold text-plum-depth">{totalEvents}</p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Plans */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
            <Target className="w-5 h-5 text-cobalt-ink" />
            Commission Plans
          </h2>
          {plans.length === 0 && !loading && (
            <Card>
              <CardContent>
                <p className="text-pebble text-center py-8">No commission plans yet. Create one to get started.</p>
              </CardContent>
            </Card>
          )}
          {plans.map((plan) => {
            const planAssignments = assignments.filter(a => a.plan_id === plan.id)
            return (
              <Card key={plan.id}>
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-charcoal">{plan.name}</h3>
                        {plan.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-pebble mt-1">
                        {plan.period_type} • Base: {bpsToPercent(plan.base_rate_bps)}% • Accelerator: {bpsToPercent(plan.accelerator_rate_bps)}% above {plan.threshold_pct}% attainment
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenAssignmentModal(plan.id)}>
                        <Plus className="w-4 h-4 mr-1" /> Assign Rep
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenPlanModal(plan)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {planAssignments.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                      {planAssignments.map((a) => (
                        <div key={a.id} className="bg-bone rounded-lg p-3 border border-sage-mist flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-mint-sprout rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-forest-depths">
                                {a.employees?.first_name?.[0]}{a.employees?.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-charcoal text-sm">{a.employees?.first_name} {a.employees?.last_name}</p>
                              <p className="text-xs text-pebble">
                                {a.base_rate_override_bps !== null ? `${bpsToPercent(a.base_rate_override_bps)}%` : `${bpsToPercent(plan.base_rate_bps)}%`} base
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAssignment(a.id)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {planAssignments.length === 0 && (
                    <p className="text-sm text-pebble mt-2">No reps assigned yet.</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Commission Events */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
            <Award className="w-5 h-5 text-plum-depth" />
            Commission Events
          </h2>
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
                  <input
                    type="text"
                    placeholder="Search by deal ID or rep name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="coda-input pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'disputed', label: 'Disputed' },
                  ]}
                  placeholder="Filter by status"
                />
              </div>
            </CardContent>
          </Card>
          <DataTable
            columns={eventColumns}
            data={filteredEvents}
            loading={loading}
            emptyMessage="No commission events found"
          />
        </div>
      </div>

      {/* Commission Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? 'Edit Commission Plan' : 'New Commission Plan'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Plan Name"
            placeholder="e.g. Standard Sales Commission"
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
          <div className="bg-sky-wash rounded-lg p-4">
            <p className="text-sm font-medium text-cobalt-ink mb-3">Commission Rates (Basis Points)</p>
            <p className="text-xs text-pebble mb-3">100 bps = 1%. E.g., 500 bps = 5%</p>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Base Rate (bps)"
                type="number"
                placeholder="500"
                value={planForm.base_rate_bps}
                onChange={(e) => setPlanForm({ ...planForm, base_rate_bps: e.target.value })}
              />
              <Input
                label="Accelerator Rate (bps)"
                type="number"
                placeholder="750"
                value={planForm.accelerator_rate_bps}
                onChange={(e) => setPlanForm({ ...planForm, accelerator_rate_bps: e.target.value })}
              />
              <Input
                label="Threshold Attainment %"
                type="number"
                placeholder="100"
                value={planForm.threshold_pct}
                onChange={(e) => setPlanForm({ ...planForm, threshold_pct: e.target.value })}
              />
            </div>
            <p className="text-xs text-pebble mt-2">
              Preview: Base {planForm.base_rate_bps ? bpsToPercent(parseInt(planForm.base_rate_bps)) : '0'}% •
              {' '}Accelerator {planForm.accelerator_rate_bps ? bpsToPercent(parseInt(planForm.accelerator_rate_bps)) : '0'}% above {planForm.threshold_pct || '100'}% attainment
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsPlanModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={saving || !planForm.name || !planForm.base_rate_bps}>
              {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Assign Rep to Plan"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Employee"
            value={assignmentForm.employee_id}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, employee_id: e.target.value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
            }))}
            placeholder="Select employee..."
          />
          <div className="bg-sage-mist rounded-lg p-4">
            <p className="text-sm font-medium text-charcoal mb-2">Optional Rate Overrides (bps)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Base Rate Override"
                type="number"
                placeholder="Use plan default"
                value={assignmentForm.base_rate_override_bps}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, base_rate_override_bps: e.target.value })}
              />
              <Input
                label="Accelerator Rate Override"
                type="number"
                placeholder="Use plan default"
                value={assignmentForm.accelerator_rate_override_bps}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, accelerator_rate_override_bps: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAssignmentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAssignment} disabled={saving || !assignmentForm.employee_id}>
              {saving ? 'Saving...' : 'Assign Rep'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
