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
import { Plus, Search, MessageSquare, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
}

interface Deal {
  id: string
  title: string
}

interface Organization {
  id: string
  name: string
}

interface SupportQueue {
  id: string
  name: string
  code: string
  description: string
  first_response_hours: number
  resolution_hours: number
  default_assignee_id: string | null
}

interface SupportTicket {
  id: string
  ticket_number: string
  queue_id: string
  opportunity_id: string | null
  subject: string
  description: string
  ticket_type: 'general' | 'deal_desk' | 'legal' | 'technical' | 'billing'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
  assigned_to: string | null
  raised_by: string | null
  first_responded_at: string | null
  resolved_at: string | null
  created_at: string
  queue?: SupportQueue
  assignee?: Employee
  raiser?: Employee
  opportunity?: Deal
}

interface SupportComment {
  id: string
  ticket_id: string
  author_id: string
  content: string
  created_at: string
  author?: Employee
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [queues, setQueues] = useState<SupportQueue[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [comments, setComments] = useState<SupportComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [formData, setFormData] = useState({
    queue_id: '',
    opportunity_id: '',
    subject: '',
    description: '',
    ticket_type: 'general' as SupportTicket['ticket_type'],
    priority: 'medium' as SupportTicket['priority'],
    assigned_to: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchQueues()
    fetchTickets()
    fetchEmployees()
    fetchDeals()
  }, [])

  useEffect(() => {
    if (selectedTicket) {
      fetchComments(selectedTicket.id)
    }
  }, [selectedTicket])

  const fetchQueues = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('sales_support_queues').select('*').order('name')
    if (data) setQueues(data)
  }

  const fetchTickets = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('sales_support_tickets')
      .select('*, queue:sales_support_queues(*), assignee:employees!sales_support_tickets_assigned_to_fkey(id, first_name, last_name, employee_id), raiser:employees!sales_support_tickets_raised_by_fkey(id, first_name, last_name, employee_id), opportunity:deals(id, title)')
      .order('created_at', { ascending: false })

