// ============================================
// CONTAINER DE INJEÇÃO DE DEPENDÊNCIAS
// Centraliza a criação de services e repositories
// Facilita a migração para backend separado
// ============================================

import { prisma } from './database/prisma'

// Repositories
import { 
  PrismaDepartamentoRepository,
  PrismaColaboradorRepository,
  PrismaPeriodoAquisitivoRepository,
  PrismaSolicitacaoFeriasRepository,
  PrismaFolgaRepository
} from './database/repositories'

// Services
import { 
  ColaboradorService,
  PeriodoAquisitivoService,
  SolicitacaoFeriasService,
  DashboardService,
  FolgaService
} from '@/core/services'

// ============================================
// SINGLETON CONTAINER
// ============================================

class Container {
  private static instance: Container

  // Repositories (instanciados uma vez)
  private _departamentoRepo: PrismaDepartamentoRepository | null = null
  private _colaboradorRepo: PrismaColaboradorRepository | null = null
  private _periodoRepo: PrismaPeriodoAquisitivoRepository | null = null
  private _solicitacaoRepo: PrismaSolicitacaoFeriasRepository | null = null
  private _folgaRepo: PrismaFolgaRepository | null = null

  // Services (instanciados uma vez)
  private _colaboradorService: ColaboradorService | null = null
  private _periodoService: PeriodoAquisitivoService | null = null
  private _solicitacaoService: SolicitacaoFeriasService | null = null
  private _dashboardService: DashboardService | null = null
  private _folgaService: FolgaService | null = null

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  // ============================================
  // REPOSITORIES
  // ============================================

  getDepartamentoRepository(): PrismaDepartamentoRepository {
    if (!this._departamentoRepo) {
      this._departamentoRepo = new PrismaDepartamentoRepository(prisma)
    }
    return this._departamentoRepo
  }

  getColaboradorRepository(): PrismaColaboradorRepository {
    if (!this._colaboradorRepo) {
      this._colaboradorRepo = new PrismaColaboradorRepository(prisma)
    }
    return this._colaboradorRepo
  }

  getPeriodoAquisitivoRepository(): PrismaPeriodoAquisitivoRepository {
    if (!this._periodoRepo) {
      this._periodoRepo = new PrismaPeriodoAquisitivoRepository(prisma)
    }
    return this._periodoRepo
  }

  getSolicitacaoFeriasRepository(): PrismaSolicitacaoFeriasRepository {
    if (!this._solicitacaoRepo) {
      this._solicitacaoRepo = new PrismaSolicitacaoFeriasRepository(prisma)
    }
    return this._solicitacaoRepo
  }

  getFolgaRepository(): PrismaFolgaRepository {
    if (!this._folgaRepo) {
      this._folgaRepo = new PrismaFolgaRepository(prisma)
    }
    return this._folgaRepo
  }

  // ============================================
  // SERVICES
  // ============================================

  getColaboradorService(): ColaboradorService {
    if (!this._colaboradorService) {
      this._colaboradorService = new ColaboradorService(
        this.getColaboradorRepository(),
        this.getPeriodoAquisitivoRepository()
      )
    }
    return this._colaboradorService
  }

  getPeriodoAquisitivoService(): PeriodoAquisitivoService {
    if (!this._periodoService) {
      this._periodoService = new PeriodoAquisitivoService(
        this.getPeriodoAquisitivoRepository(),
        this.getSolicitacaoFeriasRepository()
      )
    }
    return this._periodoService
  }

  getSolicitacaoFeriasService(): SolicitacaoFeriasService {
    if (!this._solicitacaoService) {
      this._solicitacaoService = new SolicitacaoFeriasService(
        this.getSolicitacaoFeriasRepository(),
        this.getPeriodoAquisitivoRepository(),
        this.getDepartamentoRepository()
      )
    }
    return this._solicitacaoService
  }

  getDashboardService(): DashboardService {
    if (!this._dashboardService) {
      this._dashboardService = new DashboardService(
        this.getColaboradorRepository(),
        this.getSolicitacaoFeriasRepository(),
        this.getPeriodoAquisitivoRepository(),
        this.getDepartamentoRepository()
      )
    }
    return this._dashboardService
  }

  getFolgaService(): FolgaService {
    if (!this._folgaService) {
      this._folgaService = new FolgaService(
        this.getFolgaRepository(),
        this.getColaboradorRepository()
      )
    }
    return this._folgaService
  }
}

// Exportar instância singleton
export const container = Container.getInstance()

// Atalhos para acesso direto (conveniência)
export const getColaboradorService = () => container.getColaboradorService()
export const getPeriodoAquisitivoService = () => container.getPeriodoAquisitivoService()
export const getSolicitacaoFeriasService = () => container.getSolicitacaoFeriasService()
export const getDashboardService = () => container.getDashboardService()
export const getFolgaService = () => container.getFolgaService()