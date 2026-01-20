// ============================================
// API ROUTE - SALDO DO PERÍODO
// GET /api/periodos/[id]/saldo - Obter saldo do período
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const periodoService = container.getPeriodoAquisitivoService()
    const saldo = await periodoService.calcularSaldo(params.id)

    return NextResponse.json(saldo)
  } catch (error: any) {
    console.error('Erro ao buscar saldo do período:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar saldo do período' },
      { status: 400 }
    )
  }
}
