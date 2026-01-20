// ============================================
// INTERFACE DO REPOSITÓRIO DE PERÍODO AQUISITIVO
// Contrato para implementação (Prisma, etc.)
// ============================================

import { 
  PeriodoAquisitivo,
  PeriodoAquisitivoComSolicitacoes,
  PeriodoAquisitivoCompleto,
  CreatePeriodoDTO, 
  UpdatePeriodoDTO,
  StatusPeriodo
} from '../types'

export interface IPeriodoAquisitivoRepository {
  // CRUD básico
  findById(id: string): Promise<PeriodoAquisitivo | null>
  findByIdComSolicitacoes(id: string): Promise<PeriodoAquisitivoComSolicitacoes | null>
  findByIdCompleto(id: string): Promise<PeriodoAquisitivoCompleto | null>
  create(data: CreatePeriodoDTO): Promise<PeriodoAquisitivo>
  update(id: string, data: UpdatePeriodoDTO): Promise<PeriodoAquisitivo>
  delete(id: string): Promise<void>

  // Consultas por colaborador
  findByColaboradorId(colaboradorId: string): Promise<PeriodoAquisitivoComSolicitacoes[]>
  findUltimoPeriodoByColaboradorId(colaboradorId: string): Promise<PeriodoAquisitivo | null>
  
  // Consultas por status
  findByStatus(status: StatusPeriodo): Promise<PeriodoAquisitivoCompleto[]>
  findAtivos(): Promise<PeriodoAquisitivoCompleto[]>
  
  // Consultas de vencimento
  findVencendoEm(dias: number): Promise<PeriodoAquisitivoCompleto[]>
  findVencidos(): Promise<PeriodoAquisitivoCompleto[]>
  
  // Atualização de status
  atualizarStatus(id: string, status: StatusPeriodo): Promise<PeriodoAquisitivo>
  registrarVenda(id: string, diasVendidos: number): Promise<PeriodoAquisitivo>
  
  // Verificações
  existePeriodo(colaboradorId: string, numeroPeriodo: number): Promise<boolean>
}
