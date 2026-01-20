// ============================================
// SERVICE DE PERÍODO AQUISITIVO
// Regras de negócio para gestão de períodos
// ============================================

import { IPeriodoAquisitivoRepository } from '../repositories/periodo-aquisitivo.repository'
import { ISolicitacaoFeriasRepository } from '../repositories/solicitacao-ferias.repository'
import { 
  PeriodoAquisitivo,
  PeriodoAquisitivoComSolicitacoes,
  PeriodoAquisitivoCompleto,
  UpdatePeriodoDTO,
  StatusPeriodo,
  StatusSolicitacao,
  SaldoPeriodo
} from '../types'
import { differenceInDays } from 'date-fns'

// Constantes das regras CLT
const MAXIMO_DIAS_VENDA = 10 // 1/3 de 30 dias
const DIAS_ALERTA_VENCIMENTO = 90

export class PeriodoAquisitivoService {
  constructor(
    private periodoRepo: IPeriodoAquisitivoRepository,
    private solicitacaoRepo: ISolicitacaoFeriasRepository
  ) {}

  // ============================================
  // CONSULTAS
  // ============================================

  async buscarPorId(id: string): Promise<PeriodoAquisitivoCompleto | null> {
    return this.periodoRepo.findByIdCompleto(id)
  }

  async listarPorColaborador(colaboradorId: string): Promise<PeriodoAquisitivoComSolicitacoes[]> {
    return this.periodoRepo.findByColaboradorId(colaboradorId)
  }

  async listarAtivos(): Promise<PeriodoAquisitivoCompleto[]> {
    return this.periodoRepo.findAtivos()
  }

  async listarVencendo(dias: number = DIAS_ALERTA_VENCIMENTO): Promise<PeriodoAquisitivoCompleto[]> {
    return this.periodoRepo.findVencendoEm(dias)
  }

  async listarVencidos(): Promise<PeriodoAquisitivoCompleto[]> {
    return this.periodoRepo.findVencidos()
  }

  // ============================================
  // CÁLCULO DE SALDO
  // ============================================

  async calcularSaldo(periodoId: string): Promise<SaldoPeriodo> {
    const periodo = await this.periodoRepo.findByIdComSolicitacoes(periodoId)
    if (!periodo) {
      throw new Error('Período aquisitivo não encontrado')
    }

    const hoje = new Date()

    // Calcular dias gozados (apenas aprovados e do tipo GOZO)
    const diasGozados = periodo.solicitacoes
      .filter(s => s.status === StatusSolicitacao.APROVADO && s.tipo === 'GOZO')
      .reduce((acc, s) => acc + s.diasGozo, 0)

    // Calcular dias aprovados (todos os tipos)
    const diasAprovados = periodo.solicitacoes
      .filter(s => s.status === StatusSolicitacao.APROVADO)
      .reduce((acc, s) => acc + s.diasGozo, 0)

    // Calcular dias pendentes
    const diasPendentes = periodo.solicitacoes
      .filter(s => s.status === StatusSolicitacao.PENDENTE)
      .reduce((acc, s) => acc + s.diasGozo, 0)

    // Calcular saldo
    const diasRestantes = periodo.diasDireito - periodo.diasVendidos - diasGozados
    const percentualUsado = ((periodo.diasDireito - diasRestantes) / periodo.diasDireito) * 100
    
    // Calcular dias para vencer
    const diasParaVencer = differenceInDays(new Date(periodo.dataLimiteGozo), hoje)
    const estaVencendo = diasParaVencer <= DIAS_ALERTA_VENCIMENTO && diasParaVencer > 0 && diasRestantes > 0

    return {
      periodoId: periodo.id,
      numeroPeriodo: periodo.numeroPeriodo,
      dataInicioAquisitivo: periodo.dataInicioAquisitivo,
      dataFimAquisitivo: periodo.dataFimAquisitivo,
      dataLimiteGozo: periodo.dataLimiteGozo,
      diasDireito: periodo.diasDireito,
      diasVendidos: periodo.diasVendidos,
      diasGozados,
      diasAprovados,
      diasPendentes,
      diasRestantes,
      percentualUsado,
      status: periodo.status,
      diasParaVencer,
      estaVencendo
    }
  }

  // ============================================
  // VENDA DE FÉRIAS (ABONO PECUNIÁRIO)
  // ============================================

