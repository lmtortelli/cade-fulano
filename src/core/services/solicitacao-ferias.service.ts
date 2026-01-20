// ============================================
// SERVICE DE SOLICITAÇÃO DE FÉRIAS
// Regras de negócio para gestão de solicitações
// ============================================

import { ISolicitacaoFeriasRepository } from '../repositories/solicitacao-ferias.repository'
import { IPeriodoAquisitivoRepository } from '../repositories/periodo-aquisitivo.repository'
import { IDepartamentoRepository } from '../repositories/departamento.repository'
import { 
  SolicitacaoFerias,
  SolicitacaoFeriasCompleta,
  CreateSolicitacaoDTO, 
  UpdateSolicitacaoDTO,
  StatusSolicitacao,
  TipoSolicitacao,
  StatusPeriodo,
  SolicitacaoFiltros,
  PaginacaoResult,
  ProximaSaida,
  ConflitoDepartamento
} from '../types'
import { differenceInDays, addDays, isAfter, isBefore, isWithinInterval } from 'date-fns'

// Constantes das regras CLT
const MINIMO_DIAS_PERIODO_PRINCIPAL = 14 // CLT: um dos períodos deve ter no mínimo 14 dias
const MINIMO_DIAS_PERIODO_SECUNDARIO = 5 // CLT: demais períodos mínimo 5 dias
const MAXIMO_FRACOES = 3 // CLT: pode fracionar em até 3 períodos

export class SolicitacaoFeriasService {
  constructor(
    private solicitacaoRepo: ISolicitacaoFeriasRepository,
    private periodoRepo: IPeriodoAquisitivoRepository,
    private departamentoRepo: IDepartamentoRepository
  ) {}

  // ============================================
  // CRUD
  // ============================================

  async buscarPorId(id: string): Promise<SolicitacaoFeriasCompleta | null> {
    return this.solicitacaoRepo.findByIdCompleto(id)
  }

  async listarPendentes(): Promise<SolicitacaoFeriasCompleta[]> {
    return this.solicitacaoRepo.findPendentes()
  }

  async listarComFiltros(filtros: SolicitacaoFiltros): Promise<PaginacaoResult<SolicitacaoFeriasCompleta>> {
    return this.solicitacaoRepo.findComFiltros(filtros)
  }

  async listarProximasSaidas(limite: number = 10): Promise<ProximaSaida[]> {
    return this.solicitacaoRepo.findProximasSaidas(limite)
  }

  // ============================================
  // CRIAÇÃO DE SOLICITAÇÃO
  // ============================================

  async criar(dados: CreateSolicitacaoDTO): Promise<SolicitacaoFerias> {
    // Validar período aquisitivo
    const periodo = await this.periodoRepo.findByIdCompleto(dados.periodoAquisitivoId)
    if (!periodo) {
      throw new Error('Período aquisitivo não encontrado')
    }

    // Verificar status do período
    if (periodo.status !== StatusPeriodo.ATIVO) {
      throw new Error('Não é possível solicitar férias de um período que não está ativo')
    }

    const isAbonoPecuniario = dados.tipo === TipoSolicitacao.ABONO_PECUNIARIO

    // Validar datas apenas para GOZO (não para ABONO_PECUNIARIO)
    if (!isAbonoPecuniario) {
      this.validarDatas(dados.dataInicioGozo, dados.dataFimGozo, dados.diasGozo)
      
      // Validar quantidade de dias conforme CLT apenas para GOZO
      await this.validarFracionamento(dados.periodoAquisitivoId, dados.diasGozo)
      
      // Verificar conflitos de departamento apenas para GOZO
      const conflitos = await this.verificarConflitos(
        periodo.colaborador.departamentoId,
        dados.dataInicioGozo,
        dados.dataFimGozo
      )
      // Apenas alertar sobre conflitos, não bloquear
      // O gestor decidirá na aprovação
    } else {
      // Validação específica para ABONO_PECUNIARIO
      const maxVenda = 10 - periodo.diasVendidos
      if (dados.diasGozo > maxVenda) {
        throw new Error(`Você pode vender no máximo ${maxVenda} dias deste período (limite de 10 dias já vendidos: ${periodo.diasVendidos})`)
      }
    }

    // Calcular saldo disponível
    const saldoDisponivel = await this.calcularSaldoDisponivel(dados.periodoAquisitivoId)
    if (dados.diasGozo > saldoDisponivel) {
      throw new Error(`Saldo insuficiente. Disponível: ${saldoDisponivel} dias`)
    }

    return this.solicitacaoRepo.create(dados)
  }

  async atualizar(id: string, dados: UpdateSolicitacaoDTO): Promise<SolicitacaoFerias> {
    const solicitacao = await this.solicitacaoRepo.findByIdCompleto(id)
    if (!solicitacao) {
      throw new Error('Solicitação não encontrada')
    }

    // Só pode editar se estiver pendente
    if (solicitacao.status !== StatusSolicitacao.PENDENTE) {
      throw new Error('Não é possível editar uma solicitação que não está pendente')
    }

    // Validar datas se alteradas
    const novoInicio = dados.dataInicioGozo || solicitacao.dataInicioGozo
    const novoFim = dados.dataFimGozo || solicitacao.dataFimGozo
    const novosDias = dados.diasGozo || solicitacao.diasGozo

    this.validarDatas(novoInicio, novoFim, novosDias)

    return this.solicitacaoRepo.update(id, dados)
  }

