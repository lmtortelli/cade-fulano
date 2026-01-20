'use client'

import { useEffect, useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, getInitials, cn, parseLocalDate } from '@/lib/utils'
import { ChevronRight, Calendar, Edit2, Trash2, Filter, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ColaboradorModal, ConfirmModal } from '@/components/modals'
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

interface SaldoPeriodo {
  periodoId: string
  numeroPeriodo: number
  dataInicioAquisitivo: string
  dataFimAquisitivo: string
  dataLimiteGozo: string
  diasDireito: number
  diasGozados: number
  diasPendentes: number
  diasRestantes: number
  diasDisponiveis: number
  ignorado: boolean
}

interface ColaboradorComSaldo {
  id: string
  nome: string
  email: string
  matricula: string | null
  cargo: string | null
  dataAdmissao: string
  ativo: boolean
  avatarUrl: string | null
  departamentoId: string
  departamento: {
    id: string
    nome: string
  }
  saldos?: SaldoPeriodo[]
  totalDiasRestantes?: number
}

interface Colaborador {
  id: string
  nome: string
  email: string
  matricula: string | null
  cargo: string | null
  dataAdmissao: string
  ativo: boolean
  avatarUrl: string | null
  departamentoId: string
  departamento: {
    id: string
    nome: string
  }
}

interface PaginatedResponse {
  data: Colaborador[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<ColaboradorComSaldo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [total, setTotal] = useState(0)
  
  // Filtros
  const [filterDepartamento, setFilterDepartamento] = useState<string>('TODOS')
  const [filterVigenciaProxima, setFilterVigenciaProxima] = useState<boolean>(false)
  const [filterDataLimite, setFilterDataLimite] = useState<string>('')
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchDepartamentos()
    fetchColaboradores()
  }, [searchTerm])

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

  const fetchColaboradores = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('busca', searchTerm)
      params.append('limit', '100')

      const response = await fetch(`/api/colaboradores?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar colaboradores')
      }
      
      const data: PaginatedResponse = await response.json()
      
      // Buscar saldo de cada colaborador para o filtro de vigência
      const colaboradoresComSaldo = await Promise.all(
        data.data.map(async (col) => {
          try {
            const saldoRes = await fetch(`/api/colaboradores/${col.id}/saldo`)
            if (saldoRes.ok) {
              const saldoData = await saldoRes.json()
              return {
                ...col,
                saldos: saldoData.saldos || [],
                totalDiasRestantes: saldoData.totalDiasRestantes || 0
              }
            }
          } catch (e) {
            console.error('Erro ao carregar saldo:', e)
          }
          return { ...col, saldos: [], totalDiasRestantes: 0 }
        })
      )
      
      setColaboradores(colaboradoresComSaldo)
      setTotal(data.total)
    } catch (err) {
      console.error('Erro:', err)
      setColaboradores([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar colaboradores
  const colaboradoresFiltrados = useMemo(() => {
    let resultado = colaboradores

    // Filtro por departamento
    if (filterDepartamento !== 'TODOS') {
      resultado = resultado.filter(c => c.departamentoId === filterDepartamento)
    }

    // Filtro por vigência próxima de vencer com saldo
    if (filterVigenciaProxima && filterDataLimite) {
      const dataLimite = parseLocalDate(filterDataLimite)
      
      resultado = resultado.filter(c => {
        // Verificar se tem algum período não ignorado com:
        // 1. Data limite de gozo até a data informada
        // 2. Ainda tem dias restantes
        const periodosNaoIgnorados = (c.saldos || []).filter(s => !s.ignorado)
        
        return periodosNaoIgnorados.some(saldo => {
          const dataLimiteGozo = parseLocalDate(saldo.dataLimiteGozo)
          return dataLimiteGozo <= dataLimite && saldo.diasRestantes > 0
        })
      })
    }

    return resultado
  }, [colaboradores, filterDepartamento, filterVigenciaProxima, filterDataLimite])

  const temFiltrosAtivos = filterDepartamento !== 'TODOS' || filterVigenciaProxima

  const limparFiltros = () => {
    setFilterDepartamento('TODOS')
    setFilterVigenciaProxima(false)
    setFilterDataLimite('')
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleNewColaborador = () => {
    setSelectedColaborador(null)
    setModalOpen(true)
  }

  const handleEdit = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador)
    setModalOpen(true)
  }

  const handleDelete = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador)
    setConfirmModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedColaborador) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/colaboradores/${selectedColaborador.id}?hard=true`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir colaborador')
        return
      }

      fetchColaboradores()
      setConfirmModalOpen(false)
      setSelectedColaborador(null)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir colaborador')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <Header
        title={`Colaboradores (${colaboradoresFiltrados.length}${temFiltrosAtivos ? ` de ${total}` : ''})`}
        subtitle="Gerencie os colaboradores e seus períodos de férias."
        onSearch={handleSearch}
        onNewClick={handleNewColaborador}
        newButtonLabel="Novo Colaborador"
      />

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtrar:</span>
            </div>
            
            {/* Filtro por Departamento */}
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

            <div className="h-6 w-px bg-gray-200" />

            {/* Filtro por Vigência Próxima */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterVigenciaProxima}
                  onChange={(e) => setFilterVigenciaProxima(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Vigência vencendo até:
                </span>
              </label>
              <Input
                type="date"
                value={filterDataLimite}
                onChange={(e) => setFilterDataLimite(e.target.value)}
                disabled={!filterVigenciaProxima}
                className="w-40"
              />
            </div>

            {temFiltrosAtivos && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>

          {filterVigenciaProxima && filterDataLimite && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Mostrando colaboradores com vigência até {formatDate(filterDataLimite)} e que ainda possuem saldo de férias
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colaboradoresFiltrados.map((colaborador) => (
            <ColaboradorCard 
              key={colaborador.id} 
              colaborador={colaborador} 
              onEdit={() => handleEdit(colaborador)}
              onDelete={() => handleDelete(colaborador)}
              saldos={colaborador.saldos}
              totalDiasRestantes={colaborador.totalDiasRestantes}
              destacarVigencia={filterVigenciaProxima && filterDataLimite ? parseLocalDate(filterDataLimite) : undefined}
            />
          ))}

          {colaboradoresFiltrados.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">
                {searchTerm || temFiltrosAtivos ? 'Nenhum colaborador encontrado com os filtros aplicados' : 'Nenhum colaborador cadastrado'}
              </p>
              {!searchTerm && !temFiltrosAtivos && (
                <Button className="mt-4" onClick={handleNewColaborador}>
                  Cadastrar Primeiro Colaborador
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ColaboradorModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedColaborador(null); }}
        onSuccess={fetchColaboradores}
        colaborador={selectedColaborador}
      />

      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setSelectedColaborador(null); }}
        onConfirm={confirmDelete}
        title="Excluir Colaborador"
        description={`Tem certeza que deseja excluir "${selectedColaborador?.nome}"? Esta ação irá remover todos os registros de férias associados.`}
        confirmText="Excluir"
        loading={deleteLoading}
      />
    </div>
  )
}

