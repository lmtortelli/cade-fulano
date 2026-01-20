// ============================================
// API ROUTE - DEPARTAMENTOS
// GET /api/departamentos - Listar departamentos
// POST /api/departamentos - Criar departamento
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/infrastructure/database/prisma'
import { container } from '@/infrastructure/container'

export async function GET() {
  try {
    // Usar Prisma diretamente para incluir a contagem de colaboradores
    const departamentos = await prisma.departamento.findMany({
      where: { ativo: true },
      include: {
        _count: {
          select: { colaboradores: true }
        }
      },
      orderBy: { nome: 'asc' }
    })
    
    return NextResponse.json(departamentos)
  } catch (error) {
    console.error('Erro ao listar departamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar departamentos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, sigla, limiteAusencias } = body

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const departamentoRepo = container.getDepartamentoRepository()
    
    // Verificar se já existe
    const existe = await departamentoRepo.findByNome(nome)
    if (existe) {
      return NextResponse.json(
        { error: 'Já existe um departamento com este nome' },
        { status: 400 }
      )
    }

    const departamento = await departamentoRepo.create({
      nome,
      sigla,
      limiteAusencias
    })

    return NextResponse.json(departamento, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar departamento:', error)
    return NextResponse.json(
      { error: 'Erro ao criar departamento' },
      { status: 500 }
    )
  }
}
