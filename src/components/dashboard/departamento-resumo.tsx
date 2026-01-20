'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface DepartamentoResumo {
  id: string
  nome: string
  totalColaboradores: number
  colaboradoresDeFeriasHoje: number
}

interface DepartamentoResumoProps {
  departamentos: DepartamentoResumo[]
}

export function DepartamentoResumoList({ departamentos }: DepartamentoResumoProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Destaque por Departamento
      </h3>

      <div className="space-y-5">
        {departamentos.map((dep) => {
          const percentual = dep.totalColaboradores > 0
            ? (dep.colaboradoresDeFeriasHoje / dep.totalColaboradores) * 100
            : 0

          return (
            <div key={dep.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {dep.nome}
                </span>
                <span className="text-sm text-gray-500">
                  {dep.colaboradoresDeFeriasHoje} fora / {dep.totalColaboradores} total
                </span>
              </div>
              <Progress 
                value={percentual} 
                className="h-2"
                indicatorClassName={cn(
                  percentual > 50 ? 'bg-ferias-warning' : 'bg-ferias-info'
                )}
              />
            </div>
          )
        })}

        {departamentos.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            Nenhum departamento cadastrado
          </p>
        )}
      </div>
    </div>
  )
}
