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
import { Textarea } from '@/components/ui/textarea'
import { differenceInDays } from 'date-fns'
import { Calendar, DollarSign, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Solicitacao {
  id: string
  tipo: 'GOZO' | 'ABONO_PECUNIARIO'
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO'
  dataInicioGozo: string
  dataFimGozo: string
  diasGozo: number
  observacoes: string | null
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

interface EditarFeriasModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  solicitacao: Solicitacao | null
}

export function EditarFeriasModal({ 
  open, 
  onClose, 
  onSuccess, 
  solicitacao 
}: EditarFeriasModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    dataInicioGozo: '',
    dataFimGozo: '',
    diasGozo: 0,
    observacoes: '',
  })

  // Carregar dados da solicitação quando abrir o modal
  useEffect(() => {
    if (open && solicitacao) {
      const dataInicio = solicitacao.dataInicioGozo.split('T')[0]
      const dataFim = solicitacao.dataFimGozo.split('T')[0]
      
      setFormData({
        dataInicioGozo: dataInicio,
        dataFimGozo: dataFim,
        diasGozo: solicitacao.diasGozo,
        observacoes: solicitacao.observacoes || '',
      })
      setError('')
    }
  }, [open, solicitacao])

  // Calcular dias quando as datas mudam
  useEffect(() => {
    if (formData.dataInicioGozo && formData.dataFimGozo && solicitacao?.tipo === 'GOZO') {
      const inicio = new Date(formData.dataInicioGozo + 'T12:00:00')
      const fim = new Date(formData.dataFimGozo + 'T12:00:00')
      const dias = differenceInDays(fim, inicio) + 1
      if (dias > 0) {
        setFormData(prev => ({ ...prev, diasGozo: dias }))
      }
    }
  }, [formData.dataInicioGozo, formData.dataFimGozo, solicitacao?.tipo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!solicitacao) return
    
    setError('')
    setLoading(true)

    try {
      const payload: any = {
        observacoes: formData.observacoes || null,
      }

      if (solicitacao.tipo === 'GOZO') {
        payload.dataInicioGozo = new Date(formData.dataInicioGozo + 'T12:00:00').toISOString()
        payload.dataFimGozo = new Date(formData.dataFimGozo + 'T12:00:00').toISOString()
        payload.diasGozo = formData.diasGozo
      } else {
        // Para abono pecuniário, só pode alterar os dias
        payload.diasGozo = formData.diasGozo
      }

      const response = await fetch(`/api/solicitacoes/${solicitacao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar férias')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar férias')
    } finally {
      setLoading(false)
    }
  }

  if (!solicitacao) return null

  const isGozo = solicitacao.tipo === 'GOZO'

  return (
    <Dialog open={open} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isGozo ? (
              <><Calendar className="w-5 h-5 text-primary" /> Editar Férias</>
            ) : (
              <><DollarSign className="w-5 h-5 text-green-600" /> Editar Venda de Férias</>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Info do colaborador */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {solicitacao.periodoAquisitivo.colaborador.nome}
              </p>
              <p className="text-sm text-gray-500">
                {solicitacao.periodoAquisitivo.colaborador.departamento.nome} • 
                {solicitacao.periodoAquisitivo.numeroPeriodo}º Período Aquisitivo
              </p>
            </div>

            {isGozo ? (
              <>
                {/* Data Início */}
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicioGozo}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataInicioGozo: e.target.value }))}
                    required
                  />
                </div>

                {/* Data Fim */}
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Término</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFimGozo}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataFimGozo: e.target.value }))}
                    min={formData.dataInicioGozo}
                    required
                  />
                </div>

                {/* Dias calculados */}
                {formData.diasGozo > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <strong>{formData.diasGozo} dias</strong> de férias
                    <br />
                    <span className="text-xs">
                      De {formatDate(formData.dataInicioGozo)} até {formatDate(formData.dataFimGozo)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Dias para venda */}
                <div className="space-y-2">
                  <Label htmlFor="diasVenda">Dias a Vender</Label>
                  <Input
                    id="diasVenda"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.diasGozo}
                    onChange={(e) => setFormData(prev => ({ ...prev, diasGozo: Number(e.target.value) }))}
                    required
                  />
                  <p className="text-xs text-gray-500">Máximo de 10 dias (1/3 das férias)</p>
                </div>
              </>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Alguma observação sobre as férias..."
                rows={2}
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
