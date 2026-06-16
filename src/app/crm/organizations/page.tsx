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
import { Plus, Search, Edit2, Trash2, Building2, Globe, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Organization {
  id: string
  name: string
  industry?: string
  website?: string
  email?: string
  phone?: string
  city?: string
  country?: string
  employee_count?: number
  annual_revenue?: number
  is_active: boolean
  created_at: string
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    email: '',
    phone: '',
    city: '',
    country: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (data) {
      setOrganizations(data)
    }
    setLoading(false)
  }

  const handleOpenModal = (org?: Organization) => {
    if (org) {
      setEditingOrg(org)
      setFormData({
        name: org.name,
        industry: org.industry || '',
        website: org.website || '',
        email: org.email || '',
        phone: org.phone || '',
        city: org.city || '',
        country: org.country || '',
      })
    } else {
      setEditingOrg(null)
      setFormData({ name: '', industry: '', website: '', email: '', phone: '', city: '', country: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingOrg(null)
    setFormData({ name: '', industry: '', website: '', email: '', phone: '', city: '', country: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      name: formData.name,
      industry: formData.industry || null,
      website: formData.website || null,
      email: formData.email || null,
      phone: formData.phone || null,
      city: formData.city || null,
      country: formData.country || null,
    }

    if (editingOrg) {
      const { error } = await supabase
        .from('organizations')
        .update(record)
        .eq('id', editingOrg.id)

      if (!error) {
        await fetchOrganizations()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('organizations')
        .insert(record)

      if (!error) {
        await fetchOrganizations()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchOrganizations()
    }
  }

  const columns: Column<Organization>[] = [
    { 
      key: 'name', 
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-wash rounded-[9px] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-cobalt-ink" />
          </div>
          <div>
            <p className="font-medium text-charcoal">{item.name}</p>
            {item.industry && <p className="text-xs text-pebble">{item.industry}</p>}
          </div>
        </div>
      )
    },
    { 
      key: 'website', 
      header: 'Website',
      render: (item) => item.website ? (
        <div className="flex items-center gap-1 text-sm">
          <Globe className="w-3 h-3 text-pebble" />
          <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-cobalt-ink hover:underline">
            {item.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        </div>
      ) : <span className="text-pebble">-</span>
    },
    { 
      key: 'email', 
      header: 'Email',
      render: (item) => item.email ? (
        <div className="flex items-center gap-1 text-sm">
          <Mail className="w-3 h-3 text-pebble" />
          {item.email}
        </div>
      ) : <span className="text-pebble">-</span>
    },
    { 
      key: 'phone', 
      header: 'Phone',
      render: (item) => item.phone ? (
        <div className="flex items-center gap-1 text-sm">
          <Phone className="w-3 h-3 text-pebble" />
          {item.phone}
        </div>
      ) : <span className="text-pebble">-</span>
    },
    { 
      key: 'city', 
      header: 'Location',
      render: (item) => {
        const parts = [item.city, item.country].filter(Boolean)
        return parts.length > 0 ? parts.join(', ') : <span className="text-pebble">-</span>
      }
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

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Organizations
            </h1>
            <p className="text-olive-slate mt-1">
              Manage your business accounts
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Organization
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
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coda-input pl-10"
                />
              </div>
              <Button variant="secondary">Filter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Organizations</p>
              <p className="text-2xl font-bold text-forest-depths">{organizations.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">With Website</p>
              <p className="text-2xl font-bold text-plum-depth">
                {organizations.filter((o) => o.website).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">With Email</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {organizations.filter((o) => o.email).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Industries</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {new Set(organizations.filter((o) => o.industry).map((o) => o.industry)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredOrganizations}
          loading={loading}
          emptyMessage="No organizations found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingOrg ? 'Edit Organization' : 'Add Organization'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Organization Name"
            placeholder="Acme Corporation"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Industry"
              placeholder="Technology"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
            <Input
              label="Website"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="contact@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              placeholder="+1 234 567 890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="San Francisco"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Country"
              placeholder="United States"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? 'Saving...' : editingOrg ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
