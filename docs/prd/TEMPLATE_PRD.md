# Template de PRD (Product Requirements Document)

**Versão:** 1.0  
**Data:** [DATA]  
**Status:** [Rascunho | Em Revisão | Aprovado | Implementado]  
**Autor:** [NOME]

---

## 1. Visão Geral do Produto

### 1.1 Nome do Produto
[Nome do sistema/aplicação]

### 1.2 Objetivo
[Descreva em 2-3 frases o propósito principal do produto]

### 1.3 Problema a Resolver
- [Problema 1]
- [Problema 2]
- [Problema 3]

### 1.4 Proposta de Valor
- [Benefício 1]
- [Benefício 2]
- [Benefício 3]

---

## 2. Público-Alvo

### 2.1 Usuários Primários
- **[Tipo de usuário 1]**: [Descrição do que faz]
- **[Tipo de usuário 2]**: [Descrição do que faz]

### 2.2 Usuários Secundários
- **[Tipo de usuário]**: [Descrição do que faz]

### 2.3 Personas (Opcional)
| Persona | Descrição | Necessidades |
|---------|-----------|--------------|
| [Nome] | [Perfil] | [O que precisa] |

---

## 3. Requisitos Funcionais

### 3.1 Módulo [Nome do Módulo 1]

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| XX-01 | [Descrição] | Alta/Média/Baixa | [Como validar] |
| XX-02 | [Descrição] | Alta/Média/Baixa | [Como validar] |

### 3.2 Módulo [Nome do Módulo 2]

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| XX-01 | [Descrição] | Alta/Média/Baixa | [Como validar] |

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance
- [Requisito de performance 1]
- [Requisito de performance 2]

### 4.2 Usabilidade
- [Requisito de UX 1]
- [Requisito de UX 2]

### 4.3 Segurança
- [Requisito de segurança 1]
- [Requisito de segurança 2]

### 4.4 Escalabilidade
- [Requisito de escala 1]

### 4.5 Manutenibilidade
- [Requisito de manutenção 1]

---

## 5. Arquitetura Técnica

### 5.1 Stack Tecnológico Recomendado

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Frontend | [Tech] | [Por quê] |
| Backend | [Tech] | [Por quê] |
| Banco de Dados | [Tech] | [Por quê] |
| Infraestrutura | [Tech] | [Por quê] |

### 5.2 Estrutura de Pastas Sugerida

```
src/
├── app/                    # Páginas e rotas
├── components/             # Componentes React
│   ├── ui/                # Componentes base
│   ├── layout/            # Layout (Header, Sidebar)
│   └── modals/            # Modais reutilizáveis
├── core/                   # Camada de Domínio
│   ├── types/             # Interfaces e Enums
│   ├── repositories/      # Interfaces de Repositórios
│   └── services/          # Regras de Negócio
├── infrastructure/         # Camada de Infraestrutura
│   └── database/          # Implementações de persistência
└── lib/                    # Utilitários
```

### 5.3 Modelo de Dados (ERD Simplificado)

```
[Desenhe o relacionamento entre entidades principais]

Entidade1 ──1:N──► Entidade2
    │
    └──1:N──► Entidade3
```

---

## 6. Regras de Negócio

### 6.1 [Regra/Domínio 1]
- [Descrição da regra]
- [Fórmula se aplicável]
- [Exceções]

### 6.2 [Regra/Domínio 2]
- [Descrição da regra]

---

## 7. Fluxos Principais

### 7.1 [Nome do Fluxo 1]
```
1. [Passo 1]
2. [Passo 2]
3. [Decisão]
   - Se X: [Ação A]
   - Se Y: [Ação B]
4. [Conclusão]
```

### 7.2 [Nome do Fluxo 2]
```
1. [Passo 1]
2. [Passo 2]
```

---

## 8. Interfaces (Wireframes/Páginas)

| Rota | Descrição | Funcionalidades |
|------|-----------|-----------------|
| `/` | [Descrição] | [Lista de features] |
| `/[pagina]` | [Descrição] | [Lista de features] |

---

## 9. APIs

### 9.1 [Recurso 1]
```
GET    /api/[recurso]          - [Descrição]
POST   /api/[recurso]          - [Descrição]
GET    /api/[recurso]/[id]     - [Descrição]
PUT    /api/[recurso]/[id]     - [Descrição]
DELETE /api/[recurso]/[id]     - [Descrição]
```

### 9.2 Formato de Resposta Padrão
```json
{
  "data": {},
  "error": null,
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

---

## 10. Integrações Externas

| Sistema | Tipo | Descrição |
|---------|------|-----------|
| [Sistema] | [API/Webhook/OAuth] | [O que faz] |

---

## 11. Métricas de Sucesso (KPIs)

| Métrica | Meta | Como Medir |
|---------|------|------------|
| [Métrica 1] | [Valor] | [Método] |
| [Métrica 2] | [Valor] | [Método] |

---

## 12. Roadmap

### Fase 1 - MVP (X semanas)
- [ ] [Feature 1]
- [ ] [Feature 2]
- [ ] [Feature 3]

### Fase 2 - Melhorias (X semanas)
- [ ] [Feature 4]
- [ ] [Feature 5]

### Fase 3 - Escala (X semanas)
- [ ] [Feature 6]

---

## 13. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| [Risco 1] | Alto/Médio/Baixo | Alta/Média/Baixa | [Ação] |
| [Risco 2] | Alto/Médio/Baixo | Alta/Média/Baixa | [Ação] |

---

## 14. Glossário

| Termo | Definição |
|-------|-----------|
| [Termo 1] | [Definição] |
| [Termo 2] | [Definição] |

---

## 15. Referências

- [Link para documentação técnica]
- [Link para designs]
- [Link para pesquisas]

---

## Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | [Data] | [Nome] | Versão inicial |

---

## Aprovações

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Product Owner | | | |
| Tech Lead | | | |
| Stakeholder | | | |

---

*Template criado com base no projeto Offy*
