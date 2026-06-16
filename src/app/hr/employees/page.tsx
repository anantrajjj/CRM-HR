'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Plus, Search, Edit2, Eye, User } from 'lucide-react'

interface Employee {
  id: string
  employee_id: string
  name: string
  email: string
  department: string
  designation: string
  status: 'active' | 'on_leave' | 'terminated'
  hire_date: string
}

const mockEmployees: Employee[] = [
  { id: '1', employee_id: 'EMP001', name: 'Sarah Johnson', email: 'sarah@company.com', department: 'HR', designation: 'HR Manager', status: 'active', hire_date: '2022-03-15' },
  { id: '2', employee_id: 'EMP002', name: 'Mike Chen', email: 'mike@company.com', department: 'Engineering', designation: 'Senior Software Engineer', status: 'active', hire_date: '2021-06-20' },
  { id: '3', employee_id: 'EMP003', name: 'John Smith', email: 'john@company.com', department: 'Sales', designation: 'Sales Manager', status: 'active', hire_date: '2023-01-10' },
  { id: '4', employee_id: 'EMP004', name: 'Emily Davis', email: 'emily@company.com', department: 'Marketing', designation: 'Marketing Specialist', status: 'on_leave', hire_date: '2023-08-05' },
  { id: '5', employee_id: 'EMP005', name: 'Robert Wilson', email: 'robert@company.com', department: 'Finance', designation: 'Financial Analyst', status: 'active', hire_date: '2022-11-01' },
]

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const columns: Column<Employee>[] = [
    { 
      key: 'employee_id', 
      header: 'ID',
      render: (item) => (
        <span className="font-mono text-sm">{item.employee_id}</span>
      )
    },
    { 
      key: 'name', 
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mint-sprout rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-forest-depths" />
          </div>
          <div>
            <p className="font-medium text-charcoal">{item.name}</p>
            <p className="text-xs text-pebble">{item.email}</p>
          </div>
        </div>
      )
    },
    { key: 'department', header: 'Department' },
    { key: 'designation', header: 'Designation' },
    { 
      key: 'status', 
      header: 'Status',
      render: (item) => (
        <Badge 
          variant={
            item.status === 'active' ? 'success' :
            item.status === 'on_leave' ? 'warning' : 'error'
          }
        >
          {item.status.replace('_', ' ')}
        </Badge>
      )
    },
    { key: 'hire_date', header: 'Hire Date' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredEmployees = mockEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Employees
            </h1>
            <p className="text-olive-slate mt-1">
              Manage your workforce and employee information
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Employees</p>
              <p className="text-2xl font-bold text-forest-depths">{mockEmployees.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Active</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {mockEmployees.filter((e) => e.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">On Leave</p>
              <p className="text-2xl font-bold text-plum-depth">
                {mockEmployees.filter((e) => e.status === 'on_leave').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Departments</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {new Set(mockEmployees.map((e) => e.department)).size}
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

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredEmployees}
          emptyMessage="No employees found"
        />
      </div>
    </MainLayout>
  )
}
