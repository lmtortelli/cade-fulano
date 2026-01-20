// ============================================
// IMPLEMENTAÇÃO PRISMA - DEPARTAMENTO REPOSITORY
// ============================================

import { PrismaClient } from '@prisma/client'
import { IDepartamentoRepository } from '@/core/repositories/departamento.repository'
import { 
  Departamento, 
  CreateDepartamentoDTO, 
  UpdateDepartamentoDTO,
  DepartamentoResumo 
} from '@/core/types'
import { startOfDay, endOfDay } from 'date-fns'

export class PrismaDepartamentoRepository implements IDepartamentoRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Departamento[]> {
    return this.prisma.departamento.findMany({
      orderBy: { nome: 'asc' }
    })
  }

  async findById(id: string): Promise<Departamento | null> {
    return this.prisma.departamento.findUnique({
      where: { id }
    })
  }

  async findByNome(nome: string): Promise<Departamento | null> {
    return this.prisma.departamento.findUnique({
      where: { nome }
    })
  }

  async create(data: CreateDepartamentoDTO): Promise<Departamento> {
    return this.prisma.departamento.create({
      data: {
        nome: data.nome,
        sigla: data.sigla,
        limiteAusencias: data.limiteAusencias ?? 2
      }
    })
  }

  async update(id: string, data: UpdateDepartamentoDTO): Promise<Departamento> {
    return this.prisma.departamento.update({
      where: { id },
      data
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.departamento.delete({
      where: { id }
    })
  }

  async findAtivos(): Promise<Departamento[]> {
    return this.prisma.departamento.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    })
  }

  async getResumoComEstatisticas(dataReferencia: Date): Promise<DepartamentoResumo[]> {
    const departamentos = await this.prisma.departamento.findMany({
      where: { ativo: true },
      include: {
        colaboradores: {
          where: { ativo: true },
          include: {
            periodosAquisitivos: {
              include: {
                solicitacoes: {
                  where: {
                    status: 'APROVADO',
                    dataInicioGozo: { lte: dataReferencia },
                    dataFimGozo: { gte: dataReferencia }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { nome: 'asc' }
    })

    return departamentos.map(dep => {
      const colaboradoresDeFeriasHoje = dep.colaboradores.filter(col =>
        col.periodosAquisitivos.some(per =>
          per.solicitacoes.length > 0
        )
      ).length

      return {
        id: dep.id,
        nome: dep.nome,
        totalColaboradores: dep.colaboradores.length,
        colaboradoresDeFeriasHoje,
        colaboradoresDeFeriasPeriodo: colaboradoresDeFeriasHoje
      }
    })
  }

  async contarColaboradoresDeFeriasPorDepartamento(
    departamentoId: string, 
    dataInicio: Date, 
    dataFim: Date
  ): Promise<number> {
    const result = await this.prisma.colaborador.count({
      where: {
        departamentoId,
        ativo: true,
        periodosAquisitivos: {
          some: {
            solicitacoes: {
              some: {
                status: 'APROVADO',
                dataInicioGozo: { lte: dataFim },
                dataFimGozo: { gte: dataInicio }
              }
            }
          }
        }
      }
    })

    return result
  }
}
