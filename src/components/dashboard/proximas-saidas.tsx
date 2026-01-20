'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, getInitials } from '@/lib/utils'

type StatusSolicitacaoType = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO'

interface ProximaSaida {
  colaboradorId: string
  colaboradorNome: string
  colaboradorAvatar: string | null
  departamentoNome: string
  dataInicio: Date | string
  dataFim: Date | string
  diasGozo: number
  status: StatusSolicitacaoType
  solicitacaoId: string
}

interface ProximasSaidasProps {
  saidas: ProximaSaida[]
  onVerTodas?: () => void
}

const statusConfig = {
  PENDENTE: { label: 'PENDENTE', variant: 'warning' as const },
  APROVADO: { label: 'APROVADO', variant: 'success' as const },
  REJEITADO: { label: 'REJEITADO', variant: 'danger' as const },
  CANCELADO: { label: 'CANCELADO', variant: 'secondary' as const },
}

export function ProximasSaidas({ saidas, onVerTodas }: ProximasSaidasProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Próximas Saídas</h3>
        <Button variant="link" className="text-primary p-0 h-auto" onClick={onVerTodas}>
          Ver todas
        </Button>
      </div>

      <div className="space-y-4">
        {saidas.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            Nenhuma saída programada
          </p>
        ) : (
          saidas.map((saida) => {
            const config = statusConfig[saida.status]
            
            return (
              <div
                key={saida.solicitacaoId}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {saida.colaboradorAvatar && (
                      <AvatarImage src={saida.colaboradorAvatar} alt={saida.colaboradorNome} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(saida.colaboradorNome)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-medium text-gray-900">{saida.colaboradorNome}</p>
                    <p className="text-sm text-gray-500">{saida.departamentoNome}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(saida.dataInicio)}
                  </p>
                  <Badge variant={config.variant} className="mt-1">
                    {config.label}
                  </Badge>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
