// Database Types for CRM + HR Application

// ============================================================
// MASTERS MODULE
// ============================================================

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  parent_id?: string
  head_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Designation {
  id: string
  name: string
  code: string
  description?: string
  department_id?: string
  grade_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Grade {
  id: string
  name: string
  code: string
  min_salary?: number
  max_salary?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LeadSource {
  id: string
  name: string
  code: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DealStage {
  id: string
  name: string
  code: string
  pipeline_id: string
  probability: number
  stage_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Pipeline {
  id: string
  name: string
  code: string
  description?: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ActivityType {
  id: string
  name: string
  code: string
  icon?: string
  color?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Currency {
  id: string
  name: string
  code: string
  symbol: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TaxRate {
  id: string
  name: string
  rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  name: string
  code: string
  description?: string
  parent_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LeaveType {
  id: string
  name: string
  code: string
  days_per_year: number
  is_paid: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HolidayCalendar {
  id: string
  name: string
  year: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Holiday {
  id: string
  calendar_id: string
  name: string
  date: string
  is_recurring: boolean
  created_at: string
  updated_at: string
}

export interface ShiftType {
  id: string
  name: string
  code: string
  start_time: string
  end_time: string
  break_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PayGrade {
  id: string
  name: string
  code: string
  min_salary: number
  max_salary: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions: Record<string, string[]>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  created_at: string
  updated_at: string
}

// ============================================================
// CRM MODULE
// ============================================================

export interface Organization {
  id: string
  name: string
  code?: string
  industry?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  annual_revenue?: number
  employee_count?: number
  owner_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  organization_id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  mobile?: string
  job_title?: string
  department?: string
  lead_source_id?: string
  owner_id?: string
  is_lead: boolean
  is_customer: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  contact_id: string
  organization_id?: string
  lead_source_id?: string
  status: 'new' | 'contacted' | 'qualified' | 'unqualified'
  score: number
  owner_id?: string
  converted_at?: string
  converted_to_contact_id?: string
  converted_to_deal_id?: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  title: string
  organization_id?: string
  contact_id?: string
  pipeline_id: string
  stage_id: string
  amount: number
  currency_id: string
  probability: number
  close_date?: string
  owner_id?: string
  status: 'open' | 'won' | 'lost'
  lost_reason?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  code: string
  category_id?: string
  description?: string
  unit_price: number
  currency_id: string
  tax_rate_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  quote_number: string
  organization_id?: string
  contact_id?: string
  deal_id?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  valid_until?: string
  subtotal: number
  tax_amount: number
  total: number
  currency_id: string
  terms?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface QuoteItem {
  id: string
  quote_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount?: number
  tax_amount?: number
  total: number
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  type: 'email' | 'social' | 'ads' | 'event' | 'other'
  status: 'planned' | 'in_progress' | 'completed' | 'aborted'
  start_date?: string
  end_date?: string
  budget?: number
  actual_cost?: number
  expected_revenue?: number
  actual_revenue?: number
  description?: string
  created_at: string
  updated_at: string
}

// ============================================================
// HR MODULE
// ============================================================

export interface Employee {
  id: string
  employee_id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: string
  department_id?: string
  designation_id?: string
  grade_id?: string
  manager_id?: string
  hire_date: string
  termination_date?: string
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern'
  status: 'active' | 'on_leave' | 'terminated' | 'resigned'
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  check_in?: string
  check_out?: string
  shift_type_id?: string
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave'
  hours_worked?: number
  overtime_hours?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approved_by?: string
  approved_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Timesheet {
  id: string
  employee_id: string
  week_starting: string
  total_hours: number
  billable_hours: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface TimesheetEntry {
  id: string
  timesheet_id: string
  date: string
  project_id?: string
  task_id?: string
  hours: number
  is_billable: boolean
  description?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  code: string
  description?: string
  organization_id?: string
  start_date?: string
  end_date?: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  budget?: number
  created_at: string
  updated_at: string
}

export interface PerformanceReview {
  id: string
  employee_id: string
  reviewer_id: string
  review_period_start: string
  review_period_end: string
  overall_rating?: number
  strengths?: string
  areas_for_improvement?: string
  goals_met?: boolean
  status: 'draft' | 'self_assessment' | 'manager_review' | 'completed'
  submitted_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  employee_id: string
  title: string
  description?: string
  category: 'performance' | 'development' | 'personal'
  start_date?: string
  due_date?: string
  progress: number
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface TrainingCourse {
  id: string
  title: string
  code: string
  description?: string
  category_id?: string
  duration_hours: number
  is_mandatory: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TrainingEnrollment {
  id: string
  employee_id: string
  course_id: string
  enrolled_at: string
  started_at?: string
  completed_at?: string
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
  score?: number
  certificate_url?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  employee_id: string
  expense_date: string
  category: string
  amount: number
  currency_id: string
  description?: string
  receipt_url?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed'
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface HelpDeskTicket {
  id: string
  ticket_number: string
  subject: string
  description?: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  raised_by_type: 'employee' | 'contact'
  raised_by_id: string
  assigned_to?: string
  resolved_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
}

// ============================================================
// SHARED MODULE
// ============================================================

export interface Activity {
  id: string
  type_id: string
  subject: string
  description?: string
  due_date?: string
  completed_at?: string
  owner_id?: string
  // Polymorphic associations
  parent_type: 'lead' | 'contact' | 'organization' | 'deal' | 'employee'
  parent_id: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  content: string
  author_id?: string
  // Polymorphic associations
  parent_type: 'lead' | 'contact' | 'organization' | 'deal' | 'employee'
  parent_id: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  name: string
  file_url: string
  file_size: number
  mime_type: string
  uploaded_by?: string
  // Polymorphic associations
  parent_type: 'lead' | 'contact' | 'organization' | 'deal' | 'employee'
  parent_id: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  is_read: boolean
  link?: string
  created_at: string
  updated_at: string
}

// ============================================================
// USER & AUTH
// ============================================================

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role_id?: string
  employee_id?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

// ============================================================
// API RESPONSES
// ============================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  error: string | null
  count: number
  page: number
  per_page: number
  total_pages: number
}
