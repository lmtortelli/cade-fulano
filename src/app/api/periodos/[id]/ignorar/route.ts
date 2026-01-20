// ============================================
// API ROUTE - IGNORAR PERÍODO
// POST /api/periodos/[id]/ignorar - Ignorar período
// DELETE /api/periodos/[id]/ignorar - Restaurar período
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/infrastructure/database/prisma'

interface Params {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const periodo = await prisma.periodoAquisitivo.update({
      where: { id: params.id },
      data: { ignorado: true }
    })

    return NextResponse.json({ 
      message: 'Período ignorado com sucesso',
      periodo 
    })
  } catch (error: any) {
    console.error('Erro ao ignorar período:', error)
    return NextResponse.json(
      { error: 'Erro ao ignorar período' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const periodo = await prisma.periodoAquisitivo.update({
      where: { id: params.id },
      data: { ignorado: false }
    })

    return NextResponse.json({ 
      message: 'Período restaurado com sucesso',
      periodo 
    })
  } catch (error: any) {
    console.error('Erro ao restaurar período:', error)
    return NextResponse.json(
      { error: 'Erro ao restaurar período' },
      { status: 400 }
    )
  }
}
