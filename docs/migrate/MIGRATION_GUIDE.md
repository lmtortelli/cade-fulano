# 🚀 Guia de Migração - FériasPro

Este guia documenta como migrar a aplicação FériasPro de um monolito Next.js para uma arquitetura de backend separado.

## 📋 Índice

1. [Visão Geral da Arquitetura Atual](#visão-geral-da-arquitetura-atual)
2. [Por que Migrar?](#por-que-migrar)
3. [Arquitetura Alvo](#arquitetura-alvo)
4. [Passo a Passo da Migração](#passo-a-passo-da-migração)
5. [Prompts para Assistente IA](#prompts-para-assistente-ia)
6. [Checklist de Migração](#checklist-de-migração)

---

## 📊 Visão Geral da Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEXT.JS (Monolito)                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                        Frontend                              │ │
│  │  • Pages (app/)                                              │ │
│  │  • Components                                                │ │
│  │  • Hooks                                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    API Routes (Controllers)                  │ │
│  │  • /api/colaboradores                                        │ │
│  │  • /api/solicitacoes                                         │ │
│  │  • /api/dashboard                                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    CORE (Extraível)                          │ │
│  │  ├── services/          ← Regras de negócio                 │ │
│  │  ├── repositories/      ← Interfaces                        │ │
│  │  └── types/             ← DTOs e entidades                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 INFRASTRUCTURE (Extraível)                   │ │
│  │  ├── database/prisma.ts                                     │ │
│  │  ├── repositories/      ← Implementações Prisma             │ │
│  │  └── container.ts       ← Injeção de dependências           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                       PostgreSQL                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Pastas Extraíveis

| Pasta | Conteúdo | Dependências |
|-------|----------|--------------|
| `src/core/` | Services, Repositories (interfaces), Types | Nenhuma externa |
| `src/infrastructure/` | Prisma client, Repositories (implementação), Container DI | Prisma |

---

## 🎯 Por que Migrar?

### Quando NÃO Migrar
- Aplicação com menos de 50 colaboradores
- Time pequeno (1-3 desenvolvedores)
- Sem necessidade de escalar horizontalmente
- MVP ou POC

### Quando Migrar
- ✅ Crescimento para 100+ colaboradores
- ✅ Necessidade de múltiplas instâncias
- ✅ Time crescendo (separar frontend/backend)
- ✅ Integração com outros sistemas (ERP, RH)
- ✅ Requisitos de performance mais exigentes
- ✅ Necessidade de API pública

---

## 🏗️ Arquitetura Alvo

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                          │
│  • Pages, Components, Hooks                                      │
│  • Chamadas HTTP para Backend                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP / REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS)                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      Controllers                             │ │
│  │  • ColaboradorController                                     │ │
│  │  • SolicitacaoController                                     │ │
│  │  • DashboardController                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    CORE (Copiado)                            │ │
│  │  ├── services/                                               │ │
│  │  ├── repositories/                                           │ │
│  │  └── types/                                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 INFRASTRUCTURE (Copiado)                     │ │
│  │  ├── database/                                               │ │
│  │  └── repositories/                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Passo a Passo da Migração

### Fase 1: Preparação (1 dia)

1. **Criar novo projeto NestJS**
```bash
# Criar projeto
npx @nestjs/cli new ferias-pro-api

# Instalar dependências
cd ferias-pro-api
npm install @prisma/client class-validator class-transformer date-fns
npm install -D prisma
```

2. **Configurar estrutura de pastas**
```
ferias-pro-api/
├── src/
│   ├── core/              # Copiar do projeto original
│   │   ├── services/
│   │   ├── repositories/
│   │   └── types/
│   │
│   ├── infrastructure/    # Copiar do projeto original
│   │   ├── database/
│   │   └── repositories/
│   │
│   ├── modules/           # Criar novo
│   │   ├── colaborador/
│   │   ├── solicitacao/
│   │   └── dashboard/
│   │
│   └── main.ts
│
├── prisma/                # Copiar do projeto original
│   └── schema.prisma
│
└── docker-compose.yml
```

### Fase 2: Migrar Core (1 dia)

1. **Copiar pasta `src/core/`**
```bash
cp -r ferias-pro/src/core ferias-pro-api/src/
```

2. **Ajustar imports** (se necessário)
- O código do core não deve ter dependências do Next.js
- Verificar se todos os tipos estão corretos

### Fase 3: Migrar Infrastructure (1 dia)

1. **Copiar pasta `src/infrastructure/`**
```bash
cp -r ferias-pro/src/infrastructure ferias-pro-api/src/
```

2. **Copiar Prisma schema**
```bash
cp -r ferias-pro/prisma ferias-pro-api/
```

3. **Ajustar container para NestJS**
- Converter para módulos NestJS
- Usar `@Injectable()` nos services e repositories

### Fase 4: Criar Controllers NestJS (2 dias)

Exemplo de controller:

```typescript
// src/modules/colaborador/colaborador.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { ColaboradorService } from '@/core/services'
import { CreateColaboradorDTO, UpdateColaboradorDTO } from '@/core/types'

@Controller('colaboradores')
export class ColaboradorController {
  constructor(private readonly colaboradorService: ColaboradorService) {}

  @Get()
  async listar(@Query() filtros: any) {
    return this.colaboradorService.listarComFiltros(filtros)
  }

  @Get(':id')
  async buscar(@Param('id') id: string) {
    return this.colaboradorService.buscarPorId(id)
  }

  @Post()
  async criar(@Body() dados: CreateColaboradorDTO) {
    return this.colaboradorService.criar(dados)
  }

  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dados: UpdateColaboradorDTO) {
    return this.colaboradorService.atualizar(id, dados)
  }

  @Delete(':id')
  async inativar(@Param('id') id: string) {
    return this.colaboradorService.inativar(id)
  }
}
```

### Fase 5: Atualizar Frontend (1 dia)

1. **Criar arquivo de configuração de API**
```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error('Erro na requisição')
  }
  
  return response.json()
}
```

2. **Atualizar chamadas de API**
```typescript
// Antes
const response = await fetch('/api/colaboradores')

// Depois
const response = await fetchAPI('/colaboradores')
```

3. **Remover pasta `src/app/api/`**

### Fase 6: Atualizar Docker (0.5 dia)

```yaml
# docker-compose.yml (atualizado)
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: feriaspro-db
    environment:
      POSTGRES_USER: ferias
      POSTGRES_PASSWORD: ferias123
      POSTGRES_DB: feriaspro
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./ferias-pro-api
      dockerfile: Dockerfile
    container_name: feriaspro-api
    environment:
      DATABASE_URL: postgresql://ferias:ferias123@postgres:5432/feriaspro
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build:
      context: ./ferias-pro
      dockerfile: Dockerfile
    container_name: feriaspro-web
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 🤖 Prompts para Assistente IA

### Prompt 1: Criar Projeto NestJS

```
Preciso criar um projeto backend NestJS para o FériasPro.

O projeto original está em Next.js e tem a seguinte estrutura:
- src/core/ - Services e interfaces de repositórios (regras de negócio)
- src/infrastructure/ - Implementações Prisma dos repositórios

Crie:
1. Estrutura do projeto NestJS
2. Configuração do Prisma
3. Módulos para: Colaborador, Solicitacao, Dashboard
4. Controllers equivalentes aos API Routes do Next.js
5. Módulo de injeção de dependências

Use as mesmas interfaces e services do projeto original.
```

### Prompt 2: Converter Services para NestJS

```
Tenho os seguintes services do projeto FériasPro que precisam ser convertidos para NestJS:

[Cole o conteúdo de src/core/services/]

Converta para usar decoradores NestJS (@Injectable) mantendo a mesma lógica.
Crie os módulos necessários e configure a injeção de dependências.
```

### Prompt 3: Criar Controllers NestJS

```
Com base nas API Routes do Next.js abaixo, crie os Controllers NestJS equivalentes:

[Cole o conteúdo de src/app/api/]

Mantenha:
- Mesmos endpoints
- Mesmas validações
- Mesmos tratamentos de erro

Use decoradores NestJS: @Controller, @Get, @Post, @Put, @Delete, @Body, @Param, @Query
```

### Prompt 4: Atualizar Frontend

```
Preciso atualizar o frontend Next.js para usar um backend separado.

Atualmente as chamadas são para /api/*, preciso:
1. Criar um módulo de API client que aponte para o backend externo
2. Atualizar todas as chamadas fetch para usar o novo client
3. Adicionar tratamento de CORS se necessário
4. Configurar variável de ambiente NEXT_PUBLIC_API_URL

Mantenha a mesma estrutura de dados e contratos.
```

### Prompt 5: Configurar Docker para Arquitetura Separada

```
Tenho dois projetos:
- ferias-pro/ (Frontend Next.js)
- ferias-pro-api/ (Backend NestJS)

Crie:
1. Dockerfile para o backend NestJS
2. docker-compose.yml que orquestre:
   - PostgreSQL
   - Backend NestJS (porta 3001)
   - Frontend Next.js (porta 3000)
3. Variáveis de ambiente para conexão entre serviços
4. Health checks
```

---

## ✅ Checklist de Migração

### Preparação
- [ ] Criar repositório para o backend
- [ ] Configurar ambiente de desenvolvimento
- [ ] Fazer backup do projeto atual

### Backend
- [ ] Criar projeto NestJS
- [ ] Copiar pasta `core/`
- [ ] Copiar pasta `infrastructure/`
- [ ] Copiar schema Prisma
- [ ] Criar módulos NestJS
- [ ] Criar controllers
- [ ] Configurar CORS
- [ ] Testar todos os endpoints

### Frontend
- [ ] Criar API client
- [ ] Atualizar chamadas de API
- [ ] Remover pasta `api/`
- [ ] Testar todas as páginas
- [ ] Configurar variáveis de ambiente

### DevOps
- [ ] Atualizar Dockerfile do frontend
- [ ] Criar Dockerfile do backend
- [ ] Atualizar docker-compose.yml
- [ ] Testar deploy local
- [ ] Configurar CI/CD

### Testes
- [ ] Testar CRUD de colaboradores
- [ ] Testar solicitações de férias
- [ ] Testar aprovações/rejeições
- [ ] Testar dashboard
- [ ] Testar cronograma
- [ ] Testar venda de férias

---

## ⏱️ Tempo Estimado

| Fase | Duração |
|------|---------|
| Preparação | 1 dia |
| Migrar Core | 1 dia |
| Migrar Infrastructure | 1 dia |
| Criar Controllers | 2 dias |
| Atualizar Frontend | 1 dia |
| DevOps e Testes | 1 dia |
| **Total** | **7 dias** |

---

## 📞 Suporte

Se tiver dúvidas durante a migração, use os prompts acima com um assistente IA ou consulte:
- [Documentação NestJS](https://docs.nestjs.com/)
- [Documentação Prisma](https://www.prisma.io/docs/)
- [Documentação Next.js](https://nextjs.org/docs)
