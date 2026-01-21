'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatDateLong, getInitials, cn } from '@/lib/utils'
import { 
  ArrowLeft, 
  Calendar, 
  Mail, 
  Building, 
  User, 
  AlertTriangle, 
  CheckCircle,
  EyeOff,
  Eye,
  DollarSign,
  FileText,
  Pencil
} from 'lucide-react'
import { FeriasModal, CancelamentoModal, ObservacoesPeriodoModal } from '@/components/modals'

interface Periodo {
  id: string
  numeroPeriodo: number
  dataInicioAquisitivo: string
  dataFimAquisitivo: string
  dataLimiteGozo: string
  diasDireito: number
  diasVendidos: number
  status: 'ATIVO' | 'QUITADO' | 'VENCIDO'
  ignorado: boolean
  observacoes: string | null
  solicitacoes: Array<{
    id: string
    dataInicioGozo: string
    dataFimGozo: string
    diasGozo: number
    tipo: 'GOZO' | 'ABONO_PECUNIARIO'
    status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO'
    motivoRejeicao: string | null
    motivoCancelamento: string | null
    aprovadoPor: string | null
    aprovadoEm: string | null
    canceladoEm: string | null
  }>
}

interface ColaboradorCompleto {
  id: string
  nome: string
  email: string
  matricula: string | null
  cargo: string | null
  dataAdmissao: string
  ativo: boolean
  avatarUrl: string | null
  departamento: {
    id: string
    nome: string
  }
  periodosAquisitivos: Periodo[]
}

