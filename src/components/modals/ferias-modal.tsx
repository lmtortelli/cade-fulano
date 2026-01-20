'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { differenceInDays, format } from 'date-fns'
import { EyeOff, Eye, Calendar, DollarSign, AlertCircle } from 'lucide-react'

interface Colaborador {
  id: string
  nome: string
  departamento: {
    nome: string
  }
}

interface PeriodoAquisitivo {
  id: string
  numeroPeriodo: number
  dataInicioAquisitivo: string
  dataFimAquisitivo: string
  diasDireito: number
  diasVendidos: number
  diasRestantes?: number
  ignorado?: boolean
}

interface FeriasModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  colaboradorPreSelecionado?: string | null
  periodoPreSelecionado?: string | null
}

export function FeriasModal({ 
  open, 
  onClose, 
  onSuccess, 
  colaboradorPreSelecionado,
  periodoPreSelecionado 
}: FeriasModalProps) {
  const [loading, setLoading] = useState(false)
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [periodos, setPeriodos] = useState<PeriodoAquisitivo[]>([])
  const [periodosIgnorados, setPeriodosIgnorados] = useState<PeriodoAquisitivo[]>([])
  const [loadingPeriodos, setLoadingPeriodos] = useState(false)
  const [showIgnorados, setShowIgnorados] = useState(false)
  const [ignorandoPeriodo, setIgnorandoPeriodo] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    colaboradorId: '',
    periodoAquisitivoId: '',
    tipo: 'GOZO' as 'GOZO' | 'ABONO_PECUNIARIO',
    dataInicioGozo: '',
    dataFimGozo: '',
    diasGozo: 0,
    diasVenda: 0,
    observacoes: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      fetchColaboradores()
      resetForm()
      
      // Pré-selecionar colaborador se fornecido
      if (colaboradorPreSelecionado) {
        setFormData(prev => ({ ...prev, colaboradorId: colaboradorPreSelecionado }))
      }
    }
  }, [open, colaboradorPreSelecionado])

  useEffect(() => {
    if (formData.colaboradorId) {
      fetchPeriodos(formData.colaboradorId)
    } else {
      setPeriodos([])
      setPeriodosIgnorados([])
    }
  }, [formData.colaboradorId])

  useEffect(() => {
    // Pré-selecionar período se fornecido
    if (periodoPreSelecionado && periodos.length > 0) {
      const periodoExiste = periodos.find(p => p.id === periodoPreSelecionado)
      if (periodoExiste) {
        setFormData(prev => ({ ...prev, periodoAquisitivoId: periodoPreSelecionado }))
      }
    }
  }, [periodoPreSelecionado, periodos])

  useEffect(() => {
    // Calcular dias automaticamente para GOZO
    if (formData.tipo === 'GOZO' && formData.dataInicioGozo && formData.dataFimGozo) {
      const inicio = new Date(formData.dataInicioGozo)
      const fim = new Date(formData.dataFimGozo)
      const dias = differenceInDays(fim, inicio) + 1
      setFormData(prev => ({ ...prev, diasGozo: dias > 0 ? dias : 0 }))
    }
  }, [formData.dataInicioGozo, formData.dataFimGozo, formData.tipo])

  const resetForm = () => {
    setFormData({
      colaboradorId: colaboradorPreSelecionado || '',
      periodoAquisitivoId: periodoPreSelecionado || '',
      tipo: 'GOZO',
      dataInicioGozo: '',
      dataFimGozo: '',
      diasGozo: 0,
      diasVenda: 0,
      observacoes: '',
    })
    setError('')
    setPeriodos([])
    setPeriodosIgnorados([])
    setShowIgnorados(false)
  }

  const fetchColaboradores = async () => {
    try {
      const response = await fetch('/api/colaboradores?limit=100')
      if (response.ok) {
        const data = await response.json()
        setColaboradores(data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err)
    }
  }

  const fetchPeriodos = async (colaboradorId: string) => {
    setLoadingPeriodos(true)
    try {
      const response = await fetch(`/api/colaboradores/${colaboradorId}/saldo`)
      if (response.ok) {
        const data = await response.json()
        const todosPeriodos = (data.saldos || []).map((s: any) => ({
          id: s.periodoId,
          numeroPeriodo: s.numeroPeriodo,
          dataInicioAquisitivo: s.dataInicioAquisitivo,
          dataFimAquisitivo: s.dataFimAquisitivo,
          diasDireito: s.diasDireito,
          diasVendidos: s.diasVendidos,
          diasRestantes: s.diasRestantes,
          ignorado: s.ignorado || false
        }))
        
        // Separar períodos ativos (não ignorados e com dias restantes) dos ignorados
        setPeriodos(todosPeriodos.filter((p: PeriodoAquisitivo) => !p.ignorado && p.diasRestantes! > 0))
        setPeriodosIgnorados(todosPeriodos.filter((p: PeriodoAquisitivo) => p.ignorado))
      }
    } catch (err) {
      console.error('Erro ao carregar períodos:', err)
    } finally {
      setLoadingPeriodos(false)
    }
  }

  const handleIgnorarPeriodo = async (periodoId: string) => {
    setIgnorandoPeriodo(periodoId)
    try {
      const response = await fetch(`/api/periodos/${periodoId}/ignorar`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const periodo = periodos.find(p => p.id === periodoId)
        if (periodo) {
          setPeriodos(prev => prev.filter(p => p.id !== periodoId))
          setPeriodosIgnorados(prev => [...prev, { ...periodo, ignorado: true }])
        }
        
        if (formData.periodoAquisitivoId === periodoId) {
          setFormData(prev => ({ ...prev, periodoAquisitivoId: '' }))
        }
      }
    } catch (err) {
      console.error('Erro ao ignorar período:', err)
    } finally {
      setIgnorandoPeriodo(null)
    }
  }

  const handleRestaurarPeriodo = async (periodoId: string) => {
    setIgnorandoPeriodo(periodoId)
    try {
      const response = await fetch(`/api/periodos/${periodoId}/ignorar`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        const periodo = periodosIgnorados.find(p => p.id === periodoId)
        if (periodo && periodo.diasRestantes! > 0) {
          setPeriodosIgnorados(prev => prev.filter(p => p.id !== periodoId))
          setPeriodos(prev => [...prev, { ...periodo, ignorado: false }].sort((a, b) => a.numeroPeriodo - b.numeroPeriodo))
        }
      }
    } catch (err) {
      console.error('Erro ao restaurar período:', err)
    } finally {
      setIgnorandoPeriodo(null)
    }
  }

  const handleAgendarPeriodo = (periodoId: string) => {
    setFormData(prev => ({ ...prev, periodoAquisitivoId: periodoId, tipo: 'GOZO' }))
  }

  const handleVenderPeriodo = (periodoId: string) => {
    const periodo = periodos.find(p => p.id === periodoId)
    const maxVenda = Math.min(10 - (periodo?.diasVendidos || 0), periodo?.diasRestantes || 0)
    setFormData(prev => ({ 
      ...prev, 
      periodoAquisitivoId: periodoId, 
      tipo: 'ABONO_PECUNIARIO',
      diasVenda: maxVenda > 0 ? maxVenda : 0
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.colaboradorId || !formData.periodoAquisitivoId) {
      setError('Selecione o colaborador e o período')
      return
    }

    const periodoSelecionado = periodos.find(p => p.id === formData.periodoAquisitivoId)

    if (formData.tipo === 'GOZO') {
      if (!formData.dataInicioGozo || !formData.dataFimGozo) {
        setError('Preencha as datas de início e fim')
        return
      }

      if (formData.diasGozo <= 0) {
        setError('A data de fim deve ser posterior à data de início')
        return
      }

      if (periodoSelecionado && formData.diasGozo > (periodoSelecionado.diasRestantes || 0)) {
        setError(`Você só tem ${periodoSelecionado.diasRestantes} dias disponíveis neste período`)
        return
      }
    } else {
      // ABONO_PECUNIARIO
      if (formData.diasVenda <= 0) {
        setError('Informe quantos dias deseja vender')
        return
      }

      const maxVenda = Math.min(10 - (periodoSelecionado?.diasVendidos || 0), periodoSelecionado?.diasRestantes || 0)
      if (formData.diasVenda > maxVenda) {
        setError(`Você pode vender no máximo ${maxVenda} dias deste período`)
        return
      }

      if (formData.diasVenda > 10) {
        setError('O limite máximo de venda é 10 dias (1/3 das férias)')
        return
      }
    }

    setLoading(true)

    try {
      const payload = formData.tipo === 'GOZO' 
        ? {
            periodoAquisitivoId: formData.periodoAquisitivoId,
            dataInicioGozo: new Date(formData.dataInicioGozo).toISOString(),
            dataFimGozo: new Date(formData.dataFimGozo).toISOString(),
            diasGozo: formData.diasGozo,
            tipo: 'GOZO',
            observacoes: formData.observacoes || null,
          }
        : {
            periodoAquisitivoId: formData.periodoAquisitivoId,
            dataInicioGozo: new Date().toISOString(),
            dataFimGozo: new Date().toISOString(),
            diasGozo: formData.diasVenda,
            tipo: 'ABONO_PECUNIARIO',
            observacoes: formData.observacoes || `Venda de ${formData.diasVenda} dias`,
          }

      const response = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar solicitação')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedPeriodo = periodos.find(p => p.id === formData.periodoAquisitivoId)
  const maxVendaDisponivel = selectedPeriodo 
    ? Math.min(10 - (selectedPeriodo.diasVendidos || 0), selectedPeriodo.diasRestantes || 0)
    : 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.tipo === 'GOZO' ? 'Agendar Férias' : 'Vender Dias de Férias'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Colaborador */}
            <div>
              <Label htmlFor="colaborador">Colaborador *</Label>
              <Select 
                value={formData.colaboradorId} 
                onValueChange={(value) => setFormData({ ...formData, colaboradorId: value, periodoAquisitivoId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador..." />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.nome} - {col.departamento.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de períodos com ações */}
            {formData.colaboradorId && !loadingPeriodos && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Períodos Aquisitivos</span>
                  {periodosIgnorados.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => setShowIgnorados(!showIgnorados)}
                    >
                      {showIgnorados ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {periodosIgnorados.length} ignorado(s)
                    </Button>
                  )}
                </div>
                
                {periodos.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nenhum período com dias disponíveis
                  </div>
                ) : (
                  <div className="divide-y max-h-48 overflow-y-auto">
                    {periodos.map((periodo) => {
                      const isSelected = formData.periodoAquisitivoId === periodo.id
                      const podeVender = (10 - (periodo.diasVendidos || 0)) > 0 && periodo.diasRestantes! > 0
                      
                      return (
                        <div 
                          key={periodo.id} 
                          className={`p-3 ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                {periodo.numeroPeriodo}º Período
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(periodo.dataInicioAquisitivo), 'dd/MM/yyyy')} - {format(new Date(periodo.dataFimAquisitivo), 'dd/MM/yyyy')}
                              </p>
                              <p className="text-xs mt-1">
                                <span className="text-green-600 font-medium">{periodo.diasRestantes} dias disponíveis</span>
                                {periodo.diasVendidos > 0 && (
                                  <span className="text-amber-600 ml-2">({periodo.diasVendidos} vendidos)</span>
                                )}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={isSelected && formData.tipo === 'GOZO' ? 'default' : 'outline'}
                                className="h-8 text-xs"
                                onClick={() => handleAgendarPeriodo(periodo.id)}
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                Agendar
                              </Button>
                              {podeVender && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected && formData.tipo === 'ABONO_PECUNIARIO' ? 'default' : 'outline'}
                                  className="h-8 text-xs"
                                  onClick={() => handleVenderPeriodo(periodo.id)}
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Vender
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-gray-400 hover:text-red-600"
                                onClick={() => handleIgnorarPeriodo(periodo.id)}
                                disabled={ignorandoPeriodo === periodo.id}
                              >
                                <EyeOff className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Períodos ignorados */}
                {showIgnorados && periodosIgnorados.length > 0 && (
                  <div className="border-t bg-amber-50">
                    <div className="px-3 py-2 border-b border-amber-200">
                      <span className="text-xs font-medium text-amber-700">Períodos Ignorados</span>
                    </div>
                    <div className="divide-y divide-amber-200 max-h-32 overflow-y-auto">
                      {periodosIgnorados.map((periodo) => (
                        <div key={periodo.id} className="p-2 flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {periodo.numeroPeriodo}º Período - {periodo.diasRestantes} dias
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-amber-600 hover:text-green-600"
                            onClick={() => handleRestaurarPeriodo(periodo.id)}
                            disabled={ignorandoPeriodo === periodo.id}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Restaurar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {loadingPeriodos && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Formulário de GOZO */}
            {formData.periodoAquisitivoId && formData.tipo === 'GOZO' && (
              <div className="border rounded-lg p-4 bg-blue-50 space-y-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Agendar Férias - {selectedPeriodo?.numeroPeriodo}º Período</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dataInicio">Data Início *</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={formData.dataInicioGozo}
                      onChange={(e) => setFormData({ ...formData, dataInicioGozo: e.target.value })}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim">Data Fim *</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={formData.dataFimGozo}
                      onChange={(e) => setFormData({ ...formData, dataFimGozo: e.target.value })}
                      min={formData.dataInicioGozo}
                      className="bg-white"
                    />
                  </div>
                </div>

                {formData.diasGozo > 0 && (
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>{formData.diasGozo} dias</strong> de férias serão agendados
                      {selectedPeriodo && (
                        <span className="text-blue-600">
                          {' '}(restará {selectedPeriodo.diasRestantes! - formData.diasGozo} dias)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Formulário de ABONO PECUNIÁRIO (Venda) */}
            {formData.periodoAquisitivoId && formData.tipo === 'ABONO_PECUNIARIO' && (
              <div className="border rounded-lg p-4 bg-amber-50 space-y-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">Vender Dias - {selectedPeriodo?.numeroPeriodo}º Período</span>
                </div>

                <div>
                  <Label htmlFor="diasVenda">Quantidade de dias para vender *</Label>
                  <Input
                    id="diasVenda"
                    type="number"
                    min={1}
                    max={maxVendaDisponivel}
                    value={formData.diasVenda}
                    onChange={(e) => setFormData({ ...formData, diasVenda: parseInt(e.target.value) || 0 })}
                    className="bg-white"
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    Máximo permitido: {maxVendaDisponivel} dias 
                    {selectedPeriodo?.diasVendidos! > 0 && ` (já vendeu ${selectedPeriodo?.diasVendidos} dias)`}
                  </p>
                </div>

                {formData.diasVenda > 0 && (
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-700">
                      Você receberá o valor de <strong>{formData.diasVenda} dias</strong> em dinheiro
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            {formData.periodoAquisitivoId && (
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações opcionais..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.periodoAquisitivoId}>
              {loading ? 'Salvando...' : formData.tipo === 'GOZO' ? 'Agendar Férias' : 'Solicitar Venda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
