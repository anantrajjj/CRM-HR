'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'social' | 'ads' | 'event' | 'other'
  status: 'planned' | 'in_progress' | 'completed' | 'aborted'
  start_date: string
  end_date: string
  budget: number
  actual_cost: number
  expected_revenue: number
  actual_revenue: number
  description: string
  created_at: string
  updated_at: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as Campaign['type'],
    status: 'planned' as Campaign['status'],
    start_date: '',
    end_date: '',
    budget: '',
    actual_cost: '',
    expected_revenue: '',
    actual_revenue: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setCampaigns(data)
    }
    setLoading(false)
  }

  const handleOpenModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign)
      setFormData({
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        budget: campaign.budget?.toString() || '',
        actual_cost: campaign.actual_cost?.toString() || '',
        expected_revenue: campaign.expected_revenue?.toString() || '',
        actual_revenue: campaign.actual_revenue?.toString() || '',
        description: campaign.description || '',
      })
    } else {
      setEditingCampaign(null)
      setFormData({
        name: '',
        type: 'email',
        status: 'planned',
        start_date: '',
        end_date: '',
        budget: '',
        actual_cost: '',
        expected_revenue: '',
        actual_revenue: '',
        description: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCampaign(null)
    setFormData({
      name: '',
      type: 'email',
      status: 'planned',
      start_date: '',
      end_date: '',
      budget: '',
      actual_cost: '',
      expected_revenue: '',
      actual_revenue: '',
      description: '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      name: formData.name,
      type: formData.type,
      status: formData.status,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : null,
      expected_revenue: formData.expected_revenue ? parseFloat(formData.expected_revenue) : null,
      actual_revenue: formData.actual_revenue ? parseFloat(formData.actual_revenue) : null,
      description: formData.description || null,
    }

    if (editingCampaign) {
      const { error } = await supabase
        .from('campaigns')
        .update(record)
        .eq('id', editingCampaign.id)

      if (!error) {
        await fetchCampaigns()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('campaigns')
        .insert(record)

      if (!error) {
        await fetchCampaigns()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchCampaigns()
    }
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const map: Record<Campaign['status'], { variant: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
      planned: { variant: 'info', label: 'Planned' },
      in_progress: { variant: 'warning', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      aborted: { variant: 'error', label: 'Aborted' },
    }
    const { variant, label } = map[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  const getTypeBadge = (type: Campaign['type']) => {
    const map: Record<Campaign['type'], { variant: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
      email: { variant: 'info', label: 'Email' },
      social: { variant: 'success', label: 'Social' },
      ads: { variant: 'warning', label: 'Ads' },
      event: { variant: 'default', label: 'Event' },
      other: { variant: 'default', label: 'Other' },
    }
    const { variant, label } = map[type]
    return <Badge variant={variant}>{label}</Badge>
  }

  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign',
      render: (item) => (
        <div>
          <p className="font-medium text-charcoal">{item.name}</p>
          {item.description && <p className="text-xs text-pebble truncate max-w-[200px]">{item.description}</p>}
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => getTypeBadge(item.type)
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status)
    },
    {
      key: 'start_date',
      header: 'Start Date',
      render: (item) => item.start_date ? (
        <span className="text-sm text-charcoal">{new Date(item.start_date).toLocaleDateString()}</span>
      ) : <span className="text-pebble">-</span>
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (item) => item.budget ? (
        <span className="text-sm text-charcoal">${item.budget.toLocaleString()}</span>
      ) : <span className="text-pebble">-</span>
    },
    {
      key: 'actual_cost',
      header: 'Actual Cost',
      render: (item) => item.actual_cost ? (
        <span className="text-sm text-charcoal">${item.actual_cost.toLocaleString()}</span>
      ) : <span className="text-pebble">-</span>
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

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Campaigns
            </h1>
            <p className="text-olive-slate mt-1">
              Track and manage your marketing campaigns
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Campaign
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
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coda-input pl-10"
                />
              </div>
              <Button variant="secondary">Filter</Button>
              <Button variant="secondary">Export</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Campaigns</p>
              <p className="text-2xl font-bold text-forest-depths">{campaigns.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">In Progress</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {campaigns.filter((c) => c.status === 'in_progress').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Completed</p>
              <p className="text-2xl font-bold text-plum-depth">
                {campaigns.filter((c) => c.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Total Budget</p>
              <p className="text-2xl font-bold text-wine-shadow">
                ${totalBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredCampaigns}
          loading={loading}
          emptyMessage="No campaigns found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCampaign ? 'Edit Campaign' : 'Add Campaign'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Campaign Name"
            placeholder="Summer Sale 2024"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Campaign['type'] })}
              options={[
                { value: 'email', label: 'Email' },
                { value: 'social', label: 'Social' },
                { value: 'ads', label: 'Ads' },
                { value: 'event', label: 'Event' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Campaign['status'] })}
              options={[
                { value: 'planned', label: 'Planned' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'aborted', label: 'Aborted' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Budget"
              type="number"
              placeholder="10000"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
            <Input
              label="Actual Cost"
              type="number"
              placeholder="8500"
              value={formData.actual_cost}
              onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expected Revenue"
              type="number"
              placeholder="50000"
              value={formData.expected_revenue}
              onChange={(e) => setFormData({ ...formData, expected_revenue: e.target.value })}
            />
            <Input
              label="Actual Revenue"
              type="number"
              placeholder="45000"
              value={formData.actual_revenue}
              onChange={(e) => setFormData({ ...formData, actual_revenue: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Campaign description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? 'Saving...' : editingCampaign ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
