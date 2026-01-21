'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileText, AlertCircle } from 'lucide-react'

interface ObservacoesPeriodoModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  periodoId: string
  numeroPeriodo: number
  observacoesAtuais: string | null
}

export function ObservacoesPeriodoModal({
  open,
  onClose,
  onSuccess,
  periodoId,
  numeroPeriodo,
  observacoesAtuais,
}: ObservacoesPeriodoModalProps) {
  const [loading, setLoading] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setObservacoes(observacoesAtuais || '')
      setError('')
    }
  }, [open, observacoesAtuais])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/periodos/${periodoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observacoes: observacoes.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar observações')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar observações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Observações - {numeroPeriodo}º Período
          </DialogTitle>
          <DialogDescription>
            Adicione anotações ou detalhes sobre este período aquisitivo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Colaborador optou em não utilizar dias de sindicato neste período..."
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Estas observações são internas e visíveis apenas para os gestores.
              </p>
            </div>

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
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
