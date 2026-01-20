// ============================================
// SERVICE DE COLABORADOR
// Regras de negócio para gestão de colaboradores
// ============================================

import { IColaboradorRepository } from '../repositories/colaborador.repository'
import { IPeriodoAquisitivoRepository } from '../repositories/periodo-aquisitivo.repository'
import { 
  ColaboradorComDepartamento,
  ColaboradorCompleto,
  CreateColaboradorDTO, 
  UpdateColaboradorDTO,
  ColaboradorFiltros,
  PaginacaoResult,
  ColaboradorComSaldo,
  SaldoPeriodo,
  StatusPeriodo,
  StatusSolicitacao
} from '../types'
import { addYears, addMonths, differenceInDays } from 'date-fns'

export class ColaboradorService {
  constructor(
    private colaboradorRepo: IColaboradorRepository,
    private periodoRepo: IPeriodoAquisitivoRepository
  ) {}

  // ============================================
  // CRUD
  // ============================================

  async listarTodos(): Promise<ColaboradorComDepartamento[]> {
    return this.colaboradorRepo.findAll()
  }

  async listarComFiltros(filtros: ColaboradorFiltros): Promise<PaginacaoResult<ColaboradorComDepartamento>> {
    return this.colaboradorRepo.findComFiltros(filtros)
  }

  async buscarPorId(id: string): Promise<ColaboradorCompleto | null> {
    return this.colaboradorRepo.findByIdCompleto(id)
  }

  async criar(dados: CreateColaboradorDTO): Promise<ColaboradorComDepartamento> {
    // Validar email único
    const existeEmail = await this.colaboradorRepo.findByEmail(dados.email)
    if (existeEmail) {
      throw new Error('Já existe um colaborador com este e-mail')
    }

    // Validar matrícula única (se fornecida)
    if (dados.matricula) {
      const existeMatricula = await this.colaboradorRepo.findByMatricula(dados.matricula)
      if (existeMatricula) {
        throw new Error('Já existe um colaborador com esta matrícula')
      }
    }

    // Criar colaborador
    const colaborador = await this.colaboradorRepo.create(dados)

    // Gerar períodos aquisitivos automaticamente
    await this.gerarPeriodosAquisitivos(colaborador.id, dados.dataAdmissao)

    return colaborador
  }

  async atualizar(id: string, dados: UpdateColaboradorDTO): Promise<ColaboradorComDepartamento> {
    // Verificar se colaborador existe
    const colaborador = await this.colaboradorRepo.findById(id)
    if (!colaborador) {
      throw new Error('Colaborador não encontrado')
    }

    // Validar email único (se alterado)
    if (dados.email && dados.email !== colaborador.email) {
      const existeEmail = await this.colaboradorRepo.findByEmail(dados.email)
      if (existeEmail) {
        throw new Error('Já existe um colaborador com este e-mail')
      }
    }

    // Validar matrícula única (se alterada)
    if (dados.matricula && dados.matricula !== colaborador.matricula) {
      const existeMatricula = await this.colaboradorRepo.findByMatricula(dados.matricula)
      if (existeMatricula) {
        throw new Error('Já existe um colaborador com esta matrícula')
      }
    }

    return this.colaboradorRepo.update(id, dados)
  }

  async inativar(id: string): Promise<ColaboradorComDepartamento> {
    return this.colaboradorRepo.update(id, { ativo: false })
  }

  async reativar(id: string): Promise<ColaboradorComDepartamento> {
    return this.colaboradorRepo.update(id, { ativo: true })
  }

  // ============================================
  // GERAÇÃO DE PERÍODOS AQUISITIVOS
  // ============================================

  /**
   * Gera todos os períodos aquisitivos desde a admissão até hoje
   */
  async gerarPeriodosAquisitivos(colaboradorId: string, dataAdmissao: Date): Promise<void> {
    const hoje = new Date()
    let numeroPeriodo = 1
    let inicioAquisitivo = new Date(dataAdmissao)

    while (inicioAquisitivo < hoje) {
      const fimAquisitivo = addYears(dataAdmissao, numeroPeriodo)
      const limiteGozo = addMonths(fimAquisitivo, 12)

      // Verificar se período já existe
      const existe = await this.periodoRepo.existePeriodo(colaboradorId, numeroPeriodo)
      
      if (!existe) {
        await this.periodoRepo.create({
          colaboradorId,
          numeroPeriodo,
          dataInicioAquisitivo: inicioAquisitivo,
          dataFimAquisitivo: fimAquisitivo,
          dataLimiteGozo: limiteGozo,
          diasDireito: 30
        })
      }

      numeroPeriodo++
      inicioAquisitivo = fimAquisitivo
    }
  }

  /**
   * Verifica e cria novos períodos se necessário (job diário)
   */
  async verificarNovosPeriodos(): Promise<number> {
    const colaboradores = await this.colaboradorRepo.findAtivos()
    let periodosGerados = 0

    for (const colaborador of colaboradores) {
      const ultimoPeriodo = await this.periodoRepo.findUltimoPeriodoByColaboradorId(colaborador.id)
      
      if (ultimoPeriodo) {
        const hoje = new Date()
        const fimUltimoPeriodo = new Date(ultimoPeriodo.dataFimAquisitivo)
        
        // Se o último período já terminou, criar próximo
        if (fimUltimoPeriodo < hoje) {
          const novoNumero = ultimoPeriodo.numeroPeriodo + 1
          const novoInicio = fimUltimoPeriodo
          const novoFim = addYears(colaborador.dataAdmissao, novoNumero)
          const novoLimite = addMonths(novoFim, 12)

          await this.periodoRepo.create({
            colaboradorId: colaborador.id,
            numeroPeriodo: novoNumero,
            dataInicioAquisitivo: novoInicio,
            dataFimAquisitivo: novoFim,
            dataLimiteGozo: novoLimite,
            diasDireito: 30
          })
          periodosGerados++
        }
      }
    }

    return periodosGerados
  }

