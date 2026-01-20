'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  History,
  Filter,
  Pencil
} from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import { RejeicaoModal, CancelamentoModal, EditarFeriasModal } from '@/components/modals'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Solicitacao {
  id: string
  tipo: 'GOZO' | 'ABONO_PECUNIARIO'
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO'
  dataInicioGozo: string
  dataFimGozo: string
  diasGozo: number
  observacoes: string | null
  motivoRejeicao: string | null
  motivoCancelamento: string | null
  aprovadoPor: string | null
  aprovadoEm: string | null
  canceladoEm: string | null
  createdAt: string
  periodoAquisitivo: {
    id: string
    numeroPeriodo: number
    colaborador: {
      id: string
      nome: string
      cargo: string | null
      departamento: {
        nome: string
      }
    }
  }
}

type FilterStatus = 'TODOS' | 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO'

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDENTE')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Modal de rejeição
  const [rejeicaoModal, setRejeicaoModal] = useState<{
    open: boolean
    solicitacao: Solicitacao | null
  }>({ open: false, solicitacao: null })

  // Modal de cancelamento
  const [cancelamentoModal, setCancelamentoModal] = useState<{
    open: boolean
    solicitacao: Solicitacao | null
  }>({ open: false, solicitacao: null })

  // Modal de edição
  const [editarModal, setEditarModal] = useState<{
    open: boolean
    solicitacao: Solicitacao | null
  }>({ open: false, solicitacao: null })

  useEffect(() => {
    fetchSolicitacoes()
  }, [filterStatus])

  const fetchSolicitacoes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'TODOS') {
        params.append('status', filterStatus)
      }
      params.append('limit', '50')

      const response = await fetch(`/api/solicitacoes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSolicitacoes(data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAprovar = async (solicitacaoId: string) => {
    setActionLoading(solicitacaoId)
    try {
      const response = await fetch(`/api/solicitacoes/${solicitacaoId}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprovadoPor: 'Admin' }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erro ao aprovar solicitação')
        return
      }

      fetchSolicitacoes()
    } catch (err) {
      console.error('Erro ao aprovar:', err)
      alert('Erro ao aprovar solicitação')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejeitar = (solicitacao: Solicitacao) => {
    setRejeicaoModal({ open: true, solicitacao })
  }

  const confirmRejeitar = async (motivo: string) => {
    if (!rejeicaoModal.solicitacao) return

    const response = await fetch(`/api/solicitacoes/${rejeicaoModal.solicitacao.id}/rejeitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        motivoRejeicao: motivo,
        rejeitadoPor: 'Admin'
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erro ao rejeitar solicitação')
    }

    fetchSolicitacoes()
  }

  const handleCancelar = (solicitacao: Solicitacao) => {
    setCancelamentoModal({ open: true, solicitacao })
  }

  const confirmCancelar = async (motivo: string) => {
    if (!cancelamentoModal.solicitacao) return

    const response = await fetch(`/api/solicitacoes/${cancelamentoModal.solicitacao.id}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivoCancelamento: motivo }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erro ao cancelar solicitação')
    }

    fetchSolicitacoes()
  }

  // Verificar se pode cancelar (pendente ou aprovada antes de iniciar)
  const podeCancelar = (solicitacao: Solicitacao) => {
    if (solicitacao.status === 'PENDENTE') return true
    if (solicitacao.status === 'APROVADO') {
      // Se for GOZO, verificar se ainda não iniciou
      if (solicitacao.tipo === 'GOZO') {
        const dataInicio = new Date(solicitacao.dataInicioGozo)
        return dataInicio > new Date()
      }
      // ABONO_PECUNIARIO pode ser cancelado mesmo depois
      return true
    }
    return false
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, icon: React.ReactNode }> = {
      PENDENTE: { variant: 'secondary', label: 'Pendente', icon: <Clock className="w-3 h-3" /> },
      APROVADO: { variant: 'default', label: 'Aprovado', icon: <CheckCircle className="w-3 h-3" /> },
      REJEITADO: { variant: 'destructive', label: 'Rejeitado', icon: <XCircle className="w-3 h-3" /> },
      CANCELADO: { variant: 'outline', label: 'Cancelado', icon: <AlertCircle className="w-3 h-3" /> },
    }
    const config = variants[status] || variants.PENDENTE
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const getTipoBadge = (tipo: string) => {
    return tipo === 'GOZO' ? (
      <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
        <Calendar className="w-3 h-3" />
        Férias
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
        <DollarSign className="w-3 h-3" />
        Venda
      </Badge>
    )
  }

  const pendentes = solicitacoes.filter(s => s.status === 'PENDENTE').length

  return (
    <div className="animate-fade-in">
      <Header
        title={`Solicitações${pendentes > 0 ? ` (${pendentes} pendentes)` : ''}`}
        subtitle="Gerencie as solicitações de férias e abonos pecuniários"
        showNewButton={false}
      />

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtrar por status:</span>
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="APROVADO">Aprovados</SelectItem>
                <SelectItem value="REJEITADO">Rejeitados</SelectItem>
                <SelectItem value="CANCELADO">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filterStatus === 'PENDENTE' 
                ? 'Nenhuma solicitação pendente' 
                : 'Nenhuma solicitação encontrada'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {solicitacoes.map((solicitacao) => (
            <Card key={solicitacao.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(solicitacao.periodoAquisitivo.colaborador.nome)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {solicitacao.periodoAquisitivo.colaborador.nome}
                        </h3>
                        {getStatusBadge(solicitacao.status)}
                        {getTipoBadge(solicitacao.tipo)}
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        {solicitacao.periodoAquisitivo.colaborador.cargo || 'Sem cargo'} • {solicitacao.periodoAquisitivo.colaborador.departamento.nome}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">Período: </span>
                          <span className="font-medium">{solicitacao.periodoAquisitivo.numeroPeriodo}º</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Dias: </span>
                          <span className="font-medium">{solicitacao.diasGozo}</span>
                        </div>
                        {solicitacao.tipo === 'GOZO' && (
                          <div>
                            <span className="text-gray-500">Data: </span>
                            <span className="font-medium">
                              {formatDate(solicitacao.dataInicioGozo)} - {formatDate(solicitacao.dataFimGozo)}
                            </span>
                          </div>
                        )}
                      </div>

                      {solicitacao.observacoes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          💬 {solicitacao.observacoes}
                        </p>
                      )}

                      {/* Motivo da rejeição */}
                      {solicitacao.status === 'REJEITADO' && solicitacao.motivoRejeicao && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-xs font-medium text-red-700 mb-1">Motivo da rejeição:</p>
                          <p className="text-sm text-red-600">{solicitacao.motivoRejeicao}</p>
                        </div>
                      )}

                      {/* Motivo do cancelamento */}
                      {solicitacao.status === 'CANCELADO' && solicitacao.motivoCancelamento && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                          <p className="text-xs font-medium text-amber-700 mb-1">Motivo do cancelamento:</p>
                          <p className="text-sm text-amber-600">{solicitacao.motivoCancelamento}</p>
                          {solicitacao.canceladoEm && (
                            <p className="text-xs text-amber-500 mt-1">
                              Cancelado em {formatDate(solicitacao.canceladoEm)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Info de aprovação */}
                      {solicitacao.status === 'APROVADO' && solicitacao.aprovadoEm && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Aprovado por {solicitacao.aprovadoPor || 'Sistema'} em {formatDate(solicitacao.aprovadoEm)}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        Solicitado em {formatDate(solicitacao.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 flex-wrap">
                    {solicitacao.status === 'PENDENTE' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => setEditarModal({ open: true, solicitacao })}
                          disabled={actionLoading === solicitacao.id}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleAprovar(solicitacao.id)}
                          disabled={actionLoading === solicitacao.id}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {actionLoading === solicitacao.id ? '...' : 'Aprovar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleRejeitar(solicitacao)}
                          disabled={actionLoading === solicitacao.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {podeCancelar(solicitacao) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                        onClick={() => handleCancelar(solicitacao)}
                        disabled={actionLoading === solicitacao.id}
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Rejeição */}
      <RejeicaoModal
        open={rejeicaoModal.open}
        onClose={() => setRejeicaoModal({ open: false, solicitacao: null })}
        onConfirm={confirmRejeitar}
        solicitacaoInfo={rejeicaoModal.solicitacao ? {
          colaboradorNome: rejeicaoModal.solicitacao.periodoAquisitivo.colaborador.nome,
          tipo: rejeicaoModal.solicitacao.tipo,
          dias: rejeicaoModal.solicitacao.diasGozo
        } : undefined}
      />

      {/* Modal de Cancelamento */}
      <CancelamentoModal
        open={cancelamentoModal.open}
        onClose={() => setCancelamentoModal({ open: false, solicitacao: null })}
        onConfirm={confirmCancelar}
        title={cancelamentoModal.solicitacao?.tipo === 'GOZO' 
          ? 'Cancelar Férias' 
          : 'Cancelar Venda de Dias'}
        description={cancelamentoModal.solicitacao ? 
          `Cancelar ${cancelamentoModal.solicitacao.tipo === 'GOZO' ? 'férias' : 'venda'} de ${cancelamentoModal.solicitacao.diasGozo} dias de ${cancelamentoModal.solicitacao.periodoAquisitivo.colaborador.nome}?` 
          : 'Informe o motivo do cancelamento.'}
      />

      {/* Modal de Edição */}
      <EditarFeriasModal
        open={editarModal.open}
        onClose={() => setEditarModal({ open: false, solicitacao: null })}
        onSuccess={fetchSolicitacoes}
        solicitacao={editarModal.solicitacao}
      />
    </div>
  )
}
