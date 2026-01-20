// ============================================
// API ROUTE - SOLICITAÇÕES PENDENTES
// GET /api/solicitacoes/pendentes
// ============================================

import { NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

export async function GET() {
  try {
    const solicitacaoService = container.getSolicitacaoFeriasService()
    const pendentes = await solicitacaoService.listarPendentes()

    return NextResponse.json(pendentes)
  } catch (error) {
    console.error('Erro ao listar solicitações pendentes:', error)
    return NextResponse.json(
      { error: 'Erro ao listar solicitações pendentes' },
      { status: 500 }
    )
  }
}
