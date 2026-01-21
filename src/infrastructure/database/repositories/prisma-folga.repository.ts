// ============================================
// IMPLEMENTAÇÃO PRISMA DO REPOSITÓRIO DE FOLGA
// ============================================

import { PrismaClient } from '@prisma/client'
import { IFolgaRepository } from '@/core/repositories/folga.repository'
import { 
  Folga,
  FolgaCompleta,
  CreateFolgaDTO, 
  UpdateFolgaDTO,
  FolgaFiltros
} from '@/core/types'

export class PrismaFolgaRepository implements IFolgaRepository {
  constructor(private prisma: PrismaClient) {}

  private includeCompleto = {
    colaborador: {
      include: {
        departamento: true
      }
    }
  }

  async findById(id: string): Promise<Folga | null> {
    return this.prisma.folga.findUnique({
      where: { id }
    }) as Promise<Folga | null>
  }

  async findByIdCompleto(id: string): Promise<FolgaCompleta | null> {
    return this.prisma.folga.findUnique({
      where: { id },
      include: this.includeCompleto
    }) as Promise<FolgaCompleta | null>
  }

  async create(data: CreateFolgaDTO): Promise<Folga> {
    return this.prisma.folga.create({
      data: {
        colaboradorId: data.colaboradorId,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim || null,
        tipo: data.tipo as any,
        descricao: data.descricao,
        status: (data.status as any) || 'APROVADO'
      }
    }) as Promise<Folga>
  }

  async update(id: string, data: UpdateFolgaDTO): Promise<Folga> {
    const updateData: any = {}
    
    if (data.dataInicio !== undefined) updateData.dataInicio = data.dataInicio
    if (data.dataFim !== undefined) updateData.dataFim = data.dataFim
    if (data.tipo !== undefined) updateData.tipo = data.tipo
    if (data.descricao !== undefined) updateData.descricao = data.descricao

    return this.prisma.folga.update({
      where: { id },
      data: updateData
    }) as Promise<Folga>
  }

  async delete(id: string): Promise<void> {
    await this.prisma.folga.delete({
      where: { id }
    })
  }

  async findByColaboradorId(colaboradorId: string): Promise<Folga[]> {
    return this.prisma.folga.findMany({
      where: { colaboradorId },
      orderBy: { dataInicio: 'desc' }
    }) as Promise<Folga[]>
  }

  async findByData(data: Date): Promise<FolgaCompleta[]> {
    const startOfDay = new Date(data)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(data)
    endOfDay.setHours(23, 59, 59, 999)

    // Buscar folgas que incluem esta data (dataInicio <= data <= dataFim ou dataInicio = data se dataFim é null)
    return this.prisma.folga.findMany({
      where: {
        OR: [
          // Folga de um dia (dataFim é null) e dataInicio é o dia
          {
            dataInicio: { gte: startOfDay, lte: endOfDay },
            dataFim: null
          },
          // Folga de intervalo onde a data está dentro
          {
            dataInicio: { lte: endOfDay },
            dataFim: { gte: startOfDay }
          }
        ]
      },
      include: this.includeCompleto,
      orderBy: { dataInicio: 'asc' }
    }) as Promise<FolgaCompleta[]>
  }

  async findByPeriodo(dataInicio: Date, dataFim: Date): Promise<FolgaCompleta[]> {
    // Buscar folgas que intersectam o período
    return this.prisma.folga.findMany({
      where: {
        OR: [
          // Folga de um dia dentro do período
          {
            dataInicio: { gte: dataInicio, lte: dataFim },
            dataFim: null
          },
          // Folga de intervalo que intersecta o período
          {
            dataInicio: { lte: dataFim },
            OR: [
              { dataFim: { gte: dataInicio } },
              { dataFim: null }
            ]
          }
        ]
      },
      include: this.includeCompleto,
      orderBy: { dataInicio: 'asc' }
    }) as Promise<FolgaCompleta[]>
  }

  async findComFiltros(filtros: FolgaFiltros): Promise<FolgaCompleta[]> {
    const where: any = {}

    if (filtros.colaboradorId) {
      where.colaboradorId = filtros.colaboradorId
    }

    if (filtros.departamentoId) {
      where.colaborador = {
        departamentoId: filtros.departamentoId
      }
    }

    if (filtros.tipo) {
      where.tipo = filtros.tipo
    }

    if (filtros.status) {
      where.status = filtros.status
    }

    // Filtro por período (busca folgas que intersectam o intervalo)
    if (filtros.dataInicio || filtros.dataFim) {
      if (filtros.dataInicio && filtros.dataFim) {
        where.OR = [
          {
            dataInicio: { gte: filtros.dataInicio, lte: filtros.dataFim },
            dataFim: null
          },
          {
            dataInicio: { lte: filtros.dataFim },
            dataFim: { gte: filtros.dataInicio }
          }
        ]
      } else if (filtros.dataInicio) {
        where.OR = [
          { dataInicio: { gte: filtros.dataInicio } },
          { dataFim: { gte: filtros.dataInicio } }
        ]
      } else if (filtros.dataFim) {
        where.dataInicio = { lte: filtros.dataFim }
      }
    }

    return this.prisma.folga.findMany({
      where,
      include: this.includeCompleto,
      orderBy: { dataInicio: 'desc' }
    }) as Promise<FolgaCompleta[]>
  }

  async findAll(): Promise<FolgaCompleta[]> {
    return this.prisma.folga.findMany({
      include: this.includeCompleto,
      orderBy: { dataInicio: 'desc' }
    }) as Promise<FolgaCompleta[]>
  }
}
