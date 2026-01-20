'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Colaborador {
  id: string
  nome: string
  departamento: {
    id: string
    nome: string
  }
}

const TIPOS_FOLGA = [
  { value: 'FERIADO', label: 'Feriado' },
  { value: 'COMPENSACAO', label: 'Compensação (Banco de horas)' },
  { value: 'ABONO', label: 'Abono do empregador' },
  { value: 'LICENCA', label: 'Licença' },
  { value: 'CARGO_CONFIANCA', label: 'Cargo de Confiança' },
  { value: 'OUTRO', label: 'Outro' },
]

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function SolicitarFolgaPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Form fields
  const [colaboradorId, setColaboradorId] = useState('')
  const [data, setData] = useState('')
  const [tipo, setTipo] = useState('')
  const [descricao, setDescricao] = useState('')

  useEffect(() => {
    fetchColaboradores()
  }, [])

  const fetchColaboradores = async () => {
    try {
      const response = await fetch('/api/colaboradores?limit=100')
      if (response.ok) {
        const data = await response.json()
        setColaboradores(data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!colaboradorId || !data || !tipo) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.')
      setFormStatus('error')
      return
    }

    setFormStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/folgas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colaboradorId,
          data,
          tipo,
          descricao: descricao || undefined,
          status: 'PENDENTE', // Sempre vai como pendente para aprovação
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao enviar solicitação')
      }

      setFormStatus('success')
      // Limpar formulário
      setColaboradorId('')
      setData('')
      setTipo('')
      setDescricao('')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar solicitação')
      setFormStatus('error')
    }
  }

  const resetForm = () => {
    setFormStatus('idle')
    setErrorMessage('')
  }

  if (formStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Solicitação Enviada!
              </h2>
              <p className="text-gray-600 mb-6">
                Sua solicitação de folga foi enviada com sucesso e está aguardando aprovação.
              </p>
              <Button onClick={resetForm} className="w-full">
                Fazer Nova Solicitação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Solicitar Folga</CardTitle>
          <CardDescription>
            Preencha o formulário abaixo para solicitar uma folga. Sua solicitação será enviada para aprovação.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Colaborador */}
            <div className="space-y-2">
              <Label htmlFor="colaborador">
                Colaborador <span className="text-red-500">*</span>
              </Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger id="colaborador">
                  <SelectValue placeholder="Selecione seu nome" />
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
            <div className="space-y-2">
              <Label htmlFor="data">
                Data da Folga <span className="text-red-500">*</span>
              </Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Folga <span className="text-red-500">*</span>
              </Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_FOLGA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">
                Descrição / Motivo <span className="text-gray-400">(opcional)</span>
              </Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o motivo da folga..."
                rows={3}
              />
            </div>

            {/* Erro */}
            {formStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* Info */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              <Clock className="w-4 h-4 flex-shrink-0" />
              Sua solicitação será analisada e você receberá uma resposta em breve.
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={formStatus === 'loading' || loading}
            >
              {formStatus === 'loading' ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
