# System Prompt - Offy

> Use este prompt no início de novos chats para carregar o contexto do projeto.

---

## Prompt para Copiar:

```
Você está trabalhando no projeto "Offy", um sistema de gestão de férias e ausências.

**Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, MySQL, Docker.

**Arquitetura em camadas**:
- `src/app/api/` - API Routes (controllers)
- `src/core/services/` - Regras de negócio
- `src/core/repositories/` - Interfaces de dados
- `src/infrastructure/database/repositories/` - Implementações Prisma
- `src/components/modals/` - Modais reutilizáveis

**Modelos principais**:
- Colaborador (nome, email, cargo, departamento, períodos aquisitivos)
- PeriodoAquisitivo (30 dias/ano, pode ser ignorado, status)
- SolicitacaoFerias (GOZO ou ABONO_PECUNIARIO, status: PENDENTE/APROVADO/REJEITADO/CANCELADO)
- Folga (tipos: FERIADO, COMPENSACAO, LICENCA, ATESTADO, CARGO_CONFIANCA, OUTROS; status com aprovação)
- Departamento (nome, sigla, limite de ausências)

**Convenções importantes**:
1. Datas: Usar `parseLocalDate()` de `@/lib/utils` para evitar problemas de timezone
2. Enums: Fazer type casting entre Prisma enums e TypeScript enums nos repositories
3. Cálculo de saldo: `diasDisponiveis = diasDireito - diasVendidos - diasGozados - diasVendidosViaSolicitacao - diasPendentes`

**Funcionalidades**:
- CRUD de colaboradores, departamentos, solicitações, folgas
- Aprovação/Rejeição/Cancelamento com motivos
- Edição de solicitações pendentes
- Cronograma visual com filtros múltiplos
- Exportação para Google Calendar
- Página pública /solicitar-folga

**Para rodar**: `docker-compose -f docker-compose.dev.yml up -d`

Leia o arquivo `docs/prompt/CONTEXT.md` para contexto completo.
```

---

## Comandos Úteis

```bash
# Subir ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker logs -f feriaspro-app-dev

# Reiniciar após mudanças
docker restart feriaspro-app-dev

# Executar migrations
docker exec -it feriaspro-app-dev npx prisma db push

# Executar seed
docker exec -it feriaspro-app-dev npx tsx prisma/seed.ts

# Acessar container
docker exec -it feriaspro-app-dev sh
```

## Arquivos-Chave para Referência

| Quando precisar de... | Veja o arquivo |
|-----------------------|----------------|
| Schema do banco | `prisma/schema.prisma` |
| Tipos e interfaces | `src/core/types/index.ts` |
| Regras de férias | `src/core/services/solicitacao-ferias.service.ts` |
| Cálculo de saldo | `src/core/services/colaborador.service.ts` |
| Utilitários de data | `src/lib/utils.ts` |
| Container DI | `src/infrastructure/container.ts` |
