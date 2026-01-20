import { PrismaClient, StatusPeriodo, StatusSolicitacao, TipoSolicitacao } from '@prisma/client'
import { addYears, addMonths, subYears, subMonths, addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes
  await prisma.solicitacaoFerias.deleteMany()
  await prisma.periodoAquisitivo.deleteMany()
  await prisma.colaborador.deleteMany()
  await prisma.departamento.deleteMany()

  // ============================================
  // DEPARTAMENTOS
  // ============================================
  console.log('📁 Criando departamentos...')
  
  const departamentos = await Promise.all([
    prisma.departamento.create({
      data: { nome: 'Vendas', sigla: 'VND', limiteAusencias: 2 }
    }),
    prisma.departamento.create({
      data: { nome: 'TI', sigla: 'TI', limiteAusencias: 2 }
    }),
    prisma.departamento.create({
      data: { nome: 'RH', sigla: 'RH', limiteAusencias: 1 }
    }),
    prisma.departamento.create({
      data: { nome: 'Operações', sigla: 'OPS', limiteAusencias: 2 }
    }),
    prisma.departamento.create({
      data: { nome: 'Marketing', sigla: 'MKT', limiteAusencias: 2 }
    }),
  ])

  const [vendas, ti, rh, operacoes, marketing] = departamentos

  // ============================================
  // COLABORADORES
  // ============================================
  console.log('👥 Criando colaboradores...')

  const hoje = new Date()

  // Função auxiliar para criar colaborador com períodos
  const criarColaboradorComPeriodos = async (
    dados: {
      nome: string
      email: string
      matricula: string
      cargo: string
      dataAdmissao: Date
      departamentoId: string
    },
    periodosConfig: Array<{
      diasVendidos?: number
      diasGozados?: number
      status?: StatusPeriodo
    }>
  ) => {
    const colaborador = await prisma.colaborador.create({
      data: dados
    })

    // Criar períodos aquisitivos
    for (let i = 0; i < periodosConfig.length; i++) {
      const config = periodosConfig[i]
      const numeroPeriodo = i + 1
      const inicioAquisitivo = addYears(dados.dataAdmissao, i)
      const fimAquisitivo = addYears(dados.dataAdmissao, i + 1)
      const limiteGozo = addMonths(fimAquisitivo, 12)

      const periodo = await prisma.periodoAquisitivo.create({
        data: {
          colaboradorId: colaborador.id,
          numeroPeriodo,
          dataInicioAquisitivo: inicioAquisitivo,
          dataFimAquisitivo: fimAquisitivo,
          dataLimiteGozo: limiteGozo,
          diasDireito: 30,
          diasVendidos: config.diasVendidos || 0,
          status: config.status || StatusPeriodo.ATIVO,
        }
      })

      // Criar solicitações de férias gozadas
      if (config.diasGozados && config.diasGozados > 0) {
        const inicioGozo = addMonths(fimAquisitivo, 2)
        await prisma.solicitacaoFerias.create({
          data: {
            periodoAquisitivoId: periodo.id,
            dataInicioGozo: inicioGozo,
            dataFimGozo: addDays(inicioGozo, config.diasGozados - 1),
            diasGozo: config.diasGozados,
            tipo: TipoSolicitacao.GOZO,
            status: StatusSolicitacao.APROVADO,
            aprovadoPor: 'Sistema',
            aprovadoEm: addMonths(fimAquisitivo, 1),
          }
        })
      }
    }

    return colaborador
  }

  // Colaboradores de Vendas (6)
  await criarColaboradorComPeriodos(
    {
      nome: 'Ana Silva',
      email: 'ana.silva@empresa.com',
      matricula: 'VND001',
      cargo: 'Vendedora Senior',
      dataAdmissao: subYears(hoje, 3),
      departamentoId: vendas.id,
    },
    [
      { diasVendidos: 10, diasGozados: 20, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 15 },
      { diasVendidos: 0, diasGozados: 0 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Bruno Costa',
      email: 'bruno.costa@empresa.com',
      matricula: 'VND002',
      cargo: 'Vendedor',
      dataAdmissao: subYears(subMonths(hoje, 6), 2),
      departamentoId: vendas.id,
    },
    [
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 10, diasGozados: 10 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Carla Mendes',
      email: 'carla.mendes@empresa.com',
      matricula: 'VND003',
      cargo: 'Gerente de Vendas',
      dataAdmissao: subYears(hoje, 5),
      departamentoId: vendas.id,
    },
    [
      { diasVendidos: 10, diasGozados: 20, status: StatusPeriodo.QUITADO },
      { diasVendidos: 10, diasGozados: 20, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 20 },
      { diasVendidos: 0, diasGozados: 0 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Daniel Oliveira',
      email: 'daniel.oliveira@empresa.com',
      matricula: 'VND004',
      cargo: 'Vendedor',
      dataAdmissao: subMonths(hoje, 14),
      departamentoId: vendas.id,
    },
    [{ diasVendidos: 0, diasGozados: 0 }]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Elena Rodrigues',
      email: 'elena.rodrigues@empresa.com',
      matricula: 'VND005',
      cargo: 'Vendedora',
      dataAdmissao: subMonths(hoje, 8),
      departamentoId: vendas.id,
    },
    []
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Felipe Santos',
      email: 'felipe.santos@empresa.com',
      matricula: 'VND006',
      cargo: 'Vendedor Junior',
      dataAdmissao: subMonths(hoje, 4),
      departamentoId: vendas.id,
    },
    []
  )

  // Colaboradores de TI (5)
  await criarColaboradorComPeriodos(
    {
      nome: 'Gabriel Martins',
      email: 'gabriel.martins@empresa.com',
      matricula: 'TI001',
      cargo: 'Desenvolvedor Senior',
      dataAdmissao: subYears(hoje, 4),
      departamentoId: ti.id,
    },
    [
      { diasVendidos: 10, diasGozados: 20, status: StatusPeriodo.QUITADO },
      { diasVendidos: 10, diasGozados: 20, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 0 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Helena Souza',
      email: 'helena.souza@empresa.com',
      matricula: 'TI002',
      cargo: 'Tech Lead',
      dataAdmissao: subYears(subMonths(hoje, 3), 2),
      departamentoId: ti.id,
    },
    [
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 15 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Igor Lima',
      email: 'igor.lima@empresa.com',
      matricula: 'TI003',
      cargo: 'DevOps',
      dataAdmissao: subYears(hoje, 1),
      departamentoId: ti.id,
    },
    [{ diasVendidos: 0, diasGozados: 0 }]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Juliana Alves',
      email: 'juliana.alves@empresa.com',
      matricula: 'TI004',
      cargo: 'Desenvolvedora',
      dataAdmissao: subMonths(hoje, 18),
      departamentoId: ti.id,
    },
    [{ diasVendidos: 0, diasGozados: 20 }]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Kevin Pereira',
      email: 'kevin.pereira@empresa.com',
      matricula: 'TI005',
      cargo: 'Desenvolvedor Junior',
      dataAdmissao: subMonths(hoje, 6),
      departamentoId: ti.id,
    },
    []
  )

  // Colaboradores de RH (5)
  await criarColaboradorComPeriodos(
    {
      nome: 'Laura Fernandes',
      email: 'laura.fernandes@empresa.com',
      matricula: 'RH001',
      cargo: 'Gerente de RH',
      dataAdmissao: subYears(hoje, 6),
      departamentoId: rh.id,
    },
    [
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 10, diasGozados: 20, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 15 },
      { diasVendidos: 0, diasGozados: 0 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Marcos Ribeiro',
      email: 'marcos.ribeiro@empresa.com',
      matricula: 'RH002',
      cargo: 'Analista de RH',
      dataAdmissao: subYears(hoje, 2),
      departamentoId: rh.id,
    },
    [
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 0 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Natália Castro',
      email: 'natalia.castro@empresa.com',
      matricula: 'RH003',
      cargo: 'Assistente de RH',
      dataAdmissao: subYears(hoje, 1),
      departamentoId: rh.id,
    },
    [{ diasVendidos: 0, diasGozados: 15 }]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Otávio Gomes',
      email: 'otavio.gomes@empresa.com',
      matricula: 'RH004',
      cargo: 'Recrutador',
      dataAdmissao: subMonths(hoje, 10),
      departamentoId: rh.id,
    },
    []
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Patricia Nunes',
      email: 'patricia.nunes@empresa.com',
      matricula: 'RH005',
      cargo: 'Analista de DP',
      dataAdmissao: subMonths(hoje, 15),
      departamentoId: rh.id,
    },
    [{ diasVendidos: 10, diasGozados: 0 }]
  )

  // Colaboradores de Operações (5)
  await criarColaboradorComPeriodos(
    {
      nome: 'Rafael Duarte',
      email: 'rafael.duarte@empresa.com',
      matricula: 'OPS001',
      cargo: 'Coordenador de Operações',
      dataAdmissao: subYears(hoje, 3),
      departamentoId: operacoes.id,
    },
    [
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 0 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Sandra Moreira',
      email: 'sandra.moreira@empresa.com',
      matricula: 'OPS002',
      cargo: 'Analista de Operações',
      dataAdmissao: subYears(subMonths(hoje, 4), 2),
      departamentoId: operacoes.id,
    },
    [
      { diasVendidos: 10, diasGozados: 20, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 20 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Thiago Barros',
      email: 'thiago.barros@empresa.com',
      matricula: 'OPS003',
      cargo: 'Operador',
      dataAdmissao: subYears(hoje, 1),
      departamentoId: operacoes.id,
    },
    [{ diasVendidos: 0, diasGozados: 0 }]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Úrsula Vieira',
      email: 'ursula.vieira@empresa.com',
      matricula: 'OPS004',
      cargo: 'Operadora',
      dataAdmissao: subMonths(hoje, 8),
      departamentoId: operacoes.id,
    },
    []
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Vinícius Cardoso',
      email: 'vinicius.cardoso@empresa.com',
      matricula: 'OPS005',
      cargo: 'Operador Junior',
      dataAdmissao: subMonths(hoje, 5),
      departamentoId: operacoes.id,
    },
    []
  )

  // Colaboradores de Marketing (5)
  await criarColaboradorComPeriodos(
    {
      nome: 'Wanda Freitas',
      email: 'wanda.freitas@empresa.com',
      matricula: 'MKT001',
      cargo: 'Gerente de Marketing',
      dataAdmissao: subYears(hoje, 4),
      departamentoId: marketing.id,
    },
    [
      { diasVendidos: 10, diasGozados: 20, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 10 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Xavier Teixeira',
      email: 'xavier.teixeira@empresa.com',
      matricula: 'MKT002',
      cargo: 'Designer',
      dataAdmissao: subYears(subMonths(hoje, 2), 2),
      departamentoId: marketing.id,
    },
    [
      { diasVendidos: 0, diasGozados: 30, status: StatusPeriodo.QUITADO },
      { diasVendidos: 0, diasGozados: 15 },
    ]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Yasmin Araújo',
      email: 'yasmin.araujo@empresa.com',
      matricula: 'MKT003',
      cargo: 'Social Media',
      dataAdmissao: subYears(hoje, 1),
      departamentoId: marketing.id,
    },
    [{ diasVendidos: 0, diasGozados: 0 }]
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Zé Roberto',
      email: 'ze.roberto@empresa.com',
      matricula: 'MKT004',
      cargo: 'Copywriter',
      dataAdmissao: subMonths(hoje, 11),
      departamentoId: marketing.id,
    },
    []
  )

  await criarColaboradorComPeriodos(
    {
      nome: 'Amanda Lopes',
      email: 'amanda.lopes@empresa.com',
      matricula: 'MKT005',
      cargo: 'Analista de Marketing',
      dataAdmissao: subMonths(hoje, 7),
      departamentoId: marketing.id,
    },
    []
  )

  // ============================================
  // SOLICITAÇÕES PENDENTES
  // ============================================
  console.log('📋 Criando solicitações pendentes...')

  // Buscar alguns períodos para criar solicitações pendentes
  const periodosAtivos = await prisma.periodoAquisitivo.findMany({
    where: { status: StatusPeriodo.ATIVO },
    include: { colaborador: true },
    take: 5,
  })

  for (const periodo of periodosAtivos.slice(0, 2)) {
    const inicioGozo = addDays(hoje, Math.floor(Math.random() * 60) + 30)
    await prisma.solicitacaoFerias.create({
      data: {
        periodoAquisitivoId: periodo.id,
        dataInicioGozo: inicioGozo,
        dataFimGozo: addDays(inicioGozo, 14),
        diasGozo: 15,
        tipo: TipoSolicitacao.GOZO,
        status: StatusSolicitacao.PENDENTE,
      }
    })
  }

  // ============================================
  // ESTATÍSTICAS
  // ============================================
  const totalColaboradores = await prisma.colaborador.count()
  const totalPeriodos = await prisma.periodoAquisitivo.count()
  const totalSolicitacoes = await prisma.solicitacaoFerias.count()

  console.log('')
  console.log('✅ Seed concluído com sucesso!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📁 Departamentos: ${departamentos.length}`)
  console.log(`👥 Colaboradores: ${totalColaboradores}`)
  console.log(`📅 Períodos Aquisitivos: ${totalPeriodos}`)
  console.log(`📋 Solicitações de Férias: ${totalSolicitacoes}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
