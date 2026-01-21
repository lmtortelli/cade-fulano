'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, cn, parseLocalDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon, Download, ExternalLink } from 'lucide-react'
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth,
  addMonths,
  subMonths,
  isWithinInterval
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Ferias {
  id: string
  colaboradorNome: string
  departamento: string
  departamentoId: string
  dataInicio: string
  dataFim: string
  status: 'PENDENTE' | 'APROVADO'
}

interface Folga {
  id: string
  colaboradorNome: string
  departamento: string
  departamentoId: string
  dataInicio: string
  dataFim: string | null
  tipo: string
  descricao: string | null
}

interface Departamento {
  id: string
  nome: string
}

interface Colaborador {
  id: string
  nome: string
  departamento: {
    id: string
    nome: string
  }
}

// Cores disponíveis para departamentos (geradas dinamicamente)
const CORES_DEPARTAMENTOS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-violet-500',
]

// Tipos de folga
const TIPOS_FOLGA: Record<string, { label: string, color: string }> = {
  FERIADO: { label: 'Feriado', color: 'bg-red-400' },
  COMPENSACAO: { label: 'Compensação', color: 'bg-yellow-400' },
  ABONO: { label: 'Abono', color: 'bg-lime-400' },
  LICENCA: { label: 'Licença', color: 'bg-pink-400' },
  CARGO_CONFIANCA: { label: 'Cargo de Confiança', color: 'bg-indigo-400' },
  OUTRO: { label: 'Outro', color: 'bg-gray-400' },
}

type TipoEvento = 'TODOS' | 'FERIAS' | 'FOLGAS'

// Funções para integração com Google Calendar
const formatDateForGoogle = (date: Date) => {
  return format(date, "yyyyMMdd")
}

const generateGoogleCalendarUrl = (
  title: string,
  startDate: Date,
  endDate: Date,
  description?: string,
  location?: string
) => {
  const baseUrl = 'https://calendar.google.com/calendar/render'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(new Date(endDate.getTime() + 86400000))}`, // Google usa data fim exclusiva, então adicionamos 1 dia
    details: description || '',
    location: location || '',
  })
  return `${baseUrl}?${params.toString()}`
}

const generateICSContent = (events: Array<{
  title: string
  startDate: Date
  endDate: Date
  description?: string
  uid: string
}>) => {
  const formatICSDate = (date: Date) => format(date, "yyyyMMdd")
  
  const icsEvents = events.map(event => `BEGIN:VEVENT
DTSTART;VALUE=DATE:${formatICSDate(event.startDate)}
DTEND;VALUE=DATE:${formatICSDate(new Date(event.endDate.getTime() + 86400000))}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
UID:${event.uid}@feriaspro
END:VEVENT`).join('\n')

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Offy//Cronograma//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
${icsEvents}
END:VCALENDAR`
}

