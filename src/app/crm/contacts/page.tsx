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
import { Plus, Search, Edit2, Trash2, User, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  job_title?: string
  organization_id?: string
  is_lead: boolean
  is_customer: boolean
  created_at: string
  organizations?: { name: string }
}

interface Organization {
  id: string
  name: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    organization_id: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchContacts()
    fetchOrganizations()
  }, [])

  const fetchContacts = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('contacts')
      .select('*, organizations(name)')
      .order('last_name')

    if (data) {
      setContacts(data)
    }
    setLoading(false)
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

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact)
      setFormData({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email || '',
        phone: contact.phone || '',
        job_title: contact.job_title || '',
        organization_id: contact.organization_id || '',
      })
    } else {
      setEditingContact(null)
      setFormData({ first_name: '', last_name: '', email: '', phone: '', job_title: '', organization_id: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingContact(null)
    setFormData({ first_name: '', last_name: '', email: '', phone: '', job_title: '', organization_id: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email || null,
      phone: formData.phone || null,
      job_title: formData.job_title || null,
      organization_id: formData.organization_id || null,
    }

    if (editingContact) {
      const { error } = await supabase
        .from('contacts')
        .update(record)
        .eq('id', editingContact.id)

      if (!error) {
        await fetchContacts()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('contacts')
        .insert(record)

      if (!error) {
        await fetchContacts()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchContacts()
    }
  }

  const columns: Column<Contact>[] = [
    { 
      key: 'last_name', 
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-lilac-wash rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-plum-depth" />
          </div>
          <div>
            <p className="font-medium text-charcoal">{item.first_name} {item.last_name}</p>
            {item.job_title && <p className="text-xs text-pebble">{item.job_title}</p>}
          </div>
        </div>
      )
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
      key: 'organizations', 
      header: 'Organization',
      render: (item) => item.organizations?.name || <span className="text-pebble">-</span>
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

  const filteredContacts = contacts.filter(
    (contact) =>
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Contacts
            </h1>
            <p className="text-olive-slate mt-1">
              Manage your customer relationships
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
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
                  placeholder="Search contacts..."
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
              <p className="text-sm text-forest-depths">Total Contacts</p>
              <p className="text-2xl font-bold text-forest-depths">{contacts.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">With Email</p>
              <p className="text-2xl font-bold text-plum-depth">
                {contacts.filter((c) => c.email).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">With Phone</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {contacts.filter((c) => c.phone).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Organizations</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {new Set(contacts.filter((c) => c.organization_id).map((c) => c.organization_id)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredContacts}
          loading={loading}
          emptyMessage="No contacts found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              placeholder="+1 234 567 890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Job Title"
              placeholder="Software Engineer"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            />
          </div>
          <Select
            label="Organization"
            value={formData.organization_id}
            onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
            options={organizations.map((org) => ({ value: org.id, label: org.name }))}
            placeholder="Select organization..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.first_name || !formData.last_name}>
              {saving ? 'Saving...' : editingContact ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
