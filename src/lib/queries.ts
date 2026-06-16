import { createClient } from './supabase/client'
import type { ApiResponse, PaginatedResponse } from '@/types/database'

const supabase = createClient()

// ============================================================
// GENERIC QUERY HELPERS
// ============================================================

export async function fetchAll<T>(
  table: string,
  options?: {
    select?: string
    filters?: Record<string, unknown>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  }
): Promise<PaginatedResponse<T>> {
  let query = supabase.from(table).select(options?.select || '*', { count: 'exact' })

  if (options?.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value)
      }
    })
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    })
  }

  if (options?.limit) {
    query = query.range(
      options.offset || 0,
      (options.offset || 0) + options.limit - 1
    )
  }

  const { data, error, count } = await query

  return {
    data: (data as T[]) || [],
    error: error?.message || null,
    count: count || 0,
    page: Math.floor((options?.offset || 0) / (options?.limit || 10)) + 1,
    per_page: options?.limit || 10,
    total_pages: Math.ceil((count || 0) / (options?.limit || 10)),
  }
}

export async function fetchById<T>(
  table: string,
  id: string,
  select?: string
): Promise<ApiResponse<T>> {
  const { data, error } = await supabase
    .from(table)
    .select(select || '*')
    .eq('id', id)
    .single()

  return {
    data: data as T | null,
    error: error?.message || null,
  }
}

export async function create<T>(
  table: string,
  record: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single()

  return {
    data: data as T | null,
    error: error?.message || null,
  }
}

export async function update<T>(
  table: string,
  id: string,
  updates: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return {
    data: data as T | null,
    error: error?.message || null,
  }
}

export async function remove(
  table: string,
  id: string
): Promise<ApiResponse<null>> {
  const { error } = await supabase.from(table).delete().eq('id', id)

  return {
    data: null,
    error: error?.message || null,
  }
}

// ============================================================
// MODULE-SPECIFIC QUERIES
// ============================================================

// Masters
export const masters = {
  departments: () => fetchAll('departments', { orderBy: { column: 'name' } }),
  designations: () => fetchAll('designations', { orderBy: { column: 'name' } }),
  grades: () => fetchAll('grades', { orderBy: { column: 'name' } }),
  leadSources: () => fetchAll('lead_sources', { orderBy: { column: 'name' } }),
  dealStages: () => fetchAll('deal_stages', { orderBy: { column: 'stage_order' } }),
  pipelines: () => fetchAll('pipelines', { orderBy: { column: 'name' } }),
  activityTypes: () => fetchAll('activity_types', { orderBy: { column: 'name' } }),
  currencies: () => fetchAll('currencies', { orderBy: { column: 'name' } }),
  taxRates: () => fetchAll('tax_rates', { orderBy: { column: 'name' } }),
  productCategories: () => fetchAll('product_categories', { orderBy: { column: 'name' } }),
  leaveTypes: () => fetchAll('leave_types', { orderBy: { column: 'name' } }),
  holidayCalendars: () => fetchAll('holiday_calendars', { orderBy: { column: 'name' } }),
  shiftTypes: () => fetchAll('shift_types', { orderBy: { column: 'name' } }),
  payGrades: () => fetchAll('pay_grades', { orderBy: { column: 'name' } }),
  roles: () => fetchAll('roles', { orderBy: { column: 'name' } }),
  tags: () => fetchAll('tags', { orderBy: { column: 'name' } }),
}

// CRM
export const crm = {
  organizations: (filters?: Record<string, unknown>) =>
    fetchAll('organizations', { filters, orderBy: { column: 'name' } }),
  contacts: (filters?: Record<string, unknown>) =>
    fetchAll('contacts', { filters, orderBy: { column: 'last_name' } }),
  leads: (filters?: Record<string, unknown>) =>
    fetchAll('leads', { filters, orderBy: { column: 'created_at' } }),
  deals: (filters?: Record<string, unknown>) =>
    fetchAll('deals', { filters, orderBy: { column: 'created_at' } }),
  products: (filters?: Record<string, unknown>) =>
    fetchAll('products', { filters, orderBy: { column: 'name' } }),
  quotes: (filters?: Record<string, unknown>) =>
    fetchAll('quotes', { filters, orderBy: { column: 'created_at' } }),
  campaigns: (filters?: Record<string, unknown>) =>
    fetchAll('campaigns', { filters, orderBy: { column: 'created_at' } }),
}

// HR
export const hr = {
  employees: (filters?: Record<string, unknown>) =>
    fetchAll('employees', { filters, orderBy: { column: 'last_name' } }),
  attendance: (filters?: Record<string, unknown>) =>
    fetchAll('attendance', { filters, orderBy: { column: 'date', ascending: false } }),
  leaveRequests: (filters?: Record<string, unknown>) =>
    fetchAll('leave_requests', { filters, orderBy: { column: 'created_at', ascending: false } }),
  timesheets: (filters?: Record<string, unknown>) =>
    fetchAll('timesheets', { filters, orderBy: { column: 'week_starting', ascending: false } }),
  projects: (filters?: Record<string, unknown>) =>
    fetchAll('projects', { filters, orderBy: { column: 'name' } }),
  performanceReviews: (filters?: Record<string, unknown>) =>
    fetchAll('performance_reviews', { filters, orderBy: { column: 'created_at', ascending: false } }),
  goals: (filters?: Record<string, unknown>) =>
    fetchAll('goals', { filters, orderBy: { column: 'due_date' } }),
  trainingCourses: (filters?: Record<string, unknown>) =>
    fetchAll('training_courses', { filters, orderBy: { column: 'title' } }),
  trainingEnrollments: (filters?: Record<string, unknown>) =>
    fetchAll('training_enrollments', { filters, orderBy: { column: 'enrolled_at', ascending: false } }),
  expenses: (filters?: Record<string, unknown>) =>
    fetchAll('expenses', { filters, orderBy: { column: 'expense_date', ascending: false } }),
  helpDeskTickets: (filters?: Record<string, unknown>) =>
    fetchAll('help_desk_tickets', { filters, orderBy: { column: 'created_at', ascending: false } }),
}

// Shared
export const shared = {
  activities: (parentType: string, parentId: string) =>
    fetchAll('activities', {
      filters: { parent_type: parentType, parent_id: parentId },
      orderBy: { column: 'created_at', ascending: false },
    }),
  notes: (parentType: string, parentId: string) =>
    fetchAll('notes', {
      filters: { parent_type: parentType, parent_id: parentId },
      orderBy: { column: 'created_at', ascending: false },
    }),
  documents: (parentType: string, parentId: string) =>
    fetchAll('documents', {
      filters: { parent_type: parentType, parent_id: parentId },
      orderBy: { column: 'created_at', ascending: false },
    }),
}
