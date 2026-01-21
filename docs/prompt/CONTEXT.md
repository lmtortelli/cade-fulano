# CadêFulano? - Contexto do Projeto

> **Documento de contexto para carregar em chats futuros com IA**

## 📋 Visão Geral

**CadêFulano?** é um sistema de gerenciamento de férias e ausências para empresas com 26-50 colaboradores. Permite cadastrar colaboradores, gerenciar períodos aquisitivos de férias, agendar férias, vender dias (abono pecuniário), registrar folgas e visualizar tudo em um cronograma.

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Estilização | Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| ORM | Prisma |
| Banco de Dados | MySQL 8.0 |
| Containerização | Docker, Docker Compose |

## 📁 Estrutura do Projeto

```
poc-ferias/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.ts            # Script de seed inicial
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API Routes
│   │   │   ├── colaboradores/
│   │   │   ├── departamentos/
│   │   │   ├── solicitacoes/
│   │   │   ├── periodos/
│   │   │   ├── folgas/
│   │   │   ├── dashboard/
│   │   │   └── stats/
│   │   ├── colaboradores/     # Página de colaboradores
│   │   ├── departamentos/     # Página de departamentos
│   │   ├── solicitacoes/      # Página de solicitações
│   │   ├── cronograma/        # Calendário visual
│   │   ├── folgas/            # Gestão de folgas
│   │   └── solicitar-folga/   # Formulário público de folgas
│   ├── components/
│   │   ├── ui/            # Componentes shadcn/ui
│   │   ├── layout/        # Header, Sidebar
│   │   ├── dashboard/     # Componentes do dashboard
│   │   └── modals/        # Modais (criar, editar, confirmar)
│   ├── core/              # Camada de negócio (preparada para migração)
│   │   ├── types/         # Interfaces e enums TypeScript
│   │   ├── repositories/  # Interfaces dos repositórios
│   │   └── services/      # Regras de negócio
│   ├── infrastructure/
│   │   ├── database/      # Prisma client e implementações
│   │   │   └── repositories/  # Implementações Prisma
│   │   └── container.ts   # Injeção de dependências
│   └── lib/
│       └── utils.ts       # Utilitários (formatDate, parseLocalDate, etc.)
├── docs/
│   ├── migrate/           # Guia de migração para backend separado
│   └── prompt/            # Este arquivo de contexto
├── docker-compose.yml     # Produção
├── docker-compose.dev.yml # Desenvolvimento
├── Dockerfile
└── Dockerfile.dev
```

## 🗃️ Modelos de Dados (Prisma)

### Colaborador
```prisma
model Colaborador {
  id, nome, email, cargo, dataAdmissao, avatar, ativo
  departamentoId -> Departamento
  periodosAquisitivos -> PeriodoAquisitivo[]
  folgas -> Folga[]
}
```

### PeriodoAquisitivo
```prisma
model PeriodoAquisitivo {
  id, numeroPeriodo, dataInicioAquisitivo, dataFimAquisitivo
  dataInicioConcessivo, dataFimConcessivo, diasDireito, diasVendidos
  status (PENDENTE, EM_GOZO, CONCLUIDO), ignorado (Boolean)
  colaboradorId -> Colaborador
  solicitacoes -> SolicitacaoFerias[]
}
```

### SolicitacaoFerias
```prisma
model SolicitacaoFerias {
  id, tipo (GOZO, ABONO_PECUNIARIO)
  status (PENDENTE, APROVADO, REJEITADO, CANCELADO)
  dataInicioGozo, dataFimGozo, diasGozo, observacoes
  motivoRejeicao, aprovadoPor, aprovadoEm
  motivoCancelamento, canceladoEm
  periodoAquisitivoId -> PeriodoAquisitivo
}
```

### Folga
```prisma
model Folga {
  id, data, tipo (FERIADO, COMPENSACAO, LICENCA, ATESTADO, OUTROS, CARGO_CONFIANCA)
  status (PENDENTE, APROVADO, REJEITADO), descricao, motivoRejeicao
  colaboradorId -> Colaborador
}
```

### Departamento
```prisma
model Departamento {
  id, nome, sigla, limiteAusencias, ativo
  colaboradores -> Colaborador[]
}
```

## 🎯 Funcionalidades Implementadas

### Colaboradores
- CRUD completo (criar, listar, editar, excluir)
- Filtros por departamento e vigência vencendo
- Visualização de saldo de férias por período
- Detalhes com histórico de solicitações

### Departamentos
- CRUD completo
- Limite de ausências simultâneas

### Períodos Aquisitivos
- Geração automática baseada na data de admissão
- Possibilidade de "ignorar" períodos antigos
- Cálculo correto de saldo considerando:
  - Dias gozados (GOZO aprovado)
  - Dias vendidos (ABONO_PECUNIARIO aprovado)
  - Dias pendentes (GOZO e ABONO pendentes)
  - Dias vendidos no cadastro do período

### Solicitações de Férias
- Criar solicitações de GOZO ou ABONO_PECUNIARIO
- Aprovar / Rejeitar (com motivo)
- Cancelar (com motivo) - pendentes e aprovados não iniciados
- **Editar** - apenas solicitações pendentes
- Filtros por status
- Histórico completo com motivos

