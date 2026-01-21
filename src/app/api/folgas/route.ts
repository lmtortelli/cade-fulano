import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'
import { TipoFolga, StatusFolga } from '@/core/types'

// GET /api/folgas - Listar folgas com filtros
export async function GET(request: NextRequest) {
  try {
    const folgaService = container.getFolgaService()
    const { searchParams } = new URL(request.url)

    const colaboradorId = searchParams.get('colaboradorId')
    const departamentoId = searchParams.get('departamentoId')
    const tipo = searchParams.get('tipo') as TipoFolga | null
    const status = searchParams.get('status') as StatusFolga | null
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    // Se há filtros, usar findComFiltros
    if (colaboradorId || departamentoId || tipo || status || dataInicio || dataFim) {
      const folgas = await folgaService.listarComFiltros({
        colaboradorId: colaboradorId || undefined,
        departamentoId: departamentoId || undefined,
        tipo: tipo || undefined,
        status: status || undefined,
        dataInicio: dataInicio ? new Date(dataInicio) : undefined,
        dataFim: dataFim ? new Date(dataFim) : undefined
      })
      return NextResponse.json(folgas)
    }

    // Senão, listar todas
    const folgas = await folgaService.listarTodas()
    return NextResponse.json(folgas)
  } catch (error) {
    console.error('Erro ao listar folgas:', error)
    return NextResponse.json(
      { error: 'Erro ao listar folgas' },
      { status: 500 }
    )
  }
}

// POST /api/folgas - Criar nova folga
export async function POST(request: NextRequest) {
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
    const dataFim = body.dataFim ? parseDate(body.dataFim) : null

    if (!dataInicio) {
      return NextResponse.json(
        { error: 'Data de início é obrigatória' },
        { status: 400 }
      )
    }

    const folga = await folgaService.criar({
      colaboradorId: body.colaboradorId,
      dataInicio,
      dataFim,
      tipo: body.tipo,
      descricao: body.descricao,
      status: body.status // PENDENTE para solicitações, APROVADO para criação direta
    })

    return NextResponse.json(folga, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar folga:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar folga' },
      { status: 400 }
    )
  }
}
