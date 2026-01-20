# 🤖 Prompts para Migração - FériasPro

Este documento contém prompts prontos para usar com assistentes IA durante a migração do FériasPro para uma arquitetura de backend separado.

---

## 📋 Prompt Completo de Migração

Use este prompt para iniciar uma migração completa:

```
# Contexto

Tenho uma aplicação Next.js chamada FériasPro para gerenciamento de férias de colaboradores.
A aplicação foi arquitetada com separação de camadas para facilitar uma futura migração:

## Estrutura Atual (Next.js Monolito)

```
src/
├── app/
│   ├── api/               # API Routes (controllers) - SERÁ REMOVIDO
│   ├── page.tsx           # Dashboard
│   ├── colaboradores/     # Páginas de colaboradores
│   └── cronograma/        # Página de cronograma
│
├── core/                  # SERÁ COPIADO PARA BACKEND
│   ├── services/          # Regras de negócio
│   │   ├── colaborador.service.ts
│   │   ├── periodo-aquisitivo.service.ts
│   │   ├── solicitacao-ferias.service.ts
│   │   └── dashboard.service.ts
│   │
│   ├── repositories/      # Interfaces (contratos)
│   │   ├── colaborador.repository.ts
│   │   ├── periodo-aquisitivo.repository.ts
│   │   └── solicitacao-ferias.repository.ts
│   │
│   └── types/             # DTOs e entidades
│       └── index.ts
│
├── infrastructure/        # SERÁ COPIADO PARA BACKEND
│   ├── database/
│   │   ├── prisma.ts
│   │   └── repositories/  # Implementações Prisma
│   │       ├── prisma-colaborador.repository.ts
│   │       ├── prisma-periodo-aquisitivo.repository.ts
│   │       └── prisma-solicitacao-ferias.repository.ts
│   │
│   └── container.ts       # Injeção de dependências
│
└── components/            # Componentes React
```

## Objetivo

Migrar para arquitetura separada:
- Frontend: Next.js (mantém pages e components)
- Backend: NestJS (recebe core e infrastructure)

## Tarefas

1. Criar projeto NestJS com a estrutura adequada
2. Copiar e adaptar pasta `core/` para NestJS
3. Copiar e adaptar pasta `infrastructure/` para NestJS
4. Criar Controllers NestJS equivalentes às API Routes
5. Criar API client no frontend para chamar backend externo
6. Atualizar docker-compose para nova arquitetura

## Requisitos

- Manter mesmos endpoints e contratos
- Usar decoradores NestJS (@Injectable, @Controller, etc.)
- Configurar CORS no backend
- Manter compatibilidade com o schema Prisma existente

Por favor, me guie passo a passo na migração.
```

---

## 🔧 Prompts Específicos

### 1. Criar Estrutura do Backend NestJS

```
Crie a estrutura inicial de um projeto NestJS para o FériasPro com:

1. Módulos:
   - ColaboradorModule
   - SolicitacaoModule
   - PeriodoAquisitivoModule
   - DashboardModule
   - DatabaseModule

2. Configuração:
   - Prisma como ORM
   - CORS habilitado
   - Validação com class-validator
   - Documentação Swagger

3. Estrutura de pastas seguindo o padrão:
   src/
   ├── core/           # Copiar do projeto original
   ├── infrastructure/ # Copiar do projeto original
   ├── modules/        # Módulos NestJS
   └── main.ts

Gere os arquivos de configuração necessários.
```

### 2. Converter ColaboradorService para NestJS

```
Converta o seguinte ColaboradorService para usar o padrão NestJS:

[Cole o conteúdo de src/core/services/colaborador.service.ts]

Requisitos:
- Adicionar decorator @Injectable()
- Manter a mesma lógica de negócio
- Usar injeção de dependências do NestJS
- Criar o módulo ColaboradorModule correspondente
```

### 3. Criar Controller de Colaboradores

```
Crie um ColaboradorController NestJS com os seguintes endpoints:

GET    /colaboradores          - Listar com filtros e paginação
GET    /colaboradores/:id      - Buscar por ID
GET    /colaboradores/:id/saldo - Obter saldo de férias
POST   /colaboradores          - Criar colaborador
PUT    /colaboradores/:id      - Atualizar colaborador
DELETE /colaboradores/:id      - Inativar colaborador

O controller deve usar o ColaboradorService que já existe.
Adicione validação de DTOs com class-validator.
Adicione documentação Swagger.
```

### 4. Criar Controller de Solicitações

```
Crie um SolicitacaoController NestJS com os seguintes endpoints:

GET    /solicitacoes              - Listar com filtros
GET    /solicitacoes/pendentes    - Listar pendentes
GET    /solicitacoes/:id          - Buscar por ID
POST   /solicitacoes              - Criar solicitação
PUT    /solicitacoes/:id          - Atualizar solicitação
DELETE /solicitacoes/:id          - Cancelar solicitação
POST   /solicitacoes/:id/aprovar  - Aprovar solicitação
POST   /solicitacoes/:id/rejeitar - Rejeitar solicitação

O controller deve usar o SolicitacaoFeriasService que já existe.
Adicione validação de DTOs e documentação Swagger.
```

