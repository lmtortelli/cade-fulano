// ============================================
// API ROUTE - DASHBOARD
// GET /api/dashboard - Métricas do dashboard
// ============================================

import { NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

export async function GET() {
  try {
    const dashboardService = container.getDashboardService()

    const [metricas, proximasSaidas, resumoDepartamentos] = await Promise.all([
      dashboardService.obterMetricas(),
      dashboardService.obterProximasSaidas(10),
      dashboardService.obterResumoPorDepartamento()
    ])

    return NextResponse.json({
      metricas,
      proximasSaidas,
      resumoDepartamentos
    })
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    )
  }
}
