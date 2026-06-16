'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Edit2, Trash2, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Department {
  id: string
  name: string
  code: string
  description?: string
  is_active: boolean
  created_at: string
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name')

    if (data) {
      setDepartments(data)
    }
    setLoading(false)
  }

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept)
      setFormData({ name: dept.name, code: dept.code, description: dept.description || '' })
    } else {
      setEditingDept(null)
      setFormData({ name: '', code: '', description: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDept(null)
    setFormData({ name: '', code: '', description: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    if (editingDept) {
      // Update
      const { error } = await supabase
        .from('departments')
        .update({ name: formData.name, code: formData.code, description: formData.description })
        .eq('id', editingDept.id)

      if (!error) {
        await fetchDepartments()
        handleCloseModal()
      }
    } else {
      // Create
      const { error } = await supabase
        .from('departments')
        .insert({ name: formData.name, code: formData.code, description: formData.description })

      if (!error) {
        await fetchDepartments()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchDepartments()
    }
  }

  const columns: Column<Department>[] = [
    { 
      key: 'name', 
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mint-sprout rounded-[9px] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-forest-depths" />
          </div>
          <span className="font-medium text-charcoal">{item.name}</span>
        </div>
      )
    },
    { 
      key: 'code', 
      header: 'Code',
      render: (item) => (
        <span className="font-mono text-sm text-olive-slate">{item.code}</span>
      )
    },
    { key: 'description', header: 'Description' },
    { 
      key: 'is_active', 
      header: 'Status',
      render: (item) => (
        <Badge variant={item.is_active ? 'success' : 'default'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
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

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Departments
            </h1>
            <p className="text-olive-slate mt-1">
              Manage your organizational structure
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coda-input pl-10"
                />
              </div>
              <Button variant="secondary">Filter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredDepartments}
          loading={loading}
          emptyMessage="No departments found"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Departments</p>
              <p className="text-2xl font-bold text-forest-depths">{departments.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Active Departments</p>
              <p className="text-2xl font-bold text-plum-depth">
                {departments.filter((d) => d.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Employees</p>
              <p className="text-2xl font-bold text-cobalt-ink">0</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDept ? 'Edit Department' : 'Add Department'}
      >
        <div className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Engineering"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Department Code"
            placeholder="e.g. ENG"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          />
          <Textarea
            label="Description"
            placeholder="Optional description..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.code}>
              {saving ? 'Saving...' : editingDept ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
