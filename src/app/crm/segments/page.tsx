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
import { Plus, Search, Edit2, Trash2, Filter, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Organization {
  id: string
  name: string
  industry: string | null
  tier: string | null
  city: string | null
  icp_score: number | null
}

interface Segment {
  id: string
  name: string
  description: string
  segment_type: 'rule_based' | 'manual'
  rule_config: Record<string, unknown> | null
  is_active: boolean
}

interface SegmentMember {
  id: string
  segment_id: string
  organization_id: string
  icp_score: number | null
  added_at: string
  organization?: Organization
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [members, setMembers] = useState<SegmentMember[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [saving, setSaving] = useState(false)

  const [segmentForm, setSegmentForm] = useState({
    name: '',
    description: '',
    segment_type: 'manual' as Segment['segment_type'],
    rule_industry: '',
    rule_tier: '',
    rule_min_icp: '',
  })

  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
  const [orgSearch, setOrgSearch] = useState('')

  useEffect(() => {
    fetchSegments()
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedSegment) {
      fetchMembers(selectedSegment.id)
    }
  }, [selectedSegment])

  const fetchSegments = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('account_segments').select('*').order('name')
    if (data) setSegments(data)
    setLoading(false)
  }

  const fetchMembers = async (segmentId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('account_segment_members')
      .select('*, organization:organizations(id, name, industry, tier, city, icp_score)')
      .eq('segment_id', segmentId)
      .order('icp_score', { ascending: false })

    if (data) setMembers(data)
  }

  const fetchOrganizations = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('organizations').select('id, name, industry, tier, city, icp_score').order('name')
    if (data) setOrganizations(data)
  }

  const handleOpenModal = (segment?: Segment) => {
    if (segment) {
      setEditingSegment(segment)
      const rules = segment.rule_config as Record<string, string> | null
      setSegmentForm({
        name: segment.name,
        description: segment.description || '',
        segment_type: segment.segment_type,
        rule_industry: rules?.industry || '',
        rule_tier: rules?.tier || '',
        rule_min_icp: rules?.min_icp || '',
      })
    } else {
      setEditingSegment(null)
      setSegmentForm({
        name: '',
        description: '',
        segment_type: 'manual',
        rule_industry: '',
        rule_tier: '',
        rule_min_icp: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSaveSegment = async () => {
    setSaving(true)
    const supabase = createClient()

    let rule_config = null
    if (segmentForm.segment_type === 'rule_based') {
      rule_config = {}
      if (segmentForm.rule_industry) (rule_config as Record<string, string>).industry = segmentForm.rule_industry
      if (segmentForm.rule_tier) (rule_config as Record<string, string>).tier = segmentForm.rule_tier
      if (segmentForm.rule_min_icp) (rule_config as Record<string, string>).min_icp = segmentForm.rule_min_icp
    }

    const record = {
      name: segmentForm.name,
      description: segmentForm.description,
      segment_type: segmentForm.segment_type,
      rule_config,
      is_active: true,
    }

    if (editingSegment) {
      const { error } = await supabase.from('account_segments').update(record).eq('id', editingSegment.id)
      if (!error) {
        await fetchSegments()
        setIsModalOpen(false)
      }
    } else {
      const { error } = await supabase.from('account_segments').insert(record)
      if (!error) {
        await fetchSegments()
        setIsModalOpen(false)
      }
    }
    setSaving(false)
  }

  const handleDeleteSegment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) return
    const supabase = createClient()
    await supabase.from('account_segment_members').delete().eq('segment_id', id)
    await supabase.from('account_segments').delete().eq('id', id)
    if (selectedSegment?.id === id) setSelectedSegment(null)
    await fetchSegments()
  }

  const handleAddMembers = async () => {
    if (!selectedSegment || selectedOrgIds.length === 0) return
    setSaving(true)
    const supabase = createClient()

    const records = selectedOrgIds.map(orgId => ({
      segment_id: selectedSegment.id,
      organization_id: orgId,
      icp_score: organizations.find(o => o.id === orgId)?.icp_score || null,
      added_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('account_segment_members').insert(records)
    if (!error) {
      await fetchMembers(selectedSegment.id)
      setIsAddMemberModalOpen(false)
      setSelectedOrgIds([])
      setOrgSearch('')
    }
    setSaving(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedSegment) return
    const supabase = createClient()
    await supabase.from('account_segment_members').delete().eq('id', memberId)
    await fetchMembers(selectedSegment.id)
  }

  const formatRuleConfig = (config: Record<string, unknown> | null) => {
    if (!config || Object.keys(config).length === 0) return 'No rules defined'
    return Object.entries(config)
      .map(([key, value]) => `${key.replace('_', ' ')} = ${value}`)
      .join(' AND ')
  }

  const getICPScoreBar = (score: number | null) => {
    if (score === null) return <span className="text-pebble text-sm">-</span>
    const width = Math.min(100, Math.max(0, score))
    const color = score >= 80 ? 'bg-forest-depths' : score >= 50 ? 'bg-cobalt-ink' : 'bg-wine-shadow'
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-bone rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
        </div>
        <span className="text-sm font-medium text-charcoal">{score}</span>
      </div>
    )
  }

  const segmentColumns: Column<Segment>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <button
          onClick={() => setSelectedSegment(item)}
          className="text-sm font-medium text-cobalt-ink hover:underline"
        >
          {item.name}
        </button>
      ),
    },
    {
      key: 'segment_type',
      header: 'Type',
      render: (item) => (
        <Badge variant={item.segment_type === 'rule_based' ? 'info' : 'default'}>
          {item.segment_type === 'rule_based' ? 'Rule-Based' : 'Manual'}
        </Badge>
      ),
    },
    {
      key: 'member_count',
      header: 'Member Count',
      render: (item) => {
        const count = members.filter(m => m.segment_id === item.id).length
        return <span className="text-sm font-medium text-charcoal">{count}</span>
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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteSegment(item.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const memberColumns: Column<SegmentMember>[] = [
    {
      key: 'organization',
      header: 'Account',
      render: (item) => item.organization ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-wash rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-cobalt-ink">{item.organization.name[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-charcoal">{item.organization.name}</p>
            <p className="text-xs text-pebble">{item.organization.industry || 'No industry'} · {item.organization.city || '-'}</p>
          </div>
        </div>
      ) : <span className="text-pebble text-sm">Unknown</span>,
    },
    {
      key: 'icp_score',
      header: 'ICP Score',
      render: (item) => getICPScoreBar(item.icp_score),
    },
    {
      key: 'added_at',
      header: 'Added',
      render: (item) => (
        <span className="text-sm text-olive-slate">
          {new Date(item.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => selectedSegment?.segment_type === 'manual' ? (
        <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(item.id)}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      ) : null,
    },
  ]

  const filteredSegments = segments.filter(s =>
    searchTerm === '' || s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalMembers = members.length
  const ruleBasedCount = segments.filter(s => s.segment_type === 'rule_based').length
  const manualCount = segments.filter(s => s.segment_type === 'manual').length

  const filteredOrgs = organizations.filter(o =>
    orgSearch === '' || o.name.toLowerCase().includes(orgSearch.toLowerCase())
  ).filter(o => !members.some(m => m.organization_id === o.id))

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">Account Segmentation</h1>
            <p className="text-olive-slate mt-1">Segment accounts for targeted sales strategies</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Segment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Segments</p>
              <p className="text-2xl font-bold text-cobalt-ink">{segments.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Rule-Based</p>
              <p className="text-2xl font-bold text-forest-depths">{ruleBasedCount}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Manual</p>
              <p className="text-2xl font-bold text-plum-depth">{manualCount}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Total Members</p>
              <p className="text-2xl font-bold text-wine-shadow">{totalMembers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Segments + Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Segments List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
                  <input
                    type="text"
                    placeholder="Search segments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="coda-input pl-10"
                  />
                </div>
              </CardContent>
            </Card>
            <DataTable
              columns={segmentColumns}
              data={filteredSegments}
              loading={loading}
              emptyMessage="No segments yet"
            />
          </div>

          {/* Member Details */}
          <div className="lg:col-span-2">
            {selectedSegment ? (
              <div className="space-y-4">
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="text-lg font-semibold text-charcoal">{selectedSegment.name}</h2>
                        {selectedSegment.description && (
                          <p className="text-sm text-olive-slate mt-1">{selectedSegment.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {selectedSegment.segment_type === 'manual' && (
                          <Button size="sm" onClick={() => { setSelectedOrgIds([]); setOrgSearch(''); setIsAddMemberModalOpen(true) }}>
                            <Plus className="w-4 h-4 mr-1" /> Add Accounts
                          </Button>
                        )}
                      </div>
                    </div>
                    {selectedSegment.segment_type === 'rule_based' && selectedSegment.rule_config && (
                      <div className="bg-sage-mist rounded-lg p-3">
                        <p className="text-xs text-pebble mb-1">Rules</p>
                        <p className="text-sm text-charcoal font-mono">{formatRuleConfig(selectedSegment.rule_config)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <DataTable
                  columns={memberColumns}
                  data={members}
                  loading={loading}
                  emptyMessage="No accounts in this segment"
                />
              </div>
            ) : (
              <Card>
                <CardContent>
                  <div className="text-center py-12">
                    <Filter className="w-12 h-12 text-pebble mx-auto mb-3" />
                    <p className="text-olive-slate">Select a segment to view its member accounts</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Segment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSegment ? 'Edit Segment' : 'Create Segment'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Segment Name"
            placeholder="e.g. High-Value Banking Accounts"
            value={segmentForm.name}
            onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Brief description of this segment..."
            value={segmentForm.description}
            onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
            rows={2}
          />
          <Select
            label="Segment Type"
            value={segmentForm.segment_type}
            onChange={(e) => setSegmentForm({ ...segmentForm, segment_type: e.target.value as Segment['segment_type'] })}
            options={[
              { value: 'manual', label: 'Manual (add accounts manually)' },
              { value: 'rule_based', label: 'Rule-Based (auto-match criteria)' },
            ]}
          />

          {segmentForm.segment_type === 'rule_based' && (
            <div className="space-y-3 bg-sage-mist rounded-lg p-4">
              <p className="text-sm font-medium text-charcoal">Matching Rules</p>
              <Input
                label="Industry"
                placeholder="e.g. Banking, Healthcare"
                value={segmentForm.rule_industry}
                onChange={(e) => setSegmentForm({ ...segmentForm, rule_industry: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tier"
                  value={segmentForm.rule_tier}
                  onChange={(e) => setSegmentForm({ ...segmentForm, rule_tier: e.target.value })}
                  options={[
                    { value: '', label: 'Any' },
                    { value: 'enterprise', label: 'Enterprise' },
                    { value: 'mid_market', label: 'Mid-Market' },
                    { value: 'smb', label: 'SMB' },
                  ]}
                />
                <Input
                  label="Min ICP Score"
                  type="number"
                  placeholder="0-100"
                  value={segmentForm.rule_min_icp}
                  onChange={(e) => setSegmentForm({ ...segmentForm, rule_min_icp: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSegment} disabled={saving || !segmentForm.name}>
              {saving ? 'Saving...' : editingSegment ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Members Modal (Manual Segments) */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Add Accounts to Segment"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Search Accounts"
            placeholder="Search by name, industry, or city..."
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
          />

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {filteredOrgs.length === 0 ? (
              <p className="text-sm text-pebble p-4 text-center">No matching accounts</p>
            ) : (
              <div className="divide-y">
                {filteredOrgs.map((org) => (
                  <label key={org.id} className="flex items-center gap-3 p-3 hover:bg-sage-mist cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOrgIds.includes(org.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrgIds([...selectedOrgIds, org.id])
                        } else {
                          setSelectedOrgIds(selectedOrgIds.filter(id => id !== org.id))
                        }
                      }}
                      className="rounded border-pebble"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal">{org.name}</p>
                      <p className="text-xs text-pebble">{org.industry || '-'} · {org.city || '-'} · ICP: {org.icp_score ?? '-'}</p>
                    </div>
                    {org.icp_score !== null && getICPScoreBar(org.icp_score)}
                  </label>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-pebble">{selectedOrgIds.length} account(s) selected</p>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddMemberModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMembers} disabled={saving || selectedOrgIds.length === 0}>
              {saving ? 'Adding...' : `Add ${selectedOrgIds.length} Account(s)`}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
