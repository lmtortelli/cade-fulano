// ============================================
// API ROUTE - SALDO DO COLABORADOR
// GET /api/colaboradores/[id]/saldo - Obter saldo de férias
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const colaboradorService = container.getColaboradorService()
    const colaboradorComSaldo = await colaboradorService.obterColaboradorComSaldo(params.id)

    if (!colaboradorComSaldo) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(colaboradorComSaldo)
  } catch (error) {
    console.error('Erro ao buscar saldo do colaborador:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar saldo do colaborador' },
      { status: 500 }
    )
  }
}
