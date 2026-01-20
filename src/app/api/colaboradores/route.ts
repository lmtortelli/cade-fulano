// ============================================
// API ROUTE - COLABORADORES
// GET /api/colaboradores - Listar colaboradores
// POST /api/colaboradores - Criar colaborador
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')
    const departamentoId = searchParams.get('departamentoId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const colaboradorService = container.getColaboradorService()

    // Se tem busca, usar método de busca
    if (busca) {
      const colaboradores = await colaboradorService.buscar(busca)
      return NextResponse.json({
        data: colaboradores,
        total: colaboradores.length,
        page: 1,
        limit: colaboradores.length,
        totalPages: 1
      })
    }

    // Senão, listar com filtros
    const resultado = await colaboradorService.listarComFiltros({
      departamentoId: departamentoId || undefined,
      page,
      limit,
      ativo: true
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error)
    return NextResponse.json(
      { error: 'Erro ao listar colaboradores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, email, matricula, cargo, dataAdmissao, departamentoId } = body

    // Validações básicas
    if (!nome || !email || !dataAdmissao || !departamentoId) {
      return NextResponse.json(
        { error: 'Nome, email, data de admissão e departamento são obrigatórios' },
        { status: 400 }
      )
    }

    const colaboradorService = container.getColaboradorService()

    const colaborador = await colaboradorService.criar({
      nome,
      email,
      matricula,
      cargo,
      dataAdmissao: new Date(dataAdmissao),
      departamentoId
    })

    return NextResponse.json(colaborador, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar colaborador:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar colaborador' },
      { status: 400 }
    )
  }
}
