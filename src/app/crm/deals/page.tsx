'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Edit2, Trash2, DollarSign, GripVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Deal {
  id: string
  title: string
  amount: number
  stage_id: string
  pipeline_id: string
  contact_id?: string
  organization_id?: string
  close_date?: string
  status: 'open' | 'won' | 'lost'
  created_at: string
  deal_stages?: { name: string; code: string }
  contacts?: { first_name: string; last_name: string }
  organizations?: { name: string }
}

interface DealStage {
  id: string
  name: string
  code: string
  pipeline_id: string
  stage_order: number
}

interface Contact {
  id: string
  first_name: string
  last_name: string
}

interface Organization {
  id: string
  name: string
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [stages, setStages] = useState<DealStage[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    stage_id: '',
    contact_id: '',
    organization_id: '',
    close_date: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDeals()
    fetchStages()
    fetchContacts()
    fetchOrganizations()
  }, [])

  const fetchDeals = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('deals')
      .select('*, deal_stages(name, code), contacts(first_name, last_name), organizations(name)')
      .order('created_at', { ascending: false })

    if (data) {
      setDeals(data)
    }
    setLoading(false)
  }

  const fetchStages = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('deal_stages')
      .select('*')
      .order('stage_order')

    if (data) {
      setStages(data)
    }
  }

  const fetchContacts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .order('last_name')

    if (data) {
      setContacts(data)
    }
  }

  const fetchOrganizations = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name')

    if (data) {
      setOrganizations(data)
    }
  }

  const handleOpenModal = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal)
      setFormData({
        title: deal.title,
        amount: deal.amount?.toString() || '',
        stage_id: deal.stage_id,
        contact_id: deal.contact_id || '',
        organization_id: deal.organization_id || '',
        close_date: deal.close_date || '',
      })
    } else {
      setEditingDeal(null)
      setFormData({
        title: '',
        amount: '',
        stage_id: stages[0]?.id || '',
        contact_id: '',
        organization_id: '',
        close_date: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDeal(null)
    setFormData({ title: '', amount: '', stage_id: '', contact_id: '', organization_id: '', close_date: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      title: formData.title,
      amount: formData.amount ? parseFloat(formData.amount) : 0,
      stage_id: formData.stage_id || null,
      contact_id: formData.contact_id || null,
      organization_id: formData.organization_id || null,
      close_date: formData.close_date || null,
    }

    if (editingDeal) {
      const { error } = await supabase
        .from('deals')
        .update(record)
        .eq('id', editingDeal.id)

      if (!error) {
        await fetchDeals()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('deals')
        .insert({ ...record, pipeline_id: stages[0]?.pipeline_id })

      if (!error) {
        await fetchDeals()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchDeals()
    }
  }

  const getDealsByStage = (stageId: string) => {
    return deals.filter((deal) => deal.stage_id === stageId)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalPipelineValue = deals
    .filter((d) => d.status === 'open')
    .reduce((sum, deal) => sum + (deal.amount || 0), 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Deals Pipeline
            </h1>
            <p className="text-olive-slate mt-1">
              Track and manage your sales opportunities
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Deals</p>
              <p className="text-2xl font-bold text-forest-depths">{deals.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Pipeline Value</p>
              <p className="text-2xl font-bold text-plum-depth">{formatCurrency(totalPipelineValue)}</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Open Deals</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {deals.filter((d) => d.status === 'open').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Won Deals</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {deals.filter((d) => d.status === 'won').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[300px] h-[400px] bg-bone rounded-[22px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageDeals = getDealsByStage(stage.id)
              const stageValue = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
              
              return (
                <div key={stage.id} className="min-w-[300px] flex-shrink-0">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-charcoal">{stage.name}</h3>
                      <Badge variant="default">{stageDeals.length}</Badge>
                    </div>
                    <span className="text-sm text-olive-slate">{formatCurrency(stageValue)}</span>
                  </div>

                  {/* Stage Cards */}
                  <div className="space-y-3 bg-bone/50 rounded-[22px] p-3 min-h-[300px]">
                    {stageDeals.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-sm text-pebble">
                        No deals
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="bg-pure-white border border-sage-mist rounded-[13px] p-4 cursor-pointer hover:border-obsidian transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-charcoal text-sm">{deal.title}</h4>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenModal(deal)
                                }}
                                className="p-1 hover:bg-bone rounded"
                              >
                                <Edit2 className="w-3 h-3 text-pebble" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(deal.id)
                                }}
                                className="p-1 hover:bg-bone rounded"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-3 h-3 text-forest-depths" />
                            <span className="text-sm font-medium text-forest-depths">
                              {formatCurrency(deal.amount || 0)}
                            </span>
                          </div>
                          {deal.contacts && (
                            <p className="text-xs text-pebble">
                              {deal.contacts.first_name} {deal.contacts.last_name}
                            </p>
                          )}
                          {deal.organizations && (
                            <p className="text-xs text-pebble">{deal.organizations.name}</p>
                          )}
                          {deal.close_date && (
                            <p className="text-xs text-olive-slate mt-2">
                              Close: {new Date(deal.close_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDeal ? 'Edit Deal' : 'Add Deal'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Deal Title"
            placeholder="Enterprise Software License"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              placeholder="50000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <Select
              label="Stage"
              value={formData.stage_id}
              onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
              options={stages.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select stage..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Contact"
              value={formData.contact_id}
              onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
              options={contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))}
              placeholder="Select contact..."
            />
            <Select
              label="Organization"
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              options={organizations.map((o) => ({ value: o.id, label: o.name }))}
              placeholder="Select organization..."
            />
          </div>
          <Input
            label="Expected Close Date"
            type="date"
            value={formData.close_date}
            onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.title}>
              {saving ? 'Saving...' : editingDeal ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
