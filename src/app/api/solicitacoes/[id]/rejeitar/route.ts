// ============================================
// API ROUTE - REJEITAR SOLICITAÇÃO
// POST /api/solicitacoes/[id]/rejeitar
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

interface Params {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const { motivoRejeicao } = body

    if (!motivoRejeicao) {
      return NextResponse.json(
        { error: 'É necessário informar o motivo da rejeição' },
        { status: 400 }
      )
    }

    const solicitacaoService = container.getSolicitacaoFeriasService()
    const solicitacao = await solicitacaoService.rejeitar(params.id, motivoRejeicao)

    return NextResponse.json(solicitacao)
  } catch (error: any) {
    console.error('Erro ao rejeitar solicitação:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao rejeitar solicitação' },
      { status: 400 }
    )
  }
}
