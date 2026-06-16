import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1.5',
        'font-mono text-xs uppercase tracking-wider',
        'border rounded-full',
        {
          'border-sage-mist text-charcoal bg-transparent': variant === 'default',
          'border-green-500 text-green-700 bg-green-50': variant === 'success',
          'border-yellow-500 text-yellow-700 bg-yellow-50': variant === 'warning',
          'border-red-500 text-red-700 bg-red-50': variant === 'error',
          'border-blue-500 text-blue-700 bg-blue-50': variant === 'info',
        },
        className
      )}
      {...props}
    />
  )
}
