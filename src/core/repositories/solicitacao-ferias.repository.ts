// ============================================
// INTERFACE DO REPOSITÓRIO DE SOLICITAÇÃO DE FÉRIAS
// Contrato para implementação (Prisma, etc.)
// ============================================

import { 
  SolicitacaoFerias,
  SolicitacaoFeriasCompleta,
  CreateSolicitacaoDTO, 
  UpdateSolicitacaoDTO,
  StatusSolicitacao,
  TipoSolicitacao,
  SolicitacaoFiltros,
  PaginacaoResult,
  ProximaSaida
} from '../types'

export interface ISolicitacaoFeriasRepository {
  // CRUD básico
  findById(id: string): Promise<SolicitacaoFerias | null>
  findByIdCompleto(id: string): Promise<SolicitacaoFeriasCompleta | null>
  create(data: CreateSolicitacaoDTO): Promise<SolicitacaoFerias>
  update(id: string, data: UpdateSolicitacaoDTO): Promise<SolicitacaoFerias>
  delete(id: string): Promise<void>

  // Consultas por período
  findByPeriodoId(periodoId: string): Promise<SolicitacaoFerias[]>
  findByPeriodoIdEStatus(periodoId: string, status: StatusSolicitacao): Promise<SolicitacaoFerias[]>
  
  // Consultas por status
  findByStatus(status: StatusSolicitacao): Promise<SolicitacaoFeriasCompleta[]>
  findPendentes(): Promise<SolicitacaoFeriasCompleta[]>
  findAprovadas(): Promise<SolicitacaoFeriasCompleta[]>
  
  // Consultas com filtros
  findComFiltros(filtros: SolicitacaoFiltros): Promise<PaginacaoResult<SolicitacaoFeriasCompleta>>

  // Workflow de aprovação
  aprovar(id: string, aprovadoPor: string): Promise<SolicitacaoFerias>
  rejeitar(id: string, motivoRejeicao: string): Promise<SolicitacaoFerias>
  cancelar(id: string, motivoCancelamento: string): Promise<SolicitacaoFerias>

  // Consultas de período
  findPorPeriodoData(dataInicio: Date, dataFim: Date): Promise<SolicitacaoFeriasCompleta[]>
  findAprovadasNoPeriodo(dataInicio: Date, dataFim: Date): Promise<SolicitacaoFeriasCompleta[]>
  
  // Próximas saídas
  findProximasSaidas(limite: number): Promise<ProximaSaida[]>
  
  // Estatísticas
  countByStatus(status: StatusSolicitacao): Promise<number>
  countPendentes(): Promise<number>
  
  // Cálculos
  somarDiasGozadosPorPeriodo(periodoId: string): Promise<number>
  somarDiasAprovadosPorPeriodo(periodoId: string): Promise<number>
  somarDiasPendentesPorPeriodo(periodoId: string): Promise<number>

  // Verificação de conflitos
  findConflitosNoPeriodo(
    departamentoId: string, 
    dataInicio: Date, 
    dataFim: Date, 
    excluirSolicitacaoId?: string
  ): Promise<SolicitacaoFeriasCompleta[]>
}
