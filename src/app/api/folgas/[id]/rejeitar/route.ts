import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/database/prisma'

// POST /api/folgas/[id]/rejeitar - Rejeitar uma folga
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.motivo || body.motivo.trim() === '') {
      return NextResponse.json(
        { error: 'Motivo da rejeição é obrigatório' },
        { status: 400 }
      )
    }

    const folga = await prisma.folga.findUnique({
      where: { id }
    })

    if (!folga) {
      return NextResponse.json(
        { error: 'Folga não encontrada' },
        { status: 404 }
      )
    }

    if (folga.status !== 'PENDENTE') {
      return NextResponse.json(
        { error: 'Apenas folgas pendentes podem ser rejeitadas' },
        { status: 400 }
      )
    }

    const folgaAtualizada = await prisma.folga.update({
      where: { id },
      data: { 
        status: 'REJEITADO',
        motivoRejeicao: body.motivo.trim()
      },
      include: {
        colaborador: {
          include: {
            departamento: true
          }
        }
      }
    })

    return NextResponse.json(folgaAtualizada)
  } catch (error) {
    console.error('Erro ao rejeitar folga:', error)
    return NextResponse.json(
      { error: 'Erro ao rejeitar folga' },
      { status: 500 }
    )
  }
}