  async cancelar(id: string, motivoCancelamento: string): Promise<SolicitacaoFerias> {
    const solicitacao = await this.solicitacaoRepo.findById(id)
    if (!solicitacao) {
      throw new Error('Solicitação não encontrada')
    }

    if (!motivoCancelamento || motivoCancelamento.trim().length === 0) {
      throw new Error('Motivo do cancelamento é obrigatório')
    }

    // Só pode cancelar se estiver pendente ou aprovada (antes do início)
    if (solicitacao.status === StatusSolicitacao.REJEITADO || 
        solicitacao.status === StatusSolicitacao.CANCELADO) {
      throw new Error('Esta solicitação não pode ser cancelada')
    }

    // Se aprovada, verificar se já iniciou (apenas para GOZO)
    if (solicitacao.status === StatusSolicitacao.APROVADO && solicitacao.tipo === TipoSolicitacao.GOZO) {
      const hoje = new Date()
      if (isAfter(hoje, new Date(solicitacao.dataInicioGozo))) {
        throw new Error('Não é possível cancelar férias que já iniciaram')
      }
    }

    return this.solicitacaoRepo.cancelar(id, motivoCancelamento.trim())
  }

  // ============================================
  // WORKFLOW DE APROVAÇÃO
  // ============================================

  async aprovar(id: string, aprovadoPor: string): Promise<SolicitacaoFerias> {
    const solicitacao = await this.solicitacaoRepo.findByIdCompleto(id)
    if (!solicitacao) {
      throw new Error('Solicitação não encontrada')
    }

    if (solicitacao.status !== StatusSolicitacao.PENDENTE) {
      throw new Error('Apenas solicitações pendentes podem ser aprovadas')
    }

    // Verificar saldo excluindo a própria solicitação (já está contada como PENDENTE)
    const saldoDisponivel = await this.calcularSaldoDisponivelExcluindo(
      solicitacao.periodoAquisitivoId, 
      id
    )
    
    // Verifica se após excluir esta solicitação, ainda há saldo suficiente para ela
    if (solicitacao.diasGozo > saldoDisponivel) {
      // Isso só aconteceria se outra solicitação foi aprovada enquanto esta estava pendente
      throw new Error(`Saldo insuficiente. Disponível: ${saldoDisponivel} dias`)
    }

    return this.solicitacaoRepo.aprovar(id, aprovadoPor)
  }

  async rejeitar(id: string, motivoRejeicao: string): Promise<SolicitacaoFerias> {
    const solicitacao = await this.solicitacaoRepo.findById(id)
    if (!solicitacao) {
      throw new Error('Solicitação não encontrada')
    }

    if (solicitacao.status !== StatusSolicitacao.PENDENTE) {
      throw new Error('Apenas solicitações pendentes podem ser rejeitadas')
    }

    if (!motivoRejeicao || motivoRejeicao.trim().length === 0) {
      throw new Error('É necessário informar o motivo da rejeição')
    }

    return this.solicitacaoRepo.rejeitar(id, motivoRejeicao)
  }

  // ============================================
  // VALIDAÇÕES
  // ============================================

  private validarDatas(dataInicio: Date, dataFim: Date, diasGozo: number): void {
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)

    // Data fim deve ser após data início
    if (isBefore(fim, inicio)) {
      throw new Error('A data de fim deve ser após a data de início')
    }

