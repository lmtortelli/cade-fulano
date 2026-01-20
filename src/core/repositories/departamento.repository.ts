// ============================================
// INTERFACE DO REPOSITÓRIO DE DEPARTAMENTO
// Contrato para implementação (Prisma, etc.)
// ============================================

import { 
  Departamento, 
  CreateDepartamentoDTO, 
  UpdateDepartamentoDTO,
  DepartamentoResumo 
} from '../types'

export interface IDepartamentoRepository {
  // CRUD básico
  findAll(): Promise<Departamento[]>
  findById(id: string): Promise<Departamento | null>
  findByNome(nome: string): Promise<Departamento | null>
  create(data: CreateDepartamentoDTO): Promise<Departamento>
  update(id: string, data: UpdateDepartamentoDTO): Promise<Departamento>
  delete(id: string): Promise<void>

  // Consultas específicas
  findAtivos(): Promise<Departamento[]>
  
  // Resumo com estatísticas
  getResumoComEstatisticas(dataReferencia: Date): Promise<DepartamentoResumo[]>
  
  // Contagem de colaboradores de férias
  contarColaboradoresDeFeriasPorDepartamento(
    departamentoId: string, 
    dataInicio: Date, 
    dataFim: Date
  ): Promise<number>
}
