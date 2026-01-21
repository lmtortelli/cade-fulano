# Product Requirements Document (PRD)
## Offy - Sistema de Gestão de Férias e Ausências

**Versão:** 1.0  
**Data:** Janeiro 2026  
**Status:** MVP Implementado

---

## 1. Visão Geral do Produto

### 1.1 Objetivo
Offy é um sistema web para gerenciamento de férias e ausências de colaboradores em empresas de pequeno/médio porte (26-50 funcionários). O sistema permite controle completo do ciclo de férias, desde o período aquisitivo até a aprovação e histórico.

### 1.2 Problema a Resolver
- Dificuldade em acompanhar múltiplos períodos aquisitivos de férias
- Falta de visibilidade sobre saldos de férias pendentes
- Ausência de controle centralizado de folgas e ausências
- Risco de perda de férias por vencimento do período concessivo
- Falta de histórico de aprovações/rejeições

### 1.3 Proposta de Valor
- Visualização clara de todos os períodos aquisitivos por colaborador
- Alertas automáticos de vencimento de férias
- Workflow de aprovação/rejeição com histórico
- Cronograma visual integrado (férias + folgas)
- Exportação para Google Calendar

---

## 2. Público-Alvo

### 2.1 Usuários Primários
- **Gestores de RH**: Administram férias, aprovam solicitações
- **Gestores de Departamento**: Visualizam cronograma da equipe
- **Administradores**: Configuração geral do sistema

### 2.2 Usuários Secundários
- **Colaboradores**: Visualizam seu saldo e solicitam folgas (via página pública)

---

## 3. Requisitos Funcionais

### 3.1 Módulo de Colaboradores

| ID | Requisito | Prioridade |
|----|-----------|------------|
| COL-01 | Cadastro de colaborador com dados básicos (nome, email, cargo, departamento, data admissão) | Alta |
| COL-02 | Listagem com filtros por departamento | Alta |
| COL-03 | Filtro por vigência vencendo (colaboradores com saldo prestes a vencer) | Média |
| COL-04 | Edição e inativação de colaboradores | Alta |
| COL-05 | Visualização detalhada com todos os períodos aquisitivos | Alta |
| COL-06 | Geração automática de períodos aquisitivos baseado na data de admissão | Alta |

### 3.2 Módulo de Departamentos

| ID | Requisito | Prioridade |
|----|-----------|------------|
| DEP-01 | CRUD completo de departamentos | Alta |
| DEP-02 | Configuração de limite de ausências simultâneas | Média |
| DEP-03 | Sigla opcional para identificação rápida | Baixa |

### 3.3 Módulo de Períodos Aquisitivos

| ID | Requisito | Prioridade |
|----|-----------|------------|
| PER-01 | Geração automática de períodos (12 meses de trabalho = 1 período) | Alta |
| PER-02 | Cálculo automático de data limite de gozo (12 meses após fim do período aquisitivo) | Alta |
| PER-03 | Status do período: ATIVO, QUITADO, VENCIDO | Alta |
| PER-04 | Possibilidade de ignorar períodos antigos | Média |
| PER-05 | Campo de observações por período | Média |
| PER-06 | Alerta visual quando período está próximo de vencer (90 dias) | Alta |

### 3.4 Módulo de Solicitações de Férias

| ID | Requisito | Prioridade |
|----|-----------|------------|
| SOL-01 | Criar solicitação de gozo de férias (período + datas) | Alta |
| SOL-02 | Criar solicitação de venda de férias (abono pecuniário - máx 10 dias) | Alta |
| SOL-03 | Workflow de aprovação: PENDENTE → APROVADO/REJEITADO | Alta |
| SOL-04 | Motivo obrigatório ao rejeitar | Alta |
| SOL-05 | Cancelamento de solicitações pendentes ou aprovadas não iniciadas | Alta |
| SOL-06 | Motivo obrigatório ao cancelar | Alta |
| SOL-07 | Edição de solicitações pendentes | Média |
| SOL-08 | Histórico completo com datas e motivos | Alta |
| SOL-09 | Cálculo de saldo disponível em tempo real | Alta |
| SOL-10 | Validação de saldo antes de aprovar | Alta |

