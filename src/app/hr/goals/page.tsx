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
import { Plus, Search, Edit2, Trash2, Target, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
}

interface Goal {
  id: string
  employee_id: string
  title: string
  description: string
  category: 'performance' | 'development' | 'personal'
  start_date: string
  due_date: string
  progress: number
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  employees?: Employee
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    employee_id: '',
    title: '',
    description: '',
    category: 'performance' as Goal['category'],
    start_date: '',
    due_date: '',
    progress: '0',
    status: 'not_started' as Goal['status'],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGoals()
    fetchEmployees()
  }, [])

  const fetchGoals = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('goals')
      .select('*, employees(id, employee_id, first_name, last_name)')
      .order('due_date', { ascending: true })

    if (data) {
      setGoals(data)
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

  const handleOpenModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal)
      setFormData({
        employee_id: goal.employee_id,
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        start_date: goal.start_date || '',
        due_date: goal.due_date || '',
        progress: goal.progress?.toString() || '0',
        status: goal.status,
      })
    } else {
      setEditingGoal(null)
      setFormData({
        employee_id: '',
        title: '',
        description: '',
        category: 'performance',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        progress: '0',
        status: 'not_started',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingGoal(null)
    setFormData({
      employee_id: '',
      title: '',
      description: '',
      category: 'performance',
      start_date: '',
      due_date: '',
      progress: '0',
      status: 'not_started',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      employee_id: formData.employee_id,
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      start_date: formData.start_date || null,
      due_date: formData.due_date || null,
      progress: parseInt(formData.progress),
      status: formData.status,
    }

    if (editingGoal) {
      const { error } = await supabase
        .from('goals')
        .update(record)
        .eq('id', editingGoal.id)

      if (!error) {
        await fetchGoals()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('goals')
        .insert(record)

      if (!error) {
        await fetchGoals()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchGoals()
    }
  }

  const getStatusBadge = (status: Goal['status']) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      not_started: 'default',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error',
    }
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>
  }

  const getCategoryBadge = (category: Goal['category']) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      performance: 'info',
      development: 'success',
      personal: 'default',
    }
    return <Badge variant={variants[category]}>{category}</Badge>
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-forest-depths'
    if (progress >= 50) return 'bg-cobalt-ink'
    if (progress >= 25) return 'bg-olive-slate'
    return 'bg-pebble'
  }

  const columns: Column<Goal>[] = [
    {
      key: 'employee_id',
      header: 'Employee',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-peach rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-wine-shadow">
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
      key: 'title',
      header: 'Goal',
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-cobalt-ink" />
            <span className="font-medium text-charcoal">{item.title}</span>
          </div>
          {item.description && (
            <p className="text-xs text-pebble mt-0.5 truncate max-w-[200px]">{item.description}</p>
          )}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => getCategoryBadge(item.category)
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-bone rounded-full overflow-hidden max-w-[80px]">
            <div
              className={`h-full rounded-full ${getProgressColor(item.progress)}`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-charcoal">{item.progress}%</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status)
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (item) => {
        if (!item.due_date) return <span className="text-pebble">-</span>
        const isOverdue = new Date(item.due_date) < new Date() && item.status !== 'completed'
        return (
          <span className={`text-sm ${isOverdue ? 'text-wine-shadow font-medium' : 'text-charcoal'}`}>
            {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )
      }
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

  const filteredGoals = goals.filter(
    (goal) => {
      const matchesSearch = searchTerm === '' ||
        `${goal.employees?.first_name} ${goal.employees?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.employees?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === '' || goal.status === statusFilter
      const matchesCategory = categoryFilter === '' || goal.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    }
  )

  const today = new Date().toISOString().split('T')[0]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Goals
            </h1>
            <p className="text-olive-slate mt-1">
              Track employee performance and development goals
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Goals</p>
              <p className="text-2xl font-bold text-cobalt-ink">{goals.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-olive-slate">In Progress</p>
              <p className="text-2xl font-bold text-olive-slate">
                {goals.filter((g) => g.status === 'in_progress').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Completed</p>
              <p className="text-2xl font-bold text-forest-depths">
                {goals.filter((g) => g.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Overdue</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {goals.filter((g) => g.due_date && new Date(g.due_date) < new Date() && g.status !== 'completed').length}
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
                  placeholder="Search by employee name, ID, or goal title..."
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
                  { value: 'not_started', label: 'Not Started' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                placeholder="Filter by status"
              />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Categories' },
                  { value: 'performance', label: 'Performance' },
                  { value: 'development', label: 'Development' },
                  { value: 'personal', label: 'Personal' },
                ]}
                placeholder="Filter by category"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredGoals}
          loading={loading}
          emptyMessage="No goals found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGoal ? 'Edit Goal' : 'Add Goal'}
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
            label="Goal Title"
            placeholder="e.g. Improve sales performance"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-charcoal">Description</label>
            <textarea
              placeholder="Goal description and details..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 text-base bg-pure-white border border-sage-mist rounded-[9px] placeholder:text-pebble focus:outline-none focus:border-obsidian transition-colors"
            />
          </div>
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as Goal['category'] })}
            options={[
              { value: 'performance', label: 'Performance' },
              { value: 'development', label: 'Development' },
              { value: 'personal', label: 'Personal' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-charcoal">
              Progress: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
              className="w-full h-2 bg-bone rounded-full appearance-none cursor-pointer accent-forest-depths"
            />
            <div className="flex justify-between text-xs text-pebble">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Goal['status'] })}
            options={[
              { value: 'not_started', label: 'Not Started' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.employee_id || !formData.title}>
              {saving ? 'Saving...' : editingGoal ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
