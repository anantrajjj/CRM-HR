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
import { Plus, Search, Edit2, Trash2, User, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department_id?: string
  designation_id?: string
  hire_date: string
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern'
  status: 'active' | 'on_leave' | 'terminated' | 'resigned'
  departments?: { name: string }
  designations?: { name: string }
}

interface Department { id: string; name: string }
interface Designation { id: string; name: string }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    employee_id: '',
    department_id: '',
    designation_id: '',
    hire_date: '',
    employment_type: 'full_time' as Employee['employment_type'],
    status: 'active' as Employee['status'],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEmployees()
    fetchLookups()
  }, [])

  const fetchEmployees = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employees')
      .select('*, departments(name), designations(name)')
      .order('last_name')

    if (data) setEmployees(data)
    setLoading(false)
  }

  const fetchLookups = async () => {
    const supabase = createClient()
    const [dRes, desRes] = await Promise.all([
      supabase.from('departments').select('id, name').order('name'),
      supabase.from('designations').select('id, name').order('name'),
    ])
    if (dRes.data) setDepartments(dRes.data)
    if (desRes.data) setDesignations(desRes.data)
  }

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp)
      setFormData({
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        phone: emp.phone || '',
        employee_id: emp.employee_id,
        department_id: emp.department_id || '',
        designation_id: emp.designation_id || '',
        hire_date: emp.hire_date,
        employment_type: emp.employment_type,
        status: emp.status,
      })
    } else {
      setEditingEmp(null)
      setFormData({
        first_name: '', last_name: '', email: '', phone: '', employee_id: '',
        department_id: '', designation_id: '', hire_date: '',
        employment_type: 'full_time', status: 'active',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEmp(null)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const record = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone || null,
      employee_id: formData.employee_id,
      department_id: formData.department_id || null,
      designation_id: formData.designation_id || null,
      hire_date: formData.hire_date,
      employment_type: formData.employment_type,
      status: formData.status,
    }

    if (editingEmp) {
      const { error } = await supabase.from('employees').update(record).eq('id', editingEmp.id)
      if (!error) { await fetchEmployees(); handleCloseModal() }
    } else {
      const { error } = await supabase.from('employees').insert(record)
      if (!error) { await fetchEmployees(); handleCloseModal() }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    const supabase = createClient()
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (!error) await fetchEmployees()
  }

  const columns: Column<Employee>[] = [
    {
      key: 'employee_id',
      header: 'ID',
      render: (item) => <span className="font-mono text-sm">{item.employee_id}</span>,
    },
    {
      key: 'last_name',
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mint-sprout rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-forest-depths" />
          </div>
          <div>
            <p className="font-medium text-charcoal">{item.first_name} {item.last_name}</p>
            <p className="text-xs text-pebble">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'departments',
      header: 'Department',
      render: (item) => item.departments?.name || <span className="text-pebble">-</span>,
    },
    {
      key: 'designations',
      header: 'Designation',
      render: (item) => item.designations?.name || <span className="text-pebble">-</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={
            item.status === 'active' ? 'success' :
            item.status === 'on_leave' ? 'warning' :
            item.status === 'resigned' ? 'info' : 'error'
          }
        >
          {item.status.replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'hire_date', header: 'Hire Date' },
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

  const filteredEmployees = employees.filter(
    (emp) =>
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.departments?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">Employees</h1>
            <p className="text-olive-slate mt-1">Manage your workforce and employee information</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Employees</p>
              <p className="text-2xl font-bold text-forest-depths">{employees.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Active</p>
              <p className="text-2xl font-bold text-cobalt-ink">{employees.filter((e) => e.status === 'active').length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">On Leave</p>
              <p className="text-2xl font-bold text-plum-depth">{employees.filter((e) => e.status === 'on_leave').length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Departments</p>
              <p className="text-2xl font-bold text-wine-shadow">{new Set(employees.map((e) => e.department_id).filter(Boolean)).size}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coda-input pl-10"
                />
              </div>
              <Button variant="secondary">Department</Button>
              <Button variant="secondary">Status</Button>
            </div>
          </CardContent>
        </Card>

        <DataTable columns={columns} data={filteredEmployees} loading={loading} emptyMessage="No employees found" />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEmp ? 'Edit Employee' : 'Add Employee'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Employee ID"
              placeholder="EMP001"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Input
            label="Phone"
            placeholder="+1 234 567 890"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Select department..."
            />
            <Select
              label="Designation"
              value={formData.designation_id}
              onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
              options={designations.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Select designation..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hire Date"
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
            />
            <Select
              label="Employment Type"
              value={formData.employment_type}
              onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as Employee['employment_type'] })}
              options={[
                { value: 'full_time', label: 'Full Time' },
                { value: 'part_time', label: 'Part Time' },
                { value: 'contract', label: 'Contract' },
                { value: 'intern', label: 'Intern' },
              ]}
            />
          </div>
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Employee['status'] })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'on_leave', label: 'On Leave' },
              { value: 'terminated', label: 'Terminated' },
              { value: 'resigned', label: 'Resigned' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.first_name || !formData.last_name || !formData.email}>
              {saving ? 'Saving...' : editingEmp ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
