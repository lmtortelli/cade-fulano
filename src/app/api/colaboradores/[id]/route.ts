// ============================================
// API ROUTE - COLABORADOR POR ID
// GET /api/colaboradores/[id] - Buscar colaborador
// PUT /api/colaboradores/[id] - Atualizar colaborador
// DELETE /api/colaboradores/[id] - Inativar colaborador
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const colaboradorService = container.getColaboradorService()
    const colaborador = await colaboradorService.buscarPorId(params.id)

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(colaborador)
  } catch (error) {
    console.error('Erro ao buscar colaborador:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar colaborador' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const colaboradorService = container.getColaboradorService()

    const colaborador = await colaboradorService.atualizar(params.id, body)

    return NextResponse.json(colaborador)
  } catch (error: any) {
    console.error('Erro ao atualizar colaborador:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar colaborador' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'
    
    const colaboradorRepo = container.getColaboradorRepository()
    
    if (hardDelete) {
      // Hard delete - remove do banco completamente
      await colaboradorRepo.delete(params.id)
      return NextResponse.json({ message: 'Colaborador excluído com sucesso' })
    } else {
      // Soft delete - apenas inativa
      const colaboradorService = container.getColaboradorService()
      await colaboradorService.inativar(params.id)
      return NextResponse.json({ message: 'Colaborador inativado com sucesso' })
    }
  } catch (error: any) {
    console.error('Erro ao excluir colaborador:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao excluir colaborador' },
      { status: 400 }
    )
  }
}
