'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  CalendarDays, 
  Clock, 
  Users, 
  Building2,
  Calendar,
  ClipboardList,
  CalendarOff
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const menuItems = [
  {
    name: 'Painel Geral',
    href: '/',
    icon: Clock,
  },
  {
    name: 'Solicitações',
    href: '/solicitacoes',
    icon: ClipboardList,
    showPendentes: true,
  },
  {
    name: 'Cronograma',
    href: '/cronograma',
    icon: Calendar,
  },
  {
    name: 'Folgas',
    href: '/folgas',
    icon: CalendarOff,
  },
  {
    name: 'Colaboradores',
    href: '/colaboradores',
    icon: Users,
    showCount: true,
  },
  {
    name: 'Departamentos',
    href: '/departamentos',
    icon: Building2,
  },
]

interface Stats {
  totalColaboradores: number
  maxColaboradores: number
  solicitacoesPendentes: number
}

export function Sidebar() {
  const pathname = usePathname()
  const [stats, setStats] = useState<Stats>({ totalColaboradores: 0, maxColaboradores: 50, solicitacoesPendentes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [pathname]) // Refetch when navigating

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const percentualUsado = (stats.totalColaboradores / stats.maxColaboradores) * 100

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-md">
          <span className="text-xl">🔍</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Offy
          </span>
          <span className="text-[10px] text-gray-400 -mt-0.5">Gestão de ausências</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
              {item.showCount && (
                <span className={cn(
                  'ml-auto text-xs px-2 py-0.5 rounded-full',
                  isActive ? 'bg-white/20' : 'bg-gray-100'
                )}>
                  {loading ? '...' : stats.totalColaboradores}
                </span>
              )}
              {item.showPendentes && stats.solicitacoesPendentes > 0 && (
                <span className={cn(
                  'ml-auto text-xs px-2 py-0.5 rounded-full',
                  isActive ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                )}>
                  {loading ? '...' : stats.solicitacoesPendentes}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plano Atual */}
      <div className="p-4 mx-4 mb-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Plano Atual
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Gestão Interna
        </p>
        <Progress value={percentualUsado} className="h-2 mb-2" />
        <p className="text-xs text-gray-500">
          {loading ? '...' : stats.totalColaboradores} de {stats.maxColaboradores} vagas utilizadas
        </p>
      </div>
    </aside>
  )
}
