'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Edit2, Trash2, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MethodologyFramework {
  id: string
  name: string
  short_name: string
  description: string
  is_system: boolean
  is_active: boolean
  created_at: string
}

interface MethodologySlot {
  id: string
  framework_id: string
  code: string
  label: string
  description: string
  is_required: boolean
  slot_order: number
}

export default function MethodologyPage() {
  const [frameworks, setFrameworks] = useState<MethodologyFramework[]>([])
  const [slots, setSlots] = useState<MethodologySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFramework, setExpandedFramework] = useState<string | null>(null)

  const [isFrameworkModalOpen, setIsFrameworkModalOpen] = useState(false)
  const [editingFramework, setEditingFramework] = useState<MethodologyFramework | null>(null)
  const [frameworkForm, setFrameworkForm] = useState({
    name: '',
    short_name: '',
    description: '',
    is_active: true,
  })

  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<MethodologySlot | null>(null)
  const [slotForm, setSlotForm] = useState({
    code: '',
    label: '',
    description: '',
    is_required: true,
    slot_order: '1',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchFrameworks()
    fetchSlots()
  }, [])

  const fetchFrameworks = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('methodology_frameworks')
      .select('*')
      .order('name')

    if (data) {
      setFrameworks(data)
    }
    setLoading(false)
  }

  const fetchSlots = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('methodology_slots')
      .select('*')
      .order('slot_order')

    if (data) {
      setSlots(data)
    }
  }

  const getSlotCount = (frameworkId: string) => {
    return slots.filter((s) => s.framework_id === frameworkId).length
  }

  const getFrameworkSlots = (frameworkId: string) => {
    return slots
      .filter((s) => s.framework_id === frameworkId)
      .sort((a, b) => a.slot_order - b.slot_order)
  }

  const toggleExpand = (frameworkId: string) => {
    setExpandedFramework(expandedFramework === frameworkId ? null : frameworkId)
  }

  const handleOpenFrameworkModal = (framework?: MethodologyFramework) => {
    if (framework) {
      setEditingFramework(framework)
      setFrameworkForm({
        name: framework.name,
        short_name: framework.short_name,
        description: framework.description || '',
        is_active: framework.is_active,
      })
    } else {
      setEditingFramework(null)
      setFrameworkForm({ name: '', short_name: '', description: '', is_active: true })
    }
    setIsFrameworkModalOpen(true)
  }

  const handleCloseFrameworkModal = () => {
    setIsFrameworkModalOpen(false)
    setEditingFramework(null)
    setFrameworkForm({ name: '', short_name: '', description: '', is_active: true })
  }

  const handleSaveFramework = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      name: frameworkForm.name,
      short_name: frameworkForm.short_name,
      description: frameworkForm.description || null,
      is_active: frameworkForm.is_active,
    }

    if (editingFramework) {
      const { error } = await supabase
        .from('methodology_frameworks')
        .update(record)
        .eq('id', editingFramework.id)

      if (!error) {
        await fetchFrameworks()
        handleCloseFrameworkModal()
      }
    } else {
      const { error } = await supabase
        .from('methodology_frameworks')
        .insert({ ...record, is_system: false })

      if (!error) {
        await fetchFrameworks()
        handleCloseFrameworkModal()
      }
    }
    setSaving(false)
  }

  const handleDeleteFramework = async (id: string) => {
    if (!confirm('Are you sure you want to delete this framework and all its slots?')) return

    const supabase = createClient()
    const { error: slotError } = await supabase
      .from('methodology_slots')
      .delete()
      .eq('framework_id', id)

    if (!slotError) {
      const { error } = await supabase
        .from('methodology_frameworks')
        .delete()
        .eq('id', id)

      if (!error) {
        await fetchFrameworks()
        await fetchSlots()
        if (expandedFramework === id) setExpandedFramework(null)
      }
    }
  }

  const handleOpenSlotModal = (frameworkId: string, slot?: MethodologySlot) => {
    if (slot) {
      setEditingSlot(slot)
      setSlotForm({
        code: slot.code,
        label: slot.label,
        description: slot.description || '',
        is_required: slot.is_required,
        slot_order: slot.slot_order.toString(),
      })
    } else {
      setEditingSlot(null)
      const existingSlots = getFrameworkSlots(frameworkId)
      setSlotForm({
        code: '',
        label: '',
        description: '',
        is_required: true,
        slot_order: (existingSlots.length + 1).toString(),
      })
    }
    setIsSlotModalOpen(true)
  }

  const handleCloseSlotModal = () => {
    setIsSlotModalOpen(false)
    setEditingSlot(null)
    setSlotForm({ code: '', label: '', description: '', is_required: true, slot_order: '1' })
  }

  const handleSaveSlot = async () => {
    if (!expandedFramework) return
    setSaving(true)
    const supabase = createClient()

    const record = {
      framework_id: expandedFramework,
      code: slotForm.code,
      label: slotForm.label,
      description: slotForm.description || null,
      is_required: slotForm.is_required,
      slot_order: parseInt(slotForm.slot_order) || 1,
    }

    if (editingSlot) {
      const { error } = await supabase
        .from('methodology_slots')
        .update(record)
        .eq('id', editingSlot.id)

      if (!error) {
        await fetchSlots()
        handleCloseSlotModal()
      }
    } else {
      const { error } = await supabase
        .from('methodology_slots')
        .insert(record)

      if (!error) {
        await fetchSlots()
        handleCloseSlotModal()
      }
    }
    setSaving(false)
  }

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('methodology_slots')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchSlots()
    }
  }

  const totalFrameworks = frameworks.length
  const systemFrameworks = frameworks.filter((f) => f.is_system).length
  const activeFrameworks = frameworks.filter((f) => f.is_active).length
  const totalSlots = slots.length

  const filteredFrameworks = frameworks.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const frameworkColumns: Column<MethodologyFramework>[] = [
    {
      key: 'name',
      header: 'Framework',
      render: (item) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleExpand(item.id)}
            className="p-1 hover:bg-bone rounded transition-colors"
          >
            {expandedFramework === item.id ? (
              <ChevronDown className="w-4 h-4 text-olive-slate" />
            ) : (
              <ChevronRight className="w-4 h-4 text-olive-slate" />
            )}
          </button>
          <div>
            <p className="font-medium text-charcoal">{item.name}</p>
            <p className="text-xs text-pebble">{item.short_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => (
        <span className="text-sm text-olive-slate max-w-[300px] truncate block">
          {item.description || '—'}
        </span>
      ),
    },
    {
      key: 'is_system',
      header: 'Type',
      render: (item) => (
        <Badge variant={item.is_system ? 'info' : 'default'}>
          {item.is_system ? 'System' : 'Custom'}
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
      key: 'id',
      header: 'Slots',
      render: (item) => (
        <Badge variant="default">{getSlotCount(item.id)}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenFrameworkModal(item)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          {!item.is_system && (
            <Button variant="ghost" size="sm" onClick={() => handleDeleteFramework(item.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Sales Methodology
            </h1>
            <p className="text-olive-slate mt-1">
              Manage qualification frameworks and their evaluation slots
            </p>
          </div>
          <Button onClick={() => handleOpenFrameworkModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Framework
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Frameworks</p>
              <p className="text-2xl font-bold text-forest-depths">{totalFrameworks}</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">System Frameworks</p>
              <p className="text-2xl font-bold text-cobalt-ink">{systemFrameworks}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Total Slots</p>
              <p className="text-2xl font-bold text-plum-depth">{totalSlots}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Active Frameworks</p>
              <p className="text-2xl font-bold text-wine-shadow">{activeFrameworks}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
              <input
                type="text"
                placeholder="Search frameworks by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="coda-input pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Frameworks Table */}
        <DataTable
          columns={frameworkColumns}
          data={filteredFrameworks}
          loading={loading}
          emptyMessage="No methodology frameworks found"
        />

        {/* Expanded Slots Panel */}
        {expandedFramework && (() => {
          const fw = frameworks.find(f => f.id === expandedFramework)
          if (!fw) return null
          const frameworkSlots = getFrameworkSlots(expandedFramework)
          return (
            <div className="bg-bone/50 rounded-[13px] p-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cobalt-ink" />
                  <h4 className="font-medium text-charcoal">Slots for {fw.name}</h4>
                  <Badge variant="default">{frameworkSlots.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleOpenSlotModal(expandedFramework)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Slot
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setExpandedFramework(null)}>
                    Close
                  </Button>
                </div>
              </div>
              {frameworkSlots.length === 0 ? (
                <p className="text-sm text-pebble py-4 text-center">No slots defined.</p>
              ) : (
                <div className="space-y-2">
                  {frameworkSlots.map((slot) => (
                    <div key={slot.id} className="bg-pure-white border border-sage-mist rounded-[10px] p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-mint-sprout rounded-full flex items-center justify-center text-xs font-bold text-forest-depths">{slot.slot_order}</span>
                        <div>
                          <p className="font-medium text-charcoal text-sm">{slot.label}</p>
                          <p className="text-xs text-pebble">{slot.code}{slot.description && ` — ${slot.description}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.is_required && <Badge variant="info">Required</Badge>}
                        <Button variant="ghost" size="sm" onClick={() => handleOpenSlotModal(expandedFramework, slot)}><Edit2 className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSlot(slot.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Add/Edit Framework Modal */}
      <Modal
        isOpen={isFrameworkModalOpen}
        onClose={handleCloseFrameworkModal}
        title={editingFramework ? 'Edit Framework' : 'Add Framework'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Framework Name"
            placeholder="MEDDIC"
            value={frameworkForm.name}
            onChange={(e) => setFrameworkForm({ ...frameworkForm, name: e.target.value })}
          />
          <Input
            label="Short Name"
            placeholder="MEDDIC"
            value={frameworkForm.short_name}
            onChange={(e) => setFrameworkForm({ ...frameworkForm, short_name: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion"
            value={frameworkForm.description}
            onChange={(e) => setFrameworkForm({ ...frameworkForm, description: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={frameworkForm.is_active}
              onChange={(e) => setFrameworkForm({ ...frameworkForm, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-sage-mist text-forest-depths focus:ring-forest-depths"
            />
            <label htmlFor="is_active" className="text-sm text-charcoal">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseFrameworkModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveFramework} disabled={saving || !frameworkForm.name || !frameworkForm.short_name}>
              {saving ? 'Saving...' : editingFramework ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Slot Modal */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={handleCloseSlotModal}
        title={editingSlot ? 'Edit Slot' : 'Add Slot'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Slot Code"
              placeholder="metrics"
              value={slotForm.code}
              onChange={(e) => setSlotForm({ ...slotForm, code: e.target.value })}
            />
            <Input
              label="Slot Order"
              type="number"
              placeholder="1"
              value={slotForm.slot_order}
              onChange={(e) => setSlotForm({ ...slotForm, slot_order: e.target.value })}
            />
          </div>
          <Input
            label="Label"
            placeholder="Metrics"
            value={slotForm.label}
            onChange={(e) => setSlotForm({ ...slotForm, label: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Quantifiable measures of success"
            value={slotForm.description}
            onChange={(e) => setSlotForm({ ...slotForm, description: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_required_slot"
              checked={slotForm.is_required}
              onChange={(e) => setSlotForm({ ...slotForm, is_required: e.target.checked })}
              className="w-4 h-4 rounded border-sage-mist text-forest-depths focus:ring-forest-depths"
            />
            <label htmlFor="is_required_slot" className="text-sm text-charcoal">Required for qualification</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseSlotModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveSlot} disabled={saving || !slotForm.code || !slotForm.label}>
              {saving ? 'Saving...' : editingSlot ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
