'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Edit2, Trash2, BookOpen, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TrainingCourse {
  id: string
  title: string
  code: string
  description: string
  category_id: string
  duration_hours: number
  is_mandatory: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function TrainingPage() {
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    category_id: '',
    duration_hours: '',
    is_mandatory: false,
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('training_courses')
      .select('*')
      .order('title')

    if (data) {
      setCourses(data)
    }
    setLoading(false)
  }

  const handleOpenModal = (course?: TrainingCourse) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        title: course.title,
        code: course.code,
        description: course.description || '',
        category_id: course.category_id || '',
        duration_hours: course.duration_hours?.toString() || '',
        is_mandatory: course.is_mandatory,
        is_active: course.is_active,
      })
    } else {
      setEditingCourse(null)
      setFormData({
        title: '',
        code: '',
        description: '',
        category_id: '',
        duration_hours: '',
        is_mandatory: false,
        is_active: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCourse(null)
    setFormData({
      title: '',
      code: '',
      description: '',
      category_id: '',
      duration_hours: '',
      is_mandatory: false,
      is_active: true,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      title: formData.title,
      code: formData.code,
      description: formData.description || null,
      category_id: formData.category_id || null,
      duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
      is_mandatory: formData.is_mandatory,
      is_active: formData.is_active,
    }

    if (editingCourse) {
      const { error } = await supabase
        .from('training_courses')
        .update(record)
        .eq('id', editingCourse.id)

      if (!error) {
        await fetchCourses()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('training_courses')
        .insert(record)

      if (!error) {
        await fetchCourses()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training course?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('training_courses')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchCourses()
    }
  }

  const columns: Column<TrainingCourse>[] = [
    {
      key: 'title',
      header: 'Course',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mint-sprout rounded-[9px] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-forest-depths" />
          </div>
          <div>
            <p className="font-medium text-charcoal">{item.title}</p>
            <p className="text-xs text-pebble font-mono">{item.code}</p>
          </div>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => (
        <span className="text-sm text-olive-slate truncate max-w-[250px] block">
          {item.description || '-'}
        </span>
      )
    },
    {
      key: 'duration_hours',
      header: 'Duration',
      render: (item) => (
        <span className="text-sm font-medium text-charcoal">{item.duration_hours || 0}h</span>
      )
    },
    {
      key: 'is_mandatory',
      header: 'Mandatory',
      render: (item) => (
        item.is_mandatory ? (
          <Badge variant="error">
            <Award className="w-3 h-3 mr-1" />
            Mandatory
          </Badge>
        ) : (
          <Badge variant="default">Optional</Badge>
        )
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.is_active ? 'success' : 'default'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
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

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Training
            </h1>
            <p className="text-olive-slate mt-1">
              Manage training courses and development programs
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Total Courses</p>
              <p className="text-2xl font-bold text-cobalt-ink">{courses.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="rose">
            <CardContent>
              <p className="text-sm text-wine-shadow">Mandatory</p>
              <p className="text-2xl font-bold text-wine-shadow">
                {courses.filter((c) => c.is_mandatory).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Active</p>
              <p className="text-2xl font-bold text-forest-depths">
                {courses.filter((c) => c.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Total Hours</p>
              <p className="text-2xl font-bold text-plum-depth">
                {courses.reduce((sum, c) => sum + (c.duration_hours || 0), 0)}h
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
                  placeholder="Search courses by title, code, or description..."
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
          data={filteredCourses}
          loading={loading}
          emptyMessage="No training courses found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCourse ? 'Edit Course' : 'Add Course'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Course Title"
              placeholder="e.g. Security Awareness"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Input
              label="Course Code"
              placeholder="e.g. SEC-101"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-charcoal">Description</label>
            <textarea
              placeholder="Course description..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 text-base bg-pure-white border border-sage-mist rounded-[9px] placeholder:text-pebble focus:outline-none focus:border-obsidian transition-colors"
            />
          </div>
          <Input
            label="Duration (Hours)"
            type="number"
            step="0.5"
            min="0"
            placeholder="8"
            value={formData.duration_hours}
            onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
          />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_mandatory}
                onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                className="w-4 h-4 rounded border-sage-mist"
              />
              <span className="text-sm font-medium text-charcoal">Mandatory Course</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-sage-mist"
              />
              <span className="text-sm font-medium text-charcoal">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.title || !formData.code}>
              {saving ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
