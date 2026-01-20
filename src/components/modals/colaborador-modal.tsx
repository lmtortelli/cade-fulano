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

interface Departamento {
  id: string
  nome: string
}

interface ColaboradorModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  colaborador?: {
    id: string
    nome: string
    email: string
    matricula: string | null
    cargo: string | null
    dataAdmissao: string
    departamentoId: string
  } | null
}

export function ColaboradorModal({ open, onClose, onSuccess, colaborador }: ColaboradorModalProps) {
  const [loading, setLoading] = useState(false)
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    matricula: '',
    cargo: '',
    dataAdmissao: '',
    departamentoId: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDepartamentos()
  }, [])

  useEffect(() => {
    if (colaborador) {
      setFormData({
        nome: colaborador.nome,
        email: colaborador.email,
        matricula: colaborador.matricula || '',
        cargo: colaborador.cargo || '',
        dataAdmissao: colaborador.dataAdmissao.split('T')[0],
        departamentoId: colaborador.departamentoId,
      })
    } else {
      setFormData({
        nome: '',
        email: '',
        matricula: '',
        cargo: '',
        dataAdmissao: '',
        departamentoId: '',
      })
    }
    setError('')
  }, [colaborador, open])

  const fetchDepartamentos = async () => {
    try {
      const response = await fetch('/api/departamentos')
      if (response.ok) {
        const data = await response.json()
        setDepartamentos(data)
      }
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nome || !formData.email || !formData.dataAdmissao || !formData.departamentoId) {
      setError('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      const url = colaborador 
        ? `/api/colaboradores/${colaborador.id}` 
        : '/api/colaboradores'
      
      const method = colaborador ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dataAdmissao: new Date(formData.dataAdmissao).toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar colaborador')
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                placeholder="EX001"
              />
            </div>

            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Desenvolvedor"
              />
            </div>

            <div>
              <Label htmlFor="dataAdmissao">Data de Admissão *</Label>
              <Input
                id="dataAdmissao"
                type="date"
                value={formData.dataAdmissao}
                onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="departamento">Departamento *</Label>
              <Select 
                value={formData.departamentoId} 
                onValueChange={(value) => setFormData({ ...formData, departamentoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((dep) => (
                    <SelectItem key={dep.id} value={dep.id}>
                      {dep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : colaborador ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
