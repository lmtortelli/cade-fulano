// ============================================
// API ROUTE - SOLICITAÇÕES DE FÉRIAS
// GET /api/solicitacoes - Listar solicitações
// POST /api/solicitacoes - Criar solicitação
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'
import { StatusSolicitacao } from '@/core/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as StatusSolicitacao | null
    const colaboradorId = searchParams.get('colaboradorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const solicitacaoService = container.getSolicitacaoFeriasService()

    const resultado = await solicitacaoService.listarComFiltros({
      status: status || undefined,
      colaboradorId: colaboradorId || undefined,
      page,
      limit
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Erro ao listar solicitações:', error)
    return NextResponse.json(
      { error: 'Erro ao listar solicitações' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { periodoAquisitivoId, dataInicioGozo, dataFimGozo, diasGozo, tipo, observacoes } = body

    // Validações básicas
    if (!periodoAquisitivoId || !dataInicioGozo || !dataFimGozo || !diasGozo) {
      return NextResponse.json(
        { error: 'Período, datas e quantidade de dias são obrigatórios' },
        { status: 400 }
      )
    }

    const solicitacaoService = container.getSolicitacaoFeriasService()

    const solicitacao = await solicitacaoService.criar({
      periodoAquisitivoId,
      dataInicioGozo: new Date(dataInicioGozo),
      dataFimGozo: new Date(dataFimGozo),
      diasGozo,
      tipo,
      observacoes
    })

    return NextResponse.json(solicitacao, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar solicitação:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar solicitação' },
      { status: 400 }
    )
  }
}
