// ============================================
// INTERFACE DO REPOSITÓRIO DE FOLGA
// Contrato para implementação (Prisma, etc.)
// ============================================

import { 
  Folga,
  FolgaCompleta,
  CreateFolgaDTO, 
  UpdateFolgaDTO,
  FolgaFiltros,
  TipoFolga
} from '../types'

export interface IFolgaRepository {
  // CRUD básico
  findById(id: string): Promise<Folga | null>
  findByIdCompleto(id: string): Promise<FolgaCompleta | null>
  create(data: CreateFolgaDTO): Promise<Folga>
  update(id: string, data: UpdateFolgaDTO): Promise<Folga>
  delete(id: string): Promise<void>

  // Consultas
  findByColaboradorId(colaboradorId: string): Promise<Folga[]>
  findByData(data: Date): Promise<FolgaCompleta[]>
  findByPeriodo(dataInicio: Date, dataFim: Date): Promise<FolgaCompleta[]>
  findComFiltros(filtros: FolgaFiltros): Promise<FolgaCompleta[]>
  
  // Listagem
  findAll(): Promise<FolgaCompleta[]>
}
