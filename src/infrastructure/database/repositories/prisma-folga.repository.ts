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
        data: data.data,
        tipo: data.tipo as any,
        descricao: data.descricao,
        status: (data.status as any) || 'APROVADO'
      }
    }) as Promise<Folga>
  }

  async update(id: string, data: UpdateFolgaDTO): Promise<Folga> {
    return this.prisma.folga.update({
      where: { id },
      data: {
        data: data.data,
        tipo: data.tipo as any,
        descricao: data.descricao
      }
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
      orderBy: { data: 'desc' }
    }) as Promise<Folga[]>
  }

  async findByData(data: Date): Promise<FolgaCompleta[]> {
    const startOfDay = new Date(data)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(data)
    endOfDay.setHours(23, 59, 59, 999)

    return this.prisma.folga.findMany({
      where: {
        data: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: this.includeCompleto,
      orderBy: { data: 'asc' }
    }) as Promise<FolgaCompleta[]>
  }

  async findByPeriodo(dataInicio: Date, dataFim: Date): Promise<FolgaCompleta[]> {
    return this.prisma.folga.findMany({
      where: {
        data: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      include: this.includeCompleto,
      orderBy: { data: 'asc' }
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

    if (filtros.dataInicio || filtros.dataFim) {
      where.data = {}
      if (filtros.dataInicio) {
        where.data.gte = filtros.dataInicio
      }
      if (filtros.dataFim) {
        where.data.lte = filtros.dataFim
      }
    }

    return this.prisma.folga.findMany({
      where,
      include: this.includeCompleto,
      orderBy: { data: 'desc' }
    }) as Promise<FolgaCompleta[]>
  }

  async findAll(): Promise<FolgaCompleta[]> {
    return this.prisma.folga.findMany({
      include: this.includeCompleto,
      orderBy: { data: 'desc' }
    }) as Promise<FolgaCompleta[]>
  }
}