  /**
   * Registra a venda de dias de férias (abono pecuniário)
   * Regra CLT Art. 143: máximo de 1/3 (10 dias)
   */
  async registrarVenda(periodoId: string, diasParaVender: number): Promise<PeriodoAquisitivo> {
    // Validar quantidade
    if (diasParaVender < 0) {
      throw new Error('A quantidade de dias não pode ser negativa')
    }

    if (diasParaVender > MAXIMO_DIAS_VENDA) {
      throw new Error(`Não é possível vender mais de ${MAXIMO_DIAS_VENDA} dias (1/3 do período)`)
    }

    // Buscar período
    const periodo = await this.periodoRepo.findByIdComSolicitacoes(periodoId)
    if (!periodo) {
      throw new Error('Período aquisitivo não encontrado')
    }

    // Verificar se período está ativo
    if (periodo.status !== StatusPeriodo.ATIVO) {
      throw new Error('Não é possível vender dias de um período que não está ativo')
    }

    // Calcular saldo disponível
    const saldo = await this.calcularSaldo(periodoId)
    
    // Verificar se há dias suficientes
    if (diasParaVender > saldo.diasRestantes) {
      throw new Error(`Não há dias suficientes para vender. Saldo disponível: ${saldo.diasRestantes} dias`)
    }

    // Verificar se já vendeu anteriormente
    if (periodo.diasVendidos > 0) {
      const totalVenda = periodo.diasVendidos + diasParaVender
      if (totalVenda > MAXIMO_DIAS_VENDA) {
        throw new Error(`Você já vendeu ${periodo.diasVendidos} dias. Pode vender no máximo mais ${MAXIMO_DIAS_VENDA - periodo.diasVendidos} dias`)
      }
    }

    // Registrar venda
    return this.periodoRepo.registrarVenda(periodoId, periodo.diasVendidos + diasParaVender)
  }

  /**
   * Cancela a venda de férias (se ainda não foi processada)
   */
  async cancelarVenda(periodoId: string): Promise<PeriodoAquisitivo> {
    const periodo = await this.periodoRepo.findById(periodoId)
    if (!periodo) {
      throw new Error('Período aquisitivo não encontrado')
    }

    if (periodo.diasVendidos === 0) {
      throw new Error('Não há venda de férias para cancelar')
    }

    // Aqui poderia ter validação se já foi pago, etc.
    return this.periodoRepo.registrarVenda(periodoId, 0)
  }

  // ============================================
  // ATUALIZAÇÃO DE STATUS
  // ============================================

  async atualizarStatus(periodoId: string, status: StatusPeriodo): Promise<PeriodoAquisitivo> {
    const periodo = await this.periodoRepo.findById(periodoId)
    if (!periodo) {
      throw new Error('Período aquisitivo não encontrado')
    }

    return this.periodoRepo.atualizarStatus(periodoId, status)
  }

  /**
   * Verifica e atualiza status de períodos (job diário)
   * - Marca como VENCIDO se passou do limite de gozo
   * - Marca como QUITADO se todos os dias foram usados
   */
  async atualizarStatusPeriodos(): Promise<{ vencidos: number; quitados: number }> {
    let vencidos = 0
    let quitados = 0

    const periodosAtivos = await this.periodoRepo.findAtivos()
    const hoje = new Date()

    for (const periodo of periodosAtivos) {
      // Verificar se venceu
      if (new Date(periodo.dataLimiteGozo) < hoje) {
        await this.periodoRepo.atualizarStatus(periodo.id, StatusPeriodo.VENCIDO)
        vencidos++
        continue
      }

      // Verificar se quitou
      const saldo = await this.calcularSaldo(periodo.id)
      if (saldo.diasRestantes <= 0) {
        await this.periodoRepo.atualizarStatus(periodo.id, StatusPeriodo.QUITADO)
        quitados++
      }
    }

    return { vencidos, quitados }
  }

  // ============================================
  // VALIDAÇÕES
  // ============================================

  /**
   * Valida se um período pode receber novas solicitações
   */
  async podeReceberSolicitacao(periodoId: string, diasSolicitados: number): Promise<{ valido: boolean; erro?: string }> {
    const saldo = await this.calcularSaldo(periodoId)

    // Verificar status
    if (saldo.status !== StatusPeriodo.ATIVO) {
      return { valido: false, erro: 'Este período não está mais ativo' }
    }

    // Verificar se já venceu
    if (saldo.diasParaVencer <= 0) {
      return { valido: false, erro: 'Este período já venceu' }
    }

    // Verificar saldo
    const saldoDisponivel = saldo.diasRestantes - saldo.diasPendentes
    if (diasSolicitados > saldoDisponivel) {
      return { 
        valido: false, 
        erro: `Saldo insuficiente. Disponível: ${saldoDisponivel} dias (${saldo.diasRestantes} restantes - ${saldo.diasPendentes} pendentes)` 
      }
    }

    return { valido: true }
  }
}
