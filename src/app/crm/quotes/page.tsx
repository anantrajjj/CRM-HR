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

interface Quote {
  id: string
  quote_number: string
  organization_id: string
  contact_id: string
  deal_id: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  valid_until: string
  subtotal: number
  tax_amount: number
  total: number
  currency_id: string
  terms: string
  notes: string
  created_at: string
  updated_at: string
  organizations?: { name: string }
  contacts?: { first_name: string; last_name: string }
  currencies?: { name: string; code: string; symbol: string }
}

interface Organization {
  id: string
  name: string
}

interface Contact {
  id: string
  first_name: string
  last_name: string
}

interface Currency {
  id: string
  name: string
  code: string
  symbol: string
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [formData, setFormData] = useState({
    quote_number: '',
    organization_id: '',
    contact_id: '',
    status: 'draft' as Quote['status'],
    valid_until: '',
    subtotal: '',
    tax_amount: '',
    total: '',
    currency_id: '',
    terms: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchQuotes()
    fetchOrganizations()
    fetchContacts()
    fetchCurrencies()
  }, [])

  const fetchQuotes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select('*, organizations(name), contacts(first_name, last_name), currencies(name, code, symbol)')
      .order('created_at', { ascending: false })

    if (data) {
      setQuotes(data)
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

  const fetchCurrencies = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('currencies')
      .select('id, name, code, symbol')
      .order('name')

    if (data) {
      setCurrencies(data)
    }
  }

  const handleOpenModal = (quote?: Quote) => {
    if (quote) {
      setEditingQuote(quote)
      setFormData({
        quote_number: quote.quote_number,
        organization_id: quote.organization_id || '',
        contact_id: quote.contact_id || '',
        status: quote.status,
        valid_until: quote.valid_until || '',
        subtotal: quote.subtotal?.toString() || '',
        tax_amount: quote.tax_amount?.toString() || '',
        total: quote.total?.toString() || '',
        currency_id: quote.currency_id || '',
        terms: quote.terms || '',
        notes: quote.notes || '',
      })
    } else {
      setEditingQuote(null)
      setFormData({
        quote_number: '',
        organization_id: '',
        contact_id: '',
        status: 'draft',
        valid_until: '',
        subtotal: '',
        tax_amount: '',
        total: '',
        currency_id: '',
        terms: '',
        notes: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingQuote(null)
    setFormData({
      quote_number: '',
      organization_id: '',
      contact_id: '',
      status: 'draft',
      valid_until: '',
      subtotal: '',
      tax_amount: '',
      total: '',
      currency_id: '',
      terms: '',
      notes: '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      quote_number: formData.quote_number,
      organization_id: formData.organization_id || null,
      contact_id: formData.contact_id || null,
      status: formData.status,
      valid_until: formData.valid_until || null,
      subtotal: formData.subtotal ? parseFloat(formData.subtotal) : null,
      tax_amount: formData.tax_amount ? parseFloat(formData.tax_amount) : null,
      total: formData.total ? parseFloat(formData.total) : null,
      currency_id: formData.currency_id || null,
      terms: formData.terms || null,
      notes: formData.notes || null,
    }

    if (editingQuote) {
      const { error } = await supabase
        .from('quotes')
        .update(record)
        .eq('id', editingQuote.id)

      if (!error) {
        await fetchQuotes()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('quotes')
        .insert(record)

      if (!error) {
        await fetchQuotes()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchQuotes()
    }
  }

  const getStatusBadge = (status: Quote['status']) => {
    const map: Record<Quote['status'], { variant: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
      draft: { variant: 'default', label: 'Draft' },
      sent: { variant: 'info', label: 'Sent' },
      accepted: { variant: 'success', label: 'Accepted' },
      rejected: { variant: 'error', label: 'Rejected' },
    }
    const { variant, label } = map[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  const columns: Column<Quote>[] = [
    {
      key: 'quote_number',
      header: 'Quote',
      render: (item) => (
        <p className="font-medium text-charcoal">{item.quote_number}</p>
      )
    },
    {
      key: 'organizations',
      header: 'Organization',
      render: (item) => item.organizations?.name || <span className="text-pebble">-</span>
    },
    {
      key: 'contacts',
      header: 'Contact',
      render: (item) => item.contacts ? (
        <span className="text-sm text-charcoal">{item.contacts.first_name} {item.contacts.last_name}</span>
      ) : <span className="text-pebble">-</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status)
    },
    {
      key: 'total',
      header: 'Total',
      render: (item) => item.total ? (
        <span className="text-sm text-charcoal">
          {item.currencies?.symbol || '$'}{item.total.toLocaleString()}
        </span>
      ) : <span className="text-pebble">-</span>
    },
    {
      key: 'valid_until',
      header: 'Valid Until',
      render: (item) => item.valid_until ? (
        <span className="text-sm text-charcoal">{new Date(item.valid_until).toLocaleDateString()}</span>
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

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${quote.contacts?.first_name} ${quote.contacts?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Quotes
            </h1>
            <p className="text-olive-slate mt-1">
              Create and manage sales quotes
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Quote
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
                  placeholder="Search quotes..."
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
              <p className="text-sm text-forest-depths">Total Quotes</p>
              <p className="text-2xl font-bold text-forest-depths">{quotes.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Draft</p>
              <p className="text-2xl font-bold text-plum-depth">
                {quotes.filter((q) => q.status === 'draft').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Sent</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {quotes.filter((q) => q.status === 'sent').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Accepted</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {quotes.filter((q) => q.status === 'accepted').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredQuotes}
          loading={loading}
          emptyMessage="No quotes found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingQuote ? 'Edit Quote' : 'Add Quote'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quote Number"
              placeholder="QT-001"
              value={formData.quote_number}
              onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Quote['status'] })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Organization"
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              options={organizations.map((org) => ({ value: org.id, label: org.name }))}
              placeholder="Select organization..."
            />
            <Select
              label="Contact"
              value={formData.contact_id}
              onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
              options={contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))}
              placeholder="Select contact..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valid Until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            />
            <Select
              label="Currency"
              value={formData.currency_id}
              onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
              options={currencies.map((cur) => ({ value: cur.id, label: `${cur.code} (${cur.symbol})` }))}
              placeholder="Select..."
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Subtotal"
              type="number"
              placeholder="1000"
              value={formData.subtotal}
              onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
            />
            <Input
              label="Tax Amount"
              type="number"
              placeholder="100"
              value={formData.tax_amount}
              onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
            />
            <Input
              label="Total"
              type="number"
              placeholder="1100"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: e.target.value })}
            />
          </div>
          <Textarea
            label="Terms"
            placeholder="Payment terms..."
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
          />
          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.quote_number}>
              {saving ? 'Saving...' : editingQuote ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