### 5. Criar Controller de Dashboard

```
Crie um DashboardController NestJS com o seguinte endpoint:

GET /dashboard - Retorna:
  - metricas (deFeriasHoje, pedidosPendentes, alertasConflito, etc.)
  - proximasSaidas (lista de próximas saídas)
  - resumoDepartamentos (estatísticas por departamento)

O controller deve usar o DashboardService que já existe.
```

### 6. Configurar Módulo de Database

```
Crie um DatabaseModule para NestJS que:

1. Configure o PrismaService como provider global
2. Exporte os repositories:
   - PrismaColaboradorRepository
   - PrismaPeriodoAquisitivoRepository
   - PrismaSolicitacaoFeriasRepository
   - PrismaDepartamentoRepository

3. Configure as interfaces dos repositories para injeção

Use o padrão de injeção de dependências do NestJS.
O PrismaService deve gerenciar a conexão com o banco.
```

### 7. Criar API Client no Frontend

```
Crie um módulo de API client para o frontend Next.js que:

1. Configure a URL base do backend via variável de ambiente
2. Adicione interceptors para:
   - Headers de autenticação (futuro)
   - Tratamento de erros
   - Logging em desenvolvimento

3. Exporte funções tipadas:
   - colaboradoresApi.listar()
   - colaboradoresApi.buscar(id)
   - colaboradoresApi.criar(dados)
   - solicitacoesApi.listar()
   - solicitacoesApi.aprovar(id)
   - dashboardApi.obter()

Use fetch ou axios conforme preferência.
Mantenha tipagem TypeScript consistente com os DTOs do backend.
```

### 8. Atualizar Docker Compose

```
Atualize o docker-compose.yml para a nova arquitetura:

Serviços:
1. postgres - PostgreSQL 16
2. backend - NestJS na porta 3001
3. frontend - Next.js na porta 3000

Requisitos:
- Variáveis de ambiente para conexão
- Health checks
- Volumes para dados persistentes
- Network compartilhada
- Ordem de inicialização correta

O frontend deve conseguir acessar o backend via http://backend:3001
```

### 9. Criar Dockerfile do Backend

```
Crie um Dockerfile otimizado para o backend NestJS com:

1. Multi-stage build:
   - Stage de instalação de dependências
   - Stage de build
   - Stage de produção (imagem final pequena)

2. Configurações:
   - Node.js 20 Alpine como base
   - Prisma generate no build
   - Usuário não-root para segurança
   - Healthcheck

3. Variáveis de ambiente:
   - DATABASE_URL
   - NODE_ENV
   - PORT
```

### 10. Configurar CORS e Segurança

```
Configure CORS e segurança básica no backend NestJS:

1. CORS:
   - Permitir origem do frontend (configurável via env)
   - Métodos: GET, POST, PUT, DELETE
   - Headers permitidos

2. Helmet para headers de segurança

3. Rate limiting básico

4. Validação global de DTOs

5. Tratamento global de exceções

Gere o código necessário para o main.ts e módulos auxiliares.
```

---

## 🧪 Prompts de Teste

### Testar Endpoints do Backend

```
Gere um arquivo de testes (usando Jest ou arquivo .http) para testar:

1. CRUD de Colaboradores
2. Fluxo de solicitação de férias:
   - Criar colaborador
   - Verificar período aquisitivo gerado
   - Criar solicitação
   - Aprovar solicitação
   - Verificar saldo atualizado

3. Dashboard:
   - Métricas
   - Próximas saídas
   - Resumo por departamento

Inclua casos de erro (validação, não encontrado, etc.)
```

### Testar Integração Frontend-Backend

```
Crie um checklist de testes manuais para verificar:

1. Página inicial (Dashboard)
   - [ ] Carrega métricas corretamente
   - [ ] Mostra próximas saídas
   - [ ] Mostra resumo por departamento

2. Lista de Colaboradores
   - [ ] Carrega lista
   - [ ] Busca funciona
   - [ ] Filtro por departamento funciona

3. Detalhe do Colaborador
   - [ ] Mostra dados do colaborador
   - [ ] Mostra períodos aquisitivos
   - [ ] Mostra saldo correto

4. Cronograma
   - [ ] Carrega férias do mês
   - [ ] Navegação de meses funciona

5. Solicitações
   - [ ] Criar solicitação
   - [ ] Aprovar/Rejeitar
   - [ ] Verificar atualização do saldo
```

---

## 📝 Notas de Uso

1. **Ordem recomendada**: Execute os prompts na ordem numérica
2. **Contexto**: Sempre forneça o código existente quando o prompt pedir
3. **Iteração**: Se o resultado não estiver completo, peça refinamentos
4. **Validação**: Teste cada etapa antes de prosseguir para a próxima

---

## 🔗 Links Úteis

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma with NestJS](https://docs.nestjs.com/recipes/prisma)
- [NestJS CRUD Generator](https://docs.nestjs.com/recipes/crud-generator)
