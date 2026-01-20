import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    valueColor: 'text-gray-900',
    descriptionColor: 'text-gray-500',
  },
  success: {
    iconBg: 'bg-ferias-success/10',
    iconColor: 'text-ferias-success',
    valueColor: 'text-ferias-success',
    descriptionColor: 'text-ferias-success',
  },
  warning: {
    iconBg: 'bg-ferias-warning/10',
    iconColor: 'text-ferias-warning',
    valueColor: 'text-gray-900',
    descriptionColor: 'text-ferias-warning',
  },
  danger: {
    iconBg: 'bg-ferias-danger/10',
    iconColor: 'text-ferias-danger',
    valueColor: 'text-ferias-danger',
    descriptionColor: 'text-ferias-danger',
  },
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  variant = 'default' 
}: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn(
        'inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4',
        styles.iconBg
      )}>
        <Icon className={cn('w-6 h-6', styles.iconColor)} />
      </div>

      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      
      <p className={cn('text-4xl font-bold mb-1', styles.valueColor)}>
        {value}
      </p>

      {description && (
        <p className={cn('text-sm', styles.descriptionColor)}>
          {description}
        </p>
      )}
    </div>
  )
}
