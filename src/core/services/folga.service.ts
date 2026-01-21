// ============================================
// SERVIÇO DE FOLGA
// Regras de negócio para gerenciamento de folgas
// ============================================

import { IFolgaRepository } from '../repositories/folga.repository'
import { IColaboradorRepository } from '../repositories/colaborador.repository'
import { 
  Folga,
  FolgaCompleta,
  CreateFolgaDTO, 
  UpdateFolgaDTO,
  FolgaFiltros
} from '../types'

export class FolgaService {
  constructor(
    private folgaRepo: IFolgaRepository,
    private colaboradorRepo: IColaboradorRepository
  ) {}

  // ============================================
  // CRUD
  // ============================================

  async obterPorId(id: string): Promise<FolgaCompleta | null> {
    return this.folgaRepo.findByIdCompleto(id)
  }

  async listarTodas(): Promise<FolgaCompleta[]> {
    return this.folgaRepo.findAll()
  }

  async listarPorColaborador(colaboradorId: string): Promise<Folga[]> {
    return this.folgaRepo.findByColaboradorId(colaboradorId)
  }

  async listarComFiltros(filtros: FolgaFiltros): Promise<FolgaCompleta[]> {
    return this.folgaRepo.findComFiltros(filtros)
  }

  async listarPorPeriodo(dataInicio: Date, dataFim: Date): Promise<FolgaCompleta[]> {
    return this.folgaRepo.findByPeriodo(dataInicio, dataFim)
  }

  async criar(dados: CreateFolgaDTO): Promise<Folga> {
    // Validar colaborador
    const colaborador = await this.colaboradorRepo.findById(dados.colaboradorId)
    if (!colaborador) {
      throw new Error('Colaborador não encontrado')
    }

    if (!colaborador.ativo) {
      throw new Error('Não é possível registrar folga para colaborador inativo')
    }

    // Validar data de início
    if (!dados.dataInicio) {
      throw new Error('Data de início da folga é obrigatória')
    }

    // Validar tipo
    if (!dados.tipo) {
      throw new Error('Tipo da folga é obrigatório')
    }

    // Validar que dataFim não é antes de dataInicio
    if (dados.dataFim && dados.dataFim < dados.dataInicio) {
      throw new Error('Data de fim não pode ser anterior à data de início')
    }

    return this.folgaRepo.create(dados)
  }

  async atualizar(id: string, dados: UpdateFolgaDTO): Promise<Folga> {
    const folga = await this.folgaRepo.findById(id)
    if (!folga) {
      throw new Error('Folga não encontrada')
    }

    return this.folgaRepo.update(id, dados)
  }

  async excluir(id: string): Promise<void> {
    const folga = await this.folgaRepo.findById(id)
    if (!folga) {
      throw new Error('Folga não encontrada')
    }

    await this.folgaRepo.delete(id)
  }

  // ============================================
  // CONSULTAS ESPECIAIS
  // ============================================

  async listarPorData(data: Date): Promise<FolgaCompleta[]> {
    return this.folgaRepo.findByData(data)
  }
}
