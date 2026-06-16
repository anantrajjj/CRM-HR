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
import { Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
}

interface LeaveType {
  id: string
  name: string
  code: string
}

interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approved_by: string
  approved_at: string
  notes: string
  created_at: string
  updated_at: string
  employees?: Employee
  leave_types?: LeaveType
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null)
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    days: '',
    reason: '',
    status: 'pending' as LeaveRequest['status'],
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRequests()
    fetchEmployees()
    fetchLeaveTypes()
  }, [])

  const fetchRequests = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, employees(id, employee_id, first_name, last_name), leave_types(id, name, code)')
      .order('created_at', { ascending: false })

    if (data) {
      setRequests(data)
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

  const fetchLeaveTypes = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('leave_types')
      .select('id, name, code')
      .order('name')

    if (data) {
      setLeaveTypes(data)
    }
  }

  const handleOpenModal = (request?: LeaveRequest) => {
    if (request) {
      setEditingRequest(request)
      setFormData({
        employee_id: request.employee_id,
        leave_type_id: request.leave_type_id,
        start_date: request.start_date,
        end_date: request.end_date,
        days: request.days?.toString() || '',
        reason: request.reason || '',
        status: request.status,
        notes: request.notes || '',
      })
    } else {
      setEditingRequest(null)
      setFormData({
        employee_id: '',
        leave_type_id: '',
        start_date: '',
        end_date: '',
        days: '',
        reason: '',
        status: 'pending',
        notes: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRequest(null)
    setFormData({
      employee_id: '',
      leave_type_id: '',
      start_date: '',
      end_date: '',
      days: '',
      reason: '',
      status: 'pending',
      notes: '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      employee_id: formData.employee_id,
      leave_type_id: formData.leave_type_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      days: formData.days ? parseInt(formData.days) : null,
      reason: formData.reason || null,
      status: formData.status,
      notes: formData.notes || null,
    }

    if (editingRequest) {
      const { error } = await supabase
        .from('leave_requests')
        .update(record)
        .eq('id', editingRequest.id)

      if (!error) {
        await fetchRequests()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('leave_requests')
        .insert(record)

      if (!error) {
        await fetchRequests()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchRequests()
    }
  }

  const getStatusBadge = (status: LeaveRequest['status']) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      cancelled: 'default',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'employee_id',
      header: 'Employee',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-lilac-wash rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-plum-depth">
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
      key: 'leave_type_id',
      header: 'Leave Type',
      render: (item) => (
        <Badge variant="info">{item.leave_types?.name || 'Unknown'}</Badge>
      )
    },
    {
      key: 'start_date',
      header: 'Period',
      render: (item) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-3 h-3 text-pebble" />
          <span className="text-charcoal">
            {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: 'days',
      header: 'Days',
      render: (item) => (
        <span className="font-medium text-charcoal">{item.days}</span>
      )
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (item) => (
        <span className="text-sm text-olive-slate truncate max-w-[200px] block">
          {item.reason || '-'}
        </span>
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

  const filteredRequests = requests.filter(
    (request) => {
      const matchesSearch = searchTerm === '' ||
        `${request.employees?.first_name} ${request.employees?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.employees?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === '' || request.status === statusFilter
      return matchesSearch && matchesStatus
    }
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Leave Requests
            </h1>
            <p className="text-olive-slate mt-1">
              Manage employee leave applications and approvals
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-olive-slate">Pending</p>
              <p className="text-2xl font-bold text-olive-slate">
                {requests.filter((r) => r.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Approved</p>
              <p className="text-2xl font-bold text-forest-depths">
                {requests.filter((r) => r.status === 'approved').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Rejected</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {requests.filter((r) => r.status === 'rejected').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total</p>
              <p className="text-2xl font-bold text-cobalt-ink">{requests.length}</p>
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
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                placeholder="Filter by status"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredRequests}
          loading={loading}
          emptyMessage="No leave requests found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRequest ? 'Edit Leave Request' : 'New Leave Request'}
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
          <Select
            label="Leave Type"
            value={formData.leave_type_id}
            onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
            options={leaveTypes.map((lt) => ({
              value: lt.id,
              label: `${lt.name} (${lt.code})`,
            }))}
            placeholder="Select leave type..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
          <Input
            label="Days"
            type="number"
            min="1"
            placeholder="Number of days"
            value={formData.days}
            onChange={(e) => setFormData({ ...formData, days: e.target.value })}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-charcoal">Reason</label>
            <textarea
              placeholder="Reason for leave..."
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 text-base bg-pure-white border border-sage-mist rounded-[9px] placeholder:text-pebble focus:outline-none focus:border-obsidian transition-colors"
            />
          </div>
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as LeaveRequest['status'] })}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.employee_id || !formData.leave_type_id || !formData.start_date}>
              {saving ? 'Saving...' : editingRequest ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
