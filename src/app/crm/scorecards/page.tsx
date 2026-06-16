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
import { Plus, Search, Edit2, Trash2, Target, Award } from 'lucide-react'

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface Scorecard {
  id: string
  employee_id: string
  period_type: string
  period_start: string
  period_end: string
  attainment_pct: number
  pipeline_coverage_pct: number
  activity_count: number
  opportunities_created: number
  opportunities_won: number
  opportunities_lost: number
  win_rate: number
  employees?: Employee
}

interface CoachingSession {
  id: string
  employee_id: string
  manager_id: string
  session_date: string
  notes: string
  status: 'scheduled' | 'completed' | 'cancelled'
  employees?: Employee
  manager?: Employee
  action_items?: CoachingActionItem[]
}

interface CoachingActionItem {
  id: string
  session_id: string
  title: string
  description: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed'
  linked_metric: string
}

export default function ScorecardsPage() {
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [sessions, setSessions] = useState<CoachingSession[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    employee_id: '',
    manager_id: '',
    session_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'scheduled' as CoachingSession['status'],
  })
  const [actionItems, setActionItems] = useState<Array<{
    title: string
    description: string
    due_date: string
    linked_metric: string
  }>>([])

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchScorecards(),
      fetchSessions(),
      fetchEmployees(),
    ])
    setLoading(false)
  }

  const fetchScorecards = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('scorecards')
      .select('*, employees(id, first_name, last_name)')
      .order('period_start', { ascending: false })
    if (data) setScorecards(data)
  }

  const fetchSessions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('coaching_sessions')
      .select('*, employees!coaching_sessions_employee_id_fkey(id, first_name, last_name), manager:employees!coaching_sessions_manager_id_fkey(id, first_name, last_name), action_items:coaching_action_items(*)')
      .order('session_date', { ascending: false })
    if (data) setSessions(data)
  }

  const fetchEmployees = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .order('first_name')
    if (data) setEmployees(data)
  }

  const handleOpenSessionModal = () => {
    setSessionForm({
      employee_id: '',
      manager_id: '',
      session_date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'scheduled',
    })
    setActionItems([])
    setIsSessionModalOpen(true)
  }

  const addActionItem = () => {
    setActionItems([...actionItems, { title: '', description: '', due_date: '', linked_metric: '' }])
  }

  const updateActionItem = (index: number, field: string, value: string) => {
    const updated = [...actionItems]
    ;(updated[index] as Record<string, string>)[field] = value
    setActionItems(updated)
  }

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index))
  }

  const handleSaveSession = async () => {
    setSaving(true)
    const supabase = createClient()

    const sessionPayload = {
      employee_id: sessionForm.employee_id,
      manager_id: sessionForm.manager_id || null,
      session_date: sessionForm.session_date,
      notes: sessionForm.notes,
      status: sessionForm.status,
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('coaching_sessions')
      .insert(sessionPayload)
      .select()
      .single()

    if (!sessionError && sessionData && actionItems.length > 0) {
      const items = actionItems
        .filter(ai => ai.title)
        .map(ai => ({
          session_id: sessionData.id,
          title: ai.title,
          description: ai.description,
          due_date: ai.due_date || null,
          status: 'pending' as const,
          linked_metric: ai.linked_metric || null,
        }))
      if (items.length > 0) {
        await supabase.from('coaching_action_items').insert(items)
      }
    }

    if (!sessionError) {
      await fetchSessions()
      setIsSessionModalOpen(false)
    }
    setSaving(false)
  }

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Delete this coaching session and its action items?')) return
    const supabase = createClient()
    await supabase.from('coaching_action_items').delete().eq('session_id', id)
    const { error } = await supabase.from('coaching_sessions').delete().eq('id', id)
    if (!error) await fetchSessions()
  }

  const handleToggleActionItem = async (item: CoachingActionItem) => {
    const supabase = createClient()
    const nextStatus = item.status === 'completed' ? 'pending' : item.status === 'pending' ? 'in_progress' : 'completed'
    const { error } = await supabase
      .from('coaching_action_items')
      .update({ status: nextStatus })
      .eq('id', item.id)
    if (!error) await fetchSessions()
  }

  const getAttainmentColor = (pct: number) => {
    if (pct >= 100) return 'text-forest-depths'
    if (pct >= 70) return 'text-amber-600'
    return 'text-wine-shadow'
  }

  const getAttainmentBadge = (pct: number) => {
    if (pct >= 100) return <Badge variant="success">{pct}%</Badge>
    if (pct >= 70) return <Badge variant="warning">{pct}%</Badge>
    return <Badge variant="error">{pct}%</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      scheduled: 'info',
      completed: 'success',
      cancelled: 'default',
      pending: 'warning',
      in_progress: 'info',
    }
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
  }

  const teamAvgAttainment = scorecards.length > 0
    ? Math.round(scorecards.reduce((sum, s) => sum + s.attainment_pct, 0) / scorecards.length)
    : 0
  const totalSessions = sessions.length
  const openActionItems = sessions.reduce((count, s) =>
    count + (s.action_items?.filter(ai => ai.status !== 'completed').length || 0), 0)
  const bestWinRate = scorecards.length > 0
    ? Math.max(...scorecards.map(s => s.win_rate))
    : 0

  const scorecardColumns: Column<Scorecard>[] = [
    {
      key: 'employee_id',
      header: 'Rep',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mint-sprout rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-forest-depths">
              {item.employees?.first_name?.[0]}{item.employees?.last_name?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-charcoal">{item.employees?.first_name} {item.employees?.last_name}</p>
            <p className="text-xs text-pebble">{item.period_type} • {item.period_start}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'attainment_pct',
      header: 'Attainment %',
      render: (item) => getAttainmentBadge(item.attainment_pct),
    },
    {
      key: 'pipeline_coverage_pct',
      header: 'Pipeline Coverage',
      render: (item) => <span className="text-sm text-charcoal">{item.pipeline_coverage_pct}x</span>,
    },
    {
      key: 'win_rate',
      header: 'Win Rate',
      render: (item) => <span className="text-sm font-medium text-cobalt-ink">{item.win_rate}%</span>,
    },
    {
      key: 'opportunities_created',
      header: 'Created',
      render: (item) => <span className="text-sm text-charcoal">{item.opportunities_created}</span>,
    },
    {
      key: 'opportunities_won',
      header: 'Won',
      render: (item) => <span className="text-sm font-semibold text-forest-depths">{item.opportunities_won}</span>,
    },
    {
      key: 'opportunities_lost',
      header: 'Lost',
      render: (item) => <span className="text-sm text-wine-shadow">{item.opportunities_lost}</span>,
    },
    {
      key: 'activity_count',
      header: 'Activities',
      render: (item) => <span className="text-sm text-pebble">{item.activity_count}</span>,
    },
  ]

  const filteredScorecards = scorecards.filter((s) => {
    const matchesSearch = searchTerm === '' ||
      `${s.employees?.first_name} ${s.employees?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPeriod = periodFilter === '' || s.period_type === periodFilter
    return matchesSearch && matchesPeriod
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Sales Performance Management
            </h1>
            <p className="text-olive-slate mt-1">
              Track scorecards and manage coaching sessions
            </p>
          </div>
          <Button onClick={handleOpenSessionModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Session
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Team Avg Attainment</p>
              <p className={`text-2xl font-bold ${getAttainmentColor(teamAvgAttainment)}`}>{teamAvgAttainment}%</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Sessions</p>
              <p className="text-2xl font-bold text-cobalt-ink">{totalSessions}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Open Action Items</p>
              <p className="text-2xl font-bold text-wine-shadow">{openActionItems}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Best Win Rate</p>
              <p className="text-2xl font-bold text-plum-depth">{bestWinRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Scorecards Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
            <Target className="w-5 h-5 text-cobalt-ink" />
            Scorecards
          </h2>
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
                  <input
                    type="text"
                    placeholder="Search by rep name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="coda-input pl-10"
                  />
                </div>
                <Select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Periods' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'annual', label: 'Annual' },
                  ]}
                  placeholder="Filter by period"
                />
              </div>
            </CardContent>
          </Card>
          <DataTable
            columns={scorecardColumns}
            data={filteredScorecards}
            loading={loading}
            emptyMessage="No scorecards found"
          />
        </div>

        {/* Coaching Sessions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
            <Award className="w-5 h-5 text-plum-depth" />
            Coaching Sessions
          </h2>
          {sessions.length === 0 && !loading && (
            <Card>
              <CardContent>
                <p className="text-pebble text-center py-8">No coaching sessions yet. Click "Add Session" to create one.</p>
              </CardContent>
            </Card>
          )}
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-charcoal">
                        {session.employees?.first_name} {session.employees?.last_name}
                      </h3>
                      {getStatusBadge(session.status)}
                    </div>
                    <p className="text-sm text-pebble mt-1">
                      {session.session_date} • Manager: {session.manager?.first_name} {session.manager?.last_name || 'Unassigned'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSession(session.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                {session.notes && (
                  <p className="text-sm text-olive-slate mb-3 bg-bone rounded-lg p-3">{session.notes}</p>
                )}
                {session.action_items && session.action_items.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-sage-mist">
                    <p className="text-xs font-semibold text-pebble uppercase tracking-wide">Action Items</p>
                    {session.action_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-bone rounded-lg p-3">
                        <button
                          onClick={() => handleToggleActionItem(item)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            item.status === 'completed'
                              ? 'bg-forest-depths border-forest-depths text-white'
                              : item.status === 'in_progress'
                              ? 'bg-cobalt-ink border-cobalt-ink text-white'
                              : 'border-pebble'
                          }`}
                        >
                          {item.status === 'completed' && '✓'}
                          {item.status === 'in_progress' && '→'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${item.status === 'completed' ? 'line-through text-pebble' : 'text-charcoal'}`}>
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-pebble">{item.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {item.due_date && (
                              <span className="text-xs text-pebble">Due: {item.due_date}</span>
                            )}
                            {item.linked_metric && (
                              <Badge variant="info">{item.linked_metric}</Badge>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title="Add Coaching Session"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Employee"
            value={sessionForm.employee_id}
            onChange={(e) => setSessionForm({ ...sessionForm, employee_id: e.target.value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
            }))}
            placeholder="Select employee..."
          />
          <Select
            label="Manager"
            value={sessionForm.manager_id}
            onChange={(e) => setSessionForm({ ...sessionForm, manager_id: e.target.value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
            }))}
            placeholder="Select manager..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Session Date"
              type="date"
              value={sessionForm.session_date}
              onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
            />
            <Select
              label="Status"
              value={sessionForm.status}
              onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value as CoachingSession['status'] })}
              options={[
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
          <Textarea
            label="Session Notes"
            placeholder="Key discussion points, feedback, goals..."
            value={sessionForm.notes}
            onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
          />

          {/* Action Items */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-charcoal">Action Items</p>
              <Button variant="ghost" size="sm" onClick={addActionItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
            {actionItems.length === 0 && (
              <p className="text-sm text-pebble text-center py-4 bg-bone rounded-lg">No action items added yet.</p>
            )}
            {actionItems.map((item, index) => (
              <div key={index} className="bg-bone rounded-lg p-4 mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-pebble">Item {index + 1}</p>
                  <Button variant="ghost" size="sm" onClick={() => removeActionItem(index)}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
                <Input
                  label="Title"
                  placeholder="e.g. Increase daily calls to 30"
                  value={item.title}
                  onChange={(e) => updateActionItem(index, 'title', e.target.value)}
                />
                <Textarea
                  label="Description"
                  placeholder="Optional details..."
                  value={item.description}
                  onChange={(e) => updateActionItem(index, 'description', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Due Date"
                    type="date"
                    value={item.due_date}
                    onChange={(e) => updateActionItem(index, 'due_date', e.target.value)}
                  />
                  <Input
                    label="Linked Metric"
                    placeholder="e.g. activity_count"
                    value={item.linked_metric}
                    onChange={(e) => updateActionItem(index, 'linked_metric', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsSessionModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSession} disabled={saving || !sessionForm.employee_id}>
              {saving ? 'Saving...' : 'Create Session'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
