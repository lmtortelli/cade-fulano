'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Calendar, 
  Clock, 
  Gift, 
  Briefcase, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Filter,
  Plus,
  Shield,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { FolgaModal, ConfirmModal, RejeicaoModal } from '@/components/modals'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Folga {
  id: string
  data: string
  tipo: string
  descricao: string | null
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO'
  motivoRejeicao: string | null
  colaboradorId: string
  colaborador: {
    id: string
    nome: string
    cargo: string | null
    departamento: {
      id: string
      nome: string
    }
  }
}

const STATUS_CONFIG = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  APROVADO: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
  REJEITADO: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
}

interface Departamento {
  id: string
  nome: string
}

const TIPOS_FOLGA: Record<string, { label: string, icon: React.ReactNode, color: string }> = {
  FERIADO: { label: 'Feriado', icon: <Calendar className="w-4 h-4" />, color: 'bg-red-100 text-red-700' },
  COMPENSACAO: { label: 'Compensação', icon: <Clock className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  ABONO: { label: 'Abono', icon: <Gift className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  LICENCA: { label: 'Licença', icon: <Briefcase className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  CARGO_CONFIANCA: { label: 'Cargo de Confiança', icon: <Shield className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-700' },
  OUTRO: { label: 'Outro', icon: <MoreHorizontal className="w-4 h-4" />, color: 'bg-gray-100 text-gray-700' },
}

export default function FolgasPage() {
  const [folgas, setFolgas] = useState<Folga[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDepartamento, setFilterDepartamento] = useState<string>('TODOS')
  const [filterTipo, setFilterTipo] = useState<string>('TODOS')
  const [filterStatus, setFilterStatus] = useState<string>('TODOS')
  const [filterDataInicio, setFilterDataInicio] = useState<string>('')
  const [filterDataFim, setFilterDataFim] = useState<string>('')
  
  // Modais
  const [folgaModal, setFolgaModal] = useState<{
    open: boolean
    folga: Folga | null
  }>({ open: false, folga: null })
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean
    folga: Folga | null
  }>({ open: false, folga: null })
  const [rejeicaoModal, setRejeicaoModal] = useState<{
    open: boolean
    folga: Folga | null
  }>({ open: false, folga: null })

  useEffect(() => {
    fetchDepartamentos()
  }, [])

  useEffect(() => {
    fetchFolgas()
  }, [filterDepartamento, filterTipo, filterStatus, filterDataInicio, filterDataFim])

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

  const fetchFolgas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filterDepartamento !== 'TODOS') {
        params.append('departamentoId', filterDepartamento)
      }
      if (filterTipo !== 'TODOS') {
        params.append('tipo', filterTipo)
      }
      if (filterStatus !== 'TODOS') {
        params.append('status', filterStatus)
      }
      if (filterDataInicio) {
        params.append('dataInicio', new Date(filterDataInicio + 'T00:00:00').toISOString())
      }
      if (filterDataFim) {
        params.append('dataFim', new Date(filterDataFim + 'T23:59:59').toISOString())
      }

      const response = await fetch(`/api/folgas?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFolgas(data)
      }
    } catch (err) {
      console.error('Erro ao carregar folgas:', err)
    } finally {
      setLoading(false)
    }
  }

  const limparFiltros = () => {
    setFilterDepartamento('TODOS')
    setFilterTipo('TODOS')
    setFilterStatus('TODOS')
    setFilterDataInicio('')
    setFilterDataFim('')
  }

  const temFiltrosAtivos = filterDepartamento !== 'TODOS' || filterTipo !== 'TODOS' || filterStatus !== 'TODOS' || filterDataInicio || filterDataFim

  const handleAprovar = async (folga: Folga) => {
    try {
      const response = await fetch(`/api/folgas/${folga.id}/aprovar`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchFolgas()
      }
    } catch (err) {
      console.error('Erro ao aprovar folga:', err)
    }
  }

  const handleRejeitar = async (motivo: string) => {
    if (!rejeicaoModal.folga) return

    try {
      const response = await fetch(`/api/folgas/${rejeicaoModal.folga.id}/rejeitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      })

      if (response.ok) {
        fetchFolgas()
      }
    } catch (err) {
      console.error('Erro ao rejeitar folga:', err)
    } finally {
      setRejeicaoModal({ open: false, folga: null })
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete.folga) return

    try {
      const response = await fetch(`/api/folgas/${confirmDelete.folga.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchFolgas()
      }
    } catch (err) {
      console.error('Erro ao excluir folga:', err)
    } finally {
      setConfirmDelete({ open: false, folga: null })
    }
  }

  const getTipoBadge = (tipo: string) => {
    const config = TIPOS_FOLGA[tipo] || TIPOS_FOLGA.OUTRO
    return (
      <Badge variant="outline" className={cn('gap-1', config.color)}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="animate-fade-in">
      <Header
        title="Folgas"
        subtitle="Gerencie folgas, compensações e abonos dos colaboradores."
        newButtonLabel="Nova Folga"
        onNewClick={() => setFolgaModal({ open: true, folga: null })}
      />

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtrar:</span>
            </div>
            
            <Select value={filterDepartamento} onValueChange={setFilterDepartamento}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os departamentos</SelectItem>
                {departamentos.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os tipos</SelectItem>
                {Object.entries(TIPOS_FOLGA).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os status</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="APROVADO">Aprovados</SelectItem>
                <SelectItem value="REJEITADO">Rejeitados</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Label htmlFor="dataInicio" className="text-sm text-gray-600 whitespace-nowrap">De:</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filterDataInicio}
                onChange={(e) => setFilterDataInicio(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="dataFim" className="text-sm text-gray-600 whitespace-nowrap">Até:</Label>
              <Input
                id="dataFim"
                type="date"
                value={filterDataFim}
                onChange={(e) => setFilterDataFim(e.target.value)}
                min={filterDataInicio}
                className="w-40"
              />
            </div>

            {temFiltrosAtivos && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : folgas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhuma folga registrada</p>
            <Button onClick={() => setFolgaModal({ open: true, folga: null })}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Folga
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {folgas.map((folga) => (
            <Card key={folga.id} className={cn(
              "hover:shadow-md transition-shadow",
              folga.status === 'PENDENTE' && "border-yellow-300 bg-yellow-50/30"
            )}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(folga.colaborador.nome)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {folga.colaborador.nome}
                        </h3>
                        {getTipoBadge(folga.tipo)}
                        <Badge 
                          variant="outline" 
                          className={STATUS_CONFIG[folga.status]?.color || ''}
                        >
                          {STATUS_CONFIG[folga.status]?.label || folga.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        {folga.colaborador.cargo || 'Sem cargo'} • {folga.colaborador.departamento.nome}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(folga.data)}
                        </div>
                        {folga.descricao && (
                          <span className="text-gray-500">• {folga.descricao}</span>
                        )}
                      </div>

                      {folga.status === 'REJEITADO' && folga.motivoRejeicao && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>Motivo: {folga.motivoRejeicao}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {folga.status === 'PENDENTE' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleAprovar(folga)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setRejeicaoModal({ open: true, folga })}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFolgaModal({ open: true, folga })}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setConfirmDelete({ open: true, folga })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Folga */}
      <FolgaModal
        open={folgaModal.open}
        onClose={() => setFolgaModal({ open: false, folga: null })}
        onSuccess={fetchFolgas}
        folga={folgaModal.folga}
      />

      {/* Modal de Confirmação */}
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, folga: null })}
        onConfirm={handleDelete}
        title="Excluir Folga"
        description={`Tem certeza que deseja excluir a folga de ${confirmDelete.folga?.colaborador.nome}?`}
        confirmText="Excluir"
        variant="danger"
      />

      {/* Modal de Rejeição */}
      <RejeicaoModal
        open={rejeicaoModal.open}
        onClose={() => setRejeicaoModal({ open: false, folga: null })}
        onConfirm={handleRejeitar}
        solicitacaoInfo={rejeicaoModal.folga ? {
          colaboradorNome: rejeicaoModal.folga.colaborador.nome,
          tipo: 'Folga',
          dias: 1
        } : undefined}
      />
    </div>
  )
}
