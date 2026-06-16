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
import { Plus, Search, Edit2, Trash2, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions: Record<string, unknown> | null
  is_active: boolean
  created_at: string
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name')

    if (data) {
      setRoles(data)
    }
    setLoading(false)
  }

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        code: role.code,
        description: role.description || '',
        permissions: role.permissions ? JSON.stringify(role.permissions, null, 2) : '',
      })
    } else {
      setEditingRole(null)
      setFormData({ name: '', code: '', description: '', permissions: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRole(null)
    setFormData({ name: '', code: '', description: '', permissions: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    let parsedPermissions: Record<string, unknown> | null = null
    if (formData.permissions.trim()) {
      try {
        parsedPermissions = JSON.parse(formData.permissions)
      } catch {
        alert('Invalid JSON in permissions field')
        setSaving(false)
        return
      }
    }

    if (editingRole) {
      const { error } = await supabase
        .from('roles')
        .update({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          permissions: parsedPermissions,
        })
        .eq('id', editingRole.id)

      if (!error) {
        await fetchRoles()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase.from('roles').insert({
        name: formData.name,
        code: formData.code,
        description: formData.description,
        permissions: parsedPermissions,
      })

      if (!error) {
        await fetchRoles()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    const supabase = createClient()
    const { error } = await supabase.from('roles').delete().eq('id', id)

    if (!error) {
      await fetchRoles()
    }
  }

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-rose rounded-[9px] flex items-center justify-center">
            <Shield className="w-4 h-4 text-wine-shadow" />
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
      key: 'permissions',
      header: 'Permissions',
      render: (item) => (
        <span className="text-olive-slate text-sm">
          {item.permissions ? 'Configured' : 'None'}
        </span>
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

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Roles
            </h1>
            <p className="text-olive-slate mt-1">
              Manage user roles and permissions
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Role
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
                  placeholder="Search roles..."
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
          data={filteredRoles}
          loading={loading}
          emptyMessage="No roles found"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Total Roles</p>
              <p className="text-2xl font-bold text-wine-shadow">{roles.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Active Roles</p>
              <p className="text-2xl font-bold text-plum-depth">
                {roles.filter((r) => r.is_active).length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRole ? 'Edit Role' : 'Add Role'}
      >
        <div className="space-y-4">
          <Input
            label="Role Name"
            placeholder="e.g. Admin"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Role Code"
            placeholder="e.g. ADMIN"
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
          <Textarea
            label="Permissions (JSON)"
            placeholder='{"users": "read", "reports": "write"}'
            rows={6}
            value={formData.permissions}
            onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.code}>
              {saving ? 'Saving...' : editingRole ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
