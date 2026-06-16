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
import { Plus, Search, Edit2, Users, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
}

interface ChannelPartner {
  id: string
  name: string
  partner_type: 'referral' | 'reseller' | 'var' | 'consulting' | 'technology'
  tier: 'strategic' | 'gold' | 'silver' | 'standard'
  default_margin_bps: number
  target_industries: string[] | null
  target_geographies: string[] | null
  channel_manager_id: string | null
  is_active: boolean
  channel_manager?: Employee
}

interface DealRegistration {
  id: string
  partner_id: string
  customer_name: string
  industry: string
  location: string
  estimated_amount: number
  expected_close_date: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  reviewed_by: string | null
  decision_at: string | null
  expiry_date: string | null
  partner?: ChannelPartner
  reviewer?: Employee
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<ChannelPartner[]>([])
  const [registrations, setRegistrations] = useState<DealRegistration[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'partners' | 'registrations'>('partners')
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false)
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<ChannelPartner | null>(null)
  const [reviewingRegistration, setReviewingRegistration] = useState<DealRegistration | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  const [partnerForm, setPartnerForm] = useState({
    name: '',
    partner_type: 'referral' as ChannelPartner['partner_type'],
    tier: 'standard' as ChannelPartner['tier'],
    default_margin_bps: '',
    target_industries: '',
    target_geographies: '',
    channel_manager_id: '',
  })

  const [registrationForm, setRegistrationForm] = useState({
    partner_id: '',
    customer_name: '',
    industry: '',
    location: '',
    estimated_amount: '',
    expected_close_date: '',
    description: '',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPartners()
    fetchRegistrations()
    fetchEmployees()
  }, [])

  const fetchPartners = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('channel_partners')
      .select('*, channel_manager:employees!channel_partners_channel_manager_id_fkey(id, first_name, last_name, employee_id)')
      .order('name')