    if (data) {
      setTickets(data)
    }
    setLoading(false)
  }

  const fetchEmployees = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('employees').select('id, employee_id, first_name, last_name').order('first_name')
    if (data) setEmployees(data)
  }

  const fetchDeals = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('deals').select('id, title').order('title')
    if (data) setDeals(data)
  }

  const fetchComments = async (ticketId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('sales_support_comments')
      .select('*, author:employees!sales_support_comments_author_id_fkey(id, first_name, last_name, employee_id)')
      .eq('ticket_id', ticketId)
      .order('created_at')

    if (data) setComments(data)
  }

  const handleOpenModal = () => {
    setFormData({
      queue_id: '',
      opportunity_id: '',
      subject: '',
      description: '',
      ticket_type: 'general',
      priority: 'medium',
      assigned_to: '',
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`

    const record = {
      ticket_number: ticketNumber,
      queue_id: formData.queue_id || null,
      opportunity_id: formData.opportunity_id || null,
      subject: formData.subject,
      description: formData.description,
      ticket_type: formData.ticket_type,
      priority: formData.priority,
      status: 'open' as const,
      assigned_to: formData.assigned_to || null,
      raised_by: null,
    }

    const { error } = await supabase.from('sales_support_tickets').insert(record)

    if (!error) {
      await fetchTickets()
      handleCloseModal()
    }
    setSaving(false)
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return
    const supabase = createClient()

    const { error } = await supabase.from('sales_support_comments').insert({
      ticket_id: selectedTicket.id,
      author_id: null,
      content: newComment,
    })

    if (!error) {
      setNewComment('')
      fetchComments(selectedTicket.id)
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: SupportTicket['status']) => {
    const supabase = createClient()
    const updates: Record<string, unknown> = { status }
    if (status === 'in_progress' && !tickets.find(t => t.id === ticketId)?.first_responded_at) {
      updates.first_responded_at = new Date().toISOString()
    }
    if (status === 'resolved' || status === 'closed') {
      updates.resolved_at = new Date().toISOString()
    }
    await supabase.from('sales_support_tickets').update(updates).eq('id', ticketId)
    await fetchTickets()
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'error',
    }
    return <Badge variant={variants[priority]}>{priority}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      open: 'info',
      in_progress: 'warning',
      waiting: 'default',
      resolved: 'success',
      closed: 'success',
    }
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      general: 'default',
      deal_desk: 'info',
      legal: 'warning',
      technical: 'success',
      billing: 'error',
    }
    return <Badge variant={variants[type]}>{type.replace('_', ' ')}</Badge>
  }

  const getSLATimer = (ticket: SupportTicket) => {
    if (!ticket.queue) return null
    if (ticket.resolved_at) return <Badge variant="success">Resolved</Badge>

    const created = new Date(ticket.created_at)
    const now = new Date()
    const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60)

    if (!ticket.first_responded_at) {
      const remaining = ticket.queue.first_response_hours - hoursElapsed
      if (remaining <= 0) return <Badge variant="error">SLA Breached</Badge>
      if (remaining <= 2) return <Badge variant="warning">{Math.round(remaining)}h left</Badge>
      return <Badge variant="success">{Math.round(remaining)}h left</Badge>
    }

    const responded = new Date(ticket.first_responded_at)
    const hoursSinceResponse = (now.getTime() - responded.getTime()) / (1000 * 60 * 60)
    const remaining = ticket.queue.resolution_hours - hoursSinceResponse
    if (remaining <= 0) return <Badge variant="error">Resolution Breached</Badge>
    if (remaining <= 4) return <Badge variant="warning">{Math.round(remaining)}h left</Badge>
    return <Badge variant="success">{Math.round(remaining)}h left</Badge>
  }

  const columns: Column<SupportTicket>[] = [
    {
      key: 'ticket_number',
      header: 'Ticket #',
      render: (item) => (
        <button
          onClick={() => setSelectedTicket(item)}
          className="font-mono text-sm font-semibold text-cobalt-ink hover:underline"
        >
          {item.ticket_number}
        </button>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (item) => <span className="text-sm text-charcoal font-medium">{item.subject}</span>,
    },
    {
      key: 'ticket_type',
      header: 'Type',
      render: (item) => getTypeBadge(item.ticket_type),
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
      render: (item) => item.assignee ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-lilac-wash rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-plum-depth">
              {item.assignee.first_name[0]}{item.assignee.last_name[0]}
            </span>
          </div>
          <span className="text-sm text-olive-slate">{item.assignee.first_name} {item.assignee.last_name}</span>
        </div>
      ) : <span className="text-pebble text-sm">Unassigned</span>,
    },
    {
      key: 'sla',
      header: 'SLA',
      render: (item) => getSLATimer(item),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(item)}>
          <MessageSquare className="w-4 h-4" />
        </Button>
      ),
    },
  ]

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = searchTerm === '' ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === '' || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const totalOpen = tickets.filter(t => t.status === 'open').length
  const totalInProgress = tickets.filter(t => t.status === 'in_progress').length
  const totalResolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length
  const avgResponseTime = tickets.filter(t => t.first_responded_at).reduce((acc, t) => {
    const diff = (new Date(t.first_responded_at!).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60)
    return acc + diff
  }, 0) / (tickets.filter(t => t.first_responded_at).length || 1)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">Sales Support</h1>
            <p className="text-olive-slate mt-1">Manage support queues and resolve tickets</p>
          </div>
          <Button onClick={handleOpenModal}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Queue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {queues.filter(q => ['deal_desk', 'legal', 'technical'].includes(q.code)).map((queue) => {
            const count = tickets.filter(t => t.queue_id === queue.id && t.status !== 'resolved' && t.status !== 'closed').length
            const colors: Record<string, { pastel: 'mint' | 'sky' | 'lilac' | 'rose', text: string }> = {
              deal_desk: { pastel: 'mint', text: 'text-forest-depths' },
              legal: { pastel: 'lilac', text: 'text-plum-depth' },
              technical: { pastel: 'sky', text: 'text-cobalt-ink' },
            }
            const config = colors[queue.code] || colors.deal_desk
            return (
              <Card key={queue.id} pastelColor={config.pastel}>
                <CardContent>
                  <p className="text-sm text-olive-slate">{queue.name}</p>
                  <p className={`text-3xl font-bold mt-1 ${config.text}`}>{count}</p>
                  <p className="text-xs text-pebble mt-1">Open tickets</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Tickets</p>
              <p className="text-2xl font-bold text-cobalt-ink">{tickets.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Open</p>
              <p className="text-2xl font-bold text-forest-depths">{totalOpen}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">In Progress</p>
              <p className="text-2xl font-bold text-wine-shadow">{totalInProgress}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Avg Response</p>
              <p className="text-2xl font-bold text-plum-depth">{avgResponseTime.toFixed(1)}h</p>
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
                  placeholder="Search tickets by subject or number..."
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
                  { value: 'waiting', label: 'Waiting' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                placeholder="Status"
              />
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Priorities' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
                placeholder="Priority"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredTickets}
          loading={loading}
          emptyMessage="No support tickets found"
        />
      </div>

      {/* Add Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create Support Ticket"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Queue"
            value={formData.queue_id}
            onChange={(e) => setFormData({ ...formData, queue_id: e.target.value })}
            options={queues.map(q => ({ value: q.id, label: q.name }))}
            placeholder="Select queue..."
          />
          <Input
            label="Subject"
            placeholder="Brief summary of the issue..."
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Detailed description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              value={formData.ticket_type}
              onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value as SupportTicket['ticket_type'] })}
              options={[
                { value: 'general', label: 'General' },
                { value: 'deal_desk', label: 'Deal Desk' },
                { value: 'legal', label: 'Legal' },
                { value: 'technical', label: 'Technical' },
                { value: 'billing', label: 'Billing' },
              ]}
            />
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as SupportTicket['priority'] })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </div>
          <Select
            label="Related Opportunity"
            value={formData.opportunity_id}
            onChange={(e) => setFormData({ ...formData, opportunity_id: e.target.value })}
            options={deals.map(d => ({ value: d.id, label: d.title }))}
            placeholder="Select deal (optional)..."
          />
          <Select
            label="Assign To"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            options={employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))}
            placeholder="Unassigned..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.subject}>
              {saving ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `${selectedTicket.ticket_number} — ${selectedTicket.subject}` : ''}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-pebble">Status</p>
                <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
              </div>
              <div>
                <p className="text-pebble">Priority</p>
                <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
              </div>
              <div>
                <p className="text-pebble">Type</p>
                <div className="mt-1">{getTypeBadge(selectedTicket.ticket_type)}</div>
              </div>
              <div>
                <p className="text-pebble">SLA</p>
                <div className="mt-1">{getSLATimer(selectedTicket)}</div>
              </div>
              <div>
                <p className="text-pebble">Assigned To</p>
                <p className="text-charcoal font-medium">
                  {selectedTicket.assignee ? `${selectedTicket.assignee.first_name} ${selectedTicket.assignee.last_name}` : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-pebble">Queue</p>
                <p className="text-charcoal font-medium">{selectedTicket.queue?.name || '-'}</p>
              </div>
            </div>

            <div>
              <p className="text-pebble text-sm mb-1">Description</p>
              <p className="text-sm text-charcoal whitespace-pre-wrap">{selectedTicket.description || 'No description'}</p>
            </div>

            {/* Quick status actions */}
            <div className="flex gap-2">
              {selectedTicket.status === 'open' && (
                <Button variant="secondary" size="sm" onClick={() => { handleUpdateStatus(selectedTicket.id, 'in_progress'); setSelectedTicket({ ...selectedTicket, status: 'in_progress' }) }}>
                  Start Progress
                </Button>
              )}
              {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                <Button variant="secondary" size="sm" onClick={() => { handleUpdateStatus(selectedTicket.id, 'resolved'); setSelectedTicket({ ...selectedTicket, status: 'resolved' }) }}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Resolve
                </Button>
              )}
            </div>

            {/* Comments Thread */}
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3">Comments ({comments.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-sage-mist rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-charcoal">
                        {comment.author ? `${comment.author.first_name} ${comment.author.last_name}` : 'System'}
                      </span>
                      <span className="text-xs text-pebble">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-olive-slate whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-pebble">No comments yet</p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>Send</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}
