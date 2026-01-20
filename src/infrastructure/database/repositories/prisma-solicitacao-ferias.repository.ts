// ============================================
// IMPLEMENTAÇÃO PRISMA - SOLICITAÇÃO FÉRIAS REPOSITORY
// ============================================

import { PrismaClient } from '@prisma/client'
import { ISolicitacaoFeriasRepository } from '@/core/repositories/solicitacao-ferias.repository'
import { 
  SolicitacaoFerias,
  SolicitacaoFeriasCompleta,
  CreateSolicitacaoDTO, 
  UpdateSolicitacaoDTO,
  StatusSolicitacao,
  SolicitacaoFiltros,
  PaginacaoResult,
  ProximaSaida
} from '@/core/types'

export class PrismaSolicitacaoFeriasRepository implements ISolicitacaoFeriasRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<SolicitacaoFerias | null> {
    const result = await this.prisma.solicitacaoFerias.findUnique({
      where: { id }
    })
    return result as SolicitacaoFerias | null
  }

  async findByIdCompleto(id: string): Promise<SolicitacaoFeriasCompleta | null> {
    return this.prisma.solicitacaoFerias.findUnique({
      where: { id },
      include: {
        periodoAquisitivo: {
          include: {
            colaborador: {
              include: { departamento: true }
            }
          }
        }
      }
    }) as Promise<SolicitacaoFeriasCompleta | null>
  }

  async create(data: CreateSolicitacaoDTO): Promise<SolicitacaoFerias> {
    const result = await this.prisma.solicitacaoFerias.create({
      data: {
        periodoAquisitivoId: data.periodoAquisitivoId,
        dataInicioGozo: data.dataInicioGozo,
        dataFimGozo: data.dataFimGozo,
        diasGozo: data.diasGozo,
        tipo: (data.tipo ?? 'GOZO') as any,
        observacoes: data.observacoes
      }
    })
    return result as SolicitacaoFerias
  }

  async update(id: string, data: UpdateSolicitacaoDTO): Promise<SolicitacaoFerias> {
    const result = await this.prisma.solicitacaoFerias.update({
      where: { id },
      data: data as any
    })
    return result as SolicitacaoFerias
  }

  async delete(id: string): Promise<void> {
    await this.prisma.solicitacaoFerias.delete({
      where: { id }
    })
  }

  async findByPeriodoId(periodoId: string): Promise<SolicitacaoFerias[]> {
    const result = await this.prisma.solicitacaoFerias.findMany({
      where: { periodoAquisitivoId: periodoId },
      orderBy: { createdAt: 'desc' }
    })
    return result as SolicitacaoFerias[]
  }

  async findByPeriodoIdEStatus(periodoId: string, status: StatusSolicitacao): Promise<SolicitacaoFerias[]> {
    const result = await this.prisma.solicitacaoFerias.findMany({
      where: { periodoAquisitivoId: periodoId, status: status as any },
      orderBy: { createdAt: 'desc' }
    })
    return result as SolicitacaoFerias[]
  }

  async findByStatus(status: StatusSolicitacao): Promise<SolicitacaoFeriasCompleta[]> {
    const result = await this.prisma.solicitacaoFerias.findMany({
      where: { status: status as any },
      include: {
        periodoAquisitivo: {
          include: {
            colaborador: {
              include: { departamento: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return result as SolicitacaoFeriasCompleta[]
  }

  async findPendentes(): Promise<SolicitacaoFeriasCompleta[]> {
    return this.findByStatus(StatusSolicitacao.PENDENTE)
  }

  async findAprovadas(): Promise<SolicitacaoFeriasCompleta[]> {
    return this.findByStatus(StatusSolicitacao.APROVADO)
  }

  async findComFiltros(filtros: SolicitacaoFiltros): Promise<PaginacaoResult<SolicitacaoFeriasCompleta>> {
    const page = filtros.page || 1
    const limit = filtros.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (filtros.colaboradorId) {
      where.periodoAquisitivo = {
        colaboradorId: filtros.colaboradorId
      }
    }

    if (filtros.periodoId) {
      where.periodoAquisitivoId = filtros.periodoId
    }

    if (filtros.status) {
      where.status = filtros.status
    }

    if (filtros.tipo) {
      where.tipo = filtros.tipo
    }

    if (filtros.dataInicio && filtros.dataFim) {
      where.dataInicioGozo = {
        gte: filtros.dataInicio,
        lte: filtros.dataFim
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.solicitacaoFerias.findMany({
        where,
        include: {
          periodoAquisitivo: {
            include: {
              colaborador: {
                include: { departamento: true }
              }
            }
          }
        },
        orderBy: { dataInicioGozo: 'asc' },
        skip,
        take: limit
      }),
      this.prisma.solicitacaoFerias.count({ where })
    ])

    return {
      data: data as SolicitacaoFeriasCompleta[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async aprovar(id: string, aprovadoPor: string): Promise<SolicitacaoFerias> {
    const result = await this.prisma.solicitacaoFerias.update({
      where: { id },
      data: {
        status: 'APROVADO',
        aprovadoPor,
        aprovadoEm: new Date()
      }
    })
    return result as SolicitacaoFerias
  }

  async rejeitar(id: string, motivoRejeicao: string): Promise<SolicitacaoFerias> {
    const result = await this.prisma.solicitacaoFerias.update({
      where: { id },
      data: {
        status: 'REJEITADO',
        motivoRejeicao
      }
    })
    return result as SolicitacaoFerias
  }

  async cancelar(id: string, motivoCancelamento: string): Promise<SolicitacaoFerias> {
    const result = await this.prisma.solicitacaoFerias.update({
      where: { id },
      data: {
        status: 'CANCELADO',
        motivoCancelamento,
        canceladoEm: new Date()
      }
    })
    return result as SolicitacaoFerias
  }

  async findPorPeriodoData(dataInicio: Date, dataFim: Date): Promise<SolicitacaoFeriasCompleta[]> {
    return this.prisma.solicitacaoFerias.findMany({
      where: {
        dataInicioGozo: { lte: dataFim },
        dataFimGozo: { gte: dataInicio }
      },
      include: {
        periodoAquisitivo: {
          include: {
            colaborador: {
              include: { departamento: true }
            }
          }
        }
      },
      orderBy: { dataInicioGozo: 'asc' }
    }) as Promise<SolicitacaoFeriasCompleta[]>
  }

  async findAprovadasNoPeriodo(dataInicio: Date, dataFim: Date): Promise<SolicitacaoFeriasCompleta[]> {
    const result = await this.prisma.solicitacaoFerias.findMany({
      where: {
        status: 'APROVADO',
        dataInicioGozo: { lte: dataFim },
        dataFimGozo: { gte: dataInicio }
      },
      include: {
        periodoAquisitivo: {
          include: {
            colaborador: {
              include: { departamento: true }
            }
          }
        }
      },
      orderBy: { dataInicioGozo: 'asc' }
    })
    return result as SolicitacaoFeriasCompleta[]
  }

  async findProximasSaidas(limite: number): Promise<ProximaSaida[]> {
    const hoje = new Date()

    const solicitacoes = await this.prisma.solicitacaoFerias.findMany({
      where: {
        status: {
          in: ['APROVADO', 'PENDENTE']
        },
        dataInicioGozo: { gte: hoje }
      },
      include: {
        periodoAquisitivo: {
          include: {
            colaborador: {
              include: { departamento: true }
            }
          }
        }
      },
      orderBy: { dataInicioGozo: 'asc' },
      take: limite
    })

    return solicitacoes.map(s => ({
      colaboradorId: s.periodoAquisitivo.colaborador.id,
      colaboradorNome: s.periodoAquisitivo.colaborador.nome,
      colaboradorAvatar: s.periodoAquisitivo.colaborador.avatarUrl,
      departamentoNome: s.periodoAquisitivo.colaborador.departamento.nome,
      dataInicio: s.dataInicioGozo,
      dataFim: s.dataFimGozo,
      diasGozo: s.diasGozo,
      status: s.status as StatusSolicitacao,
      solicitacaoId: s.id
    }))
  }

  async countByStatus(status: StatusSolicitacao): Promise<number> {
    return this.prisma.solicitacaoFerias.count({
      where: { status: status as any }
    })
  }

  async countPendentes(): Promise<number> {
    return this.prisma.solicitacaoFerias.count({
      where: { status: 'PENDENTE' }
    })
  }

  async somarDiasGozadosPorPeriodo(periodoId: string): Promise<number> {
    const result = await this.prisma.solicitacaoFerias.aggregate({
      where: {
        periodoAquisitivoId: periodoId,
        status: 'APROVADO',
        tipo: 'GOZO'
      },
      _sum: { diasGozo: true }
    })
    return result._sum.diasGozo || 0
  }

  async somarDiasAprovadosPorPeriodo(periodoId: string): Promise<number> {
    const result = await this.prisma.solicitacaoFerias.aggregate({
      where: {
        periodoAquisitivoId: periodoId,
        status: 'APROVADO'
      },
      _sum: { diasGozo: true }
    })
    return result._sum.diasGozo || 0
  }

  async somarDiasPendentesPorPeriodo(periodoId: string): Promise<number> {
    const result = await this.prisma.solicitacaoFerias.aggregate({
      where: {
        periodoAquisitivoId: periodoId,
        status: 'PENDENTE'
      },
      _sum: { diasGozo: true }
    })
    return result._sum.diasGozo || 0
  }

  async findConflitosNoPeriodo(
    departamentoId: string, 
    dataInicio: Date, 
    dataFim: Date, 
    excluirSolicitacaoId?: string
  ): Promise<SolicitacaoFeriasCompleta[]> {
    const where: any = {
      status: 'APROVADO',
      dataInicioGozo: { lte: dataFim },
      dataFimGozo: { gte: dataInicio },
      periodoAquisitivo: {
        colaborador: {
          departamentoId,
          ativo: true
        }
      }
    }

    if (excluirSolicitacaoId) {
      where.id = { not: excluirSolicitacaoId }
    }

    const result = await this.prisma.solicitacaoFerias.findMany({
      where,
      include: {
        periodoAquisitivo: {
          include: {
            colaborador: {
              include: { departamento: true }
            }
          }
        }
      }
    })
    return result as SolicitacaoFeriasCompleta[]
  }
}