export default function ColaboradorDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const [colaborador, setColaborador] = useState<ColaboradorCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [feriasModalOpen, setFeriasModalOpen] = useState(false)
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string | null>(null)
  const [ignorandoPeriodo, setIgnorandoPeriodo] = useState<string | null>(null)
  const [cancelamentoModal, setCancelamentoModal] = useState<{
    open: boolean
    solicitacaoId: string | null
    tipo: 'GOZO' | 'ABONO_PECUNIARIO' | null
    dias: number
  }>({ open: false, solicitacaoId: null, tipo: null, dias: 0 })

  const [observacoesModal, setObservacoesModal] = useState<{
    open: boolean
    periodoId: string
    numeroPeriodo: number
    observacoes: string | null
  }>({ open: false, periodoId: '', numeroPeriodo: 0, observacoes: null })

  useEffect(() => {
    if (params.id) {
      fetchColaborador(params.id as string)
    }
  }, [params.id])

  const fetchColaborador = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/colaboradores/${id}`)
      
      if (!response.ok) {
        throw new Error('Colaborador não encontrado')
      }
      
      const data = await response.json()
      setColaborador(data)
    } catch (err) {
      console.error('Erro:', err)
      setColaborador(null)
    } finally {
      setLoading(false)
    }
  }

  const handleIgnorarPeriodo = async (periodoId: string, ignorar: boolean) => {
    setIgnorandoPeriodo(periodoId)
    try {
      const response = await fetch(`/api/periodos/${periodoId}/ignorar`, {
        method: ignorar ? 'POST' : 'DELETE',
      })
      
      if (response.ok && colaborador) {
        // Atualizar localmente
        setColaborador({
          ...colaborador,
          periodosAquisitivos: colaborador.periodosAquisitivos.map(p => 
            p.id === periodoId ? { ...p, ignorado: ignorar } : p
          )
        })
      }
    } catch (err) {
      console.error('Erro ao atualizar período:', err)
    } finally {
      setIgnorandoPeriodo(null)
    }
  }

  const handleAgendarFerias = (periodoId?: string) => {
    setPeriodoSelecionado(periodoId || null)
    setFeriasModalOpen(true)
  }

  const handleCancelarSolicitacao = (solicitacaoId: string, tipo: 'GOZO' | 'ABONO_PECUNIARIO', dias: number) => {
    setCancelamentoModal({ open: true, solicitacaoId, tipo, dias })
  }

  const confirmCancelar = async (motivo: string) => {
    if (!cancelamentoModal.solicitacaoId) return

    const response = await fetch(`/api/solicitacoes/${cancelamentoModal.solicitacaoId}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivoCancelamento: motivo }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erro ao cancelar solicitação')
    }

    // Atualizar dados
    if (params.id) {
      fetchColaborador(params.id as string)
    }
  }

  // Calcular saldo total apenas de períodos NÃO IGNORADOS
  const calcularSaldoTotal = () => {
    if (!colaborador) return { total: 0, restante: 0 }
    
    return colaborador.periodosAquisitivos
      .filter(p => !p.ignorado) // Apenas não ignorados
      .reduce((acc, periodo) => {
        // Dias gozados (férias aprovadas)
        const diasGozados = periodo.solicitacoes
          .filter(s => s.status === 'APROVADO' && s.tipo === 'GOZO')
          .reduce((sum, s) => sum + s.diasGozo, 0)
        
        // Dias vendidos via solicitação ABONO_PECUNIARIO aprovada
        const diasVendidosViaSolicitacao = periodo.solicitacoes
          .filter(s => s.status === 'APROVADO' && s.tipo === 'ABONO_PECUNIARIO')
          .reduce((sum, s) => sum + s.diasGozo, 0)
        
        // Dias pendentes (qualquer tipo)
        const diasPendentes = periodo.solicitacoes
          .filter(s => s.status === 'PENDENTE')
          .reduce((sum, s) => sum + s.diasGozo, 0)
        
        // Total usado = gozados + vendidos via solicitação
        const totalUsado = diasGozados + diasVendidosViaSolicitacao
        
        // Dias restantes = direito - vendidos(campo) - usados - pendentes
        const diasRestantes = periodo.diasDireito - periodo.diasVendidos - totalUsado - diasPendentes
        
        return {
          total: acc.total + periodo.diasDireito,
          restante: acc.restante + Math.max(0, diasRestantes)
        }
      }, { total: 0, restante: 0 })
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!colaborador) {
    return (
      <div className="animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Colaborador não encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const saldo = calcularSaldoTotal()
  const periodosIgnorados = colaborador.periodosAquisitivos.filter(p => p.ignorado).length

  return (
    <div className="animate-fade-in">
      {/* Voltar */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      {/* Cabeçalho do Colaborador */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              {colaborador.avatarUrl && (
                <AvatarImage src={colaborador.avatarUrl} alt={colaborador.nome} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {getInitials(colaborador.nome)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{colaborador.nome}</h1>
                <Badge variant={colaborador.ativo ? 'success' : 'secondary'}>
                  {colaborador.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{colaborador.cargo || 'Sem cargo'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="w-4 h-4" />
                  <span className="text-sm">{colaborador.departamento.nome}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{colaborador.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Admissão: {formatDate(colaborador.dataAdmissao)}</span>
                </div>
              </div>
            </div>

            <Button onClick={() => handleAgendarFerias()}>
              <Calendar className="w-4 h-4 mr-2" />
              Agendar Férias
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Saldo */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Saldo Total de Férias</h3>
              <p className="text-sm text-gray-500">
                Considerando apenas períodos não ignorados
                {periodosIgnorados > 0 && (
                  <span className="text-amber-600 ml-1">
                    ({periodosIgnorados} período(s) ignorado(s))
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{saldo.restante} dias</p>
              <p className="text-sm text-gray-500">restantes de {saldo.total} dias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Períodos Aquisitivos */}
      <Card>
        <CardHeader>
          <CardTitle>Períodos Aquisitivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {colaborador.periodosAquisitivos.map((periodo) => (
              <PeriodoCard 
                key={periodo.id} 
                periodo={periodo} 
                onAgendar={() => handleAgendarFerias(periodo.id)}
                onIgnorar={(ignorar) => handleIgnorarPeriodo(periodo.id, ignorar)}
                onCancelar={handleCancelarSolicitacao}
                onEditarObservacoes={() => setObservacoesModal({
                  open: true,
                  periodoId: periodo.id,
                  numeroPeriodo: periodo.numeroPeriodo,
                  observacoes: periodo.observacoes
                })}
                isIgnorando={ignorandoPeriodo === periodo.id}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Férias */}
      <FeriasModal
        open={feriasModalOpen}
        onClose={() => {
          setFeriasModalOpen(false)
          setPeriodoSelecionado(null)
        }}
        onSuccess={() => {
          fetchColaborador(params.id as string)
          setFeriasModalOpen(false)
          setPeriodoSelecionado(null)
        }}
        colaboradorPreSelecionado={colaborador.id}
        periodoPreSelecionado={periodoSelecionado}
      />

      {/* Modal de Cancelamento */}
      <CancelamentoModal
        open={cancelamentoModal.open}
        onClose={() => setCancelamentoModal({ open: false, solicitacaoId: null, tipo: null, dias: 0 })}
        onConfirm={confirmCancelar}
        title={cancelamentoModal.tipo === 'GOZO' ? 'Cancelar Férias' : 'Cancelar Venda de Dias'}
        description={`Cancelar ${cancelamentoModal.tipo === 'GOZO' ? 'férias' : 'venda'} de ${cancelamentoModal.dias} dias?`}
      />

      {/* Modal de Observações */}
      <ObservacoesPeriodoModal
        open={observacoesModal.open}
        onClose={() => setObservacoesModal({ open: false, periodoId: '', numeroPeriodo: 0, observacoes: null })}
        onSuccess={() => fetchColaborador(params.id as string)}
        periodoId={observacoesModal.periodoId}
        numeroPeriodo={observacoesModal.numeroPeriodo}
        observacoesAtuais={observacoesModal.observacoes}
      />
    </div>
  )
}

interface PeriodoCardProps {
  periodo: Periodo
  onAgendar: () => void
  onIgnorar: (ignorar: boolean) => void
  onCancelar: (solicitacaoId: string, tipo: 'GOZO' | 'ABONO_PECUNIARIO', dias: number) => void
  onEditarObservacoes: () => void
  isIgnorando: boolean
}

function PeriodoCard({ periodo, onAgendar, onIgnorar, onCancelar, onEditarObservacoes, isIgnorando }: PeriodoCardProps) {
  // Calcular dias gozados (férias aprovadas)
  const diasGozados = periodo.solicitacoes
    .filter(s => s.status === 'APROVADO' && s.tipo === 'GOZO')
    .reduce((acc, s) => acc + s.diasGozo, 0)

  // Dias vendidos via solicitação ABONO_PECUNIARIO aprovada
  const diasVendidosViaSolicitacao = periodo.solicitacoes
    .filter(s => s.status === 'APROVADO' && s.tipo === 'ABONO_PECUNIARIO')
    .reduce((acc, s) => acc + s.diasGozo, 0)

  // Total de dias vendidos (campo do período + solicitações aprovadas)
  const totalDiasVendidos = periodo.diasVendidos + diasVendidosViaSolicitacao

  // Dias pendentes (qualquer tipo)
  const diasPendentes = periodo.solicitacoes
    .filter(s => s.status === 'PENDENTE')
    .reduce((acc, s) => acc + s.diasGozo, 0)

  // Dias restantes considerando tudo
  const diasRestantes = periodo.diasDireito - periodo.diasVendidos - diasGozados - diasVendidosViaSolicitacao - diasPendentes
  const percentualUsado = ((periodo.diasDireito - diasRestantes) / periodo.diasDireito) * 100

  // Verificar se está vencendo
  const diasParaVencer = Math.ceil(
    (new Date(periodo.dataLimiteGozo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const estaVencendo = diasParaVencer <= 90 && diasParaVencer > 0 && diasRestantes > 0

  const statusConfig = {
    ATIVO: { label: 'Ativo', variant: 'info' as const, icon: null },
    QUITADO: { label: 'Quitado', variant: 'success' as const, icon: CheckCircle },
    VENCIDO: { label: 'Vencido', variant: 'danger' as const, icon: AlertTriangle },
  }

  const config = statusConfig[periodo.status]

  return (
    <div className={cn(
      'border rounded-xl p-5 transition-all',
      periodo.ignorado 
        ? 'border-gray-200 bg-gray-50 opacity-60' 
        : estaVencendo 
          ? 'border-ferias-warning bg-ferias-warning/5' 
          : 'border-gray-100'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900">
              {periodo.numeroPeriodo}º Período
            </h4>
            <Badge variant={config.variant}>
              {config.icon && <config.icon className="w-3 h-3 mr-1" />}
              {config.label}
            </Badge>
            {periodo.ignorado && (
              <Badge variant="secondary" className="bg-gray-200">
                <EyeOff className="w-3 h-3 mr-1" />
                Ignorado
              </Badge>
            )}
            {!periodo.ignorado && estaVencendo && (
              <Badge variant="warning">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Vence em {diasParaVencer} dias
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Aquisitivo: {formatDate(periodo.dataInicioAquisitivo)} a {formatDate(periodo.dataFimAquisitivo)}
          </p>
          <p className="text-sm text-gray-500">
            Limite para gozo: {formatDate(periodo.dataLimiteGozo)}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Botão de ignorar/restaurar */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onIgnorar(!periodo.ignorado)}
            disabled={isIgnorando}
            className={cn(
              'text-gray-500',
              periodo.ignorado ? 'hover:text-green-600' : 'hover:text-amber-600'
            )}
          >
            {isIgnorando ? (
              '...'
            ) : periodo.ignorado ? (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Restaurar
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Ignorar
              </>
            )}
          </Button>

          {/* Botões de ação (apenas se não ignorado e com dias disponíveis) */}
          {!periodo.ignorado && periodo.status === 'ATIVO' && diasRestantes > 0 && (
            <Button variant="outline" size="sm" onClick={onAgendar}>
              <Calendar className="w-4 h-4 mr-1" />
              Agendar
            </Button>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Progresso do período</span>
          <span className="font-medium text-gray-900">
            {diasRestantes} dias restantes
          </span>
        </div>
        <Progress 
          value={percentualUsado} 
          className="h-3"
          indicatorClassName={cn(
            periodo.ignorado ? 'bg-gray-300' :
            periodo.status === 'QUITADO' ? 'bg-ferias-success' :
            estaVencendo ? 'bg-ferias-warning' : 'bg-ferias-info'
          )}
        />
      </div>

      {/* Detalhes */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-gray-500">Direito</p>
          <p className="font-semibold text-gray-900">{periodo.diasDireito} dias</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-gray-500">Vendidos</p>
          <p className="font-semibold text-gray-900">{totalDiasVendidos} dias</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-gray-500">Gozados</p>
          <p className="font-semibold text-gray-900">{diasGozados} dias</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-gray-500">Pendentes</p>
          <p className="font-semibold text-gray-900">{diasPendentes} dias</p>
        </div>
      </div>

      {/* Observações */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <FileText className="w-4 h-4" />
            Observações
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEditarObservacoes}
            className="text-gray-500 hover:text-primary h-7 px-2"
          >
            <Pencil className="w-3 h-3 mr-1" />
            {periodo.observacoes ? 'Editar' : 'Adicionar'}
          </Button>
        </div>
        {periodo.observacoes ? (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-900">
            {periodo.observacoes}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Nenhuma observação registrada para este período.
          </p>
        )}
      </div>

      {/* Solicitações */}
      {periodo.solicitacoes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">Solicitações:</p>
          <div className="space-y-3">
            {periodo.solicitacoes.map((sol) => {
              // Verificar se pode cancelar
              const podeCancelar = () => {
                if (sol.status === 'PENDENTE') return true
                if (sol.status === 'APROVADO') {
                  if (sol.tipo === 'GOZO') {
                    return new Date(sol.dataInicioGozo) > new Date()
                  }
                  return true
                }
                return false
              }

              return (
                <div key={sol.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {sol.tipo === 'GOZO' ? (
                        <Calendar className="w-4 h-4 text-blue-500" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-gray-900">
                        {sol.tipo === 'GOZO' 
                          ? `${formatDate(sol.dataInicioGozo)} - ${formatDate(sol.dataFimGozo)}`
                          : 'Venda de dias'
                        }
                      </span>
                      <span className="text-gray-500">({sol.diasGozo} dias)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          sol.status === 'APROVADO' ? 'success' :
                          sol.status === 'PENDENTE' ? 'warning' :
                          sol.status === 'REJEITADO' ? 'danger' : 'secondary'
                        }
                      >
                        {sol.status}
                      </Badge>
                      {podeCancelar() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => onCancelar(sol.id, sol.tipo, sol.diasGozo)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Informações de aprovação */}
                  {sol.status === 'APROVADO' && sol.aprovadoEm && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Aprovado por {sol.aprovadoPor || 'Sistema'} em {formatDate(sol.aprovadoEm)}
                    </p>
                  )}
                  
                  {/* Motivo da rejeição */}
                  {sol.status === 'REJEITADO' && sol.motivoRejeicao && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs">
                      <span className="font-medium text-red-700">Motivo: </span>
                      <span className="text-red-600">{sol.motivoRejeicao}</span>
                    </div>
                  )}
                  
                  {/* Motivo do cancelamento */}
                  {sol.status === 'CANCELADO' && sol.motivoCancelamento && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-xs">
                      <span className="font-medium text-amber-700">Motivo do cancelamento: </span>
                      <span className="text-amber-600">{sol.motivoCancelamento}</span>
                      {sol.canceladoEm && (
                        <span className="text-amber-500 ml-1">
                          ({formatDate(sol.canceladoEm)})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
