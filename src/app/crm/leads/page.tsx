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
import { Plus, Search, Edit2, Trash2, User, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Lead {
  id: string
  contact_id: string
  organization_id?: string
  lead_source_id?: string
  status: 'new' | 'contacted' | 'qualified' | 'unqualified'
  score: number
  owner_id?: string
  converted_at?: string
  created_at: string
  contacts?: { first_name: string; last_name: string; email?: string }
  organizations?: { name: string }
  lead_sources?: { name: string }
}

interface Contact { id: string; first_name: string; last_name: string }
interface Organization { id: string; name: string }
interface LeadSource { id: string; name: string }

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [formData, setFormData] = useState({
    contact_id: '',
    organization_id: '',
    lead_source_id: '',
    status: 'new' as Lead['status'],
    score: 50,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLeads()
    fetchLookups()
  }, [])

  const fetchLeads = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .select('*, contacts(first_name, last_name, email), organizations(name), lead_sources(name)')
      .order('created_at', { ascending: false })

    if (data) setLeads(data)
    setLoading(false)
  }

  const fetchLookups = async () => {
    const supabase = createClient()
    const [cRes, oRes, lsRes] = await Promise.all([
      supabase.from('contacts').select('id, first_name, last_name').order('last_name'),
      supabase.from('organizations').select('id, name').order('name'),
      supabase.from('lead_sources').select('id, name').order('name'),
    ])
    if (cRes.data) setContacts(cRes.data)
    if (oRes.data) setOrganizations(oRes.data)
    if (lsRes.data) setLeadSources(lsRes.data)
  }

  const handleOpenModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead)
      setFormData({
        contact_id: lead.contact_id,
        organization_id: lead.organization_id || '',
        lead_source_id: lead.lead_source_id || '',
        status: lead.status,
        score: lead.score,
      })
    } else {
      setEditingLead(null)
      setFormData({ contact_id: '', organization_id: '', lead_source_id: '', status: 'new', score: 50 })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingLead(null)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const record = {
      contact_id: formData.contact_id,
      organization_id: formData.organization_id || null,
      lead_source_id: formData.lead_source_id || null,
      status: formData.status,
      score: formData.score,
    }

    if (editingLead) {
      const { error } = await supabase.from('leads').update(record).eq('id', editingLead.id)
      if (!error) { await fetchLeads(); handleCloseModal() }
    } else {
      const { error } = await supabase.from('leads').insert(record)
      if (!error) { await fetchLeads(); handleCloseModal() }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    const supabase = createClient()
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (!error) await fetchLeads()
  }

  const getContactName = (lead: Lead) =>
    lead.contacts ? `${lead.contacts.first_name} ${lead.contacts.last_name}` : 'Unknown'

  const columns: Column<Lead>[] = [
    {
      key: 'contact_id',
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-wash rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-cobalt-ink" />
          </div>
          <div>
            <p className="font-medium text-charcoal">{getContactName(item)}</p>
            {item.contacts?.email && <p className="text-xs text-pebble">{item.contacts.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'organizations',
      header: 'Organization',
      render: (item) => item.organizations?.name || <span className="text-pebble">-</span>,
    },
    {
      key: 'lead_sources',
      header: 'Source',
      render: (item) => item.lead_sources?.name || <span className="text-pebble">-</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={
            item.status === 'qualified' ? 'success' :
            item.status === 'contacted' ? 'info' :
            item.status === 'new' ? 'warning' : 'default'
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-bone rounded-full overflow-hidden">
            <div className="h-full bg-mint-sprout" style={{ width: `${item.score}%` }} />
          </div>
          <span className="text-sm text-olive-slate">{item.score}</span>
        </div>
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
          <Button variant="ghost" size="sm">
            <ArrowRight className="w-4 h-4 text-green-500" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredLeads = leads.filter(
    (lead) =>
      getContactName(lead).toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">Leads</h1>
            <p className="text-olive-slate mt-1">Manage your sales pipeline and convert leads to customers</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">New Leads</p>
              <p className="text-2xl font-bold text-cobalt-ink">{leads.filter((l) => l.status === 'new').length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Contacted</p>
              <p className="text-2xl font-bold text-plum-depth">{leads.filter((l) => l.status === 'contacted').length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Qualified</p>
              <p className="text-2xl font-bold text-forest-depths">{leads.filter((l) => l.status === 'qualified').length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Unqualified</p>
              <p className="text-2xl font-bold text-wine-shadow">{leads.filter((l) => l.status === 'unqualified').length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
                <input
                  type="text"
                  placeholder="Search leads..."
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

        <DataTable columns={columns} data={filteredLeads} loading={loading} emptyMessage="No leads found" />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingLead ? 'Edit Lead' : 'Add Lead'} size="lg">
        <div className="space-y-4">
          <Select
            label="Contact"
            value={formData.contact_id}
            onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
            options={contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))}
            placeholder="Select contact..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Organization"
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              options={organizations.map((o) => ({ value: o.id, label: o.name }))}
              placeholder="Select organization..."
            />
            <Select
              label="Lead Source"
              value={formData.lead_source_id}
              onChange={(e) => setFormData({ ...formData, lead_source_id: e.target.value })}
              options={leadSources.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select source..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead['status'] })}
              options={[
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'unqualified', label: 'Unqualified' },
              ]}
            />
            <Input
              label="Score (0-100)"
              type="number"
              min={0}
              max={100}
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.contact_id}>
              {saving ? 'Saving...' : editingLead ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
