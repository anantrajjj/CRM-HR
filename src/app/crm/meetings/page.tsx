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
import { Plus, Search, Video, Edit2, Calendar, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Deal {
  id: string
  title: string
}

interface Organization {
  id: string
  name: string
}

interface Meeting {
  id: string
  opportunity_id: string | null
  account_id: string | null
  title: string
  meeting_platform: 'zoom' | 'teams' | 'google_meet' | 'webex' | 'other'
  meeting_url: string | null
  recording_url: string | null
  attendees: string[] | null
  scheduled_at: string
  duration_minutes: number
  disposition: 'advanced' | 'no_decision' | 'no_show' | 'won' | 'lost' | 'rescheduled' | null
  outcome_notes: string | null
  next_steps: string | null
  created_at: string
  deal?: Deal
  account?: Organization
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [formData, setFormData] = useState({
    opportunity_id: '',
    account_id: '',
    title: '',
    meeting_platform: 'zoom' as Meeting['meeting_platform'],
    meeting_url: '',
    recording_url: '',
    attendees: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '30',
    disposition: '',
    outcome_notes: '',
    next_steps: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMeetings()
    fetchDeals()
    fetchOrganizations()
  }, [])

  const fetchMeetings = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('meetings')
      .select('*, deal:deals(id, title), account:organizations(id, name)')
      .order('scheduled_at', { ascending: false })

    if (data) {
      setMeetings(data)
    }
    setLoading(false)
  }

  const fetchDeals = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('deals').select('id, title').order('title')
    if (data) setDeals(data)
  }

  const fetchOrganizations = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('organizations').select('id, name').order('name')
    if (data) setOrganizations(data)
  }

  const handleOpenModal = (meeting?: Meeting) => {
    if (meeting) {
      setEditingMeeting(meeting)
      const scheduled = new Date(meeting.scheduled_at)
      setFormData({
        opportunity_id: meeting.opportunity_id || '',
        account_id: meeting.account_id || '',
        title: meeting.title,
        meeting_platform: meeting.meeting_platform,
        meeting_url: meeting.meeting_url || '',
        recording_url: meeting.recording_url || '',
        attendees: meeting.attendees?.join(', ') || '',
        scheduled_date: scheduled.toISOString().split('T')[0],
        scheduled_time: scheduled.toTimeString().slice(0, 5),
        duration_minutes: meeting.duration_minutes?.toString() || '30',
        disposition: meeting.disposition || '',
        outcome_notes: meeting.outcome_notes || '',
        next_steps: meeting.next_steps || '',
      })
    } else {
      setEditingMeeting(null)
      const now = new Date()
      now.setMinutes(now.getMinutes() + 30)
      setFormData({
        opportunity_id: '',
        account_id: '',
        title: '',
        meeting_platform: 'zoom',
        meeting_url: '',
        recording_url: '',
        attendees: '',
        scheduled_date: now.toISOString().split('T')[0],
        scheduled_time: now.toTimeString().slice(0, 5),
        duration_minutes: '30',
        disposition: '',
        outcome_notes: '',
        next_steps: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingMeeting(null)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const scheduled_at = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString()

    const record = {
      opportunity_id: formData.opportunity_id || null,
      account_id: formData.account_id || null,
      title: formData.title,
      meeting_platform: formData.meeting_platform,
      meeting_url: formData.meeting_url || null,
      recording_url: formData.recording_url || null,
      attendees: formData.attendees ? formData.attendees.split(',').map(a => a.trim()).filter(Boolean) : null,
      scheduled_at,
      duration_minutes: parseInt(formData.duration_minutes) || 30,
      disposition: formData.disposition || null,
      outcome_notes: formData.outcome_notes || null,
      next_steps: formData.next_steps || null,
    }

    if (editingMeeting) {
      const { error } = await supabase.from('meetings').update(record).eq('id', editingMeeting.id)
      if (!error) {
        await fetchMeetings()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase.from('meetings').insert(record)
      if (!error) {
        await fetchMeetings()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const getPlatformBadge = (platform: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      zoom: 'info',
      teams: 'success',
      google_meet: 'warning',
      webex: 'default',
      other: 'default',
    }
    const icons: Record<string, string> = {
      zoom: 'Z',
      teams: 'T',
      google_meet: 'G',
      webex: 'W',
      other: '?',
    }
    return (
      <Badge variant={variants[platform]}>
        <span className="font-mono text-xs mr-1">{icons[platform]}</span>
        {platform.replace('_', ' ')}
      </Badge>
    )
  }

  const getDispositionBadge = (disposition: string | null) => {
    if (!disposition) return <Badge variant="default">-</Badge>
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      advanced: 'success',
      no_decision: 'warning',
      no_show: 'error',
      won: 'success',
      lost: 'error',
      rescheduled: 'info',
    }
    return <Badge variant={variants[disposition]}>{disposition.replace('_', ' ')}</Badge>
  }

  const columns: Column<Meeting>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-charcoal">{item.title}</p>
          {item.account && <p className="text-xs text-pebble">{item.account.name}</p>}
        </div>
      ),
    },
    {
      key: 'meeting_platform',
      header: 'Platform',
      render: (item) => getPlatformBadge(item.meeting_platform),
    },
    {
      key: 'scheduled_at',
      header: 'Scheduled At',
      render: (item) => (
        <div className="text-sm">
          <p className="text-charcoal">{new Date(item.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <p className="text-xs text-pebble">{new Date(item.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
        </div>
      ),
    },
    {
      key: 'duration_minutes',
      header: 'Duration',
      render: (item) => <span className="text-sm text-olive-slate">{item.duration_minutes}m</span>,
    },
    {
      key: 'opportunity_id',
      header: 'Opportunity',
      render: (item) => item.deal ? (
        <span className="text-sm text-cobalt-ink">{item.deal.title}</span>
      ) : <span className="text-pebble text-sm">-</span>,
    },
    {
      key: 'disposition',
      header: 'Disposition',
      render: (item) => getDispositionBadge(item.disposition),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>
          <Edit2 className="w-4 h-4" />
        </Button>
      ),
    },
  ]

  const now = new Date()
  const upcomingMeetings = meetings.filter(m => new Date(m.scheduled_at) > now)
  const pastMeetings = meetings.filter(m => new Date(m.scheduled_at) <= now)
  const thisWeekEnd = new Date()
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)
  const thisWeekMeetings = meetings.filter(m => {
    const d = new Date(m.scheduled_at)
    return d >= now && d <= thisWeekEnd
  })
  const completedMeetings = meetings.filter(m => m.disposition && ['won', 'lost', 'advanced', 'no_decision'].includes(m.disposition))

  const filteredMeetings = meetings.filter((meeting) => {
    return searchTerm === '' ||
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.account?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.deal?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">Meetings</h1>
            <p className="text-olive-slate mt-1">Schedule and track virtual selling meetings</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Meetings</p>
              <p className="text-2xl font-bold text-cobalt-ink">{meetings.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Upcoming</p>
              <p className="text-2xl font-bold text-forest-depths">{upcomingMeetings.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">This Week</p>
              <p className="text-2xl font-bold text-plum-depth">{thisWeekMeetings.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Completed</p>
              <p className="text-2xl font-bold text-wine-shadow">{completedMeetings.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Meetings Quick View */}
        {upcomingMeetings.length > 0 && (
          <Card>
            <CardContent>
              <h3 className="text-sm font-semibold text-charcoal mb-3">Upcoming Meetings</h3>
              <div className="space-y-2">
                {upcomingMeetings.slice(0, 5).map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-2 bg-sage-mist rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="w-4 h-4 text-cobalt-ink" />
                      <div>
                        <p className="text-sm font-medium text-charcoal">{meeting.title}</p>
                        <p className="text-xs text-pebble">
                          {new Date(meeting.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          {' · '}{meeting.duration_minutes}m
                          {meeting.account ? ` · ${meeting.account.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(meeting)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
              <input
                type="text"
                placeholder="Search meetings by title, account, or opportunity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="coda-input pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredMeetings}
          loading={loading}
          emptyMessage="No meetings found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Meeting title..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Platform"
              value={formData.meeting_platform}
              onChange={(e) => setFormData({ ...formData, meeting_platform: e.target.value as Meeting['meeting_platform'] })}
              options={[
                { value: 'zoom', label: 'Zoom' },
                { value: 'teams', label: 'Microsoft Teams' },
                { value: 'google_meet', label: 'Google Meet' },
                { value: 'webex', label: 'Webex' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Input
              label="Meeting URL"
              placeholder="https://..."
              value={formData.meeting_url}
              onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
            />
          </div>
          <Input
            label="Attendees"
            placeholder="Comma-separated names or emails..."
            value={formData.attendees}
            onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            />
            <Input
              label="Time"
              type="time"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
            />
            <Input
              label="Duration (min)"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Related Deal"
              value={formData.opportunity_id}
              onChange={(e) => setFormData({ ...formData, opportunity_id: e.target.value })}
              options={deals.map(d => ({ value: d.id, label: d.title }))}
              placeholder="Select deal..."
            />
            <Select
              label="Account"
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              options={organizations.map(o => ({ value: o.id, label: o.name }))}
              placeholder="Select account..."
            />
          </div>

          {/* Disposition fields (shown for past meetings or when editing) */}
          {(editingMeeting || new Date(`${formData.scheduled_date}T${formData.scheduled_time}`) <= now) && (
            <>
              <Select
                label="Disposition"
                value={formData.disposition}
                onChange={(e) => setFormData({ ...formData, disposition: e.target.value })}
                options={[
                  { value: '', label: 'Not set' },
                  { value: 'advanced', label: 'Advanced' },
                  { value: 'no_decision', label: 'No Decision' },
                  { value: 'no_show', label: 'No Show' },
                  { value: 'won', label: 'Won' },
                  { value: 'lost', label: 'Lost' },
                  { value: 'rescheduled', label: 'Rescheduled' },
                ]}
              />
              <Textarea
                label="Outcome Notes"
                placeholder="Summary of meeting outcome..."
                value={formData.outcome_notes}
                onChange={(e) => setFormData({ ...formData, outcome_notes: e.target.value })}
                rows={3}
              />
              <Textarea
                label="Next Steps"
                placeholder="Action items and follow-ups..."
                value={formData.next_steps}
                onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                rows={3}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.title}>
              {saving ? 'Saving...' : editingMeeting ? 'Update' : 'Schedule'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
