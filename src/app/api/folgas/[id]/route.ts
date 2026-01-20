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

    // Adicionar horário ao meio-dia para evitar problemas de timezone
    let dataConvertida: Date | undefined = undefined
    if (body.data) {
      const dataStr = typeof body.data === 'string' && body.data.length === 10 
        ? body.data + 'T12:00:00' 
        : body.data
      dataConvertida = new Date(dataStr)
    }

    const folga = await folgaService.atualizar(params.id, {
      data: dataConvertida,
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
