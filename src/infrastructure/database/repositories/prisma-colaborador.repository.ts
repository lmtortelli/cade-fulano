// ============================================
// IMPLEMENTAÇÃO PRISMA - COLABORADOR REPOSITORY
// ============================================

import { PrismaClient } from '@prisma/client'
import { IColaboradorRepository } from '@/core/repositories/colaborador.repository'
import { 
  Colaborador,
  ColaboradorComDepartamento,
  ColaboradorCompleto,
  CreateColaboradorDTO, 
  UpdateColaboradorDTO,
  ColaboradorFiltros,
  PaginacaoResult
} from '@/core/types'

export class PrismaColaboradorRepository implements IColaboradorRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<ColaboradorComDepartamento[]> {
    return this.prisma.colaborador.findMany({
      include: { departamento: true },
      orderBy: { nome: 'asc' }
    })
  }

  async findById(id: string): Promise<ColaboradorComDepartamento | null> {
    return this.prisma.colaborador.findUnique({
      where: { id },
      include: { departamento: true }
    })
  }

  async findByIdCompleto(id: string): Promise<ColaboradorCompleto | null> {
    const result = await this.prisma.colaborador.findUnique({
      where: { id },
      include: {
        departamento: true,
        periodosAquisitivos: {
          include: { solicitacoes: true },
          orderBy: { numeroPeriodo: 'asc' }
        }
      }
    })
    return result as ColaboradorCompleto | null
  }

  async findByEmail(email: string): Promise<Colaborador | null> {
    return this.prisma.colaborador.findUnique({
      where: { email }
    })
  }

  async findByMatricula(matricula: string): Promise<Colaborador | null> {
    return this.prisma.colaborador.findUnique({
      where: { matricula }
    })
  }

  async create(data: CreateColaboradorDTO): Promise<ColaboradorComDepartamento> {
    return this.prisma.colaborador.create({
      data: {
        nome: data.nome,
        email: data.email,
        matricula: data.matricula,
        cargo: data.cargo,
        dataAdmissao: data.dataAdmissao,
        departamentoId: data.departamentoId,
        avatarUrl: data.avatarUrl
      },
      include: { departamento: true }
    })
  }

  async update(id: string, data: UpdateColaboradorDTO): Promise<ColaboradorComDepartamento> {
    return this.prisma.colaborador.update({
      where: { id },
      data,
      include: { departamento: true }
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.colaborador.delete({
      where: { id }
    })
  }

  async findComFiltros(filtros: ColaboradorFiltros): Promise<PaginacaoResult<ColaboradorComDepartamento>> {
    const page = filtros.page || 1
    const limit = filtros.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (filtros.departamentoId) {
      where.departamentoId = filtros.departamentoId
    }

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo
    }

    if (filtros.busca) {
      where.OR = [
        { nome: { contains: filtros.busca, mode: 'insensitive' } },
        { email: { contains: filtros.busca, mode: 'insensitive' } },
        { matricula: { contains: filtros.busca, mode: 'insensitive' } }
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.colaborador.findMany({
        where,
        include: { departamento: true },
        orderBy: { nome: 'asc' },
        skip,
        take: limit
      }),
      this.prisma.colaborador.count({ where })
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async findAtivos(): Promise<ColaboradorComDepartamento[]> {
    return this.prisma.colaborador.findMany({
      where: { ativo: true },
      include: { departamento: true },
      orderBy: { nome: 'asc' }
    })
  }

  async findByDepartamento(departamentoId: string): Promise<ColaboradorComDepartamento[]> {
    return this.prisma.colaborador.findMany({
      where: { departamentoId, ativo: true },
      include: { departamento: true },
      orderBy: { nome: 'asc' }
    })
  }

  async buscar(termo: string): Promise<ColaboradorComDepartamento[]> {
    return this.prisma.colaborador.findMany({
      where: {
        OR: [
          { nome: { contains: termo, mode: 'insensitive' } },
          { email: { contains: termo, mode: 'insensitive' } },
          { matricula: { contains: termo, mode: 'insensitive' } },
          { cargo: { contains: termo, mode: 'insensitive' } }
        ]
      },
      include: { departamento: true },
      orderBy: { nome: 'asc' },
      take: 20
    })
  }

  async count(): Promise<number> {
    return this.prisma.colaborador.count()
  }

  async countAtivos(): Promise<number> {
    return this.prisma.colaborador.count({
      where: { ativo: true }
    })
  }

  async countByDepartamento(departamentoId: string): Promise<number> {
    return this.prisma.colaborador.count({
      where: { departamentoId, ativo: true }
    })
  }

  async findDeFeriasNaData(data: Date): Promise<ColaboradorComDepartamento[]> {
    return this.prisma.colaborador.findMany({
      where: {
        ativo: true,
        periodosAquisitivos: {
          some: {
            solicitacoes: {
              some: {
                status: 'APROVADO',
                tipo: 'GOZO',
                dataInicioGozo: { lte: data },
                dataFimGozo: { gte: data }
              }
            }
          }
        }
      },
      include: { departamento: true },
      orderBy: { nome: 'asc' }
    })
  }

  async findDeFeriasNoPeriodo(dataInicio: Date, dataFim: Date): Promise<ColaboradorComDepartamento[]> {
    return this.prisma.colaborador.findMany({
      where: {
        ativo: true,
        periodosAquisitivos: {
          some: {
            solicitacoes: {
              some: {
                status: 'APROVADO',
                tipo: 'GOZO',
                dataInicioGozo: { lte: dataFim },
                dataFimGozo: { gte: dataInicio }
              }
            }
          }
        }
      },
      include: { departamento: true },
      orderBy: { nome: 'asc' }
    })
  }
}
