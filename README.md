# 📅 FériasPro - Sistema de Gestão de Férias

Sistema completo para gerenciamento de férias de colaboradores, desenvolvido com Next.js e preparado para escalar.

![FériasPro Dashboard](docs/images/dashboard-preview.png)

## ✨ Funcionalidades

- 👥 **Cadastro de Colaboradores** - Gerencie até 50 colaboradores
- 📅 **Períodos Aquisitivos** - Cálculo automático baseado na data de admissão
- 💰 **Venda de Férias** - Suporte a abono pecuniário (até 10 dias)
- ✅ **Workflow de Aprovação** - Solicitação → Aprovação → Gozo
- 📊 **Dashboard** - Métricas em tempo real
- 🗓️ **Cronograma** - Visualização mensal de férias
- ⚠️ **Alertas** - Detecção de conflitos e vencimentos

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14 + TypeScript |
| Estilização | Tailwind CSS |
| Componentes | shadcn/ui + Radix UI |
| Backend | Next.js API Routes |
| Banco de Dados | PostgreSQL |
| ORM | Prisma |
| Container | Docker + Docker Compose |

## 📁 Estrutura do Projeto

```
ferias-pro/
├── prisma/                    # Schema e migrations
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── colaboradores/     # Páginas de colaboradores
│   │   ├── cronograma/        # Página de cronograma
│   │   └── page.tsx           # Dashboard
│   │
│   ├── core/                  # Núcleo da aplicação (extraível)
│   │   ├── services/          # Regras de negócio
│   │   ├── repositories/      # Interfaces
│   │   └── types/             # DTOs e entidades
│   │
│   ├── infrastructure/        # Implementações (extraível)
│   │   ├── database/          # Prisma e repositories
│   │   └── container.ts       # Injeção de dependências
│   │
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes base
│   │   ├── layout/            # Sidebar, Header
│   │   └── dashboard/         # Componentes do dashboard
│   │
│   └── lib/                   # Utilitários
│
├── docs/
│   └── migrate/               # Guia de migração para backend separado
│
├── docker-compose.yml
└── Dockerfile
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn

### Com Docker (Recomendado)

```bash
# Clone o repositório
git clone <repo-url>
cd ferias-pro

# Inicie os containers
docker-compose up -d

# Aguarde o banco iniciar e execute as migrations
docker-compose exec app npx prisma migrate dev

# Popule com dados de exemplo
docker-compose exec app npm run db:seed

# Acesse http://localhost:3000
```

### Desenvolvimento Local

```bash
# Instale as dependências
npm install

# Inicie apenas o PostgreSQL
docker-compose up -d postgres

# Configure o banco de dados
cp .env.example .env
npx prisma migrate dev
npm run db:seed

# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

## 📋 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Build de produção
npm run start        # Inicia servidor de produção

# Banco de Dados
npm run db:generate  # Gera Prisma Client
npm run db:migrate   # Executa migrations
npm run db:push      # Push schema para o banco
npm run db:seed      # Popula com dados de exemplo
npm run db:studio    # Abre Prisma Studio

# Docker
npm run docker:up    # Sobe containers
npm run docker:down  # Para containers
npm run docker:logs  # Visualiza logs
```

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Banco de Dados
DATABASE_URL="postgresql://ferias:ferias123@localhost:5432/feriaspro?schema=public"

# Aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📊 API Endpoints

### Colaboradores
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/colaboradores` | Listar colaboradores |
| GET | `/api/colaboradores/:id` | Buscar por ID |
| GET | `/api/colaboradores/:id/saldo` | Saldo de férias |
| POST | `/api/colaboradores` | Criar colaborador |
| PUT | `/api/colaboradores/:id` | Atualizar colaborador |
| DELETE | `/api/colaboradores/:id` | Inativar colaborador |

### Solicitações de Férias
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/solicitacoes` | Listar solicitações |
| GET | `/api/solicitacoes/pendentes` | Listar pendentes |
| POST | `/api/solicitacoes` | Criar solicitação |
| POST | `/api/solicitacoes/:id/aprovar` | Aprovar |
| POST | `/api/solicitacoes/:id/rejeitar` | Rejeitar |

### Dashboard
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/dashboard` | Métricas e resumos |

### Períodos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/periodos/:id/saldo` | Saldo do período |
| POST | `/api/periodos/:id/venda` | Registrar venda |

## 🏗️ Arquitetura Escalável

Este projeto foi arquitetado para facilitar a migração para um backend separado:

```
ATUAL (Monolito)              FUTURO (Separado)
┌──────────────────┐          ┌──────────────────┐
│    Next.js       │          │    Next.js       │
│  ┌────────────┐  │          │    (Frontend)    │
│  │  Frontend  │  │          └────────┬─────────┘
│  └────────────┘  │                   │
│  ┌────────────┐  │          ┌────────▼─────────┐
│  │ API Routes │  │   ──>    │     NestJS       │
│  └────────────┘  │          │    (Backend)     │
│  ┌────────────┐  │          │  ┌────────────┐  │
│  │   Core     │──┼── COPY ──│  │   Core     │  │
│  └────────────┘  │          │  └────────────┘  │
└──────────────────┘          └──────────────────┘
```

📖 Consulte [docs/migrate/MIGRATION_GUIDE.md](docs/migrate/MIGRATION_GUIDE.md) para instruções detalhadas.

## 📜 Regras de Negócio (CLT)

O sistema implementa as seguintes regras da CLT:

- **Período Aquisitivo**: 12 meses de trabalho = 30 dias de férias
- **Período de Gozo**: Até 12 meses após o fim do período aquisitivo
- **Fracionamento**: Até 3 períodos (um deve ter no mínimo 14 dias)
- **Venda de Férias**: Máximo de 10 dias (1/3 do período)
- **Período Mínimo**: 5 dias para períodos fracionados

## 🧪 Dados de Exemplo

O seed cria:
- 5 departamentos (Vendas, TI, RH, Operações, Marketing)
- 26 colaboradores
- Períodos aquisitivos variados
- Solicitações de exemplo (aprovadas e pendentes)

## 📝 Licença

Este projeto é um MVP/POC para demonstração. Consulte o arquivo LICENSE para mais detalhes.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

Desenvolvido com ❤️ para simplificar a gestão de férias
