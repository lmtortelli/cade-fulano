import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

// GET /api/folgas/[id] - Obter folga por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const folgaService = container.getFolgaService()
    const folga = await folgaService.obterPorId(params.id)

    if (!folga) {
      return NextResponse.json(
        { error: 'Folga não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(folga)
  } catch (error) {
    console.error('Erro ao obter folga:', error)
    return NextResponse.json(
      { error: 'Erro ao obter folga' },
      { status: 500 }
    )
  }
}

// PUT /api/folgas/[id] - Atualizar folga
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const folgaService = container.getFolgaService()
    const body = await request.json()

    // Função helper para converter data com horário ao meio-dia
    const parseDate = (dateStr: string | undefined): Date | undefined => {
      if (!dateStr) return undefined
      const str = typeof dateStr === 'string' && dateStr.length === 10 
        ? dateStr + 'T12:00:00' 
        : dateStr
      return new Date(str)
    }

    // Suporte a data única (retrocompatibilidade) ou intervalo
    const dataInicio = parseDate(body.dataInicio || body.data)
    const dataFim = body.dataFim !== undefined 
      ? (body.dataFim ? parseDate(body.dataFim) : null)
      : undefined

    const folga = await folgaService.atualizar(params.id, {
      dataInicio,
      dataFim,
      tipo: body.tipo,
      descricao: body.descricao
    })

    return NextResponse.json(folga)
  } catch (error) {
    console.error('Erro ao atualizar folga:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar folga' },
      { status: 400 }
    )
  }
}

// DELETE /api/folgas/[id] - Excluir folga
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const folgaService = container.getFolgaService()
    await folgaService.excluir(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir folga:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao excluir folga' },
      { status: 400 }
    )
  }
}