### Folgas
- CRUD completo
- Tipos: Feriado, Compensação, Licença, Atestado, Cargo de Confiança, Outros
- Fluxo de aprovação (PENDENTE → APROVADO/REJEITADO)
- Filtros por departamento, tipo, data, status
- Página pública para solicitação (/solicitar-folga)

### Cronograma
- Calendário visual mensal
- Exibe férias e folgas
- Filtros por:
  - Múltiplos colaboradores
  - Múltiplos departamentos
  - Tipo de evento (Férias/Folgas/Todos)
- Modal de detalhes ao clicar "+X mais"
- Exportação para Google Calendar (individual e em lote .ics)

### Dashboard
- Cards de estatísticas (total colaboradores, em férias, solicitações pendentes)
- Próximas saídas
- Resumo por departamento

## 🔌 APIs Disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/colaboradores` | Listar/Criar colaboradores |
| GET/PUT/DELETE | `/api/colaboradores/[id]` | CRUD por ID |
| GET | `/api/colaboradores/[id]/saldo` | Saldo detalhado |
| GET/POST | `/api/departamentos` | Listar/Criar departamentos |
| GET/PUT/DELETE | `/api/departamentos/[id]` | CRUD por ID |
| GET/POST | `/api/solicitacoes` | Listar/Criar solicitações |
| GET/PUT | `/api/solicitacoes/[id]` | Ver/Editar solicitação |
| POST | `/api/solicitacoes/[id]/aprovar` | Aprovar |
| POST | `/api/solicitacoes/[id]/rejeitar` | Rejeitar (com motivo) |
| POST | `/api/solicitacoes/[id]/cancelar` | Cancelar (com motivo) |
| POST | `/api/periodos/[id]/ignorar` | Toggle ignorar período |
| GET/POST | `/api/folgas` | Listar/Criar folgas |
| GET/PUT/DELETE | `/api/folgas/[id]` | CRUD por ID |
| POST | `/api/folgas/[id]/aprovar` | Aprovar folga |
| POST | `/api/folgas/[id]/rejeitar` | Rejeitar folga |
| GET | `/api/dashboard` | Dados do dashboard |
| GET | `/api/stats` | Estatísticas gerais |

## ⚠️ Pontos Importantes / Convenções

### Tratamento de Datas (Timezone)
- **Problema**: Datas UTC convertidas para local podem "voltar" 1 dia
- **Solução**: Usar `parseLocalDate()` de `@/lib/utils` que cria datas ao meio-dia local
- **API**: Ao receber datas, usar `new Date(body.data + 'T12:00:00')`

### Enums TypeScript vs Prisma
- Prisma gera seus próprios enums que são incompatíveis com os TypeScript
- **Solução**: Usar type casting (`as StatusSolicitacao`) nos repositórios

### Cálculo de Saldo de Férias
O saldo disponível é calculado em `colaborador.service.ts`:
```
diasDisponiveis = diasDireito - diasVendidos(periodo) - diasGozados - diasVendidosViaSolicitacao - diasPendentes
```
- `diasGozados`: Solicitações GOZO com status APROVADO
- `diasVendidosViaSolicitacao`: Solicitações ABONO_PECUNIARIO com status APROVADO
- `diasPendentes`: Solicitações GOZO e ABONO_PECUNIARIO com status PENDENTE

### Validações de Negócio
- Máximo 10 dias de venda (1/3 das férias)
- Cancelamento só para PENDENTE ou APROVADO não iniciado
- Edição apenas para solicitações PENDENTE
- Períodos ignorados são excluídos do cálculo de saldo total

## 🐳 Como Rodar

### Desenvolvimento
```bash
docker-compose -f docker-compose.dev.yml up -d
```
- Acesse: http://localhost:3000
- Hot reload habilitado

### Primeira execução (após subir containers)
```bash
docker exec -it feriaspro-app-dev npx prisma db push
docker exec -it feriaspro-app-dev npx tsx prisma/seed.ts
docker restart feriaspro-app-dev
```

### Produção
```bash
docker-compose up -d --build
```

## 📦 Componentes Modais Disponíveis

| Modal | Arquivo | Uso |
|-------|---------|-----|
| ColaboradorModal | `colaborador-modal.tsx` | Criar/Editar colaborador |
| DepartamentoModal | `departamento-modal.tsx` | Criar/Editar departamento |
| FeriasModal | `ferias-modal.tsx` | Criar solicitação de férias/venda |
| EditarFeriasModal | `editar-ferias-modal.tsx` | Editar solicitação pendente |
| FolgaModal | `folga-modal.tsx` | Criar/Editar folga |
| RejeicaoModal | `rejeicao-modal.tsx` | Informar motivo de rejeição |
| CancelamentoModal | `cancelamento-modal.tsx` | Informar motivo de cancelamento |
| ConfirmModal | `confirm-modal.tsx` | Confirmação genérica |

## 🎨 Identidade Visual

- **Nome**: CadêFulano?
- **Ícone**: 🔍
- **Cores**: Gradiente azul (#3B82F6) → roxo (#9333EA)
- **Fonte**: Inter
- **Subtítulo**: "Gestão de ausências"

## 📝 Arquivos de Documentação

- `docs/migrate/MIGRATION_GUIDE.md` - Guia para migrar backend
- `docs/migrate/PROMPTS.md` - Prompts para IA auxiliar na migração
- `docs/prompt/CONTEXT.md` - Este arquivo

---

**Última atualização**: Janeiro 2026