const downloadICS = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function CronogramaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [ferias, setFerias] = useState<Ferias[]>([])
  const [folgas, setFolgas] = useState<Folga[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [filterColaboradores, setFilterColaboradores] = useState<string[]>([])
  const [showColaboradorDropdown, setShowColaboradorDropdown] = useState(false)
  const [filterDepartamentos, setFilterDepartamentos] = useState<string[]>([])
  const [showDepartamentoDropdown, setShowDepartamentoDropdown] = useState(false)
  const [filterTipoEvento, setFilterTipoEvento] = useState<TipoEvento>('TODOS')
  const [diaDetalhe, setDiaDetalhe] = useState<Date | null>(null)

  useEffect(() => {
    fetchDepartamentos()
    fetchColaboradores()
  }, [])

  useEffect(() => {
    fetchFerias()
    fetchFolgas()
  }, [currentMonth])

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
      const response = await fetch('/api/colaboradores?limit=100')
      if (response.ok) {
        const data = await response.json()
        setColaboradores(data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err)
    }
  }

  const fetchFerias = async () => {
    try {
      setLoading(true)
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      const response = await fetch(
        `/api/solicitacoes?status=APROVADO&dataInicio=${start.toISOString()}&dataFim=${end.toISOString()}`
      )

      if (response.ok) {
        const data = await response.json()
        // Transformar dados - filtrar apenas GOZO (férias reais, não vendas)
        const feriasFormatadas = data.data
          ?.filter((s: any) => s.tipo === 'GOZO')
          ?.map((s: any) => ({
            id: s.id,
            colaboradorNome: s.periodoAquisitivo.colaborador.nome,
            departamento: s.periodoAquisitivo.colaborador.departamento.nome,
            departamentoId: s.periodoAquisitivo.colaborador.departamento.id,
            dataInicio: s.dataInicioGozo,
            dataFim: s.dataFimGozo,
            status: s.status
          })) || []
        setFerias(feriasFormatadas)
      } else {
        setFerias([])
      }
    } catch (err) {
      console.error('Erro ao carregar férias:', err)
      setFerias([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFolgas = async () => {
    try {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      const response = await fetch(
        `/api/folgas?dataInicio=${start.toISOString()}&dataFim=${end.toISOString()}`
      )

      if (response.ok) {
        const data = await response.json()
        const folgasFormatadas = data.map((f: any) => ({
          id: f.id,
          colaboradorNome: f.colaborador.nome,
          departamento: f.colaborador.departamento.nome,
          departamentoId: f.colaborador.departamento.id,
          dataInicio: f.dataInicio,
          dataFim: f.dataFim,
          tipo: f.tipo,
          descricao: f.descricao
        }))
        setFolgas(folgasFormatadas)
      } else {
        setFolgas([])
      }
    } catch (err) {
      console.error('Erro ao carregar folgas:', err)
      setFolgas([])
    }
  }

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Gerar cores por departamento dinamicamente
  const getCorDepartamento = (departamentoId: string): string => {
    const index = departamentos.findIndex(d => d.id === departamentoId)
    if (index === -1) return 'bg-gray-500'
    return CORES_DEPARTAMENTOS[index % CORES_DEPARTAMENTOS.length]
  }

  // Filtrar dados por colaboradores, departamentos e tipo de evento
  const feriasFiltradas = filterTipoEvento === 'FOLGAS' 
    ? [] 
    : ferias.filter(f => {
        // Filtro por departamento
        if (filterDepartamentos.length > 0 && !filterDepartamentos.includes(f.departamentoId)) {
          return false
        }
        // Filtro por colaborador
        if (filterColaboradores.length > 0) {
          const colaborador = colaboradores.find(c => c.nome === f.colaboradorNome)
          if (!colaborador || !filterColaboradores.includes(colaborador.id)) {
            return false
          }
        }
        return true
      })

  const folgasFiltradas = filterTipoEvento === 'FERIAS'
    ? []
    : folgas.filter(f => {
        // Filtro por departamento
        if (filterDepartamentos.length > 0) {
          const colaborador = colaboradores.find(c => c.nome === f.colaboradorNome)
          if (!colaborador || !filterDepartamentos.includes(colaborador.departamento.id)) {
            return false
          }
        }
        // Filtro por colaborador
        if (filterColaboradores.length > 0) {
          const colaborador = colaboradores.find(c => c.nome === f.colaboradorNome)
          if (!colaborador || !filterColaboradores.includes(colaborador.id)) {
            return false
          }
        }
        return true
      })

  // Funções para gerenciar seleção de colaboradores
  const toggleColaborador = (id: string) => {
    setFilterColaboradores(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    )
  }

  const selecionarTodosColaboradores = () => {
    setFilterColaboradores(colaboradores.map(c => c.id))
  }

  const limparSelecaoColaboradores = () => {
    setFilterColaboradores([])
  }

  // Funções para gerenciar seleção de departamentos
  const toggleDepartamento = (id: string) => {
    setFilterDepartamentos(prev => 
      prev.includes(id) 
        ? prev.filter(d => d !== id)
        : [...prev, id]
    )
  }

  const selecionarTodosDepartamentos = () => {
    setFilterDepartamentos(departamentos.map(d => d.id))
  }

  const limparSelecaoDepartamentos = () => {
    setFilterDepartamentos([])
  }

  const limparTodosFiltros = () => {
    setFilterColaboradores([])
    setFilterDepartamentos([])
    setFilterTipoEvento('TODOS')
  }

  const temFiltrosAtivos = filterColaboradores.length > 0 || filterDepartamentos.length > 0 || filterTipoEvento !== 'TODOS'

  // Funções para exportar para Google Calendar
  const openGoogleCalendarFerias = (f: Ferias) => {
    const title = `Férias - ${f.colaboradorNome}`
    const description = `Departamento: ${f.departamento}\nStatus: ${f.status}`
    const url = generateGoogleCalendarUrl(
      title,
      parseLocalDate(f.dataInicio),
      parseLocalDate(f.dataFim),
      description
    )
    window.open(url, '_blank')
  }

  const openGoogleCalendarFolga = (f: Folga) => {
    const tipoLabel = TIPOS_FOLGA[f.tipo]?.label || f.tipo
    const title = `Folga (${tipoLabel}) - ${f.colaboradorNome}`
    const description = `Tipo: ${tipoLabel}\nDepartamento: ${f.departamento}${f.descricao ? `\nDescrição: ${f.descricao}` : ''}`
    const folgaInicio = parseLocalDate(f.dataInicio)
    const folgaFim = f.dataFim ? parseLocalDate(f.dataFim) : folgaInicio
    const url = generateGoogleCalendarUrl(
      title,
      folgaInicio,
      folgaFim,
      description
    )
    window.open(url, '_blank')
  }

  const exportarTodosEventos = () => {
    const events: Array<{
      title: string
      startDate: Date
      endDate: Date
      description?: string
      uid: string
    }> = []

    // Adicionar férias
    feriasFiltradas.forEach(f => {
      events.push({
        title: `Férias - ${f.colaboradorNome}`,
        startDate: parseLocalDate(f.dataInicio),
        endDate: parseLocalDate(f.dataFim),
        description: `Departamento: ${f.departamento}\nStatus: ${f.status}`,
        uid: `ferias-${f.id}`
      })
    })

    // Adicionar folgas
    folgasFiltradas.forEach(f => {
      const tipoLabel = TIPOS_FOLGA[f.tipo]?.label || f.tipo
      const folgaInicio = parseLocalDate(f.dataInicio)
      const folgaFim = f.dataFim ? parseLocalDate(f.dataFim) : folgaInicio
      events.push({
        title: `Folga (${tipoLabel}) - ${f.colaboradorNome}`,
        startDate: folgaInicio,
        endDate: folgaFim,
        description: `Tipo: ${tipoLabel}\nDepartamento: ${f.departamento}${f.descricao ? `\nDescrição: ${f.descricao}` : ''}`,
        uid: `folga-${f.id}`
      })
    })

    if (events.length === 0) {
      alert('Não há eventos para exportar.')
      return
    }

    const mesAno = format(currentMonth, 'yyyy-MM', { locale: ptBR })
    const icsContent = generateICSContent(events)
    downloadICS(icsContent, `cronograma-${mesAno}.ics`)
  }

  // Verificar se um dia está dentro do período de férias
  const getFeriasForDay = (day: Date) => {
    return feriasFiltradas.filter(f => {
      const inicio = parseLocalDate(f.dataInicio)
      const fim = parseLocalDate(f.dataFim)
      return isWithinInterval(day, { start: inicio, end: fim })
    })
  }

  // Verificar folgas de um dia
  const getFolgasForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    return folgasFiltradas.filter(f => {
      const folgaInicio = format(parseLocalDate(f.dataInicio), 'yyyy-MM-dd')
      
      // Se não tem dataFim, é uma folga de um dia só
      if (!f.dataFim) {
        return folgaInicio === dayStr
      }
      
      // Se tem dataFim, verificar se o dia está dentro do intervalo
      const folgaFim = format(parseLocalDate(f.dataFim), 'yyyy-MM-dd')
      return dayStr >= folgaInicio && dayStr <= folgaFim
    })
  }

  return (
    <div className="animate-fade-in">
      <Header
        title="Cronograma"
        subtitle="Visualize as férias programadas da sua equipe."
        showSearch={false}
        showNewButton={false}
      />

      {/* Navegação do mês */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Mês anterior
        </Button>

        <h2 className="text-xl font-semibold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>

        <Button variant="outline" onClick={nextMonth}>
          Próximo mês
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Filtro por Tipo de Evento */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Tipo:</span>
              <div className="flex gap-1">
                <Button
                  variant={filterTipoEvento === 'TODOS' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipoEvento('TODOS')}
                >
                  Todos
                </Button>
                <Button
                  variant={filterTipoEvento === 'FERIAS' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipoEvento('FERIAS')}
                >
                  Férias
                </Button>
                <Button
                  variant={filterTipoEvento === 'FOLGAS' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipoEvento('FOLGAS')}
                >
                  Folgas
                </Button>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* Filtro por Departamentos */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Departamentos:</span>
              
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDepartamentoDropdown(!showDepartamentoDropdown)
                    setShowColaboradorDropdown(false)
                  }}
                  className="w-56 justify-between"
                >
                  <span className="truncate">
                    {filterDepartamentos.length === 0 
                      ? 'Todos' 
                      : filterDepartamentos.length === 1
                        ? departamentos.find(d => d.id === filterDepartamentos[0])?.nome || '1 selecionado'
                        : `${filterDepartamentos.length} selecionados`}
                  </span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    showDepartamentoDropdown && "rotate-90"
                  )} />
                </Button>
                
                {showDepartamentoDropdown && (
                  <div className="absolute z-50 mt-1 w-64 bg-white border rounded-lg shadow-lg max-h-80 overflow-auto">
                    <div className="p-2 border-b flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={selecionarTodosDepartamentos}
                      >
                        Selecionar todos
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={limparSelecaoDepartamentos}
                      >
                        Limpar
                      </Button>
                    </div>
                    
                    <div className="p-1">
                      {departamentos.map((dept) => (
                        <label
                          key={dept.id}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filterDepartamentos.includes(dept.id)}
                            onChange={() => toggleDepartamento(dept.id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className={cn('w-3 h-3 rounded-full', getCorDepartamento(dept.id))} />
                          <span className="text-sm">{dept.nome}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="p-2 border-t">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowDepartamentoDropdown(false)}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200" />
            
            {/* Filtro por Colaboradores */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Colaboradores:</span>
              
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowColaboradorDropdown(!showColaboradorDropdown)
                    setShowDepartamentoDropdown(false)
                  }}
                  className="w-64 justify-between"
                >
                  <span className="truncate">
                    {filterColaboradores.length === 0 
                      ? 'Todos' 
                      : filterColaboradores.length === 1
                        ? colaboradores.find(c => c.id === filterColaboradores[0])?.nome || '1 selecionado'
                        : `${filterColaboradores.length} selecionados`}
                  </span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    showColaboradorDropdown && "rotate-90"
                  )} />
                </Button>
                
                {showColaboradorDropdown && (
                  <div className="absolute z-50 mt-1 w-80 bg-white border rounded-lg shadow-lg max-h-80 overflow-auto">
                    <div className="p-2 border-b flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={selecionarTodosColaboradores}
                      >
                        Selecionar todos
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={limparSelecaoColaboradores}
                      >
                        Limpar
                      </Button>
                    </div>
                    
                    <div className="p-1">
                      {colaboradores.map((col) => (
                        <label
                          key={col.id}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filterColaboradores.includes(col.id)}
                            onChange={() => toggleColaborador(col.id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm">{col.nome}</span>
                          <span className="text-xs text-gray-400">- {col.departamento.nome}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="p-2 border-t">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowColaboradorDropdown(false)}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {temFiltrosAtivos && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={limparTodosFiltros}
              >
                Limpar filtros
              </Button>
            )}

            <div className="h-6 w-px bg-gray-200 ml-auto" />

            {/* Botão de Exportação */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportarTodosEventos}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar (.ics)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legendas */}
      <div className="space-y-3 mb-6">
        {/* Departamentos (Férias) */}
        {departamentos.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Férias por Departamento</p>
            <div className="flex flex-wrap gap-4">
              {departamentos.map((dept) => (
                <div key={dept.id} className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', getCorDepartamento(dept.id))} />
                  <span className="text-sm text-gray-600">{dept.nome}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tipos de Folga */}
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Folgas</p>
          <div className="flex flex-wrap gap-4">
            {Object.entries(TIPOS_FOLGA).map(([key, { label, color }]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-sm', color)} />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            {/* Header dos dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-2">
              {/* Espaços vazios para alinhar o primeiro dia */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[100px]" />
              ))}

              {days.map((day) => {
                const feriasNoDia = getFeriasForDay(day)
                const folgasNoDia = getFolgasForDay(day)
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                const totalItens = feriasNoDia.length + folgasNoDia.length

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-[100px] border rounded-lg p-2 transition-colors',
                      isToday ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200',
                      totalItens > 0 && 'cursor-pointer hover:shadow-md'
                    )}
                    onClick={() => totalItens > 0 && setDiaDetalhe(day)}
                  >
                    <span className={cn(
                      'text-sm font-medium',
                      isToday ? 'text-primary' : 'text-gray-700'
                    )}>
                      {format(day, 'd')}
                    </span>

                    <div className="mt-1 space-y-1">
                      {/* Férias */}
                      {feriasNoDia.slice(0, 2).map((f) => (
                        <div
                          key={f.id}
                          className={cn(
                            'text-xs text-white rounded px-1 py-0.5 truncate',
                            getCorDepartamento(f.departamentoId),
                            f.status === 'PENDENTE' && 'opacity-60'
                          )}
                          title={`Férias: ${f.colaboradorNome} - ${f.departamento}`}
                        >
                          {f.colaboradorNome}
                        </div>
                      ))}
                      
                      {/* Folgas */}
                      {folgasNoDia.slice(0, feriasNoDia.length > 2 ? 0 : 2 - feriasNoDia.length).map((f) => (
                        <div
                          key={f.id}
                          className={cn(
                            'text-xs text-gray-800 rounded px-1 py-0.5 truncate',
                            TIPOS_FOLGA[f.tipo]?.color || 'bg-gray-300'
                          )}
                          title={`Folga (${TIPOS_FOLGA[f.tipo]?.label}): ${f.colaboradorNome}${f.descricao ? ` - ${f.descricao}` : ''}`}
                        >
                          📅 {f.colaboradorNome}
                        </div>
                      ))}
                      
                      {totalItens > 2 && (
                        <button 
                          className="text-xs text-primary hover:text-primary/80 font-medium"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDiaDetalhe(day)
                          }}
                        >
                          +{totalItens - 2} mais
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de férias do mês */}
      {filterTipoEvento !== 'FOLGAS' && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Férias neste mês {(filterColaboradores.length > 0 || filterTipoEvento !== 'TODOS') && <span className="text-sm font-normal text-gray-500">(filtrado)</span>}
            </h3>

            <div className="space-y-3">
              {feriasFiltradas.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      getCorDepartamento(f.departamentoId)
                    )} />
                    <div>
                      <p className="font-medium text-gray-900">{f.colaboradorNome}</p>
                      <p className="text-sm text-gray-500">{f.departamento}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {formatDate(f.dataInicio)} - {formatDate(f.dataFim)}
                      </p>
                      <Badge 
                        variant={f.status === 'APROVADO' ? 'success' : 'warning'}
                        className="mt-1"
                      >
                        {f.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openGoogleCalendarFerias(f)}
                      title="Adicionar ao Google Calendar"
                      className="text-gray-500 hover:text-primary"
                    >
                      <CalendarIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {feriasFiltradas.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  {filterColaboradores.length > 0 
                    ? 'Nenhuma férias encontrada para os colaboradores selecionados' 
                    : 'Nenhuma férias programada para este mês'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de folgas do mês */}
      {filterTipoEvento !== 'FERIAS' && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Folgas neste mês {(filterColaboradores.length > 0 || filterTipoEvento !== 'TODOS') && <span className="text-sm font-normal text-gray-500">(filtrado)</span>}
            </h3>

            <div className="space-y-3">
              {folgasFiltradas.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-3 h-3 rounded-sm',
                      TIPOS_FOLGA[f.tipo]?.color || 'bg-gray-400'
                    )} />
                    <div>
                      <p className="font-medium text-gray-900">{f.colaboradorNome}</p>
                      <p className="text-sm text-gray-500">
                        {f.departamento} • {TIPOS_FOLGA[f.tipo]?.label || f.tipo}
                      </p>
                      {f.descricao && (
                        <p className="text-xs text-gray-400">{f.descricao}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {f.dataFim 
                          ? `${formatDate(f.dataInicio)} - ${formatDate(f.dataFim)}`
                          : formatDate(f.dataInicio)
                        }
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openGoogleCalendarFolga(f)}
                      title="Adicionar ao Google Calendar"
                      className="text-gray-500 hover:text-primary"
                    >
                      <CalendarIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {folgasFiltradas.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  {filterColaboradores.length > 0 
                    ? 'Nenhuma folga encontrada para os colaboradores selecionados' 
                    : 'Nenhuma folga registrada para este mês'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes do Dia */}
      {diaDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setDiaDetalhe(null)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Eventos do dia {format(diaDetalhe, "d 'de' MMMM", { locale: ptBR })}
                </h3>
                <button 
                  onClick={() => setDiaDetalhe(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              {/* Férias */}
              {getFeriasForDay(diaDetalhe).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Férias ({getFeriasForDay(diaDetalhe).length})
                  </h4>
                  <div className="space-y-2">
                    {getFeriasForDay(diaDetalhe).map((f) => (
                      <div 
                        key={f.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className={cn(
                          'w-3 h-3 rounded-full flex-shrink-0',
                          getCorDepartamento(f.departamentoId)
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{f.colaboradorNome}</p>
                          <p className="text-sm text-gray-500">{f.departamento}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(f.dataInicio)} - {formatDate(f.dataFim)}
                          </p>
                        </div>
                        <Badge variant={f.status === 'APROVADO' ? 'success' : 'warning'}>
                          {f.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openGoogleCalendarFerias(f)}
                          title="Adicionar ao Google Calendar"
                        >
                          <CalendarIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Folgas */}
              {getFolgasForDay(diaDetalhe).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Folgas ({getFolgasForDay(diaDetalhe).length})
                  </h4>
                  <div className="space-y-2">
                    {getFolgasForDay(diaDetalhe).map((f) => (
                      <div 
                        key={f.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className={cn(
                          'w-3 h-3 rounded-sm flex-shrink-0',
                          TIPOS_FOLGA[f.tipo]?.color || 'bg-gray-400'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{f.colaboradorNome}</p>
                          <p className="text-sm text-gray-500">
                            {f.departamento} • {TIPOS_FOLGA[f.tipo]?.label || f.tipo}
                          </p>
                          {f.dataFim && (
                            <p className="text-xs text-primary">
                              {formatDate(f.dataInicio)} até {formatDate(f.dataFim)}
                            </p>
                          )}
                          {f.descricao && (
                            <p className="text-xs text-gray-400">{f.descricao}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openGoogleCalendarFolga(f)}
                          title="Adicionar ao Google Calendar"
                        >
                          <CalendarIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getFeriasForDay(diaDetalhe).length === 0 && getFolgasForDay(diaDetalhe).length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Nenhum evento neste dia
                </p>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setDiaDetalhe(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
