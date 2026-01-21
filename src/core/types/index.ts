// ============================================
// TIPOS COMPARTILHADOS - Offy
// Preparado para migração para backend separado
// ============================================

// ============================================
// ENUMS
// ============================================

export enum StatusPeriodo {
  ATIVO = 'ATIVO',
  QUITADO = 'QUITADO',
  VENCIDO = 'VENCIDO',
}

export enum StatusSolicitacao {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
  CANCELADO = 'CANCELADO',
}

export enum TipoSolicitacao {
  GOZO = 'GOZO',
  ABONO_PECUNIARIO = 'ABONO_PECUNIARIO',
}

export enum TipoFolga {
  FERIADO = 'FERIADO',
  COMPENSACAO = 'COMPENSACAO',
  ABONO = 'ABONO',
  LICENCA = 'LICENCA',
  CARGO_CONFIANCA = 'CARGO_CONFIANCA',
  OUTRO = 'OUTRO',
}

// ============================================
// ENTITIES
// ============================================

export interface Departamento {
  id: string
  nome: string
  sigla: string | null
  limiteAusencias: number
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Colaborador {
  id: string
  nome: string
  email: string
  matricula: string | null
  cargo: string | null
  dataAdmissao: Date
  ativo: boolean
  avatarUrl: string | null
  departamentoId: string
  createdAt: Date
  updatedAt: Date
}

export interface ColaboradorComDepartamento extends Colaborador {
  departamento: Departamento
}

export interface ColaboradorCompleto extends ColaboradorComDepartamento {
  periodosAquisitivos: PeriodoAquisitivoComSolicitacoes[]
}

export interface PeriodoAquisitivo {
  id: string
  colaboradorId: string
  numeroPeriodo: number
  dataInicioAquisitivo: Date
  dataFimAquisitivo: Date
  dataLimiteGozo: Date
  diasDireito: number
  diasVendidos: number
  status: StatusPeriodo
  ignorado: boolean
  observacoes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PeriodoAquisitivoComSolicitacoes extends PeriodoAquisitivo {
  solicitacoes: SolicitacaoFerias[]
}

export interface PeriodoAquisitivoCompleto extends PeriodoAquisitivoComSolicitacoes {
  colaborador: Colaborador
}

export interface SolicitacaoFerias {
  id: string
  periodoAquisitivoId: string
  dataInicioGozo: Date
  dataFimGozo: Date
  diasGozo: number
  tipo: TipoSolicitacao
  status: StatusSolicitacao
  observacoes: string | null
  motivoRejeicao: string | null
  motivoCancelamento: string | null
  aprovadoPor: string | null
  aprovadoEm: Date | null
  canceladoEm: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SolicitacaoFeriasCompleta extends SolicitacaoFerias {
  periodoAquisitivo: PeriodoAquisitivoCompleto
}

export enum StatusFolga {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
}

export interface Folga {
  id: string
  colaboradorId: string
  dataInicio: Date
  dataFim: Date | null  // null para folgas de 1 dia
  tipo: TipoFolga
  descricao: string | null
  status: StatusFolga
  motivoRejeicao: string | null
  createdAt: Date
  updatedAt: Date
}

export interface FolgaCompleta extends Folga {
  colaborador: ColaboradorComDepartamento
}

// ============================================
// DTOs - Data Transfer Objects
// ============================================

// Departamento
export interface CreateDepartamentoDTO {
  nome: string
  sigla?: string
  limiteAusencias?: number
}

export interface UpdateDepartamentoDTO {
  nome?: string
  sigla?: string
  limiteAusencias?: number
  ativo?: boolean
}

// Colaborador
export interface CreateColaboradorDTO {
  nome: string
  email: string
  matricula?: string
  cargo?: string
  dataAdmissao: Date
  departamentoId: string
  avatarUrl?: string
}

export interface UpdateColaboradorDTO {
  nome?: string
  email?: string
  matricula?: string
  cargo?: string
  departamentoId?: string
  avatarUrl?: string
  ativo?: boolean
}

// Período Aquisitivo
export interface CreatePeriodoDTO {
  colaboradorId: string
  numeroPeriodo: number
  dataInicioAquisitivo: Date
  dataFimAquisitivo: Date
  dataLimiteGozo: Date
  diasDireito?: number
}

export interface UpdatePeriodoDTO {
  diasVendidos?: number
  status?: StatusPeriodo
  observacoes?: string
}

// Solicitação de Férias
export interface CreateSolicitacaoDTO {
  periodoAquisitivoId: string
  dataInicioGozo: Date
  dataFimGozo: Date
  diasGozo: number
  tipo?: TipoSolicitacao
  observacoes?: string
}

export interface UpdateSolicitacaoDTO {
  dataInicioGozo?: Date
  dataFimGozo?: Date
  diasGozo?: number
  observacoes?: string
}

export interface AprovarSolicitacaoDTO {
  aprovadoPor: string
}

export interface RejeitarSolicitacaoDTO {
  motivoRejeicao: string
  rejeitadoPor: string
}

export interface CancelarSolicitacaoDTO {
  motivoCancelamento: string
}

// Folga
export interface CreateFolgaDTO {
  colaboradorId: string
  dataInicio: Date
  dataFim?: Date | null  // opcional para folgas de 1 dia
  tipo: TipoFolga
  descricao?: string
  status?: StatusFolga
}

export interface UpdateFolgaDTO {
  dataInicio?: Date
  dataFim?: Date | null
  tipo?: TipoFolga
  descricao?: string
}

export interface FolgaFiltros {
  colaboradorId?: string
  departamentoId?: string
  tipo?: TipoFolga
  status?: StatusFolga
  dataInicio?: Date
  dataFim?: Date
}

// ============================================
// VIEW MODELS - Dados para visualização
// ============================================

export interface SaldoPeriodo {
  periodoId: string
  numeroPeriodo: number
  dataInicioAquisitivo: Date
  dataFimAquisitivo: Date
  dataLimiteGozo: Date
  diasDireito: number
  diasVendidos: number
  diasGozados: number
  diasAprovados: number
  diasPendentes: number
  diasRestantes: number
  percentualUsado: number
  status: StatusPeriodo
  diasParaVencer: number
  estaVencendo: boolean
  ignorado: boolean
}

export interface ColaboradorComSaldo extends ColaboradorComDepartamento {
  saldos: SaldoPeriodo[]
  totalDiasRestantes: number
  temPeriodoVencendo: boolean
}

export interface DashboardMetricas {
  deFeriasHoje: number
  pedidosPendentes: number
  alertasConflito: number
  totalColaboradores: number
  colaboradoresAtivos: number
}

export interface ProximaSaida {
  colaboradorId: string
  colaboradorNome: string
  colaboradorAvatar: string | null
  departamentoNome: string
  dataInicio: Date
  dataFim: Date
  diasGozo: number
  status: StatusSolicitacao
  solicitacaoId: string
}

export interface DepartamentoResumo {
  id: string
  nome: string
  totalColaboradores: number
  colaboradoresDeFeriasHoje: number
  colaboradoresDeFeriasPeriodo: number
}

export interface ConflitoDepartamento {
  departamentoId: string
  departamentoNome: string
  dataInicio: Date
  dataFim: Date
  colaboradoresAfetados: Array<{
    id: string
    nome: string
  }>
  limiteExcedido: boolean
}

// ============================================
// FILTROS E PAGINAÇÃO
// ============================================

export interface PaginacaoParams {
  page?: number
  limit?: number
}

export interface PaginacaoResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ColaboradorFiltros extends PaginacaoParams {
  departamentoId?: string
  ativo?: boolean
  busca?: string
}

export interface SolicitacaoFiltros extends PaginacaoParams {
  colaboradorId?: string
  periodoId?: string
  status?: StatusSolicitacao
  tipo?: TipoSolicitacao
  dataInicio?: Date
  dataFim?: Date
}
