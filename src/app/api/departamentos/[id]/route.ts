// ============================================
// API ROUTE - DEPARTAMENTO POR ID
// GET /api/departamentos/[id] - Buscar departamento
// PUT /api/departamentos/[id] - Atualizar departamento
// DELETE /api/departamentos/[id] - Excluir departamento
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const departamentoRepo = container.getDepartamentoRepository()
    const departamento = await departamentoRepo.findById(params.id)

    if (!departamento) {
      return NextResponse.json(
        { error: 'Departamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(departamento)
  } catch (error) {
    console.error('Erro ao buscar departamento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar departamento' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const departamentoRepo = container.getDepartamentoRepository()

    const departamento = await departamentoRepo.update(params.id, body)

    return NextResponse.json(departamento)
  } catch (error: any) {
    console.error('Erro ao atualizar departamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar departamento' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const departamentoRepo = container.getDepartamentoRepository()
    await departamentoRepo.delete(params.id)

    return NextResponse.json({ message: 'Departamento excluído com sucesso' })
  } catch (error: any) {
    console.error('Erro ao excluir departamento:', error)
    return NextResponse.json(
      { error: 'Não é possível excluir departamento com colaboradores vinculados' },
      { status: 400 }
    )
  }
}
