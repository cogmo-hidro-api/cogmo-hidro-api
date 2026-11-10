# Diário – Sprint 1 (03/11 a 10/11/2026)

**Meta da sprint:** contrato da Cogmo funcionando (`/api/stations`, `/summary`, `/series` de nível e de chuva) com banco, autenticação e padrão de erros prontos.

**Ferramentas:** quadro no Trello (*PI Cogmo – API Hidro*) com um card por tarefa e a lista 📓 Diário; repositório na organização `cogmo-hidro-api` no GitHub com o `main` protegido (todo código entra por Pull Request com 1 aprovação).

**Encontros:** terças e quintas. Quem pode adianta nos outros dias.

---

## Dia 1 – terça, 03/11

| Quem | O que fez |
| --- | --- |
| Márcio (P5) | Criou o quadro do Trello com os cards da sprint, a organização e o repositório no GitHub, o esqueleto do projeto (`/api/health` respondendo), a proteção do `main` e os convites. Começou o `errorHandler` + `AppError` (adiantando o dia 2). |
| Kyara (P2) | Preencheu a tabela da equipe no README (PR #1). |
| Todos | Leitura dos dois PDFs (Cogmo e PI) e do plano do projeto. |

**Decisões:**
- Nomes de tabelas e rotas em inglês, para casar com o contrato da Cogmo (`/api/stations`).
- 3 entidades do PI: Estação, Observação (leitura) e Operador; `users` só para login.
- Arquitetura em camadas: routes → controllers → services → repositories.

**Travado em:** o integrante do P3 (Observações + Série) não entrou no GitHub nem no Trello. Combinado: se não houvesse retorno até quinta, as tarefas seriam redistribuídas.

---

## Dia 2 – quinta, 05/11

| Quem | O que fez |
| --- | --- |
| Márcio (P5) | PR #2 aprovado e mergeado: `errorHandler`, `AppError` e 404 padrão no formato `{ error: { code, message } }`. Revisou o PR #3. |
| Laércio (P4) | PR #3: cadastro e login com bcrypt + JWT, middleware de autenticação, CRUD de operadores e vínculo N:N estação ↔ operador. Também subiu a migration `001_init.sql` com as 5 tabelas. Ajustou o PR em 3 rodadas de revisão (rotas no `app.js`, uso do `AppError`, JWT sem segredo fixo, nome da migration). |

**Decisões:**
- Erro previsto sempre lançado com `AppError` (nunca `throw {}`), para não virar 500.
- `JWT_SECRET` só pelo `.env`, sem valor fixo no código.

---

## Dia extra – sexta, 06/11

| Quem | O que fez |
| --- | --- |
| Márcio (P3 + P5) | Assumiu a parte do P3. PR #4: validadores (`parseId`, `parseMetric`, `parseHours`), middleware de dados simulados e rota `/api/stations/:id/series`. PR #5: CRUD de leituras, leituras por estação (1:N) e operador responsável pela leitura. Configurou o ambiente no próprio PC (Windows: Git Bash e ferramentas de compilação do `better-sqlite3`). |

**Decisões (registradas também no README):**
- A janela de horas da série termina na **última leitura da estação**, não no relógio do servidor, porque o seed usa datas fixas.
- Intervalo da série `(from, to]`, pontos em ordem crescente e **lacunas não preenchidas**.
- Horário sempre em UTC ISO 8601 sem milissegundos (`2026-11-03T12:00:00Z`).
- A unidade sai da métrica (`level` → m, `rain` → mm/h); o cliente não escolhe.
- Leitura repetida (mesma estação, métrica e horário) → 409.

---

## Domingo, 08/11

| Quem | O que fez |
| --- | --- |
| Laércio (P4) | Revisou e aprovou os PRs #4 e #5 (série e leituras), que entraram no `main`. |

---

## Dia 3 – terça, 10/11

| Quem | O que fez |
| --- | --- |
| Márcio (P5) | Revisão geral do `main` contra o checklist final do plano (teste de todas as rotas). PR #7: aviso de dados simulados em toda a API, rota pública de responsável sem e-mail/telefone, `requests/api.http` com todas as rotas e casos de erro, README com equipe e tabela de rotas. Swagger em `/api/docs`, este diário e o roteiro da demonstração. |
| Laércio (P4) | Começou as correções em operadores apontadas na revisão (edição parcial e vínculo com estação ou operador inexistente, que davam 500) e a revisão do PR #7. |

---

## Review da sprint 1

| Item da meta | Situação em 10/11 |
| --- | --- |
| Banco (migration, FK em toda conexão, CHECK, UNIQUE, índice) | ✅ |
| Autenticação JWT + escrita protegida | ✅ |
| Padrão de erro + aviso de dados simulados | ✅ |
| `/series` (level e rain, 1 a 72 h, lacunas) | ✅ |
| CRUD de leituras, operadores e relacionamentos | ✅ |
| `/api/stations`, `/summary`, CRUD de estações, `/dashboard` | ⏳ sprint 2 (Kyara) |
| Seed repetível com lacunas, DER e MER | ⏳ sprint 2 (Daltro) |

## Retrospectiva

**Funcionou:**
- Main protegido + revisão de PR pegou erros antes de entrarem (conflito resolvido errado no `app.js`, `throw {}` virando 500, segredo fixo de JWT).
- Um card por tarefa no Trello deixou claro quem estava com o quê.
- Camadas separadas: cada um mexe em arquivos diferentes, quase sem conflito.

**Travou:**
- Um integrante não participou; a parte dele foi assumida pelo Márcio no dia 06/11.
- Ambiente no Windows (política do PowerShell e compilação do `better-sqlite3`) tomou tempo.
- Seed e rotas de estações atrasaram, o que deixou a demo sem dados até agora.

**Muda na sprint 2:**
- Prazo intermediário: PRs de estações e seed até quinta, 12/11.
- Congelamento no domingo, 15/11: depois disso, só correção e documentação.
- Clone limpo do zero e ensaio da demo na segunda, 16/11.
