'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

interface RejeicaoModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (motivo: string) => Promise<void>
  solicitacaoInfo?: {
    colaboradorNome: string
    tipo: string
    dias: number
  }
}

export function RejeicaoModal({ open, onClose, onConfirm, solicitacaoInfo }: RejeicaoModalProps) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!motivo.trim()) {
      setError('Informe o motivo da rejeição')
      return
    }

    if (motivo.trim().length < 10) {
      setError('O motivo deve ter pelo menos 10 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onConfirm(motivo.trim())
      setMotivo('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao rejeitar solicitação')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMotivo('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Rejeitar Solicitação</DialogTitle>
              {solicitacaoInfo && (
                <DialogDescription className="mt-1">
                  {solicitacaoInfo.colaboradorNome} - {solicitacaoInfo.tipo === 'GOZO' ? 'Férias' : 'Venda'} ({solicitacaoInfo.dias} dias)
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="motivo">Motivo da Rejeição *</Label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explique o motivo da rejeição..."
              className="w-full mt-1 p-3 border rounded-lg resize-none h-32 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {motivo.length}/500 caracteres
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? 'Rejeitando...' : 'Rejeitar Solicitação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
