// ============================================
// API ROUTE - VENDA DE FÉRIAS (ABONO PECUNIÁRIO)
// POST /api/periodos/[id]/venda - Registrar venda
// DELETE /api/periodos/[id]/venda - Cancelar venda
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

interface Params {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const { diasParaVender } = body

    if (diasParaVender === undefined || diasParaVender === null) {
      return NextResponse.json(
        { error: 'Quantidade de dias é obrigatória' },
        { status: 400 }
      )
    }

    const periodoService = container.getPeriodoAquisitivoService()
    const periodo = await periodoService.registrarVenda(params.id, diasParaVender)

    return NextResponse.json(periodo)
  } catch (error: any) {
    console.error('Erro ao registrar venda de férias:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao registrar venda de férias' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const periodoService = container.getPeriodoAquisitivoService()
    const periodo = await periodoService.cancelarVenda(params.id)

    return NextResponse.json(periodo)
  } catch (error: any) {
    console.error('Erro ao cancelar venda de férias:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao cancelar venda de férias' },
      { status: 400 }
    )
  }
}
