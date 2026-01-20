'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

interface Colaborador {
  id: string
  nome: string
  departamento: {
    nome: string
  }
}

interface Folga {
  id: string
  colaboradorId: string
  data: string
  tipo: string
  descricao: string | null
}

interface FolgaModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  folga?: Folga | null
}

const TIPOS_FOLGA = [
  { value: 'FERIADO', label: 'Feriado' },
  { value: 'COMPENSACAO', label: 'Compensação (Banco de horas)' },
  { value: 'ABONO', label: 'Abono do empregador' },
  { value: 'LICENCA', label: 'Licença' },
  { value: 'CARGO_CONFIANCA', label: 'Cargo de Confiança' },
  { value: 'OUTRO', label: 'Outro' },
]

export function FolgaModal({ open, onClose, onSuccess, folga }: FolgaModalProps) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    colaboradorId: '',
    data: '',
    tipo: 'COMPENSACAO',
    descricao: ''
  })
  const [error, setError] = useState('')

  const isEditing = !!folga

  useEffect(() => {
    if (open) {
      fetchColaboradores()
      if (folga) {
        setFormData({
          colaboradorId: folga.colaboradorId,
          data: folga.data.split('T')[0],
          tipo: folga.tipo,
          descricao: folga.descricao || ''
        })
      } else {
        setFormData({
          colaboradorId: '',
          data: new Date().toISOString().split('T')[0],
          tipo: 'COMPENSACAO',
          descricao: ''
        })
      }
    }
  }, [open, folga])

  const fetchColaboradores = async () => {
    try {
      const response = await fetch('/api/colaboradores?ativo=true')
      if (response.ok) {
        const data = await response.json()
        setColaboradores(data.data || data)
      }
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.colaboradorId) {
      setError('Selecione um colaborador')
      return
    }

    if (!formData.data) {
      setError('Informe a data da folga')
      return
    }

    setLoading(true)
    try {
      const url = isEditing ? `/api/folgas/${folga.id}` : '/api/folgas'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colaboradorId: formData.colaboradorId,
          data: formData.data,
          tipo: formData.tipo,
          descricao: formData.descricao || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar folga')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar folga')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Folga' : 'Registrar Folga'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações da folga.' 
              : 'Registre uma nova folga para um colaborador.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Colaborador */}
          <div>
            <Label htmlFor="colaborador">Colaborador *</Label>
            <Select
              value={formData.colaboradorId}
              onValueChange={(value) => setFormData({ ...formData, colaboradorId: value })}
              disabled={isEditing}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione o colaborador" />
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

          {/* Data */}
          <div>
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="mt-1.5"
            />
          </div>

          {/* Tipo */}
          <div>
            <Label htmlFor="tipo">Tipo de Folga *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_FOLGA.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Compensação de banco de horas"
              className="mt-1.5"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
