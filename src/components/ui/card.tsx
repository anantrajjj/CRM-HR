import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'pastel'
  pastelColor?: 'mint' | 'lilac' | 'sky' | 'rose'
}

export function Card({
  className,
  variant = 'default',
  pastelColor,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[22px] p-[27px]',
        {
          'bg-pure-white border border-sage-mist': variant === 'default',
          'bg-cream-parchment border border-obsidian': variant === 'bordered',
          'border-none': variant === 'pastel',
        },
        variant === 'pastel' && pastelColor && {
          'bg-mint-sprout': pastelColor === 'mint',
          'bg-lilac-wash': pastelColor === 'lilac',
          'bg-sky-wash': pastelColor === 'sky',
          'bg-rose-wash': pastelColor === 'rose',
        },
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mb-4', className)}
      {...props}
    />
  )
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-xl font-bold text-charcoal',
        className
      )}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-olive-slate', className)}
      {...props}
    />
  )
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props} />
  )
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-4 flex items-center gap-2', className)}
      {...props}
    />
  )
}
