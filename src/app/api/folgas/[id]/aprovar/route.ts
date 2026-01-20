import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/database/prisma'

// POST /api/folgas/[id]/aprovar - Aprovar uma folga
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
        { error: 'Apenas folgas pendentes podem ser aprovadas' },
        { status: 400 }
      )
    }

    const folgaAtualizada = await prisma.folga.update({
      where: { id },
      data: { 
        status: 'APROVADO',
        motivoRejeicao: null
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
    console.error('Erro ao aprovar folga:', error)
    return NextResponse.json(
      { error: 'Erro ao aprovar folga' },
      { status: 500 }
    )
  }
}
