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
import { Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LeaveType {
  id: string
  name: string
  code: string
  days_per_year: number
  is_paid: boolean
  is_active: boolean
  created_at: string
}

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLeave, setEditingLeave] = useState<LeaveType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    days_per_year: 0,
    is_paid: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  const fetchLeaveTypes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .order('name')

    if (data) {
      setLeaveTypes(data)
    }
    setLoading(false)
  }

  const handleOpenModal = (leave?: LeaveType) => {
    if (leave) {
      setEditingLeave(leave)
      setFormData({
        name: leave.name,
        code: leave.code,
        days_per_year: leave.days_per_year,
        is_paid: leave.is_paid,
      })
    } else {
      setEditingLeave(null)
      setFormData({ name: '', code: '', days_per_year: 0, is_paid: false })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingLeave(null)
    setFormData({ name: '', code: '', days_per_year: 0, is_paid: false })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    if (editingLeave) {
      const { error } = await supabase
        .from('leave_types')
        .update({
          name: formData.name,
          code: formData.code,
          days_per_year: formData.days_per_year,
          is_paid: formData.is_paid,
        })
        .eq('id', editingLeave.id)

      if (!error) {
        await fetchLeaveTypes()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase.from('leave_types').insert({
        name: formData.name,
        code: formData.code,
        days_per_year: formData.days_per_year,
        is_paid: formData.is_paid,
      })

      if (!error) {
        await fetchLeaveTypes()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave type?')) return

    const supabase = createClient()
    const { error } = await supabase.from('leave_types').delete().eq('id', id)

    if (!error) {
      await fetchLeaveTypes()
    }
  }

  const columns: Column<LeaveType>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-lilac-wash rounded-[9px] flex items-center justify-center">
            <Calendar className="w-4 h-4 text-plum-depth" />
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
    {
      key: 'days_per_year',
      header: 'Days/Year',
      render: (item) => (
        <span className="text-charcoal font-medium">{item.days_per_year}</span>
      ),
    },
    {
      key: 'is_paid',
      header: 'Paid',
      render: (item) => (
        <Badge variant={item.is_paid ? 'success' : 'default'}>
          {item.is_paid ? 'Paid' : 'Unpaid'}
        </Badge>
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

  const filteredLeaveTypes = leaveTypes.filter(
    (lt) =>
      lt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lt.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalDays = leaveTypes.reduce((sum, lt) => sum + lt.days_per_year, 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Leave Types
            </h1>
            <p className="text-olive-slate mt-1">
              Configure leave policies and allocations
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Leave Type
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
                  placeholder="Search leave types..."
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
          data={filteredLeaveTypes}
          loading={loading}
          emptyMessage="No leave types found"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Total Leave Types</p>
              <p className="text-2xl font-bold text-plum-depth">{leaveTypes.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Active</p>
              <p className="text-2xl font-bold text-forest-depths">
                {leaveTypes.filter((lt) => lt.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Paid Types</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {leaveTypes.filter((lt) => lt.is_paid).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Total Days/Year</p>
              <p className="text-2xl font-bold text-wine-shadow">{totalDays}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingLeave ? 'Edit Leave Type' : 'Add Leave Type'}
      >
        <div className="space-y-4">
          <Input
            label="Leave Type Name"
            placeholder="e.g. Annual Leave"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Leave Type Code"
            placeholder="e.g. AL"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          />
          <Input
            label="Days Per Year"
            type="number"
            min={0}
            placeholder="e.g. 12"
            value={formData.days_per_year}
            onChange={(e) =>
              setFormData({ ...formData, days_per_year: parseInt(e.target.value) || 0 })
            }
          />
          <div className="flex items-center gap-3">
            <label className="block text-sm font-medium text-charcoal">Paid Leave</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_paid: !formData.is_paid })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_paid ? 'bg-forest-depths' : 'bg-pebble'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_paid ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-olive-slate">
              {formData.is_paid ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.code}>
              {saving ? 'Saving...' : editingLeave ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