    // Verificar se os dias batem com as datas
    const diasCalculados = differenceInDays(fim, inicio) + 1
    if (diasCalculados !== diasGozo) {
      throw new Error(`O período informado (${diasCalculados} dias) não corresponde aos dias de gozo (${diasGozo} dias)`)
    }
  }

  /**
   * Valida o fracionamento de férias conforme CLT
   * - Pode fracionar em até 3 períodos
   * - Um dos períodos deve ter no mínimo 14 dias
   * - Os demais devem ter no mínimo 5 dias
   */
  private async validarFracionamento(periodoAquisitivoId: string, diasSolicitados: number): Promise<void> {
    // Verificar quantidade mínima
    if (diasSolicitados < MINIMO_DIAS_PERIODO_SECUNDARIO) {
      throw new Error(`O período mínimo de férias é de ${MINIMO_DIAS_PERIODO_SECUNDARIO} dias`)
    }

    // Buscar solicitações existentes do período
    const solicitacoesExistentes = await this.solicitacaoRepo.findByPeriodoId(periodoAquisitivoId)
    const solicitacoesValidas = solicitacoesExistentes.filter(
      s => s.status !== StatusSolicitacao.REJEITADO && s.status !== StatusSolicitacao.CANCELADO
    )

    // Verificar limite de fracionamento
    if (solicitacoesValidas.length >= MAXIMO_FRACOES) {
      throw new Error(`Não é possível fracionar as férias em mais de ${MAXIMO_FRACOES} períodos`)
    }

    // Verificar se já existe um período de 14+ dias
    const temPeriodo14Dias = solicitacoesValidas.some(s => s.diasGozo >= MINIMO_DIAS_PERIODO_PRINCIPAL)

    // Se não tem período de 14 dias e este também não tem, verificar se ainda é possível
    if (!temPeriodo14Dias && diasSolicitados < MINIMO_DIAS_PERIODO_PRINCIPAL) {
      // Verificar se ainda há oportunidade de fazer um período de 14 dias
      const totalSolicitado = solicitacoesValidas.reduce((acc, s) => acc + s.diasGozo, 0)
      const periodo = await this.periodoRepo.findById(periodoAquisitivoId)
      
      if (periodo) {
        const saldoRestante = periodo.diasDireito - periodo.diasVendidos - totalSolicitado - diasSolicitados
        
        // Se não vai sobrar pelo menos 14 dias para um período principal, alertar
        if (saldoRestante < MINIMO_DIAS_PERIODO_PRINCIPAL && solicitacoesValidas.length < MAXIMO_FRACOES - 1) {
          // Ainda tem chance de fazer período principal depois, ok
        } else if (saldoRestante < MINIMO_DIAS_PERIODO_PRINCIPAL && solicitacoesValidas.length === MAXIMO_FRACOES - 1) {
          throw new Error(`É necessário que pelo menos um dos períodos tenha no mínimo ${MINIMO_DIAS_PERIODO_PRINCIPAL} dias`)
        }
      }
    }
  }

  private async calcularSaldoDisponivel(periodoAquisitivoId: string): Promise<number> {
    const periodo = await this.periodoRepo.findByIdComSolicitacoes(periodoAquisitivoId)
    if (!periodo) {
      throw new Error('Período não encontrado')
    }

    const diasUsados = periodo.solicitacoes
      .filter(s => s.status === StatusSolicitacao.APROVADO || s.status === StatusSolicitacao.PENDENTE)
      .reduce((acc, s) => acc + s.diasGozo, 0)

    return periodo.diasDireito - periodo.diasVendidos - diasUsados
  }

  /**
   * Calcula saldo disponível excluindo uma solicitação específica do cálculo.
   * Usado na aprovação para não contar a própria solicitação sendo aprovada.
   */
  private async calcularSaldoDisponivelExcluindo(
    periodoAquisitivoId: string, 
    excluirSolicitacaoId: string
  ): Promise<number> {
    const periodo = await this.periodoRepo.findByIdComSolicitacoes(periodoAquisitivoId)
    if (!periodo) {
      throw new Error('Período não encontrado')
    }

    const diasUsados = periodo.solicitacoes
      .filter(s => 
        s.id !== excluirSolicitacaoId && // Excluir a solicitação sendo aprovada
        (s.status === StatusSolicitacao.APROVADO || s.status === StatusSolicitacao.PENDENTE)
      )
      .reduce((acc, s) => acc + s.diasGozo, 0)

    return periodo.diasDireito - periodo.diasVendidos - diasUsados
  }

  // ============================================
  // VERIFICAÇÃO DE CONFLITOS
  // ============================================

  async verificarConflitos(
    departamentoId: string, 
    dataInicio: Date, 
    dataFim: Date,
    excluirSolicitacaoId?: string
  ): Promise<ConflitoDepartamento | null> {
    // Buscar departamento
    const departamento = await this.departamentoRepo.findById(departamentoId)
    if (!departamento) {
      return null
    }

    // Buscar solicitações aprovadas que conflitam
    const conflitos = await this.solicitacaoRepo.findConflitosNoPeriodo(
      departamentoId,
      dataInicio,
      dataFim,
      excluirSolicitacaoId
    )

    if (conflitos.length === 0) {
      return null
    }

    // Verificar se excede o limite
    const limiteExcedido = conflitos.length >= departamento.limiteAusencias

    // Mapear colaboradores afetados
    const colaboradoresAfetados = conflitos.map(c => ({
      id: c.periodoAquisitivo.colaborador.id,
      nome: c.periodoAquisitivo.colaborador.nome
    }))

    // Remover duplicatas
    const colaboradoresUnicos = colaboradoresAfetados.filter(
      (v, i, a) => a.findIndex(t => t.id === v.id) === i
    )

    return {
      departamentoId,
      departamentoNome: departamento.nome,
      dataInicio,
      dataFim,
      colaboradoresAfetados: colaboradoresUnicos,
      limiteExcedido
    }
  }

  async listarConflitosAtivos(): Promise<ConflitoDepartamento[]> {
    // Implementar verificação de todos os conflitos ativos
    // Por simplicidade, retorna array vazio
    // Na prática, iteraria por todos os departamentos
    return []
  }

  // ============================================
  // ESTATÍSTICAS
  // ============================================

  async contarPendentes(): Promise<number> {
    return this.solicitacaoRepo.countPendentes()
  }

  async contarPorStatus(status: StatusSolicitacao): Promise<number> {
    return this.solicitacaoRepo.countByStatus(status)
  }
}