    if (data) setPartners(data)
    setLoading(false)
  }

  const fetchRegistrations = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('deal_registrations')
      .select('*, partner:channel_partners(id, name, tier), reviewer:employees!deal_registrations_reviewed_by_fkey(id, first_name, last_name)')
      .order('created_at', { ascending: false })

    if (data) setRegistrations(data)
  }

  const fetchEmployees = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('employees').select('id, employee_id, first_name, last_name').order('first_name')
    if (data) setEmployees(data)
  }

  const handleOpenPartnerModal = (partner?: ChannelPartner) => {
    if (partner) {
      setEditingPartner(partner)
      setPartnerForm({
        name: partner.name,
        partner_type: partner.partner_type,
        tier: partner.tier,
        default_margin_bps: partner.default_margin_bps?.toString() || '',
        target_industries: partner.target_industries?.join(', ') || '',
        target_geographies: partner.target_geographies?.join(', ') || '',
        channel_manager_id: partner.channel_manager_id || '',
      })
    } else {
      setEditingPartner(null)
      setPartnerForm({
        name: '',
        partner_type: 'referral',
        tier: 'standard',
        default_margin_bps: '',
        target_industries: '',
        target_geographies: '',
        channel_manager_id: '',
      })
    }
    setIsPartnerModalOpen(true)
  }

  const handleSavePartner = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      name: partnerForm.name,
      partner_type: partnerForm.partner_type,
      tier: partnerForm.tier,
      default_margin_bps: partnerForm.default_margin_bps ? parseInt(partnerForm.default_margin_bps) : null,
      target_industries: partnerForm.target_industries ? partnerForm.target_industries.split(',').map(s => s.trim()).filter(Boolean) : null,
      target_geographies: partnerForm.target_geographies ? partnerForm.target_geographies.split(',').map(s => s.trim()).filter(Boolean) : null,
      channel_manager_id: partnerForm.channel_manager_id || null,
      is_active: true,
    }

    if (editingPartner) {
      const { error } = await supabase.from('channel_partners').update(record).eq('id', editingPartner.id)
      if (!error) {
        await fetchPartners()
        setIsPartnerModalOpen(false)
      }
    } else {
      const { error } = await supabase.from('channel_partners').insert(record)
      if (!error) {
        await fetchPartners()
        setIsPartnerModalOpen(false)
      }
    }
    setSaving(false)
  }

  const handleOpenRegistrationModal = () => {
    setRegistrationForm({
      partner_id: '',
      customer_name: '',
      industry: '',
      location: '',
      estimated_amount: '',
      expected_close_date: '',
      description: '',
    })
    setIsRegistrationModalOpen(true)
  }

  const handleSaveRegistration = async () => {
    setSaving(true)
    const supabase = createClient()

    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)

    const record = {
      partner_id: registrationForm.partner_id || null,
      customer_name: registrationForm.customer_name,
      industry: registrationForm.industry,
      location: registrationForm.location,
      estimated_amount: registrationForm.estimated_amount ? parseFloat(registrationForm.estimated_amount) : null,
      expected_close_date: registrationForm.expected_close_date || null,
      description: registrationForm.description,
      status: 'pending' as const,
      expiry_date: expiry.toISOString().split('T')[0],
    }

    const { error } = await supabase.from('deal_registrations').insert(record)
    if (!error) {
      await fetchRegistrations()
      setIsRegistrationModalOpen(false)
    }
    setSaving(false)
  }

  const handleReviewRegistration = async (decision: 'approved' | 'rejected') => {
    if (!reviewingRegistration) return
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from('deal_registrations').update({
      status: decision,
      reviewed_by: null,
      decision_at: new Date().toISOString(),
    }).eq('id', reviewingRegistration.id)

    if (!error) {
      await fetchRegistrations()
      setIsReviewModalOpen(false)
      setReviewingRegistration(null)
      setReviewNote('')
    }
    setSaving(false)
  }

  const getPartnerTypeBadge = (type: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      referral: 'info',
      reseller: 'success',
      var: 'warning',
      consulting: 'default',
      technology: 'info',
    }
    return <Badge variant={variants[type]}>{type.toUpperCase()}</Badge>
  }

  const getTierBadge = (tier: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      strategic: 'success',
      gold: 'warning',
      silver: 'info',
      standard: 'default',
    }
    return <Badge variant={variants[tier]}>{tier}</Badge>
  }

  const getRegistrationStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      expired: 'default',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const partnerColumns: Column<ChannelPartner>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-lilac-wash rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-plum-depth">{item.name[0]}</span>
          </div>
          <span className="text-sm font-medium text-charcoal">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'partner_type',
      header: 'Type',
      render: (item) => getPartnerTypeBadge(item.partner_type),
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (item) => getTierBadge(item.tier),
    },
    {
      key: 'default_margin_bps',
      header: 'Margin %',
      render: (item) => (
        <span className="text-sm text-forest-depths font-medium">{item.default_margin_bps ? `${(item.default_margin_bps / 100).toFixed(1)}%` : '-'}</span>
      ),
    },
    {
      key: 'registrations',
      header: 'Registrations',
      render: (item) => {
        const count = registrations.filter(r => r.partner_id === item.id).length
        return <span className="text-sm text-cobalt-ink font-medium">{count}</span>
      },
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (item) => <Badge variant={item.is_active ? 'success' : 'default'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenPartnerModal(item)}>
          <Edit2 className="w-4 h-4" />
        </Button>
      ),
    },
  ]

  const registrationColumns: Column<DealRegistration>[] = [
    {
      key: 'customer_name',
      header: 'Customer',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-charcoal">{item.customer_name}</p>
          <p className="text-xs text-pebble">{item.industry}</p>
        </div>
      ),
    },
    {
      key: 'partner_id',
      header: 'Partner',
      render: (item) => item.partner ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-charcoal">{item.partner.name}</span>
          {getTierBadge(item.partner.tier)}
        </div>
      ) : <span className="text-pebble text-sm">-</span>,
    },
    {
      key: 'estimated_amount',
      header: 'Amount',
      render: (item) => (
        <span className="text-sm font-medium text-forest-depths">
          ${item.estimated_amount ? item.estimated_amount.toLocaleString() : '-'}
        </span>
      ),
    },
    {
      key: 'expected_close_date',
      header: 'Expected Close',
      render: (item) => (
        <span className="text-sm text-olive-slate">
          {item.expected_close_date ? new Date(item.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getRegistrationStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => item.status === 'pending' ? (
        <Button variant="ghost" size="sm" onClick={() => { setReviewingRegistration(item); setIsReviewModalOpen(true) }}>
          Review
        </Button>
      ) : null,
    },
  ]

  const filteredPartners = partners.filter(p =>
    searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredRegistrations = registrations.filter(r =>
    searchTerm === '' ||
    r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.partner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activePartners = partners.filter(p => p.is_active).length
  const activeRegistrations = registrations.filter(r => r.status === 'pending').length
  const totalPipeline = registrations.filter(r => ['pending', 'approved'].includes(r.status)).reduce((sum, r) => sum + (r.estimated_amount || 0), 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">Channel Partners</h1>
            <p className="text-olive-slate mt-1">Manage channel partners and deal registrations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleOpenRegistrationModal}>
              <DollarSign className="w-4 h-4 mr-2" />
              Register Deal
            </Button>
            <Button onClick={() => handleOpenPartnerModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Partners</p>
              <p className="text-2xl font-bold text-cobalt-ink">{partners.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Active Registrations</p>
              <p className="text-2xl font-bold text-forest-depths">{activeRegistrations}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Pending Approvals</p>
              <p className="text-2xl font-bold text-wine-shadow">{registrations.filter(r => r.status === 'pending').length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Total Pipeline</p>
              <p className="text-2xl font-bold text-plum-depth">${totalPipeline.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-bone rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'partners' ? 'bg-white text-charcoal shadow-sm' : 'text-olive-slate hover:text-charcoal'
            }`}
          >
            <Users className="w-4 h-4 mr-1.5 inline" />
            Partners
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'registrations' ? 'bg-white text-charcoal shadow-sm' : 'text-olive-slate hover:text-charcoal'
            }`}
          >
            <DollarSign className="w-4 h-4 mr-1.5 inline" />
            Deal Registrations
          </button>
        </div>

        {/* Search */}
        <Card>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
              <input
                type="text"
                placeholder={activeTab === 'partners' ? 'Search partners...' : 'Search registrations by customer or partner...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="coda-input pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {activeTab === 'partners' ? (
          <DataTable
            columns={partnerColumns}
            data={filteredPartners}
            loading={loading}
            emptyMessage="No partners found"
          />
        ) : (
          <DataTable
            columns={registrationColumns}
            data={filteredRegistrations}
            loading={loading}
            emptyMessage="No deal registrations found"
          />
        )}
      </div>

      {/* Add/Edit Partner Modal */}
      <Modal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        title={editingPartner ? 'Edit Partner' : 'Add Partner'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Partner Name"
            placeholder="Company name..."
            value={partnerForm.name}
            onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Partner Type"
              value={partnerForm.partner_type}
              onChange={(e) => setPartnerForm({ ...partnerForm, partner_type: e.target.value as ChannelPartner['partner_type'] })}
              options={[
                { value: 'referral', label: 'Referral' },
                { value: 'reseller', label: 'Reseller' },
                { value: 'var', label: 'VAR' },
                { value: 'consulting', label: 'Consulting' },
                { value: 'technology', label: 'Technology' },
              ]}
            />
            <Select
              label="Tier"
              value={partnerForm.tier}
              onChange={(e) => setPartnerForm({ ...partnerForm, tier: e.target.value as ChannelPartner['tier'] })}
              options={[
                { value: 'strategic', label: 'Strategic' },
                { value: 'gold', label: 'Gold' },
                { value: 'silver', label: 'Silver' },
                { value: 'standard', label: 'Standard' },
              ]}
            />
          </div>
          <Input
            label="Default Margin (bps)"
            type="number"
            placeholder="e.g. 2000 for 20%"
            value={partnerForm.default_margin_bps}
            onChange={(e) => setPartnerForm({ ...partnerForm, default_margin_bps: e.target.value })}
          />
          <Input
            label="Target Industries"
            placeholder="Comma-separated, e.g. Banking, Healthcare, Retail"
            value={partnerForm.target_industries}
            onChange={(e) => setPartnerForm({ ...partnerForm, target_industries: e.target.value })}
          />
          <Input
            label="Target Geographies"
            placeholder="Comma-separated, e.g. North America, EMEA"
            value={partnerForm.target_geographies}
            onChange={(e) => setPartnerForm({ ...partnerForm, target_geographies: e.target.value })}
          />
          <Select
            label="Channel Manager"
            value={partnerForm.channel_manager_id}
            onChange={(e) => setPartnerForm({ ...partnerForm, channel_manager_id: e.target.value })}
            options={employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))}
            placeholder="Select manager..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsPartnerModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePartner} disabled={saving || !partnerForm.name}>
              {saving ? 'Saving...' : editingPartner ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Register Deal Modal */}
      <Modal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        title="Register Deal"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Partner"
            value={registrationForm.partner_id}
            onChange={(e) => setRegistrationForm({ ...registrationForm, partner_id: e.target.value })}
            options={partners.filter(p => p.is_active).map(p => ({ value: p.id, label: `${p.name} (${p.tier})` }))}
            placeholder="Select partner..."
          />
          <Input
            label="Customer Name"
            placeholder="Customer company name..."
            value={registrationForm.customer_name}
            onChange={(e) => setRegistrationForm({ ...registrationForm, customer_name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Industry"
              placeholder="e.g. Banking, Healthcare"
              value={registrationForm.industry}
              onChange={(e) => setRegistrationForm({ ...registrationForm, industry: e.target.value })}
            />
            <Input
              label="Location"
              placeholder="e.g. New York, London"
              value={registrationForm.location}
              onChange={(e) => setRegistrationForm({ ...registrationForm, location: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Amount ($)"
              type="number"
              placeholder="0"
              value={registrationForm.estimated_amount}
              onChange={(e) => setRegistrationForm({ ...registrationForm, estimated_amount: e.target.value })}
            />
            <Input
              label="Expected Close Date"
              type="date"
              value={registrationForm.expected_close_date}
              onChange={(e) => setRegistrationForm({ ...registrationForm, expected_close_date: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Deal details and notes..."
            value={registrationForm.description}
            onChange={(e) => setRegistrationForm({ ...registrationForm, description: e.target.value })}
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsRegistrationModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRegistration} disabled={saving || !registrationForm.customer_name}>
              {saving ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Registration Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => { setIsReviewModalOpen(false); setReviewingRegistration(null) }}
        title="Review Deal Registration"
        size="md"
      >
        {reviewingRegistration && (
          <div className="space-y-4">
            <div className="bg-sage-mist rounded-lg p-4 text-sm space-y-2">
              <p><span className="text-pebble">Customer:</span> <span className="text-charcoal font-medium">{reviewingRegistration.customer_name}</span></p>
              <p><span className="text-pebble">Partner:</span> <span className="text-charcoal font-medium">{reviewingRegistration.partner?.name}</span></p>
              <p><span className="text-pebble">Amount:</span> <span className="text-forest-depths font-medium">${reviewingRegistration.estimated_amount?.toLocaleString()}</span></p>
              <p><span className="text-pebble">Industry:</span> <span className="text-charcoal">{reviewingRegistration.industry}</span></p>
              <p><span className="text-pebble">Expected Close:</span> <span className="text-charcoal">{reviewingRegistration.expected_close_date ? new Date(reviewingRegistration.expected_close_date).toLocaleDateString() : '-'}</span></p>
            </div>
            <Textarea
              label="Decision Note (optional)"
              placeholder="Add a note about your decision..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => { setIsReviewModalOpen(false); setReviewingRegistration(null) }}>Cancel</Button>
              <Button variant="secondary" onClick={() => handleReviewRegistration('rejected')} disabled={saving} className="text-red-600">
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button onClick={() => handleReviewRegistration('approved')} disabled={saving}>
                <CheckCircle className="w-4 h-4 mr-1" /> Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}
