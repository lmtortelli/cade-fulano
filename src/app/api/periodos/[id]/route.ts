// ============================================
// API ROUTE - PERÍODO AQUISITIVO POR ID
// GET /api/periodos/[id] - Buscar período
// PUT /api/periodos/[id] - Atualizar período
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const periodoService = container.getPeriodoAquisitivoService()
    const periodo = await periodoService.buscarPorId(params.id)

    if (!periodo) {
      return NextResponse.json(
        { error: 'Período não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(periodo)
  } catch (error) {
    console.error('Erro ao buscar período:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar período' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const periodoRepo = container.getPeriodoAquisitivoRepository()

    // Verificar se período existe
    const periodo = await periodoRepo.findById(params.id)
    if (!periodo) {
      return NextResponse.json(
        { error: 'Período não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar observações
    const periodoAtualizado = await periodoRepo.update(params.id, {
      observacoes: body.observacoes
    })

    return NextResponse.json(periodoAtualizado)
  } catch (error: any) {
    console.error('Erro ao atualizar período:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar período' },
      { status: 400 }
    )
  }
}
