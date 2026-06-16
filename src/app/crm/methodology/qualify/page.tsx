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
import { Plus, Search, Edit2, Trash2, CheckCircle, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Deal {
  id: string
  title: string
  amount: number
  status: 'open' | 'won' | 'lost'
  contacts?: { first_name: string; last_name: string } | { first_name: string; last_name: string }[]
  organizations?: { name: string } | { name: string }[]
}

interface MethodologyFramework {
  id: string
  name: string
  short_name: string
  is_active: boolean
}

interface MethodologySlot {
  id: string
  framework_id: string
  code: string
  label: string
  description: string
  is_required: boolean
  slot_order: number
}

interface OpportunityMethodology {
  id: string
  opportunity_id: string
  framework_id: string
  status: 'in_progress' | 'completed'
  adherence_pct: number
  verdict: 'qualified' | 'at_risk' | 'disqualified'
  created_at: string
  deals?: { title: string }
  methodology_frameworks?: { name: string; short_name: string }
}

interface OpportunityMethodologySlot {
  id: string
  qualification_id: string
  slot_id: string
  status: 'empty' | 'in_progress' | 'filled' | 'not_applicable'
  content: string
  methodology_slots?: { code: string; label: string; is_required: boolean; slot_order: number }
}

export default function QualifyPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [frameworks, setFrameworks] = useState<MethodologyFramework[]>([])
  const [frameworkSlots, setFrameworkSlots] = useState<MethodologySlot[]>([])
  const [qualifications, setQualifications] = useState<OpportunityMethodology[]>([])
  const [qualSlots, setQualSlots] = useState<OpportunityMethodologySlot[]>([])

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [verdictFilter, setVerdictFilter] = useState('')

  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [selectedFrameworkId, setSelectedFrameworkId] = useState('')
  const [existingQualification, setExistingQualification] = useState<OpportunityMethodology | null>(null)

  const [slotValues, setSlotValues] = useState<Record<string, { status: string; content: string }>>({})
  const [verdict, setVerdict] = useState<'qualified' | 'at_risk' | 'disqualified'>('in_progress' as any)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDeals()
    fetchFrameworks()
    fetchQualifications()
  }, [])

  const fetchDeals = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('deals')
      .select('id, title, amount, status, contacts(first_name, last_name), organizations(name)')
      .eq('status', 'open')
      .order('title')

    if (data) {
      setDeals(data)
    }
    setLoading(false)
  }

  const fetchFrameworks = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('methodology_frameworks')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (data) {
      setFrameworks(data)
    }
  }

  const fetchFrameworkSlots = async (frameworkId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('methodology_slots')
      .select('*')
      .eq('framework_id', frameworkId)
      .order('slot_order')

    if (data) {
      setFrameworkSlots(data)
    } else {
      setFrameworkSlots([])
    }
  }

  const fetchQualifications = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('opportunity_methodology')
      .select('*, deals(title), methodology_frameworks(name, short_name)')
      .order('created_at', { ascending: false })

    if (data) {
      setQualifications(data)
    }
  }

  const fetchQualSlots = async (qualificationId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('opportunity_methodology_slots')
      .select('*, methodology_slots(code, label, is_required, slot_order)')
      .eq('qualification_id', qualificationId)
      .order('methodology_slots(slot_order)')

    return data || []
  }

  const calculateAdherence = (frameworkId: string, currentSlotValues: Record<string, { status: string; content: string }>) => {
    const requiredSlots = frameworkSlots.filter((s) => s.framework_id === frameworkId && s.is_required)
    if (requiredSlots.length === 0) return 0

    const filledRequired = requiredSlots.filter((s) => {
      const val = currentSlotValues[s.id]
      return val && val.status === 'filled' && val.content.trim() !== ''
    })

    return Math.round((filledRequired.length / requiredSlots.length) * 100)
  }

  const handleOpenQualifyModal = async (deal: Deal) => {
    setSelectedDeal(deal)

    const existing = qualifications.find((q) => q.opportunity_id === deal.id)
    if (existing) {
      setExistingQualification(existing)
      setSelectedFrameworkId(existing.framework_id)
      await fetchFrameworkSlots(existing.framework_id)
      const existingSlots = await fetchQualSlots(existing.id)
      const values: Record<string, { status: string; content: string }> = {}
      existingSlots.forEach((qs) => {
        values[qs.slot_id] = { status: qs.status, content: qs.content || '' }
      })
      setSlotValues(values)
      setVerdict(existing.verdict as any)
    } else {
      setExistingQualification(null)
      setSelectedFrameworkId('')
      setFrameworkSlots([])
      setSlotValues({})
      setVerdict('in_progress' as any)
    }

    setIsQualifyModalOpen(true)
  }

  const handleCloseQualifyModal = () => {
    setIsQualifyModalOpen(false)
    setSelectedDeal(null)
    setSelectedFrameworkId('')
    setExistingQualification(null)
    setFrameworkSlots([])
    setSlotValues({})
    setVerdict('in_progress' as any)
  }

  const handleFrameworkSelect = async (frameworkId: string) => {
    setSelectedFrameworkId(frameworkId)
    await fetchFrameworkSlots(frameworkId)

    const values: Record<string, { status: string; content: string }> = {}
    frameworkSlots.forEach((s) => {
      if (s.framework_id === frameworkId) {
        values[s.id] = { status: 'empty', content: '' }
      }
    })
    setSlotValues(values)
    setVerdict('in_progress' as any)
  }

  const updateSlotValue = (slotId: string, field: 'status' | 'content', value: string) => {
    setSlotValues((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        [field]: value,
      },
    }))
  }

  const handleSaveQualification = async () => {
    if (!selectedDeal || !selectedFrameworkId) return
    setSaving(true)

    const supabase = createClient()
    const adherence = calculateAdherence(selectedFrameworkId, slotValues)

    let finalVerdict: 'qualified' | 'at_risk' | 'disqualified' = 'in_progress' as any
    if (adherence >= 80) finalVerdict = 'qualified'
    else if (adherence >= 50) finalVerdict = 'at_risk'
    else finalVerdict = 'disqualified'
    if (verdict !== ('in_progress' as any)) {
      finalVerdict = verdict
    }

    const qualRecord = {
      opportunity_id: selectedDeal.id,
      framework_id: selectedFrameworkId,
      status: 'completed' as const,
      adherence_pct: adherence,
      verdict: finalVerdict,
    }

    let qualificationId = existingQualification?.id

    if (existingQualification) {
      const { error } = await supabase
        .from('opportunity_methodology')
        .update(qualRecord)
        .eq('id', existingQualification.id)

      if (error) {
        setSaving(false)
        return
      }
      qualificationId = existingQualification.id
    } else {
      const { data, error } = await supabase
        .from('opportunity_methodology')
        .insert(qualRecord)
        .select('id')
        .single()

      if (error || !data) {
        setSaving(false)
        return
      }
      qualificationId = data.id
    }

    if (qualificationId) {
      await supabase
        .from('opportunity_methodology_slots')
        .delete()
        .eq('qualification_id', qualificationId)

      const slotInserts = Object.entries(slotValues).map(([slotId, val]) => ({
        qualification_id: qualificationId,
        slot_id: slotId,
        status: val.status,
        content: val.content || null,
      }))

      if (slotInserts.length > 0) {
        await supabase
          .from('opportunity_methodology_slots')
          .insert(slotInserts)
      }
    }

    await fetchQualifications()
    handleCloseQualifyModal()
    setSaving(false)
  }

  const handleDeleteQualification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this qualification?')) return

    const supabase = createClient()
    await supabase
      .from('opportunity_methodology_slots')
      .delete()
      .eq('qualification_id', id)

    const { error } = await supabase
      .from('opportunity_methodology')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchQualifications()
    }
  }

  const getVerdictBadge = (verdict: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      qualified: 'success',
      at_risk: 'warning',
      disqualified: 'error',
      in_progress: 'info',
    }
    return <Badge variant={variants[verdict] || 'default'}>{verdict.replace('_', ' ')}</Badge>
  }

  const getAdherenceColor = (pct: number) => {
    if (pct >= 80) return 'text-forest-depths'
    if (pct >= 50) return 'text-amber-600'
    return 'text-wine-shadow'
  }

  const totalQualified = qualifications.filter((q) => q.verdict === 'qualified').length
  const avgAdherence = qualifications.length > 0
    ? Math.round(qualifications.reduce((sum, q) => sum + (q.adherence_pct || 0), 0) / qualifications.length)
    : 0
  const atRiskCount = qualifications.filter((q) => q.verdict === 'at_risk').length
  const disqualifiedCount = qualifications.filter((q) => q.verdict === 'disqualified').length

  const qualificationColumns: Column<OpportunityMethodology>[] = [
    {
      key: 'opportunity_id',
      header: 'Opportunity',
      render: (item) => (
        <div>
          <p className="font-medium text-charcoal">{item.deals?.title || '—'}</p>
        </div>
      ),
    },
    {
      key: 'framework_id',
      header: 'Framework',
      render: (item) => (
        <Badge variant="info">{item.methodology_frameworks?.short_name || '—'}</Badge>
      ),
    },
    {
      key: 'adherence_pct',
      header: 'Adherence',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-bone rounded-full overflow-hidden">
            <div
              className="h-full bg-forest-depths rounded-full transition-all"
              style={{ width: `${item.adherence_pct || 0}%` }}
            />
          </div>
          <span className={`text-sm font-medium ${getAdherenceColor(item.adherence_pct || 0)}`}>
            {item.adherence_pct || 0}%
          </span>
        </div>
      ),
    },
    {
      key: 'verdict',
      header: 'Verdict',
      render: (item) => getVerdictBadge(item.verdict),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            const deal = deals.find((d) => d.id === item.opportunity_id)
            if (deal) handleOpenQualifyModal(deal)
          }}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteQualification(item.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredDeals = deals.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentAdherence = selectedFrameworkId
    ? calculateAdherence(selectedFrameworkId, slotValues)
    : 0

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Opportunity Qualification
            </h1>
            <p className="text-olive-slate mt-1">
              Qualify open opportunities against your sales methodology frameworks
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Qualified</p>
              <p className="text-2xl font-bold text-forest-depths">{qualifications.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Avg Adherence %</p>
              <p className="text-2xl font-bold text-cobalt-ink">{avgAdherence}%</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">At Risk</p>
              <p className="text-2xl font-bold text-wine-shadow">{atRiskCount}</p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Disqualified</p>
              <p className="text-2xl font-bold text-plum-depth">{disqualifiedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Open Opportunities to Qualify */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
              <Target className="w-5 h-5 text-cobalt-ink" />
              Open Opportunities
            </h2>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="coda-input pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-bone rounded-[22px] animate-pulse" />
              ))
            ) : filteredDeals.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-sm text-pebble text-center py-4">No open opportunities found</p>
                </CardContent>
              </Card>
            ) : (
              filteredDeals.map((deal) => {
                const existing = qualifications.find((q) => q.opportunity_id === deal.id)
                return (
                  <Card key={deal.id}>
                    <CardContent>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-charcoal">{deal.title}</h3>
                        {existing && getVerdictBadge(existing.verdict)}
                      </div>
                      <div className="space-y-1 mb-3">
                        {deal.contacts && (
                          <p className="text-xs text-pebble">
                            {Array.isArray(deal.contacts) ? deal.contacts.map(c => `${c.first_name} ${c.last_name}`).join(', ') : `${deal.contacts.first_name} ${deal.contacts.last_name}`}
                          </p>
                        )}
                        {deal.organizations && (
                          <p className="text-xs text-pebble">{Array.isArray(deal.organizations) ? deal.organizations.map(o => o.name).join(', ') : deal.organizations.name}</p>
                        )}
                      </div>
                      {existing && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-2 bg-bone rounded-full overflow-hidden">
                            <div
                              className="h-full bg-forest-depths rounded-full transition-all"
                              style={{ width: `${existing.adherence_pct || 0}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${getAdherenceColor(existing.adherence_pct || 0)}`}>
                            {existing.adherence_pct || 0}%
                          </span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenQualifyModal(deal)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {existing ? 'Re-Qualify' : 'Qualify'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Existing Qualifications Table */}
        <div>
          <h2 className="text-lg font-semibold text-charcoal mb-3">Existing Qualifications</h2>
          <DataTable
            columns={qualificationColumns}
            data={qualifications.filter(
              (q) =>
                !verdictFilter || q.verdict === verdictFilter
            )}
            loading={loading}
            emptyMessage="No qualifications yet"
          />
        </div>
      </div>

      {/* Qualify Modal */}
      <Modal
        isOpen={isQualifyModalOpen}
        onClose={handleCloseQualifyModal}
        title={existingQualification ? `Re-Qualify: ${selectedDeal?.title}` : `Qualify: ${selectedDeal?.title}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Framework Selection */}
          <Select
            label="Methodology Framework"
            value={selectedFrameworkId}
            onChange={(e) => handleFrameworkSelect(e.target.value)}
            options={frameworks.map((f) => ({
              value: f.id,
              label: `${f.name} (${f.short_name})`,
            }))}
            placeholder="Select a framework..."
            disabled={!!existingQualification}
          />

          {/* Live Adherence Indicator */}
          {selectedFrameworkId && (
            <div className="flex items-center gap-4 p-3 bg-bone rounded-[13px]">
              <div className="flex-1">
                <p className="text-xs text-olive-slate mb-1">Live Adherence</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-pure-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-forest-depths rounded-full transition-all"
                      style={{ width: `${currentAdherence}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${getAdherenceColor(currentAdherence)}`}>
                    {currentAdherence}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-olive-slate mb-1">Verdict</p>
                <Select
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value as any)}
                  options={[
                    { value: 'qualified', label: 'Qualified' },
                    { value: 'at_risk', label: 'At Risk' },
                    { value: 'disqualified', label: 'Disqualified' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Slot Forms */}
          {selectedFrameworkId && frameworkSlots.length === 0 && (
            <p className="text-sm text-pebble text-center py-4">
              No slots defined for this framework. Add slots in the Methodology page first.
            </p>
          )}

          {selectedFrameworkId && frameworkSlots.length > 0 && (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {frameworkSlots.map((slot) => {
                const val = slotValues[slot.id] || { status: 'empty', content: '' }
                return (
                  <div
                    key={slot.id}
                    className="border border-sage-mist rounded-[13px] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-mint-sprout rounded-full flex items-center justify-center text-xs font-bold text-forest-depths">
                          {slot.slot_order}
                        </span>
                        <span className="font-medium text-charcoal text-sm">{slot.label}</span>
                        {slot.is_required && (
                          <Badge variant="info">Required</Badge>
                        )}
                      </div>
                    </div>
                    {slot.description && (
                      <p className="text-xs text-pebble">{slot.description}</p>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <Select
                        label="Status"
                        value={val.status}
                        onChange={(e) => updateSlotValue(slot.id, 'status', e.target.value)}
                        options={[
                          { value: 'empty', label: 'Empty' },
                          { value: 'in_progress', label: 'In Progress' },
                          { value: 'filled', label: 'Filled' },
                          { value: 'not_applicable', label: 'Not Applicable' },
                        ]}
                      />
                      <div className="col-span-2">
                        <Textarea
                          label="Content"
                          placeholder={`Enter content for ${slot.label}...`}
                          value={val.content}
                          onChange={(e) => updateSlotValue(slot.id, 'content', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseQualifyModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQualification}
              disabled={saving || !selectedFrameworkId}
            >
              {saving ? 'Saving...' : existingQualification ? 'Update Qualification' : 'Save Qualification'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