### 3.5 Módulo de Folgas

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FLG-01 | CRUD de folgas com múltiplos tipos | Alta |
| FLG-02 | Tipos: Feriado, Compensação, Abono, Licença, Cargo de Confiança, Outro | Alta |
| FLG-03 | Suporte a intervalo de datas (para licenças de múltiplos dias) | Alta |
| FLG-04 | Workflow de aprovação para solicitações | Alta |
| FLG-05 | Filtros por departamento, tipo, status e período | Média |
| FLG-06 | Página pública para colaboradores solicitarem folgas | Média |

### 3.6 Módulo de Cronograma

| ID | Requisito | Prioridade |
|----|-----------|------------|
| CRO-01 | Visualização em calendário mensal | Alta |
| CRO-02 | Exibição de férias e folgas integradas | Alta |
| CRO-03 | Cores por departamento | Média |
| CRO-04 | Filtros por colaboradores (múltiplos) | Alta |
| CRO-05 | Filtros por departamentos (múltiplos) | Alta |
| CRO-06 | Filtro por tipo de evento (Férias/Folgas/Todos) | Média |
| CRO-07 | Modal de detalhes ao clicar em dia com muitos eventos | Média |
| CRO-08 | Exportação individual para Google Calendar | Alta |
| CRO-09 | Exportação em lote (.ics) | Média |

### 3.7 Dashboard

| ID | Requisito | Prioridade |
|----|-----------|------------|
| DSH-01 | Cards de estatísticas (total colaboradores, em férias hoje, pendentes) | Alta |
| DSH-02 | Lista de próximas saídas | Alta |
| DSH-03 | Resumo por departamento | Média |
| DSH-04 | Estado de boas-vindas quando não há dados | Baixa |

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance
- Tempo de carregamento inicial < 3 segundos
- Resposta de API < 500ms
- Suporte a até 50 colaboradores (plano atual)

### 4.2 Usabilidade
- Interface responsiva (desktop prioritário)
- Feedback visual para todas as ações
- Confirmação para ações destrutivas
- Mensagens de erro claras

### 4.3 Segurança
- Validação de dados no frontend e backend
- Sanitização de inputs
- Proteção contra SQL injection (via ORM)

### 4.4 Manutenibilidade
- Arquitetura em camadas (preparada para migração)
- Código TypeScript tipado
- Separação clara entre regras de negócio e infraestrutura

---

## 5. Arquitetura Técnica

### 5.1 Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Estilização | Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| ORM | Prisma |
| Banco de Dados | MySQL 8.0 |
| Containerização | Docker, Docker Compose |

### 5.2 Estrutura de Camadas

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Controllers)
│   └── [pages]/           # Páginas React
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn)
│   ├── layout/           # Layout (Header, Sidebar)
│   ├── modals/           # Modais reutilizáveis
│   └── dashboard/        # Componentes específicos
├── core/                  # Camada de Domínio
│   ├── types/            # Interfaces e Enums
│   ├── repositories/     # Interfaces de Repositórios
│   └── services/         # Regras de Negócio
├── infrastructure/        # Camada de Infraestrutura
│   ├── database/         # Prisma Client e Repositórios
│   └── container.ts      # Injeção de Dependências
└── lib/                   # Utilitários
```

### 5.3 Modelo de Dados

```
┌─────────────────┐     ┌─────────────────────┐
│  Departamento   │     │    Colaborador      │
├─────────────────┤     ├─────────────────────┤
│ id              │◄────│ departamentoId      │
│ nome            │     │ nome, email, cargo  │
│ sigla           │     │ dataAdmissao        │
│ limiteAusencias │     │ ativo               │
└─────────────────┘     └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
          ┌─────────▼─────────┐         ┌────────▼────────┐
          │ PeriodoAquisitivo │         │      Folga      │
          ├───────────────────┤         ├─────────────────┤
          │ numeroPeriodo     │         │ dataInicio      │
          │ dataInicio/Fim    │         │ dataFim         │
          │ dataLimiteGozo    │         │ tipo            │
          │ diasDireito       │         │ status          │
          │ diasVendidos      │         │ descricao       │
          │ status, ignorado  │         └─────────────────┘
          │ observacoes       │
          └─────────┬─────────┘
                    │
          ┌─────────▼─────────┐
          │ SolicitacaoFerias │
          ├───────────────────┤
          │ tipo (GOZO/ABONO) │
          │ status            │
          │ dataInicio/Fim    │
          │ diasGozo          │
          │ motivoRejeicao    │
          │ motivoCancelamento│
          └───────────────────┘
