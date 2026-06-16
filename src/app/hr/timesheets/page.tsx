'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Edit2, Trash2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
}

interface Timesheet {
  id: string
  employee_id: string
  week_starting: string
  total_hours: number
  billable_hours: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_at: string
  approved_by: string
  approved_at: string
  notes: string
  created_at: string
  updated_at: string
  employees?: Employee
}

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null)
  const [formData, setFormData] = useState({
    employee_id: '',
    week_starting: '',
    total_hours: '',
    billable_hours: '',
    status: 'draft' as Timesheet['status'],
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTimesheets()
    fetchEmployees()
  }, [])

  const fetchTimesheets = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('timesheets')
      .select('*, employees(id, employee_id, first_name, last_name)')
      .order('week_starting', { ascending: false })

    if (data) {
      setTimesheets(data)
    }
    setLoading(false)
  }

  const fetchEmployees = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name')
      .order('first_name')

    if (data) {
      setEmployees(data)
    }
  }

  const handleOpenModal = (timesheet?: Timesheet) => {
    if (timesheet) {
      setEditingTimesheet(timesheet)
      setFormData({
        employee_id: timesheet.employee_id,
        week_starting: timesheet.week_starting,
        total_hours: timesheet.total_hours?.toString() || '',
        billable_hours: timesheet.billable_hours?.toString() || '',
        status: timesheet.status,
        notes: timesheet.notes || '',
      })
    } else {
      setEditingTimesheet(null)
      setFormData({
        employee_id: '',
        week_starting: '',
        total_hours: '',
        billable_hours: '',
        status: 'draft',
        notes: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTimesheet(null)
    setFormData({
      employee_id: '',
      week_starting: '',
      total_hours: '',
      billable_hours: '',
      status: 'draft',
      notes: '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      employee_id: formData.employee_id,
      week_starting: formData.week_starting,
      total_hours: formData.total_hours ? parseFloat(formData.total_hours) : null,
      billable_hours: formData.billable_hours ? parseFloat(formData.billable_hours) : null,
      status: formData.status,
      notes: formData.notes || null,
    }

    if (editingTimesheet) {
      const { error } = await supabase
        .from('timesheets')
        .update(record)
        .eq('id', editingTimesheet.id)

      if (!error) {
        await fetchTimesheets()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('timesheets')
        .insert(record)

      if (!error) {
        await fetchTimesheets()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timesheet?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('timesheets')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchTimesheets()
    }
  }

  const getStatusBadge = (status: Timesheet['status']) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      draft: 'default',
      submitted: 'warning',
      approved: 'success',
      rejected: 'error',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const columns: Column<Timesheet>[] = [
    {
      key: 'employee_id',
      header: 'Employee',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-wash rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-cobalt-ink">
              {item.employees?.first_name?.[0]}{item.employees?.last_name?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-charcoal">
              {item.employees?.first_name} {item.employees?.last_name}
            </p>
            <p className="text-xs text-pebble">{item.employees?.employee_id}</p>
          </div>
        </div>
      )
    },
    {
      key: 'week_starting',
      header: 'Week Starting',
      render: (item) => (
        <div className="flex items-center gap-1 text-sm">
          <FileText className="w-3 h-3 text-pebble" />
          <span className="text-charcoal">
            {new Date(item.week_starting).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      )
    },
    {
      key: 'total_hours',
      header: 'Total Hours',
      render: (item) => (
        <span className="font-medium text-charcoal">{item.total_hours || 0}h</span>
      )
    },
    {
      key: 'billable_hours',
      header: 'Billable Hours',
      render: (item) => (
        <span className="font-medium text-forest-depths">{item.billable_hours || 0}h</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredTimesheets = timesheets.filter(
    (timesheet) => {
      const matchesSearch = searchTerm === '' ||
        `${timesheet.employees?.first_name} ${timesheet.employees?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timesheet.employees?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === '' || timesheet.status === statusFilter
      return matchesSearch && matchesStatus
    }
  )

  const totalBillableHours = timesheets.reduce((sum, t) => sum + (t.billable_hours || 0), 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Timesheets
            </h1>
            <p className="text-olive-slate mt-1">
              Track weekly work hours and billable time
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            New Timesheet
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Draft</p>
              <p className="text-2xl font-bold text-plum-depth">
                {timesheets.filter((t) => t.status === 'draft').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-olive-slate">Submitted</p>
              <p className="text-2xl font-bold text-olive-slate">
                {timesheets.filter((t) => t.status === 'submitted').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Approved</p>
              <p className="text-2xl font-bold text-forest-depths">
                {timesheets.filter((t) => t.status === 'approved').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Hours</p>
              <p className="text-2xl font-bold text-cobalt-ink">{totalBillableHours}h</p>
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
                  placeholder="Search by employee name or ID..."
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
                  { value: 'draft', label: 'Draft' },
                  { value: 'submitted', label: 'Submitted' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                placeholder="Filter by status"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredTimesheets}
          loading={loading}
          emptyMessage="No timesheets found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTimesheet ? 'Edit Timesheet' : 'New Timesheet'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Employee"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name} (${emp.employee_id})`,
            }))}
            placeholder="Select employee..."
          />
          <Input
            label="Week Starting"
            type="date"
            value={formData.week_starting}
            onChange={(e) => setFormData({ ...formData, week_starting: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Hours"
              type="number"
              step="0.5"
              min="0"
              placeholder="40"
              value={formData.total_hours}
              onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
            />
            <Input
              label="Billable Hours"
              type="number"
              step="0.5"
              min="0"
              placeholder="35"
              value={formData.billable_hours}
              onChange={(e) => setFormData({ ...formData, billable_hours: e.target.value })}
            />
          </div>
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Timesheet['status'] })}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Input
            label="Notes"
            placeholder="Optional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.employee_id || !formData.week_starting}>
              {saving ? 'Saving...' : editingTimesheet ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
