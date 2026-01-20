// ============================================
// API ROUTE - SOLICITAÇÃO POR ID
// GET /api/solicitacoes/[id] - Buscar solicitação
// PUT /api/solicitacoes/[id] - Atualizar solicitação
// DELETE /api/solicitacoes/[id] - Cancelar solicitação
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const solicitacaoService = container.getSolicitacaoFeriasService()
    const solicitacao = await solicitacaoService.buscarPorId(params.id)

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(solicitacao)
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar solicitação' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const solicitacaoService = container.getSolicitacaoFeriasService()

    const solicitacao = await solicitacaoService.atualizar(params.id, body)

    return NextResponse.json(solicitacao)
  } catch (error: any) {
    console.error('Erro ao atualizar solicitação:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar solicitação' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const solicitacaoService = container.getSolicitacaoFeriasService()
    await solicitacaoService.cancelar(params.id)

    return NextResponse.json({ message: 'Solicitação cancelada com sucesso' })
  } catch (error: any) {
    console.error('Erro ao cancelar solicitação:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao cancelar solicitação' },
      { status: 400 }
    )
  }
}
