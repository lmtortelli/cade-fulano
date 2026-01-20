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

interface DepartamentoModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  departamento?: {
    id: string
    nome: string
    sigla: string | null
    limiteAusencias: number
  } | null
}

export function DepartamentoModal({ open, onClose, onSuccess, departamento }: DepartamentoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    limiteAusencias: 2,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (departamento) {
      setFormData({
        nome: departamento.nome,
        sigla: departamento.sigla || '',
        limiteAusencias: departamento.limiteAusencias,
      })
    } else {
      setFormData({
        nome: '',
        sigla: '',
        limiteAusencias: 2,
      })
    }
    setError('')
  }, [departamento, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nome) {
      setError('Nome é obrigatório')
      return
    }

    setLoading(true)

    try {
      const url = departamento 
        ? `/api/departamentos/${departamento.id}` 
        : '/api/departamentos'
      
      const method = departamento ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar departamento')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {departamento ? 'Editar Departamento' : 'Novo Departamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Recursos Humanos"
              />
            </div>

            <div>
              <Label htmlFor="sigla">Sigla</Label>
              <Input
                id="sigla"
                value={formData.sigla}
                onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                placeholder="Ex: RH"
                maxLength={10}
              />
            </div>

            <div>
              <Label htmlFor="limiteAusencias">Limite de Ausências Simultâneas</Label>
              <Input
                id="limiteAusencias"
                type="number"
                min={1}
                max={10}
                value={formData.limiteAusencias}
                onChange={(e) => setFormData({ ...formData, limiteAusencias: parseInt(e.target.value) || 2 })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo de colaboradores que podem estar de férias ao mesmo tempo
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : departamento ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
