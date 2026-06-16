'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  Clock,
  Calendar,
} from 'lucide-react'

const stats = [
  { label: 'Total Contacts', value: '1,234', icon: Users, change: '+12%' },
  { label: 'Active Deals', value: '56', icon: Briefcase, change: '+8%' },
  { label: 'Organizations', value: '89', icon: Building2, change: '+5%' },
  { label: 'Revenue', value: '$124,500', icon: TrendingUp, change: '+15%' },
]

const recentActivities = [
  { type: 'call', subject: 'Call with John Smith', time: '2 hours ago', status: 'completed' },
  { type: 'email', subject: 'Follow-up email to Acme Corp', time: '4 hours ago', status: 'sent' },
  { type: 'meeting', subject: 'Product demo with TechCo', time: 'Tomorrow 10:00 AM', status: 'scheduled' },
  { type: 'task', subject: 'Prepare proposal for new client', time: 'Due in 3 days', status: 'pending' },
]

const upcomingLeaves = [
  { employee: 'Sarah Johnson', type: 'Annual Leave', dates: 'Jun 20-24, 2026', status: 'approved' },
  { employee: 'Mike Chen', type: 'Sick Leave', dates: 'Jun 18, 2026', status: 'pending' },
]

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="coda-heading-monument text-4xl text-charcoal mb-2">
            Dashboard
          </h1>
          <p className="text-olive-slate">
            Welcome back! Here&apos;s an overview of your business.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} variant="bordered">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-pebble">{stat.label}</p>
                      <p className="text-2xl font-bold text-charcoal mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-mint-sprout rounded-[9px] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-forest-depths" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Badge variant="success">{stat.change}</Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-[9px] hover:bg-bone transition-colors"
                  >
                    <div className="w-8 h-8 bg-sky-wash rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-cobalt-ink" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal">
                        {activity.subject}
                      </p>
                      <p className="text-xs text-pebble">{activity.time}</p>
                    </div>
                    <Badge
                      variant={
                        activity.status === 'completed'
                          ? 'success'
                          : activity.status === 'sent'
                          ? 'info'
                          : activity.status === 'scheduled'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Leaves */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Leaves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingLeaves.map((leave, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-[9px] border border-sage-mist"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-olive-slate" />
                      <span className="text-sm font-medium text-charcoal">
                        {leave.employee}
                      </span>
                    </div>
                    <p className="text-xs text-pebble">{leave.type}</p>
                    <p className="text-xs text-olive-slate">{leave.dates}</p>
                    <div className="mt-2">
                      <Badge
                        variant={leave.status === 'approved' ? 'success' : 'warning'}
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card pastelColor="mint">
          <CardHeader>
            <CardTitle className="text-forest-depths">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 rounded-[13px] bg-pure-white border border-sage-mist hover:border-obsidian transition-colors text-left">
                <Users className="w-5 h-5 text-charcoal mb-2" />
                <p className="text-sm font-medium text-charcoal">Add Contact</p>
              </button>
              <button className="p-4 rounded-[13px] bg-pure-white border border-sage-mist hover:border-obsidian transition-colors text-left">
                <Briefcase className="w-5 h-5 text-charcoal mb-2" />
                <p className="text-sm font-medium text-charcoal">Create Deal</p>
              </button>
              <button className="p-4 rounded-[13px] bg-pure-white border border-sage-mist hover:border-obsidian transition-colors text-left">
                <Building2 className="w-5 h-5 text-charcoal mb-2" />
                <p className="text-sm font-medium text-charcoal">Add Organization</p>
              </button>
              <button className="p-4 rounded-[13px] bg-pure-white border border-sage-mist hover:border-obsidian transition-colors text-left">
                <Calendar className="w-5 h-5 text-charcoal mb-2" />
                <p className="text-sm font-medium text-charcoal">Request Leave</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
