// ============================================
// API ROUTE - ESTATÍSTICAS GERAIS
// GET /api/stats - Estatísticas para sidebar
// ============================================

import { NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'
import prisma from '@/infrastructure/database/prisma'

export async function GET() {
  try {
    const colaboradorService = container.getColaboradorService()

    const [totalColaboradores, solicitacoesPendentes] = await Promise.all([
      colaboradorService.contarAtivos(),
      prisma.solicitacaoFerias.count({
        where: { status: 'PENDENTE' }
      })
    ])

    return NextResponse.json({
      totalColaboradores,
      maxColaboradores: 50, // Limite do plano
      solicitacoesPendentes,
    })
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error)
    return NextResponse.json(
      { totalColaboradores: 0, maxColaboradores: 50, solicitacoesPendentes: 0 },
      { status: 200 }
    )
  }
}