  // ============================================
  // CONSULTAS ESPECIAIS
  // ============================================

  async buscar(termo: string): Promise<ColaboradorComDepartamento[]> {
    return this.colaboradorRepo.buscar(termo)
  }

  async listarPorDepartamento(departamentoId: string): Promise<ColaboradorComDepartamento[]> {
    return this.colaboradorRepo.findByDepartamento(departamentoId)
  }

  async listarDeFeriasHoje(): Promise<ColaboradorComDepartamento[]> {
    return this.colaboradorRepo.findDeFeriasNaData(new Date())
  }

  async listarDeFeriasNoPeriodo(dataInicio: Date, dataFim: Date): Promise<ColaboradorComDepartamento[]> {
    return this.colaboradorRepo.findDeFeriasNoPeriodo(dataInicio, dataFim)
  }

  // ============================================
  // SALDO DE FÉRIAS
  // ============================================

  async obterColaboradorComSaldo(colaboradorId: string): Promise<ColaboradorComSaldo | null> {
    const colaborador = await this.colaboradorRepo.findByIdCompleto(colaboradorId)
    if (!colaborador) return null

    const saldos = await this.calcularSaldosPeriodos(colaborador)
    
    // Calcular totais apenas de períodos NÃO IGNORADOS
    const saldosNaoIgnorados = saldos.filter(s => !s.ignorado)
    const totalDiasRestantes = saldosNaoIgnorados.reduce((acc, s) => acc + s.diasRestantes, 0)
    const temPeriodoVencendo = saldosNaoIgnorados.some(s => s.estaVencendo)

    return {
      ...colaborador,
      saldos,
      totalDiasRestantes,
      temPeriodoVencendo
    }
  }

  async listarColaboradoresComSaldo(): Promise<ColaboradorComSaldo[]> {
    const colaboradores = await this.colaboradorRepo.findAtivos()
    const resultado: ColaboradorComSaldo[] = []

    for (const colaborador of colaboradores) {
      const comSaldo = await this.obterColaboradorComSaldo(colaborador.id)
      if (comSaldo) {
        resultado.push(comSaldo)
      }
    }

    return resultado
  }

  private async calcularSaldosPeriodos(colaborador: ColaboradorCompleto): Promise<SaldoPeriodo[]> {
    const hoje = new Date()
    const saldos: SaldoPeriodo[] = []

    for (const periodo of colaborador.periodosAquisitivos) {
      // Dias gozados (férias aprovadas)
      const diasGozados = periodo.solicitacoes
        .filter(s => s.status === StatusSolicitacao.APROVADO && s.tipo === 'GOZO')
        .reduce((acc, s) => acc + s.diasGozo, 0)

      // Dias vendidos via solicitação ABONO_PECUNIARIO aprovada
      const diasVendidosViaSolicitacao = periodo.solicitacoes
        .filter(s => s.status === StatusSolicitacao.APROVADO && s.tipo === 'ABONO_PECUNIARIO')
        .reduce((acc, s) => acc + s.diasGozo, 0)

      // Total de dias vendidos (campo do período + solicitações aprovadas)
      const totalDiasVendidos = periodo.diasVendidos + diasVendidosViaSolicitacao

      // Dias aprovados (todos os tipos)
      const diasAprovados = periodo.solicitacoes
        .filter(s => s.status === StatusSolicitacao.APROVADO)
        .reduce((acc, s) => acc + s.diasGozo, 0)

      // Dias pendentes (todos os tipos)
      const diasPendentes = periodo.solicitacoes
        .filter(s => s.status === StatusSolicitacao.PENDENTE)
        .reduce((acc, s) => acc + s.diasGozo, 0)

      // Total de dias utilizados (aprovados de qualquer tipo)
      const totalDiasUsados = diasGozados + diasVendidosViaSolicitacao
      
      // diasDisponiveis considera APROVADOS + PENDENTES (disponível para nova solicitação)
      const diasDisponiveis = periodo.diasDireito - periodo.diasVendidos - totalDiasUsados - diasPendentes
      
      const percentualUsado = ((periodo.diasDireito - diasDisponiveis) / periodo.diasDireito) * 100
      const diasParaVencer = differenceInDays(new Date(periodo.dataLimiteGozo), hoje)
      const estaVencendo = diasParaVencer <= 90 && diasParaVencer > 0 && diasDisponiveis > 0

      saldos.push({
        periodoId: periodo.id,
        numeroPeriodo: periodo.numeroPeriodo,
        dataInicioAquisitivo: periodo.dataInicioAquisitivo,
        dataFimAquisitivo: periodo.dataFimAquisitivo,
        dataLimiteGozo: periodo.dataLimiteGozo,
        diasDireito: periodo.diasDireito,
        diasVendidos: totalDiasVendidos, // Total incluindo solicitações aprovadas
        diasGozados,
        diasAprovados,
        diasPendentes,
        diasRestantes: diasDisponiveis, // Usar diasDisponiveis para disponibilidade de novas solicitações
        percentualUsado,
        status: periodo.status,
        diasParaVencer,
        estaVencendo,
        ignorado: (periodo as any).ignorado || false
      })
    }

    return saldos
  }

  // ============================================
  // ESTATÍSTICAS
  // ============================================

  async contarTotal(): Promise<number> {
    return this.colaboradorRepo.count()
  }

  async contarAtivos(): Promise<number> {
    return this.colaboradorRepo.countAtivos()
  }
}
