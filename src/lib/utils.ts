import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parseia uma data de forma segura, tratando como data local (sem timezone)
 * Resolve o problema de datas aparecerem com 1 dia a menos devido ao UTC
 */
export function parseLocalDate(date: Date | string): Date {
  if (date instanceof Date) {
    return date
  }
  
  // Se for string ISO (ex: "2025-02-03T00:00:00.000Z" ou "2025-02-03")
  // Extrai apenas a parte da data e cria como data local ao meio-dia
  const dateStr = date.split('T')[0] // Pega só "YYYY-MM-DD"
  const [year, month, day] = dateStr.split('-').map(Number)
  
  // Cria a data ao meio-dia para evitar problemas de timezone
  return new Date(year, month - 1, day, 12, 0, 0)
}

export function formatDate(date: Date | string): string {
  const d = parseLocalDate(date)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatDateLong(date: Date | string): string {
  const d = parseLocalDate(date)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

export function getDaysRemaining(date: Date | string): number {
  const target = parseLocalDate(date)
  const today = new Date()
  today.setHours(12, 0, 0, 0) // Normaliza para meio-dia
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
