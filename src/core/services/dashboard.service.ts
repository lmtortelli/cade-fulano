// ============================================
// SERVICE DO DASHBOARD
// Métricas e dados para o painel principal
// ============================================

import { IColaboradorRepository } from '../repositories/colaborador.repository'
import { ISolicitacaoFeriasRepository } from '../repositories/solicitacao-ferias.repository'
import { IPeriodoAquisitivoRepository } from '../repositories/periodo-aquisitivo.repository'
import { IDepartamentoRepository } from '../repositories/departamento.repository'
import { 
  DashboardMetricas,
  ProximaSaida,
  DepartamentoResumo,
  StatusSolicitacao,
  ConflitoDepartamento
} from '../types'
import { startOfDay, endOfDay, addDays } from 'date-fns'

export class DashboardService {
  constructor(
    private colaboradorRepo: IColaboradorRepository,
    private solicitacaoRepo: ISolicitacaoFeriasRepository,
    private periodoRepo: IPeriodoAquisitivoRepository,
    private departamentoRepo: IDepartamentoRepository
  ) {}

  // ============================================
  // MÉTRICAS PRINCIPAIS
  // ============================================

  async obterMetricas(): Promise<DashboardMetricas> {
    const hoje = new Date()

    // De férias hoje
    const colaboradoresDeFeriasHoje = await this.colaboradorRepo.findDeFeriasNaData(hoje)
    
    // Pedidos pendentes
    const pedidosPendentes = await this.solicitacaoRepo.countPendentes()

    // Alertas de conflito
    const conflitos = await this.contarAlertasConflito()

    // Total de colaboradores
    const totalColaboradores = await this.colaboradorRepo.count()
    const colaboradoresAtivos = await this.colaboradorRepo.countAtivos()

    return {
      deFeriasHoje: colaboradoresDeFeriasHoje.length,
      pedidosPendentes,
      alertasConflito: conflitos,
      totalColaboradores,
      colaboradoresAtivos
    }
  }

  // ============================================
  // PRÓXIMAS SAÍDAS
  // ============================================

  async obterProximasSaidas(limite: number = 10): Promise<ProximaSaida[]> {
    return this.solicitacaoRepo.findProximasSaidas(limite)
  }

  // ============================================
  // RESUMO POR DEPARTAMENTO
  // ============================================

  async obterResumoPorDepartamento(): Promise<DepartamentoResumo[]> {
    const hoje = new Date()
    return this.departamentoRepo.getResumoComEstatisticas(hoje)
  }

  // ============================================
  // ALERTAS DE CONFLITO
  // ============================================

  async contarAlertasConflito(): Promise<number> {
    const departamentos = await this.departamentoRepo.findAtivos()
    const hoje = new Date()
    const proximoMes = addDays(hoje, 30)
    
    let totalConflitos = 0

    for (const departamento of departamentos) {
      const solicitacoesAprovadas = await this.solicitacaoRepo.findConflitosNoPeriodo(
        departamento.id,
        startOfDay(hoje),
        endOfDay(proximoMes)
      )

      // Agrupar por dia para verificar se excede limite
      const diasComConflito = this.agruparSolicitacoesPorDia(
        solicitacoesAprovadas,
        departamento.limiteAusencias
      )

      totalConflitos += diasComConflito
    }

    return totalConflitos
  }

  async obterDetalhesConflitos(): Promise<ConflitoDepartamento[]> {
    const departamentos = await this.departamentoRepo.findAtivos()
    const hoje = new Date()
    const proximoMes = addDays(hoje, 30)
    
    const conflitos: ConflitoDepartamento[] = []

    for (const departamento of departamentos) {
      const solicitacoesAprovadas = await this.solicitacaoRepo.findConflitosNoPeriodo(
        departamento.id,
        startOfDay(hoje),
        endOfDay(proximoMes)
      )

      if (solicitacoesAprovadas.length >= departamento.limiteAusencias) {
        const colaboradoresAfetados = solicitacoesAprovadas.map(s => ({
          id: s.periodoAquisitivo.colaborador.id,
          nome: s.periodoAquisitivo.colaborador.nome
        }))

        // Remover duplicatas
        const colaboradoresUnicos = colaboradoresAfetados.filter(
          (v, i, a) => a.findIndex(t => t.id === v.id) === i
        )

        conflitos.push({
          departamentoId: departamento.id,
          departamentoNome: departamento.nome,
          dataInicio: hoje,
          dataFim: proximoMes,
          colaboradoresAfetados: colaboradoresUnicos,
          limiteExcedido: true
        })
      }
    }

    return conflitos
  }

  private agruparSolicitacoesPorDia(
    solicitacoes: Array<{ dataInicioGozo: Date; dataFimGozo: Date }>,
    limite: number
  ): number {
    // Simplificação: conta quantas vezes o limite é excedido
    // Na prática, seria mais complexo verificar dia a dia
    const periodos = solicitacoes.map(s => ({
      inicio: new Date(s.dataInicioGozo).getTime(),
      fim: new Date(s.dataFimGozo).getTime()
    }))

    let diasConflito = 0

    // Verificar sobreposições
    for (let i = 0; i < periodos.length; i++) {
      let sobreposicoes = 1
      for (let j = i + 1; j < periodos.length; j++) {
        // Verifica se há sobreposição
        if (periodos[i].inicio <= periodos[j].fim && periodos[i].fim >= periodos[j].inicio) {
          sobreposicoes++
        }
      }
      if (sobreposicoes >= limite) {
        diasConflito++
      }
    }

    return diasConflito > 0 ? 1 : 0 // Simplificado para retornar se há conflito ou não
  }

  // ============================================
  // PERÍODOS VENCENDO
  // ============================================

  async obterPeriodosVencendo(dias: number = 90): Promise<number> {
    const periodosVencendo = await this.periodoRepo.findVencendoEm(dias)
    return periodosVencendo.length
  }

  // ============================================
  // DADOS PARA GRÁFICOS
  // ============================================

  async obterDadosGraficoMensal(): Promise<{ mes: string; solicitacoes: number }[]> {
    // Implementação simplificada
    // Na prática, buscaria dados agregados do banco
    return [
      { mes: 'Jan', solicitacoes: 5 },
      { mes: 'Fev', solicitacoes: 8 },
      { mes: 'Mar', solicitacoes: 12 },
      { mes: 'Abr', solicitacoes: 6 },
      { mes: 'Mai', solicitacoes: 9 },
      { mes: 'Jun', solicitacoes: 15 },
      { mes: 'Jul', solicitacoes: 20 },
      { mes: 'Ago', solicitacoes: 18 },
      { mes: 'Set', solicitacoes: 10 },
      { mes: 'Out', solicitacoes: 7 },
      { mes: 'Nov', solicitacoes: 4 },
      { mes: 'Dez', solicitacoes: 25 },
    ]
  }
}
