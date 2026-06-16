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
import { Plus, Search, Edit2, Trash2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ShiftType {
  id: string
  name: string
  code: string
  start_time: string
  end_time: string
  break_minutes: number
  is_active: boolean
  created_at: string
}

export default function ShiftTypesPage() {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    start_time: '09:00',
    end_time: '18:00',
    break_minutes: 60,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchShiftTypes()
  }, [])

  const fetchShiftTypes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('shift_types')
      .select('*')
      .order('name')

    if (data) {
      setShiftTypes(data)
    }
    setLoading(false)
  }

  const handleOpenModal = (shift?: ShiftType) => {
    if (shift) {
      setEditingShift(shift)
      setFormData({
        name: shift.name,
        code: shift.code,
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_minutes: shift.break_minutes,
      })
    } else {
      setEditingShift(null)
      setFormData({ name: '', code: '', start_time: '09:00', end_time: '18:00', break_minutes: 60 })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingShift(null)
    setFormData({ name: '', code: '', start_time: '09:00', end_time: '18:00', break_minutes: 60 })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    if (editingShift) {
      const { error } = await supabase
        .from('shift_types')
        .update({
          name: formData.name,
          code: formData.code,
          start_time: formData.start_time,
          end_time: formData.end_time,
          break_minutes: formData.break_minutes,
        })
        .eq('id', editingShift.id)

      if (!error) {
        await fetchShiftTypes()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase.from('shift_types').insert({
        name: formData.name,
        code: formData.code,
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_minutes: formData.break_minutes,
      })

      if (!error) {
        await fetchShiftTypes()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift type?')) return

    const supabase = createClient()
    const { error } = await supabase.from('shift_types').delete().eq('id', id)

    if (!error) {
      await fetchShiftTypes()
    }
  }

  const columns: Column<ShiftType>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mint-sprout rounded-[9px] flex items-center justify-center">
            <Clock className="w-4 h-4 text-forest-depths" />
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
      key: 'start_time',
      header: 'Start',
      render: (item) => (
        <span className="text-charcoal">{item.start_time}</span>
      ),
    },
    {
      key: 'end_time',
      header: 'End',
      render: (item) => (
        <span className="text-charcoal">{item.end_time}</span>
      ),
    },
    {
      key: 'break_minutes',
      header: 'Break',
      render: (item) => (
        <span className="text-olive-slate">{item.break_minutes} min</span>
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

  const filteredShiftTypes = shiftTypes.filter(
    (st) =>
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const avgBreak =
    shiftTypes.length > 0
      ? Math.round(shiftTypes.reduce((sum, st) => sum + st.break_minutes, 0) / shiftTypes.length)
      : 0

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Shift Types
            </h1>
            <p className="text-olive-slate mt-1">
              Define work shift schedules and breaks
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Shift Type
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
                  placeholder="Search shift types..."
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
          data={filteredShiftTypes}
          loading={loading}
          emptyMessage="No shift types found"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Shift Types</p>
              <p className="text-2xl font-bold text-forest-depths">{shiftTypes.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Active Shifts</p>
              <p className="text-2xl font-bold text-plum-depth">
                {shiftTypes.filter((st) => st.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Avg Break (min)</p>
              <p className="text-2xl font-bold text-cobalt-ink">{avgBreak}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingShift ? 'Edit Shift Type' : 'Add Shift Type'}
      >
        <div className="space-y-4">
          <Input
            label="Shift Name"
            placeholder="e.g. Morning Shift"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Shift Code"
            placeholder="e.g. MS"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
          <Input
            label="Break Minutes"
            type="number"
            min={0}
            placeholder="e.g. 60"
            value={formData.break_minutes}
            onChange={(e) =>
              setFormData({ ...formData, break_minutes: parseInt(e.target.value) || 0 })
            }
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.code}>
              {saving ? 'Saving...' : editingShift ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
