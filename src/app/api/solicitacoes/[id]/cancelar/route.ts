import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { motivoCancelamento } = body

    const solicitacaoService = container.getSolicitacaoFeriasService()
    
    const solicitacao = await solicitacaoService.cancelar(
      params.id, 
      motivoCancelamento
    )

    return NextResponse.json(solicitacao)
  } catch (error) {
    console.error('Erro ao cancelar solicitação:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao cancelar solicitação' },
      { status: 400 }
    )
  }
}
