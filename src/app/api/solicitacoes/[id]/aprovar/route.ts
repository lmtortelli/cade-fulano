// ============================================
// API ROUTE - APROVAR SOLICITAÇÃO
// POST /api/solicitacoes/[id]/aprovar
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

interface Params {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const { aprovadoPor } = body

    if (!aprovadoPor) {
      return NextResponse.json(
        { error: 'É necessário informar quem está aprovando' },
        { status: 400 }
      )
    }

    const solicitacaoService = container.getSolicitacaoFeriasService()
    const solicitacao = await solicitacaoService.aprovar(params.id, aprovadoPor)

    return NextResponse.json(solicitacao)
  } catch (error: any) {
    console.error('Erro ao aprovar solicitação:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao aprovar solicitação' },
      { status: 400 }
    )
  }
}
