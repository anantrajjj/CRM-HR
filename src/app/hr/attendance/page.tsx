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
import { Plus, Search, Edit2, Trash2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
}

interface Attendance {
  id: string
  employee_id: string
  date: string
  check_in: string
  check_out: string
  shift_type_id: string
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave'
  hours_worked: number
  overtime_hours: number
  notes: string
  created_at: string
  updated_at: string
  employees?: Employee
}

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null)
  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    check_in: '',
    check_out: '',
    status: 'present' as Attendance['status'],
    hours_worked: '',
    overtime_hours: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRecords()
    fetchEmployees()
  }, [])

  const fetchRecords = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('attendance')
      .select('*, employees(id, employee_id, first_name, last_name)')
      .order('date', { ascending: false })

    if (data) {
      setRecords(data)
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

  const handleOpenModal = (record?: Attendance) => {
    if (record) {
      setEditingRecord(record)
      setFormData({
        employee_id: record.employee_id,
        date: record.date,
        check_in: record.check_in || '',
        check_out: record.check_out || '',
        status: record.status,
        hours_worked: record.hours_worked?.toString() || '',
        overtime_hours: record.overtime_hours?.toString() || '',
        notes: record.notes || '',
      })
    } else {
      setEditingRecord(null)
      setFormData({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        check_in: '',
        check_out: '',
        status: 'present',
        hours_worked: '',
        overtime_hours: '',
        notes: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
    setFormData({
      employee_id: '',
      date: '',
      check_in: '',
      check_out: '',
      status: 'present',
      hours_worked: '',
      overtime_hours: '',
      notes: '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      employee_id: formData.employee_id,
      date: formData.date,
      check_in: formData.check_in || null,
      check_out: formData.check_out || null,
      status: formData.status,
      hours_worked: formData.hours_worked ? parseFloat(formData.hours_worked) : null,
      overtime_hours: formData.overtime_hours ? parseFloat(formData.overtime_hours) : null,
      notes: formData.notes || null,
    }

    if (editingRecord) {
      const { error } = await supabase
        .from('attendance')
        .update(record)
        .eq('id', editingRecord.id)

      if (!error) {
        await fetchRecords()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('attendance')
        .insert(record)

      if (!error) {
        await fetchRecords()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchRecords()
    }
  }

  const getStatusBadge = (status: Attendance['status']) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      present: 'success',
      absent: 'error',
      late: 'warning',
      half_day: 'info',
      on_leave: 'default',
    }
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>
  }

  const columns: Column<Attendance>[] = [
    {
      key: 'employee_id',
      header: 'Employee',
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
            <p className="text-xs text-pebble">{item.employees?.employee_id}</p>
          </div>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (item) => (
        <span className="text-sm text-charcoal">
          {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      )
    },
    {
      key: 'check_in',
      header: 'Check In',
      render: (item) => item.check_in ? (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="w-3 h-3 text-forest-depths" />
          {item.check_in}
        </div>
      ) : <span className="text-pebble">-</span>
    },
    {
      key: 'check_out',
      header: 'Check Out',
      render: (item) => item.check_out ? (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="w-3 h-3 text-wine-shadow" />
          {item.check_out}
        </div>
      ) : <span className="text-pebble">-</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status)
    },
    {
      key: 'hours_worked',
      header: 'Hours',
      render: (item) => (
        <span className="text-sm font-medium text-charcoal">{item.hours_worked || 0}h</span>
      )
    },
    {
      key: 'overtime_hours',
      header: 'Overtime',
      render: (item) => (
        <span className="text-sm text-cobalt-ink">{item.overtime_hours || 0}h</span>
      )
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

  const filteredRecords = records.filter(
    (record) => {
      const matchesSearch = searchTerm === '' ||
        `${record.employees?.first_name} ${record.employees?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employees?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === '' || record.status === statusFilter
      return matchesSearch && matchesStatus
    }
  )

  const today = new Date().toISOString().split('T')[0]
  const todayRecords = records.filter((r) => r.date === today)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Attendance
            </h1>
            <p className="text-olive-slate mt-1">
              Track employee attendance and working hours
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Record
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Present Today</p>
              <p className="text-2xl font-bold text-forest-depths">
                {todayRecords.filter((r) => r.status === 'present').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Absent</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {todayRecords.filter((r) => r.status === 'absent').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-olive-slate">Late</p>
              <p className="text-2xl font-bold text-olive-slate">
                {todayRecords.filter((r) => r.status === 'late').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">On Leave</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {todayRecords.filter((r) => r.status === 'on_leave').length}
              </p>
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
                  { value: 'present', label: 'Present' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'late', label: 'Late' },
                  { value: 'half_day', label: 'Half Day' },
                  { value: 'on_leave', label: 'On Leave' },
                ]}
                placeholder="Filter by status"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredRecords}
          loading={loading}
          emptyMessage="No attendance records found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRecord ? 'Edit Attendance' : 'Add Attendance'}
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
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Check In"
              type="time"
              value={formData.check_in}
              onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
            />
            <Input
              label="Check Out"
              type="time"
              value={formData.check_out}
              onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
            />
          </div>
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Attendance['status'] })}
            options={[
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'late', label: 'Late' },
              { value: 'half_day', label: 'Half Day' },
              { value: 'on_leave', label: 'On Leave' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hours Worked"
              type="number"
              step="0.5"
              placeholder="8"
              value={formData.hours_worked}
              onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
            />
            <Input
              label="Overtime Hours"
              type="number"
              step="0.5"
              placeholder="0"
              value={formData.overtime_hours}
              onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
            />
          </div>
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
            <Button onClick={handleSave} disabled={saving || !formData.employee_id || !formData.date}>
              {saving ? 'Saving...' : editingRecord ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
