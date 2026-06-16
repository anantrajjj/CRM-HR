'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Column<T = unknown> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  className?: string
}

export interface DataTableProps<T = unknown> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="coda-card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-bone rounded w-1/4" />
          <div className="h-4 bg-bone rounded w-1/2" />
          <div className="h-4 bg-bone rounded w-3/4" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('coda-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sage-mist">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'text-left py-3 px-4',
                    'font-mono text-xs uppercase tracking-wider text-pebble',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-olive-slate"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    'border-b border-bone last:border-b-0',
                    'hover:bg-bone/50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('py-3 px-4 text-sm', column.className)}
                    >
                      {column.render
                        ? column.render(item)
                        : String((item as Record<string, unknown>)[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
