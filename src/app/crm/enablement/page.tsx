'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Plus, BookOpen, Eye, GraduationCap, Award, Search, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ContentItem {
  id: string
  title: string
  content_type: string
  description: string
  file_url: string
  tags: string[]
  target_industries: string[]
  target_tiers: string[]
  is_active: boolean
  view_count: number
}

interface TrainingCourse {
  id: string
  title: string
  code: string
  description: string
  duration_hours: number
  is_mandatory: boolean
}

interface TrainingAssignment {
  id: string
  course_id: string
  employee_id: string
  status: string
  score: number
  assigned_at: string
  completed_at: string
  training_courses?: TrainingCourse
  employees?: { first_name: string; last_name: string; employee_id: string }
}

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
}

const contentTypeConfig: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'default' | 'error' }> = {
  battle_card: { label: 'Battle Card', variant: 'info' },
  deck: { label: 'Deck', variant: 'success' },
  case_study: { label: 'Case Study', variant: 'warning' },
  rfp_template: { label: 'RFP Template', variant: 'default' },
  one_pager: { label: 'One Pager', variant: 'info' },
  video: { label: 'Video', variant: 'error' },
  document: { label: 'Document', variant: 'info' },
}

export default function EnablementPage() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'training'>('content')

  const [isContentModalOpen, setIsContentModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [contentForm, setContentForm] = useState({
    title: '',
    content_type: 'battle_card',
    description: '',
    file_url: '',
    tags: '',
    target_industries: '',
    target_tiers: '',
  })
  const [assignForm, setAssignForm] = useState({
    course_id: '',
    employee_id: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    const [contentRes, coursesRes, assignmentsRes, employeesRes] = await Promise.all([
      supabase.from('content_library').select('*').order('created_at', { ascending: false }),
      supabase.from('training_courses').select('*').order('title'),
      supabase
        .from('training_assignments')
        .select('*, training_courses(*), employees(first_name, last_name, employee_id)')
        .order('assigned_at', { ascending: false }),
      supabase.from('employees').select('id, employee_id, first_name, last_name').order('first_name'),
    ])

    if (contentRes.data) setContent(contentRes.data)
    if (coursesRes.data) setCourses(coursesRes.data)
    if (assignmentsRes.data) setAssignments(assignmentsRes.data)
    if (employeesRes.data) setEmployees(employeesRes.data)
    setLoading(false)
  }

  const handleAddContent = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('content_library').insert({
      title: contentForm.title,
      content_type: contentForm.content_type,
      description: contentForm.description || null,
      file_url: contentForm.file_url || null,
      tags: contentForm.tags ? contentForm.tags.split(',').map((t) => t.trim()) : [],
      target_industries: contentForm.target_industries ? contentForm.target_industries.split(',').map((t) => t.trim()) : [],
      target_tiers: contentForm.target_tiers ? contentForm.target_tiers.split(',').map((t) => t.trim()) : [],
      is_active: true,
      view_count: 0,
    })

    if (!error) {
      await fetchData()
      setIsContentModalOpen(false)
      setContentForm({ title: '', content_type: 'battle_card', description: '', file_url: '', tags: '', target_industries: '', target_tiers: '' })
    }
    setSaving(false)
  }

  const handleAssignTraining = async () => {
    if (!assignForm.course_id || !assignForm.employee_id) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('training_assignments').insert({
      course_id: assignForm.course_id,
      employee_id: assignForm.employee_id,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    })

    if (!error) {
      await fetchData()
      setIsAssignModalOpen(false)
      setAssignForm({ course_id: '', employee_id: '' })
    }
    setSaving(false)
  }

  const totalViews = content.reduce((sum, c) => sum + (c.view_count || 0), 0)
  const completedAssignments = assignments.filter((a) => a.status === 'completed')
  const completionRate = assignments.length > 0 ? (completedAssignments.length / assignments.length) * 100 : 0

  const stats = [
    { label: 'Total Content', value: content.length, icon: BookOpen, color: 'mint' as const },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'sky' as const },
    { label: 'Active Courses', value: courses.length, icon: GraduationCap, color: 'lilac' as const },
    { label: 'Completion Rate', value: `${completionRate.toFixed(1)}%`, icon: Award, color: 'rose' as const },
  ]

  const filteredContent = content.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAssignments = assignments.filter((a) => {
    const empName = `${a.employees?.first_name} ${a.employees?.last_name}`.toLowerCase()
    const courseName = a.training_courses?.title?.toLowerCase() || ''
    return empName.includes(searchTerm.toLowerCase()) || courseName.includes(searchTerm.toLowerCase())
  })

  const assignmentsByCourse = courses.map((course) => ({
    ...course,
    assignments: assignments.filter((a) => a.course_id === course.id),
  }))

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-olive-slate">Loading enablement data...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">Sales Enablement</h1>
            <p className="text-olive-slate mt-1">Content library and training management</p>
          </div>
          <Button onClick={() => activeTab === 'content' ? setIsContentModalOpen(true) : setIsAssignModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'content' ? 'Add Content' : 'Assign Training'}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} pastelColor={stat.color}>
              <CardContent>
                <div className="flex items-center gap-3">
                  <stat.icon className="w-5 h-5 text-charcoal" />
                  <div>
                    <p className="text-sm text-forest-depths">{stat.label}</p>
                    <p className="text-2xl font-bold text-forest-depths">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-4 border-b border-sage-mist pb-2">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'content' ? 'text-charcoal border-b-2 border-charcoal' : 'text-pebble hover:text-charcoal'
            }`}
          >
            Content Library
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`pb-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'training' ? 'text-charcoal border-b-2 border-charcoal' : 'text-pebble hover:text-charcoal'
            }`}
          >
            Training
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'content' ? 'content' : 'assignments'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="coda-input pl-10 w-full"
          />
        </div>

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.length === 0 ? (
              <Card className="col-span-full">
                <CardContent>
                  <p className="text-center text-pebble py-8">No content found. Add your first piece of content.</p>
                </CardContent>
              </Card>
            ) : (
              filteredContent.map((item) => {
                const typeInfo = contentTypeConfig[item.content_type] || contentTypeConfig.document
                return (
                  <Card key={item.id}>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-charcoal">{item.title}</h3>
                          <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                        </div>
                        {item.description && (
                          <p className="text-sm text-olive-slate line-clamp-2">{item.description}</p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs bg-bone text-olive-slate px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-xs text-pebble">+{item.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-bone">
                          <div className="flex items-center gap-1 text-sm text-pebble">
                            <Eye className="w-3 h-3" />
                            {item.view_count || 0} views
                          </div>
                          {item.file_url && (
                            <a
                              href={item.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-cobalt-ink hover:underline flex items-center gap-1"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'training' && (
          <div className="space-y-4">
            {assignmentsByCourse.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-center text-pebble py-8">No courses available. Create courses first.</p>
                </CardContent>
              </Card>
            ) : (
              assignmentsByCourse.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{course.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-pebble">{course.code}</span>
                        {course.is_mandatory && <Badge variant="error">Mandatory</Badge>}
                      </div>
                    </div>
                    {course.description && <p className="text-sm text-olive-slate">{course.description}</p>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4 text-sm text-pebble">
                      <span>Duration: {course.duration_hours}h</span>
                      <span>Assignments: {course.assignments.length}</span>
                      <span>
                        Completed: {course.assignments.filter((a) => a.status === 'completed').length}
                      </span>
                    </div>
                    {course.assignments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-bone">
                              <th className="text-left py-2 px-3 font-mono text-xs uppercase text-pebble">Employee</th>
                              <th className="text-left py-2 px-3 font-mono text-xs uppercase text-pebble">Status</th>
                              <th className="text-left py-2 px-3 font-mono text-xs uppercase text-pebble">Score</th>
                              <th className="text-left py-2 px-3 font-mono text-xs uppercase text-pebble">Assigned</th>
                              <th className="text-left py-2 px-3 font-mono text-xs uppercase text-pebble">Completed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {course.assignments.map((assignment) => (
                              <tr key={assignment.id} className="border-b border-bone last:border-b-0">
                                <td className="py-2 px-3">
                                  {assignment.employees?.first_name} {assignment.employees?.last_name}
                                </td>
                                <td className="py-2 px-3">
                                  <Badge
                                    variant={
                                      assignment.status === 'completed'
                                        ? 'success'
                                        : assignment.status === 'in_progress'
                                        ? 'warning'
                                        : 'default'
                                    }
                                  >
                                    {assignment.status}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3">{assignment.score ?? '-'}</td>
                                <td className="py-2 px-3 text-pebble">
                                  {new Date(assignment.assigned_at).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-3 text-pebble">
                                  {assignment.completed_at
                                    ? new Date(assignment.completed_at).toLocaleDateString()
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-pebble text-center py-4">No assignments yet</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        title="Add Content"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={contentForm.title}
            onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
            placeholder="Content title..."
          />
          <Select
            label="Content Type"
            value={contentForm.content_type}
            onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value })}
            options={Object.entries(contentTypeConfig).map(([value, config]) => ({
              value,
              label: config.label,
            }))}
          />
          <Input
            label="Description"
            value={contentForm.description}
            onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
            placeholder="Brief description..."
          />
          <Input
            label="File URL"
            value={contentForm.file_url}
            onChange={(e) => setContentForm({ ...contentForm, file_url: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Tags"
            value={contentForm.tags}
            onChange={(e) => setContentForm({ ...contentForm, tags: e.target.value })}
            placeholder="Comma-separated tags..."
          />
          <Input
            label="Target Industries"
            value={contentForm.target_industries}
            onChange={(e) => setContentForm({ ...contentForm, target_industries: e.target.value })}
            placeholder="Comma-separated industries..."
          />
          <Input
            label="Target Tiers"
            value={contentForm.target_tiers}
            onChange={(e) => setContentForm({ ...contentForm, target_tiers: e.target.value })}
            placeholder="Comma-separated tiers..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsContentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContent} disabled={saving || !contentForm.title}>
              {saving ? 'Saving...' : 'Add Content'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Training"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Course"
            value={assignForm.course_id}
            onChange={(e) => setAssignForm({ ...assignForm, course_id: e.target.value })}
            options={courses.map((c) => ({
              value: c.id,
              label: `${c.title} (${c.code})`,
            }))}
            placeholder="Select course..."
          />
          <Select
            label="Employee"
            value={assignForm.employee_id}
            onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name} (${emp.employee_id})`,
            }))}
            placeholder="Select employee..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTraining} disabled={saving || !assignForm.course_id || !assignForm.employee_id}>
              {saving ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
