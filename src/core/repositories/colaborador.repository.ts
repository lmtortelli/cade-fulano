// ============================================
// INTERFACE DO REPOSITÓRIO DE COLABORADOR
// Contrato para implementação (Prisma, etc.)
// ============================================

import { 
  Colaborador,
  ColaboradorComDepartamento,
  ColaboradorCompleto,
  CreateColaboradorDTO, 
  UpdateColaboradorDTO,
  ColaboradorFiltros,
  PaginacaoResult
} from '../types'

export interface IColaboradorRepository {
  // CRUD básico
  findAll(): Promise<ColaboradorComDepartamento[]>
  findById(id: string): Promise<ColaboradorComDepartamento | null>
  findByIdCompleto(id: string): Promise<ColaboradorCompleto | null>
  findByEmail(email: string): Promise<Colaborador | null>
  findByMatricula(matricula: string): Promise<Colaborador | null>
  create(data: CreateColaboradorDTO): Promise<ColaboradorComDepartamento>
  update(id: string, data: UpdateColaboradorDTO): Promise<ColaboradorComDepartamento>
  delete(id: string): Promise<void>

  // Consultas com filtros
  findComFiltros(filtros: ColaboradorFiltros): Promise<PaginacaoResult<ColaboradorComDepartamento>>
  
  // Consultas específicas
  findAtivos(): Promise<ColaboradorComDepartamento[]>
  findByDepartamento(departamentoId: string): Promise<ColaboradorComDepartamento[]>
  
  // Busca textual
  buscar(termo: string): Promise<ColaboradorComDepartamento[]>
  
  // Estatísticas
  count(): Promise<number>
  countAtivos(): Promise<number>
  countByDepartamento(departamentoId: string): Promise<number>

  // Colaboradores de férias
  findDeFeriasNaData(data: Date): Promise<ColaboradorComDepartamento[]>
  findDeFeriasNoPeriodo(dataInicio: Date, dataFim: Date): Promise<ColaboradorComDepartamento[]>
}
