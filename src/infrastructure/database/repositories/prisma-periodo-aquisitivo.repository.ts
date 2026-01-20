// ============================================
// IMPLEMENTAÇÃO PRISMA - PERÍODO AQUISITIVO REPOSITORY
// ============================================

import { PrismaClient } from '@prisma/client'
import { IPeriodoAquisitivoRepository } from '@/core/repositories/periodo-aquisitivo.repository'
import { 
  PeriodoAquisitivo,
  PeriodoAquisitivoComSolicitacoes,
  PeriodoAquisitivoCompleto,
  CreatePeriodoDTO, 
  UpdatePeriodoDTO,
  StatusPeriodo
} from '@/core/types'
import { addDays } from 'date-fns'

export class PrismaPeriodoAquisitivoRepository implements IPeriodoAquisitivoRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<PeriodoAquisitivo | null> {
    const result = await this.prisma.periodoAquisitivo.findUnique({
      where: { id }
    })
    return result as PeriodoAquisitivo | null
  }

  async findByIdComSolicitacoes(id: string): Promise<PeriodoAquisitivoComSolicitacoes | null> {
    const result = await this.prisma.periodoAquisitivo.findUnique({
      where: { id },
      include: { solicitacoes: true }
    })
    return result as PeriodoAquisitivoComSolicitacoes | null
  }

  async findByIdCompleto(id: string): Promise<PeriodoAquisitivoCompleto | null> {
    return this.prisma.periodoAquisitivo.findUnique({
      where: { id },
      include: {
        solicitacoes: true,
        colaborador: {
          include: { departamento: true }
        }
      }
    }) as Promise<PeriodoAquisitivoCompleto | null>
  }

  async create(data: CreatePeriodoDTO): Promise<PeriodoAquisitivo> {
    const result = await this.prisma.periodoAquisitivo.create({
      data: {
        colaboradorId: data.colaboradorId,
        numeroPeriodo: data.numeroPeriodo,
        dataInicioAquisitivo: data.dataInicioAquisitivo,
        dataFimAquisitivo: data.dataFimAquisitivo,
        dataLimiteGozo: data.dataLimiteGozo,
        diasDireito: data.diasDireito ?? 30
      }
    })
    return result as PeriodoAquisitivo
  }

  async update(id: string, data: UpdatePeriodoDTO): Promise<PeriodoAquisitivo> {
    const result = await this.prisma.periodoAquisitivo.update({
      where: { id },
      data: data as any
    })
    return result as PeriodoAquisitivo
  }

  async delete(id: string): Promise<void> {
    await this.prisma.periodoAquisitivo.delete({
      where: { id }
    })
  }

  async findByColaboradorId(colaboradorId: string): Promise<PeriodoAquisitivoComSolicitacoes[]> {
    const result = await this.prisma.periodoAquisitivo.findMany({
      where: { colaboradorId },
      include: { solicitacoes: true },
      orderBy: { numeroPeriodo: 'asc' }
    })
    return result as PeriodoAquisitivoComSolicitacoes[]
  }

  async findUltimoPeriodoByColaboradorId(colaboradorId: string): Promise<PeriodoAquisitivo | null> {
    const result = await this.prisma.periodoAquisitivo.findFirst({
      where: { colaboradorId },
      orderBy: { numeroPeriodo: 'desc' }
    })
    return result as PeriodoAquisitivo | null
  }

  async findByStatus(status: StatusPeriodo): Promise<PeriodoAquisitivoCompleto[]> {
    return this.prisma.periodoAquisitivo.findMany({
      where: { status },
      include: {
        solicitacoes: true,
        colaborador: {
          include: { departamento: true }
        }
      },
      orderBy: { dataLimiteGozo: 'asc' }
    }) as Promise<PeriodoAquisitivoCompleto[]>
  }

  async findAtivos(): Promise<PeriodoAquisitivoCompleto[]> {
    return this.findByStatus(StatusPeriodo.ATIVO)
  }

  async findVencendoEm(dias: number): Promise<PeriodoAquisitivoCompleto[]> {
    const hoje = new Date()
    const dataLimite = addDays(hoje, dias)

    return this.prisma.periodoAquisitivo.findMany({
      where: {
        status: StatusPeriodo.ATIVO,
        dataLimiteGozo: {
          gte: hoje,
          lte: dataLimite
        }
      },
      include: {
        solicitacoes: true,
        colaborador: {
          include: { departamento: true }
        }
      },
      orderBy: { dataLimiteGozo: 'asc' }
    }) as Promise<PeriodoAquisitivoCompleto[]>
  }

  async findVencidos(): Promise<PeriodoAquisitivoCompleto[]> {
    const hoje = new Date()

    return this.prisma.periodoAquisitivo.findMany({
      where: {
        status: StatusPeriodo.ATIVO,
        dataLimiteGozo: { lt: hoje }
      },
      include: {
        solicitacoes: true,
        colaborador: {
          include: { departamento: true }
        }
      },
      orderBy: { dataLimiteGozo: 'asc' }
    }) as Promise<PeriodoAquisitivoCompleto[]>
  }

  async atualizarStatus(id: string, status: StatusPeriodo): Promise<PeriodoAquisitivo> {
    const result = await this.prisma.periodoAquisitivo.update({
      where: { id },
      data: { status: status as any }
    })
    return result as PeriodoAquisitivo
  }

  async registrarVenda(id: string, diasVendidos: number): Promise<PeriodoAquisitivo> {
    const result = await this.prisma.periodoAquisitivo.update({
      where: { id },
      data: { diasVendidos }
    })
    return result as PeriodoAquisitivo
  }

  async existePeriodo(colaboradorId: string, numeroPeriodo: number): Promise<boolean> {
    const count = await this.prisma.periodoAquisitivo.count({
      where: { colaboradorId, numeroPeriodo }
    })
    return count > 0
  }
}
