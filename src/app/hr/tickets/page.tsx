'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  raised_by_type: 'employee' | 'contact'
  raised_by_id: string
  assigned_to: string
  resolved_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  assigned_employee?: Employee
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium' as Ticket['priority'],
    status: 'open' as Ticket['status'],
    assigned_to: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTickets()
    fetchEmployees()
  }, [])

  const fetchTickets = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('help_desk_tickets')
      .select('*, assigned_employee:assigned_to(id, first_name, last_name)')
      .order('created_at', { ascending: false })

    if (data) {
      setTickets(data)
    }
    setLoading(false)
  }

  const fetchEmployees = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .order('first_name')

    if (data) {
      setEmployees(data)
    }
  }

  const generateTicketNumber = (existing: Ticket[]) => {
    const maxNum = existing.reduce((max, t) => {
      const num = parseInt(t.ticket_number.replace('TKT-', ''), 10)
      return num > max ? num : max
    }, 0)
    return `TKT-${String(maxNum + 1).padStart(3, '0')}`
  }

  const handleOpenModal = (ticket?: Ticket) => {
    if (ticket) {
      setEditingTicket(ticket)
      setFormData({
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        assigned_to: ticket.assigned_to || '',
      })
    } else {
      setEditingTicket(null)
      setFormData({
        subject: '',
        description: '',
        category: '',
        priority: 'medium',
        status: 'open',
        assigned_to: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTicket(null)
    setFormData({
      subject: '',
      description: '',
      category: '',
      priority: 'medium',
      status: 'open',
      assigned_to: '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const now = new Date().toISOString()

    if (editingTicket) {
      const updateData: Record<string, unknown> = {
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        assigned_to: formData.assigned_to || null,
        updated_at: now,
      }

      if (formData.status === 'resolved' && editingTicket.status !== 'resolved') {
        updateData.resolved_at = now
      }
      if (formData.status === 'closed' && editingTicket.status !== 'closed') {
        updateData.closed_at = now
      }

      const { error } = await supabase
        .from('help_desk_tickets')
        .update(updateData)
        .eq('id', editingTicket.id)

      if (!error) {
        await fetchTickets()
        handleCloseModal()
      }
    } else {
      const ticket_number = generateTicketNumber(tickets)

      const { error } = await supabase
        .from('help_desk_tickets')
        .insert({
          ticket_number,
          subject: formData.subject,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          status: formData.status,
          assigned_to: formData.assigned_to || null,
          raised_by_type: 'employee',
          raised_by_id: null,
        })

      if (!error) {
        await fetchTickets()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('help_desk_tickets')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchTickets()
    }
  }

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'error',
    }
    return <Badge variant={variants[priority]}>{priority}</Badge>
  }

  const getStatusBadge = (status: Ticket['status']) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      open: 'info',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'default',
    }
    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const columns: Column<Ticket>[] = [
    {
      key: 'ticket_number',
      header: 'Ticket #',
      render: (item) => (
        <span className="font-mono text-sm font-medium text-cobalt-ink">{item.ticket_number}</span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (item) => (
        <div>
          <p className="font-medium text-charcoal">{item.subject}</p>
          <p className="text-xs text-pebble mt-0.5 line-clamp-1">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => (
        <span className="text-sm text-olive-slate">{item.category || '-'}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => getPriorityBadge(item.priority),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'assigned_to',
      header: 'Assigned To',
      render: (item) => (
        <span className="text-sm text-olive-slate">
          {item.assigned_employee
            ? `${item.assigned_employee.first_name} ${item.assigned_employee.last_name}`
            : <span className="text-pebble">Unassigned</span>}
        </span>
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

  const filteredTickets = tickets.filter(
    (ticket) => {
      const matchesSearch = searchTerm === '' ||
        ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === '' || ticket.status === statusFilter
      return matchesSearch && matchesStatus
    }
  )

  const openCount = tickets.filter((t) => t.status === 'open').length
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length
  const urgentCount = tickets.filter((t) => t.priority === 'urgent' && t.status !== 'closed').length

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Help Desk
            </h1>
            <p className="text-olive-slate mt-1">
              Manage support tickets and track issue resolution
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Tickets</p>
              <p className="text-2xl font-bold text-cobalt-ink">{tickets.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Open</p>
              <p className="text-2xl font-bold text-plum-depth">{openCount}</p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">In Progress</p>
              <p className="text-2xl font-bold text-forest-depths">{inProgressCount}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Urgent</p>
              <p className="text-2xl font-bold text-wine-shadow">{urgentCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
                <input
                  type="text"
                  placeholder="Search by ticket number, subject, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coda-input pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                placeholder="Filter by status"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredTickets}
          loading={loading}
          emptyMessage="No tickets found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTicket ? `Edit Ticket ${editingTicket.ticket_number}` : 'New Ticket'}
        size="lg"
      >
        <div className="space-y-4">
          {editingTicket && (
            <div className="bg-sky-wash rounded-lg px-4 py-3">
              <p className="text-sm text-cobalt-ink font-medium">{editingTicket.ticket_number}</p>
            </div>
          )}
          <Input
            label="Subject"
            placeholder="Brief description of the issue"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Detailed description of the issue..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label="Category"
            placeholder="e.g., IT, HR, Facilities"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Ticket['priority'] })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Ticket['status'] })}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </div>
          <Select
            label="Assigned To"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            options={[
              { value: '', label: 'Unassigned' },
              ...employees.map((emp) => ({
                value: emp.id,
                label: `${emp.first_name} ${emp.last_name}`,
              })),
            ]}
            placeholder="Select assignee..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.subject}>
              {saving ? 'Saving...' : editingTicket ? 'Update' : 'Create Ticket'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
