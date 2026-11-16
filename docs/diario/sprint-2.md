# Diário – Sprint 2 (11/11 a 16/11/2026)

**Meta da sprint:** fechar o contrato da Cogmo (`/api/stations` e `/summary` ainda faltavam), ter dados de demonstração (seed), concluir o PI (CRUD de estações, dashboard, DER e MER) e deixar tudo pronto para a entrega de 17/11.

---

## Quarta, 11/11

Sem movimentação no repositório. O Márcio conferiu o GitHub e o Trello e combinou o prazo de quinta para os PRs de estações, seed e ajuste de operadores.

---

## Dia 4 – quinta, 12/11

| Quem | O que fez |
| --- | --- |
| Márcio (P5) | Reorganizou o Trello: as tarefas pendentes de cada um foram para a lista **Hoje**, com passo a passo e dicas de onde já havia código pronto. Revisou e testou os PRs do dia. |
| Daltro (P1) | PR #9: **seed repetível** com 4 estações (uma sem leituras, para mostrar série vazia), 4 operadores, 7 vínculos e 425 leituras com **lacunas de propósito**; comando `npm run db:fresh`; **DER e MER** em PNG (com os fontes `.dot`) e descrição completa do banco no README. |
| Laércio (P4) | PR #10: correções em operadores (edição parcial, vínculo com estação ou operador inexistente, id inválido). |
| Márcio (P5) | PR #11: o #10 entrou com uma linha faltando no `getById` e sem a função `delete` (buscar, editar, apagar e vincular operador davam 500). Substituiu pelo arquivo completo já testado: 22 casos de operadores sem nenhum 500. |
| Kyara (P2) | PR #12: `GET /api/stations` (ordem alfabética, com `updated_at`), `GET /api/stations/:id`, **`/summary`** (cada métrica com seu próprio horário; sem leitura → `null`), **CRUD de estações** (400/401/404/409, PUT parcial, UF e coordenadas validadas) e **`/dashboard`** (estação + leituras de 24 h com responsável + operadores, sem dados de contato). Também um **teste automático** (`npm run test:smoke`, 30 checagens) e um script de instalação para Ubuntu. |

**Decisões:**
- O seed tem uma estação sem leituras (`EST-004`) para provar que a API devolve `null` e série vazia em vez de inventar valor.
- O `/summary` traz o formato com unidade (`level`, `rain`) e os campos planos do contrato Cogmo (`level_m`, `rain_mm_h` e horários).
- O dashboard usa a mesma regra de janela da série (termina na última leitura da estação).

**Aprendizado:** o PR #10 foi aprovado sem rodar o código e quebrou operadores. A partir daí, todo PR passa por teste antes da aprovação (smoke test ou `requests/api.http`).

---

## Dia 5 – segunda, 16/11

| Quem | O que fez |
| --- | --- |
| Márcio (P5) | Revisou e testou o PR #12 junto com o `main` atual e o seed (smoke test 30/30) e fez o merge: **contrato da Cogmo completo**. Front básico em `public/index.html` (servido em `http://localhost:3000`): lista de estações, último nível e chuva, gráfico da série 24/48/72 h com as lacunas visíveis e operadores da estação. Este diário. Tag `v1.0`. |

---

## Review da sprint 2

| Item | Situação em 16/11 |
| --- | --- |
| `GET /api/stations` e `/summary` (contrato Cogmo) | ✅ PR #12 |
| `/series` de nível e chuva | ✅ (sprint 1) |
| Seed repetível com lacunas | ✅ PR #9 |
| CRUD das 3 entidades | ✅ estações (#12), leituras (#5), operadores (#3, #10, #11) |
| Relacionamentos 1:N, N:N e responsável | ✅ |
| Rota composta `/dashboard` | ✅ PR #12 |
| Autenticação JWT | ✅ |
| DER e MER | ✅ PR #9 |
| Swagger, `api.http`, README, roteiro da demo | ✅ |
| Teste automático (smoke test) | ✅ 30/30 |
| Front básico | ✅ extra, sugerido pelo professor |

## Retrospectiva

**Funcionou:**
- Cards com passo a passo e prazo claro destravaram as entregas: os três PRs pendentes chegaram no mesmo dia.
- Revisar testando pegou o problema do #10 antes da demo.
- O Swagger escrito antes das rotas de estação serviu de especificação: a implementação saiu no formato documentado.

**Travou:**
- Entregas concentradas no último dia do prazo deixaram pouca margem para revisão.
- Aprovação sem teste (#10) quebrou o `main` por cerca de uma hora.

**Para um próximo projeto:**
- Prazos intermediários menores (PR parcial no meio da semana).
- Ninguém aprova PR sem rodar `npm run test:smoke`.
