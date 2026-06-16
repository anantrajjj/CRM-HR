'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Plus, Search, Edit2, Eye, ArrowRight } from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  company: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'unqualified'
  score: number
  owner: string
  created_at: string
}

const mockLeads: Lead[] = [
  { id: '1', name: 'Alice Brown', email: 'alice@techcorp.com', company: 'TechCorp', source: 'Website', status: 'new', score: 85, owner: 'John Smith', created_at: '2026-06-10' },
  { id: '2', name: 'Bob Wilson', email: 'bob@innovate.io', company: 'Innovate.io', source: 'Referral', status: 'contacted', score: 72, owner: 'Sarah Johnson', created_at: '2026-06-09' },
  { id: '3', name: 'Carol Davis', email: 'carol@startup.co', company: 'StartupCo', source: 'LinkedIn', status: 'qualified', score: 90, owner: 'Mike Chen', created_at: '2026-06-08' },
  { id: '4', name: 'David Lee', email: 'david@enterprise.com', company: 'Enterprise Inc', source: 'Trade Show', status: 'new', score: 65, owner: 'Emily Davis', created_at: '2026-06-07' },
  { id: '5', name: 'Eva Martinez', email: 'eva@growth.io', company: 'Growth.io', source: 'Email Campaign', status: 'unqualified', score: 30, owner: 'John Smith', created_at: '2026-06-06' },
]

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const columns: Column<Lead>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'company', header: 'Company' },
    { key: 'source', header: 'Source' },
    { 
      key: 'status', 
      header: 'Status',
      render: (item) => (
        <Badge 
          variant={
            item.status === 'qualified' ? 'success' :
            item.status === 'contacted' ? 'info' :
            item.status === 'new' ? 'warning' : 'default'
          }
        >
          {item.status}
        </Badge>
      )
    },
    { 
      key: 'score', 
      header: 'Score',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-bone rounded-full overflow-hidden">
            <div 
              className="h-full bg-mint-sprout" 
              style={{ width: `${item.score}%` }}
            />
          </div>
          <span className="text-sm text-olive-slate">{item.score}</span>
        </div>
      )
    },
    { key: 'owner', header: 'Owner' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <ArrowRight className="w-4 h-4 text-green-500" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredLeads = mockLeads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Leads
            </h1>
            <p className="text-olive-slate mt-1">
              Manage your sales pipeline and convert leads to customers
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">New Leads</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {mockLeads.filter((l) => l.status === 'new').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Contacted</p>
              <p className="text-2xl font-bold text-plum-depth">
                {mockLeads.filter((l) => l.status === 'contacted').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Qualified</p>
              <p className="text-2xl font-bold text-forest-depths">
                {mockLeads.filter((l) => l.status === 'qualified').length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Unqualified</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {mockLeads.filter((l) => l.status === 'unqualified').length}
              </p>
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
                  placeholder="Search leads..."
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

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredLeads}
          emptyMessage="No leads found"
        />
      </div>
    </MainLayout>
  )
}
