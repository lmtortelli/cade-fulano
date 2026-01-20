'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

interface CancelamentoModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (motivo: string) => Promise<void>
  title?: string
  description?: string
  loading?: boolean
}

export function CancelamentoModal({
  open,
  onClose,
  onConfirm,
  title = 'Cancelar Solicitação',
  description = 'Por favor, informe o motivo do cancelamento.',
  loading = false
}: CancelamentoModalProps) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!motivo.trim()) {
      setError('O motivo do cancelamento é obrigatório')
      return
    }

    if (motivo.trim().length < 5) {
      setError('O motivo deve ter pelo menos 5 caracteres')
      return
    }

    setSubmitting(true)
    try {
      await onConfirm(motivo.trim())
      setMotivo('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting && !loading) {
      setMotivo('')
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="motivo" className="text-sm font-medium">
              Motivo do Cancelamento <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value)
                setError('')
              }}
              placeholder="Descreva o motivo do cancelamento..."
              className="mt-1.5 w-full min-h-[100px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={submitting || loading}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting || loading}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={submitting || loading || !motivo.trim()}
            >
              {submitting || loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
