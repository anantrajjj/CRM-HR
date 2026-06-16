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
import { Plus, Search, Edit2, Trash2, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Designation {
  id: string
  name: string
  code: string
  description?: string
  department_id: string
  grade_id?: string
  is_active: boolean
  created_at: string
  departments?: { name: string }
}

interface Department {
  id: string
  name: string
}

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department_id: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDesignations()
    fetchDepartments()
  }, [])

  const fetchDesignations = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('designations')
      .select('*, departments(name)')
      .order('name')

    if (data) {
      setDesignations(data)
    }
    setLoading(false)
  }

  const fetchDepartments = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('departments').select('id, name').order('name')
    if (data) {
      setDepartments(data)
    }
  }

  const handleOpenModal = (desig?: Designation) => {
    if (desig) {
      setEditingDesig(desig)
      setFormData({
        name: desig.name,
        code: desig.code,
        description: desig.description || '',
        department_id: desig.department_id,
      })
    } else {
      setEditingDesig(null)
      setFormData({ name: '', code: '', description: '', department_id: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDesig(null)
    setFormData({ name: '', code: '', description: '', department_id: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    if (editingDesig) {
      const { error } = await supabase
        .from('designations')
        .update({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          department_id: formData.department_id,
        })
        .eq('id', editingDesig.id)

      if (!error) {
        await fetchDesignations()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase.from('designations').insert({
        name: formData.name,
        code: formData.code,
        description: formData.description,
        department_id: formData.department_id,
      })

      if (!error) {
        await fetchDesignations()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this designation?')) return

    const supabase = createClient()
    const { error } = await supabase.from('designations').delete().eq('id', id)

    if (!error) {
      await fetchDesignations()
    }
  }

  const columns: Column<Designation>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-wash rounded-[9px] flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-cobalt-ink" />
          </div>
          <span className="font-medium text-charcoal">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (item) => (
        <span className="font-mono text-sm text-olive-slate">{item.code}</span>
      ),
    },
    { key: 'description', header: 'Description' },
    {
      key: 'department_id',
      header: 'Department',
      render: (item) => (
        <span className="text-olive-slate">{item.departments?.name || '—'}</span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.is_active ? 'success' : 'default'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
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

  const filteredDesignations = designations.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const departmentNamesUsed = new Set(
    designations.filter((d) => d.department_id).map((d) => d.department_id)
  ).size

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Designations
            </h1>
            <p className="text-olive-slate mt-1">
              Manage job designations and titles
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Designation
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
                  placeholder="Search designations..."
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
          data={filteredDesignations}
          loading={loading}
          emptyMessage="No designations found"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Designations</p>
              <p className="text-2xl font-bold text-cobalt-ink">{designations.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Active Designations</p>
              <p className="text-2xl font-bold text-plum-depth">
                {designations.filter((d) => d.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Departments Used</p>
              <p className="text-2xl font-bold text-forest-depths">{departmentNamesUsed}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDesig ? 'Edit Designation' : 'Add Designation'}
      >
        <div className="space-y-4">
          <Input
            label="Designation Name"
            placeholder="e.g. Senior Engineer"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Designation Code"
            placeholder="e.g. SEN_ENG"
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
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Department</label>
            <select
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              className="coda-input w-full"
            >
              <option value="">Select department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.code || !formData.department_id}
            >
              {saving ? 'Saving...' : editingDesig ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