interface ColaboradorCardProps {
  colaborador: Colaborador
  onEdit: () => void
  onDelete: () => void
  saldos?: SaldoPeriodo[]
  totalDiasRestantes?: number
  destacarVigencia?: Date
}

function ColaboradorCard({ colaborador, onEdit, onDelete, saldos, totalDiasRestantes, destacarVigencia }: ColaboradorCardProps) {
  // Calcular saldo a partir dos dados já carregados
  const saldosNaoIgnorados = (saldos || []).filter(s => !s.ignorado)
  const diasDireito = saldosNaoIgnorados.reduce((acc, s) => acc + s.diasDireito, 0) || 30
  const diasRestantes = totalDiasRestantes || 0

  const percentualUsado = diasDireito > 0
    ? ((diasDireito - diasRestantes) / diasDireito) * 100 
    : 0

  // Verificar se tem vigência próxima de vencer
  const vigenciaProximaVencer = destacarVigencia 
    ? saldosNaoIgnorados.find(s => {
        const dataLimiteGozo = parseLocalDate(s.dataLimiteGozo)
        return dataLimiteGozo <= destacarVigencia && s.diasRestantes > 0
      })
    : null

  return (
    <Card className={cn(
      "hover:shadow-lg transition-shadow",
      vigenciaProximaVencer && "border-amber-400 bg-amber-50/30"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {colaborador.avatarUrl && (
                <AvatarImage src={colaborador.avatarUrl} alt={colaborador.nome} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(colaborador.nome)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-gray-900">{colaborador.nome}</h3>
              <p className="text-sm text-gray-500">{colaborador.cargo || 'Sem cargo'}</p>
            </div>
          </div>
          
          <Badge variant="secondary">{colaborador.departamento.nome}</Badge>
        </div>

        {vigenciaProximaVencer && (
          <div className="mb-3 p-2 bg-amber-100 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Vigência {vigenciaProximaVencer.numeroPeriodo}º período vence em {formatDate(vigenciaProximaVencer.dataLimiteGozo)} 
              ({vigenciaProximaVencer.diasRestantes} dias restantes)
            </span>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Admissão: {formatDate(colaborador.dataAdmissao)}</span>
          </div>
          
          {colaborador.matricula && (
            <p className="text-sm text-gray-500">
              Matrícula: {colaborador.matricula}
            </p>
          )}
        </div>

        {/* Saldo de Férias */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Saldo de Férias</span>
            <span className="text-xs text-gray-500">
              {diasRestantes} dias restantes
            </span>
          </div>
          <Progress value={percentualUsado} className="h-2" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/colaboradores/${colaborador.id}`} className="flex-1">
            <Button variant="ghost" className="w-full justify-between">
              Ver detalhes
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
