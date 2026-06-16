'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Edit2, Trash2, MapPin, Building2, Users } from 'lucide-react'

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface Organization {
  id: string
  name: string
  city: string
  industry: string
  tier: string
}

interface Territory {
  id: string
  name: string
  code: string
  description: string
  owner_id: string
  rule_type: string
  is_active: boolean
  employees?: Employee
}

interface TerritoryAssignment {
  id: string
  territory_id: string
  organization_id: string
  assignment_type: string
  is_current: boolean
  organizations?: Organization
  territories?: Territory
}

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([])
  const [assignments, setAssignments] = useState<TerritoryAssignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null)
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    owner_id: '',
    rule_type: 'geographic',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    const [territoriesRes, assignmentsRes, employeesRes, orgsRes] = await Promise.all([
      supabase.from('territories').select('*, employees(id, first_name, last_name)').order('name'),
      supabase
        .from('territory_assignments')
        .select('*, organizations(id, name, city, industry, tier), territories(id, name)')
        .eq('is_current', true),
      supabase.from('employees').select('id, first_name, last_name').order('first_name'),
      supabase.from('organizations').select('id, name, city, industry, tier').order('name'),
    ])

    if (territoriesRes.data) setTerritories(territoriesRes.data as Territory[])
    if (assignmentsRes.data) setAssignments(assignmentsRes.data as TerritoryAssignment[])
    if (employeesRes.data) setEmployees(employeesRes.data)
    if (orgsRes.data) setOrganizations(orgsRes.data)

    setLoading(false)
  }

  const handleOpenModal = (territory?: Territory) => {
    if (territory) {
      setEditingTerritory(territory)
      setFormData({
        name: territory.name,
        code: territory.code,
        description: territory.description || '',
        owner_id: territory.owner_id,
        rule_type: territory.rule_type,
      })
    } else {
      setEditingTerritory(null)
      setFormData({ name: '', code: '', description: '', owner_id: '', rule_type: 'geographic' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTerritory(null)
    setFormData({ name: '', code: '', description: '', owner_id: '', rule_type: 'geographic' })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      name: formData.name,
      code: formData.code,
      description: formData.description || null,
      owner_id: formData.owner_id,
      rule_type: formData.rule_type,
      is_active: true,
    }

    if (editingTerritory) {
      const { error } = await supabase.from('territories').update(record).eq('id', editingTerritory.id)
      if (!error) {
        await fetchData()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase.from('territories').insert(record)
      if (!error) {
        await fetchData()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this territory?')) return
    const supabase = createClient()
    const { error } = await supabase.from('territories').delete().eq('id', id)
    if (!error) await fetchData()
  }

  const handleOpenAssign = (territory: Territory) => {
    setSelectedTerritory(territory)
    const existing = assignments
      .filter((a) => a.territory_id === territory.id)
      .map((a) => a.organization_id)
    setSelectedOrgIds(existing)
    setIsAssignModalOpen(true)
  }

  const handleCloseAssign = () => {
    setIsAssignModalOpen(false)
    setSelectedTerritory(null)
    setSelectedOrgIds([])
  }

  const handleToggleOrg = (orgId: string) => {
    setSelectedOrgIds((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    )
  }

  const handleSaveAssignments = async () => {
    if (!selectedTerritory) return
    setSaving(true)
    const supabase = createClient()

    await supabase
      .from('territory_assignments')
      .update({ is_current: false })
      .eq('territory_id', selectedTerritory.id)
      .eq('is_current', true)

    if (selectedOrgIds.length > 0) {
      const records = selectedOrgIds.map((orgId) => ({
        territory_id: selectedTerritory.id,
        organization_id: orgId,
        assignment_type: 'manual',
        is_current: true,
      }))
      await supabase.from('territory_assignments').insert(records)
    }

    await fetchData()
    handleCloseAssign()
    setSaving(false)
  }

  const handleViewDetail = (territory: Territory) => {
    setSelectedTerritory(territory)
    setIsDetailOpen(true)
  }

  const getAccountCount = (territoryId: string) =>
    assignments.filter((a) => a.territory_id === territoryId).length

  const totalAssigned = assignments.length
  const totalOrgs = organizations.length
  const unassignedCount = totalOrgs - new Set(assignments.map((a) => a.organization_id)).size

  const filteredTerritories = territories.filter((t) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      t.name.toLowerCase().includes(search) ||
      t.code.toLowerCase().includes(search) ||
      `${t.employees?.first_name} ${t.employees?.last_name}`.toLowerCase().includes(search)
    )
  })

  const columns: Column<Territory>[] = [
    {
      key: 'name',
      header: 'Territory',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-wash rounded-full flex items-center justify-center">
            <MapPin className="w-4 h-4 text-cobalt-ink" />
          </div>
          <div>
            <p className="font-medium text-charcoal">{item.name}</p>
            <p className="text-xs text-pebble">{item.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner_id',
      header: 'Owner',
      render: (item) => (
        <span className="text-sm text-charcoal">
          {item.employees ? `${item.employees.first_name} ${item.employees.last_name}` : '-'}
        </span>
      ),
    },
    {
      key: 'rule_type',
      header: 'Rule Type',
      render: (item) => (
        <Badge variant="info">{item.rule_type}</Badge>
      ),
    },
    {
      key: 'account_count',
      header: 'Accounts',
      render: (item) => (
        <span className="text-sm font-medium text-charcoal">{getAccountCount(item.id)}</span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.is_active ? 'success' : 'default'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(item)}>
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleOpenAssign(item)}>
            <Building2 className="w-4 h-4" />
          </Button>
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

  const detailAssignments = selectedTerritory
    ? assignments.filter((a) => a.territory_id === selectedTerritory.id)
    : []

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Territory Management
            </h1>
            <p className="text-olive-slate mt-1">
              Define and manage sales territories and account assignments
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Territory
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Territories</p>
              <p className="text-2xl font-bold text-cobalt-ink">{territories.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Active</p>
              <p className="text-2xl font-bold text-forest-depths">
                {territories.filter((t) => t.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Assigned Accounts</p>
              <p className="text-2xl font-bold text-plum-depth">{totalAssigned}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Unassigned Accounts</p>
              <p className="text-2xl font-bold text-wine-shadow">{unassignedCount}</p>
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
                  placeholder="Search territories by name, code, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coda-input pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredTerritories}
          loading={loading}
          emptyMessage="No territories found"
        />
      </div>

      {/* Add/Edit Territory Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTerritory ? 'Edit Territory' : 'Add Territory'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Territory Name"
            placeholder="e.g. South Maharashtra"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Code"
            placeholder="e.g. SM-001"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Optional description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Owner"
            value={formData.owner_id}
            onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
            }))}
            placeholder="Select territory owner..."
          />
          <Select
            label="Rule Type"
            value={formData.rule_type}
            onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
            options={[
              { value: 'geographic', label: 'Geographic' },
              { value: 'industry', label: 'Industry' },
              { value: 'account_size', label: 'Account Size' },
              { value: 'named_accounts', label: 'Named Accounts' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.code}>
              {saving ? 'Saving...' : editingTerritory ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Accounts Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssign}
        title={`Assign Accounts — ${selectedTerritory?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-olive-slate">
            Select organizations to assign to this territory
          </p>
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            {organizations.map((org) => (
              <label
                key={org.id}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-bone cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedOrgIds.includes(org.id)}
                  onChange={() => handleToggleOrg(org.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">{org.name}</p>
                  <p className="text-xs text-pebble">{org.city} · {org.industry} · Tier {org.tier}</p>
                </div>
              </label>
            ))}
            {organizations.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-pebble">No organizations found</p>
            )}
          </div>
          <div className="flex justify-between items-center pt-4">
            <span className="text-sm text-olive-slate">
              {selectedOrgIds.length} selected
            </span>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCloseAssign}>
                Cancel
              </Button>
              <Button onClick={handleSaveAssignments} disabled={saving}>
                {saving ? 'Saving...' : 'Save Assignments'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Territory Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedTerritory(null) }}
        title={`Accounts in ${selectedTerritory?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {detailAssignments.length === 0 ? (
            <p className="text-center text-sm text-pebble py-8">
              No accounts assigned to this territory yet
            </p>
          ) : (
            <div className="space-y-2">
              {detailAssignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 bg-bone rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{a.organizations?.name}</p>
                    <p className="text-xs text-pebble">
                      {a.organizations?.city} · {a.organizations?.industry} · Tier {a.organizations?.tier}
                    </p>
                  </div>
                  <Badge variant={a.assignment_type === 'auto' ? 'info' : 'default'}>
                    {a.assignment_type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </MainLayout>
  )
}
