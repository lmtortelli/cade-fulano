'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { StatCard, ProximasSaidas, DepartamentoResumoList } from '@/components/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertTriangle, Users, Building2, CalendarPlus } from 'lucide-react'
import Link from 'next/link'
import { FeriasModal } from '@/components/modals'

interface DashboardData {
  metricas: {
    deFeriasHoje: number
    pedidosPendentes: number
    alertasConflito: number
    totalColaboradores: number
    colaboradoresAtivos: number
  }
  proximasSaidas: Array<{
    colaboradorId: string
    colaboradorNome: string
    colaboradorAvatar: string | null
    departamentoNome: string
    dataInicio: string
    dataFim: string
    diasGozo: number
    status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO'
    solicitacaoId: string
  }>
  resumoDepartamentos: Array<{
    id: string
    nome: string
    totalColaboradores: number
    colaboradoresDeFeriasHoje: number
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feriasModalOpen, setFeriasModalOpen] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/dashboard')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados')
      }
      
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err)
      setError(err.message)
      // Dados vazios quando não houver dados
      setData({
        metricas: {
          deFeriasHoje: 0,
          pedidosPendentes: 0,
          alertasConflito: 0,
          totalColaboradores: 0,
          colaboradoresAtivos: 0
        },
        proximasSaidas: [],
        resumoDepartamentos: []
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    console.log('Buscando:', term)
    // Implementar busca global
  }

  const handleNewSolicitacao = () => {
    setFeriasModalOpen(true)
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Header
          title="Visão Geral"
          subtitle="Gerencie o descanso da sua equipe de forma eficiente."
          onSearch={handleSearch}
          onNewClick={handleNewSolicitacao}
          newButtonLabel="Agendar Férias"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Se não há dados de colaboradores, mostrar onboarding
  if (data && data.metricas.totalColaboradores === 0 && data.resumoDepartamentos.length === 0) {
    return (
      <div className="animate-fade-in">
        <Header
          title="Visão Geral"
          subtitle="Gerencie o descanso da sua equipe de forma eficiente."
          onSearch={handleSearch}
          onNewClick={handleNewSolicitacao}
          newButtonLabel="Agendar Férias"
        />

        <Card className="max-w-2xl mx-auto mt-12">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">🔍</span>
            </div>
            <CardTitle className="text-2xl">Bem-vindo ao Offy</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600">
              Para começar a gerenciar as férias da sua equipe, você precisa cadastrar os departamentos e colaboradores.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Link href="/departamentos">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <Building2 className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900">1. Criar Departamentos</h3>
                    <p className="text-sm text-gray-500 mt-1">Organize sua empresa por setores</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/colaboradores">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <Users className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900">2. Cadastrar Colaboradores</h3>
                    <p className="text-sm text-gray-500 mt-1">Adicione os membros da equipe</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {error && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                ⚠️ Não foi possível conectar ao banco de dados. Verifique se o servidor está rodando.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Header
        title="Visão Geral"
        subtitle="Gerencie o descanso da sua equipe de forma eficiente."
        onSearch={handleSearch}
        onNewClick={handleNewSolicitacao}
        newButtonLabel="Agendar Férias"
      />

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="De férias hoje"
          value={data?.metricas.deFeriasHoje || 0}
          description={data?.metricas.deFeriasHoje === 0 ? "Equipe operando a 100%" : "Colaboradores descansando"}
          icon={CheckCircle}
          variant={data?.metricas.deFeriasHoje === 0 ? "success" : "default"}
        />

        <StatCard
          title="Pedidos Pendentes"
          value={data?.metricas.pedidosPendentes || 0}
          description={data?.metricas.pedidosPendentes === 0 ? "Nenhum pedido pendente" : "Aguardando aprovação"}
          icon={Clock}
          variant={data?.metricas.pedidosPendentes === 0 ? "success" : "warning"}
        />

        <StatCard
          title="Alerta de Conflito"
          value={data?.metricas.alertasConflito || 0}
          description={data?.metricas.alertasConflito ? "Verificar sobreposições" : "Sem conflitos detectados"}
          icon={AlertTriangle}
          variant={data?.metricas.alertasConflito ? "danger" : "success"}
        />
      </div>

      {/* Próximas Saídas e Resumo por Departamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProximasSaidas
          saidas={data?.proximasSaidas || []}
          onVerTodas={() => window.location.href = '/cronograma'}
        />

        <DepartamentoResumoList
          departamentos={data?.resumoDepartamentos || []}
        />
      </div>

      {/* Modal de Férias */}
      <FeriasModal
        open={feriasModalOpen}
        onClose={() => setFeriasModalOpen(false)}
        onSuccess={() => {
          fetchDashboard()
          setFeriasModalOpen(false)
        }}
      />
    </div>
  )
}