```

---

## 6. Regras de Negócio

### 6.1 Períodos Aquisitivos
- Cada 12 meses de trabalho gera direito a 30 dias de férias
- O período concessivo (para gozar) é de 12 meses após o fim do período aquisitivo
- Após o período concessivo, as férias são consideradas vencidas

### 6.2 Venda de Férias (Abono Pecuniário)
- Máximo de 10 dias (1/3 do período) podem ser vendidos
- A venda pode ser registrada a qualquer momento do período

### 6.3 Cálculo de Saldo
```
diasDisponiveis = diasDireito 
                - diasVendidos (no período)
                - diasGozados (solicitações GOZO aprovadas)
                - diasVendidosViaSolicitacao (solicitações ABONO aprovadas)
                - diasPendentes (solicitações pendentes)
```

### 6.4 Cancelamento de Solicitações
- Solicitações PENDENTES podem ser canceladas a qualquer momento
- Solicitações APROVADAS só podem ser canceladas se ainda não iniciaram
- Motivo é obrigatório para cancelamento

### 6.5 Folgas com Intervalo
- Folgas de um dia têm apenas dataInicio
- Licenças e ausências prolongadas usam dataInicio e dataFim
- No cronograma, aparecem em todos os dias do intervalo

---

## 7. Fluxos Principais

### 7.1 Fluxo de Agendamento de Férias
```
1. Gestor seleciona colaborador
2. Sistema exibe períodos disponíveis com saldo
3. Gestor escolhe período e datas
4. Sistema calcula dias automaticamente
5. Solicitação criada como PENDENTE (ou APROVADO direto)
6. Se pendente: Gestor aprova ou rejeita
7. Sistema atualiza saldo
```

### 7.2 Fluxo de Solicitação de Folga (Público)
```
1. Colaborador acessa /solicitar-folga
2. Seleciona seu nome na lista
3. Preenche tipo, data(s) e descrição
4. Solicitação criada como PENDENTE
5. Gestor visualiza em /folgas
6. Gestor aprova ou rejeita (com motivo)
```

---

## 8. Interfaces (Páginas)

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard com visão geral |
| `/colaboradores` | Lista de colaboradores com filtros |
| `/colaboradores/[id]` | Detalhes do colaborador e períodos |
| `/departamentos` | CRUD de departamentos |
| `/solicitacoes` | Lista de solicitações com ações |
| `/cronograma` | Calendário visual |
| `/folgas` | Gestão de folgas |
| `/solicitar-folga` | Formulário público (não listado no menu) |

---

## 9. Componentes Modais

| Modal | Uso |
|-------|-----|
| ColaboradorModal | Criar/Editar colaborador |
| DepartamentoModal | Criar/Editar departamento |
| FeriasModal | Criar solicitação de férias/venda |
| EditarFeriasModal | Editar solicitação pendente |
| FolgaModal | Criar/Editar folga |
| ObservacoesPeriodoModal | Editar observações do período |
| RejeicaoModal | Informar motivo de rejeição |
| CancelamentoModal | Informar motivo de cancelamento |
| ConfirmModal | Confirmação genérica |

---

## 10. APIs Disponíveis

### 10.1 Colaboradores
```
GET    /api/colaboradores          - Listar (com filtros)
POST   /api/colaboradores          - Criar
GET    /api/colaboradores/[id]     - Buscar por ID
PUT    /api/colaboradores/[id]     - Atualizar
DELETE /api/colaboradores/[id]     - Excluir
GET    /api/colaboradores/[id]/saldo - Saldo detalhado
```

### 10.2 Departamentos
```
GET    /api/departamentos          - Listar
POST   /api/departamentos          - Criar
GET    /api/departamentos/[id]     - Buscar
PUT    /api/departamentos/[id]     - Atualizar
DELETE /api/departamentos/[id]     - Excluir
```

### 10.3 Solicitações
```
GET    /api/solicitacoes           - Listar (com filtros)
POST   /api/solicitacoes           - Criar
GET    /api/solicitacoes/[id]      - Buscar
PUT    /api/solicitacoes/[id]      - Atualizar
POST   /api/solicitacoes/[id]/aprovar   - Aprovar
POST   /api/solicitacoes/[id]/rejeitar  - Rejeitar
POST   /api/solicitacoes/[id]/cancelar  - Cancelar
```

### 10.4 Períodos
```
GET    /api/periodos/[id]          - Buscar
PUT    /api/periodos/[id]          - Atualizar (observações)
POST   /api/periodos/[id]/ignorar  - Toggle ignorar
```

### 10.5 Folgas
```
GET    /api/folgas                 - Listar (com filtros)
POST   /api/folgas                 - Criar
GET    /api/folgas/[id]            - Buscar
PUT    /api/folgas/[id]            - Atualizar
DELETE /api/folgas/[id]            - Excluir
POST   /api/folgas/[id]/aprovar    - Aprovar
POST   /api/folgas/[id]/rejeitar   - Rejeitar
```

### 10.6 Utilitários
```
GET    /api/dashboard              - Dados do dashboard
GET    /api/stats                  - Estatísticas gerais
```

---

## 11. Roadmap Futuro

### Fase 2 - Melhorias
- [ ] Autenticação e autorização por papéis
- [ ] Notificações por email
- [ ] Relatórios em PDF
- [ ] Importação de dados em massa
- [ ] App mobile (PWA)

### Fase 3 - Escalabilidade
- [ ] Migração do backend para aplicação separada
- [ ] Multi-tenancy (múltiplas empresas)
- [ ] Integração com sistemas de folha de pagamento
- [ ] API pública documentada

---

## 12. Considerações Técnicas

### 12.1 Tratamento de Datas
- Datas são armazenadas como UTC no banco
- Frontend usa `parseLocalDate()` para evitar problemas de timezone
- APIs recebem strings YYYY-MM-DD e adicionam "T12:00:00" antes de converter

### 12.2 Compatibilidade de Enums
- Prisma gera enums próprios incompatíveis com TypeScript
- Solução: Type casting explícito nos repositórios

### 12.3 Preparação para Migração
- Camada `core/` contém apenas lógica de negócio pura
- Camada `infrastructure/` isola dependências externas
- Container de DI facilita troca de implementações

---

## 13. Ambiente de Desenvolvimento

### 13.1 Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (opcional, para desenvolvimento local)

### 13.2 Comandos

```bash
# Iniciar ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Aplicar migrations
docker exec feriaspro-app-dev npx prisma db push

# Popular banco com dados iniciais
docker exec feriaspro-app-dev npx tsx prisma/seed.ts

# Ver logs
docker logs -f feriaspro-app-dev

# Reiniciar aplicação
docker restart feriaspro-app-dev
```

### 13.3 Variáveis de Ambiente
```env
DATABASE_URL=mysql://user:pass@host:3306/dbname
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Histórico de Versões

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0 | Jan/2026 | MVP inicial com todas as funcionalidades base |

---

*Documento gerado como template para novos projetos similares.*
