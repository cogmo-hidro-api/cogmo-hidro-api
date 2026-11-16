# API de Monitoramento Hidrológico – Cogmo

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/) [![Express](https://img.shields.io/badge/Express-5-000000.svg?logo=express)](https://expressjs.com/) [![SQLite](https://img.shields.io/badge/SQLite-003B57.svg?logo=sqlite&logoColor=white)](https://www.sqlite.org/) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ⚠️ **Dados simulados.** As estações e leituras desta API são fictícias, usadas apenas para fins didáticos. Não descrevem rios reais e não podem embasar alertas ou decisões.

## Instituições de Fomento e Parceria

[![Website IFB](https://img.shields.io/badge/Website-IFB-%23508C3C.svg?labelColor=%23C8102E)](https://www.ifb.edu.br/) [![Website ihwbr](https://img.shields.io/badge/Website-ihwbr-%23DAA520.svg?labelColor=%232E2E2E)](https://hardware.org.br/)

## Orientador

Prof. Tiago Segato

## Equipe

| Papel | Integrante | GitHub |
| --- | --- | --- |
| P1 · Banco de dados | Daltro Oliveira Vinuto | https://github.com/Daltro-Oliveira-Vinuto |
| P2 · Estações + Dashboard | Kyara Esteves de Sousa | https://github.com/Kyara2 |
| P3 · Observações + Série | Márcio Liberato (assumiu a parte) | [@mvictorliberato-maker](https://github.com/mvictorliberato-maker) |
| P4 · Autenticação + Operadores | Laércio | [@Laercio13](https://github.com/Laercio13) |
| P5 · Tech lead / QA / Documentação | Márcio Liberato | [@mvictorliberato-maker](https://github.com/mvictorliberato-maker) |

## Sumário

- [Visão Geral](#visão-geral)
- [Pacotes Utilizados](#pacotes-utilizados)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Diagrama de Banco de Dados](#diagrama-de-banco-de-dados)
- [Documentação da API](#documentação-da-api)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Decisões Técnicas](#decisões-técnicas)
- [Deploy](#deploy-opcional)

## Visão Geral

API REST que lista estações hidrológicas fictícias e entrega leituras de **nível de rio (m)** e **chuva (mm/h)** ao longo do tempo. Desenvolvida para o desafio de formação da Cogmo Technology e para o Projeto Integrador do curso de back-end.

O sistema gerencia três entidades relacionadas:

- **Estação** – ponto de monitoramento (rio, município, coordenadas)
- **Observação** – leitura de nível ou chuva em um horário UTC
- **Operador** – técnico, supervisor ou pesquisador vinculado às estações

Também oferece autenticação JWT para proteger as rotas de escrita.

## Pacotes Utilizados

| Pacote | Versão | Descrição |
| --- | --- | --- |
| express | ^5 | Servidor HTTP e rotas |
| better-sqlite3 | ^13 | Acesso ao banco SQLite |
| jsonwebtoken | ^9 | Geração e validação de tokens JWT |
| bcryptjs | ^3 | Hash de senhas |
| dotenv | ^18 | Variáveis de ambiente |
| cors | ^2 | Liberação de acesso para o frontend local |
| swagger-ui-express | ^5 | Documentação interativa da API |
| nodemon (dev) | ^3 | Reinício automático em desenvolvimento |

> **Nota:** consulte o `package.json` para a lista completa e as versões exatas.

## Estrutura do Projeto

```
cogmo-hidro-api/
├── package.json
├── .env.example
├── docs/
│   ├── der.png               # Diagrama Entidade-Relacionamento
│   ├── mer.png               # Modelo conceitual
│   ├── roteiro-demo.md       # Roteiro da apresentação
│   └── diario/               # Diário de trabalho por sprint
├── requests/
│   └── api.http              # Chamadas de teste prontas
└── src/
    ├── server.js             # Sobe o servidor
    ├── app.js                # Configura Express, middlewares e rotas
    ├── config/               # Leitura de variáveis de ambiente
    ├── docs/                 # Especificação OpenAPI (Swagger em /api/docs)
    ├── database/             # Conexão, migrations e seed
    ├── middlewares/          # Autenticação, aviso de dados simulados, erros
    ├── utils/                # Validadores e classe de erro
    ├── routes/               # Definição das rotas
    ├── controllers/          # Recebem a requisição e devolvem a resposta
    ├── services/             # Regras de negócio
    └── repositories/         # Consultas SQL parametrizadas
```

## Diagrama de Banco de Dados

![Diagrama de Banco de Dados](docs/der.png)

Modelo conceitual (MER): [`docs/mer.png`](docs/mer.png). Os fontes dos dois diagramas estão em `docs/der.dot` e `docs/mer.dot` (Graphviz: `dot -Tpng docs/der.dot -o docs/der.png`).

> **Descrição:** o banco tem **5 tabelas**, definidas em `src/database/migrations/001_init.sql`.
>
> - **`stations`** (Estação): ponto de monitoramento. `id` é a chave primária numérica usada nas rotas; `code` (ex.: `EST-001`) é o código de negócio e é `UNIQUE`.
> - **`observations`** (Leitura): uma medição de `level` (m) ou `rain` (mm/h) em um horário `observed_at` (texto ISO 8601 UTC).
> - **`operators`** (Operador): técnico, supervisor ou pesquisador (`CHECK` no `type`); `email` é `UNIQUE`.
> - **`station_operators`**: tabela associativa da relação N:N, com a função (`role`) de cada operador na estação.
> - **`users`**: só para login (JWT); não se relaciona com as outras.
>
> **Relacionamentos**
>
> | Relação | Como é feita | Ao apagar |
> | --- | --- | --- |
> | 1:N Estação → Leituras | `observations.station_id` → `stations.id` (`NOT NULL`) | apagar a estação apaga as leituras (`ON DELETE CASCADE`) |
> | N:N Estação ↔ Operador | `station_operators (station_id, operator_id)`, chave primária composta | apagar estação ou operador apaga só o vínculo (`CASCADE`) |
> | 1:N Operador → Leituras (responsável) | `observations.responsible_id` → `operators.id` (opcional, `NULL` permitido) | apagar o operador deixa a leitura sem responsável (`ON DELETE SET NULL`) |
>
> **Campos críticos e garantias do banco**
>
> - `CHECK (metric IN ('level','rain'))` e `CHECK` que amarra a unidade à métrica (`level` só com `m`, `rain` só com `mm/h`): o banco recusa nível e chuva misturados.
> - `UNIQUE (station_id, metric, observed_at)`: impede a mesma leitura duas vezes (é o que torna o seed repetível e gera o 409 na API).
> - Índice `idx_obs_series (station_id, metric, observed_at)`: atende as consultas de série, resumo e dashboard.
> - `PRAGMA foreign_keys = ON` em toda conexão (`src/database/connection.js`); no SQLite as FKs vêm desligadas por padrão.

```mermaid
erDiagram
    stations ||--o{ observations : "registra (station_id)"
    stations ||--o{ station_operators : "tem"
    operators ||--o{ station_operators : "atua em"
    operators |o--o{ observations : "responsável (responsible_id)"
    stations {
        INTEGER id PK
        TEXT code UK
        TEXT name
        TEXT river
        TEXT municipality
        TEXT state
        REAL latitude
        REAL longitude
    }
    observations {
        INTEGER id PK
        INTEGER station_id FK
        TEXT metric "level | rain"
        REAL value
        TEXT unit "m | mm/h"
        TEXT observed_at "ISO 8601 UTC"
        INTEGER responsible_id FK "pode ser NULL"
    }
    operators {
        INTEGER id PK
        TEXT name
        TEXT email UK
        TEXT phone
        TEXT type "tecnico | supervisor | pesquisador"
    }
    station_operators {
        INTEGER station_id PK, FK
        INTEGER operator_id PK, FK
        TEXT role
        TEXT linked_at
    }
```

### Dados do seed (`npm run db:seed`)

O seed (`src/database/seed.js`) grava dados **fictícios e determinísticos** (datas fixas, sem depender do relógio), todos dentro de uma única transação:

| Conteúdo | Quantidade | Observação |
| --- | --- | --- |
| Estações | 4 | `EST-001` a `EST-003` com leituras; `EST-004` (Estação Dourada) **sem leituras**, para mostrar resumo com `null` e série vazia |
| Operadores | 4 | Ana (técnica), Bruno (supervisor), Carla (pesquisadora), Diego (técnico) |
| Vínculos N:N | 7 | cada estação com 1 ou 2 operadores e sua função |
| Leituras | 425 | 73 horários por métrica (de `2026-11-07T12:00:00Z` a `2026-11-10T12:00:00Z`), menos as lacunas |

**Lacunas de propósito** (horários que simplesmente não existem no banco, para provar que a API não inventa leitura):

- `EST-001`: nível sem `06:00Z` e `07:00Z` do dia 10/11 (aparece na série de 24 h); chuva sem `02:00Z` do dia 10/11.
- `EST-002`: nível sem `21:00Z` do dia 09/11.
- `EST-002`: também chuva sem 6 horas seguidas (`06:00Z` a `11:00Z` do dia 09/11, visível na janela de 72 h).
- `EST-003`: sensor de nível parou às `10:00Z` do dia 10/11, enquanto a chuva vai até `12:00Z` (no resumo, cada métrica tem seu próprio horário); chuva sem `09:00Z` do dia 10/11.

As leituras de nível têm a operadora técnica da estação como responsável; as de chuva vêm de pluviômetro automático e ficam com `responsible_id = NULL`.

**Repetível:** cada `INSERT` usa `ON CONFLICT ... DO NOTHING` sobre uma chave única (`code`, `email`, `(station_id, operator_id)` e `(station_id, metric, observed_at)`). Rodar o seed de novo mostra `inseridos_agora = 0` em todas as tabelas e o total não muda. Para recomeçar do zero: `npm run db:fresh`.

## Documentação da API

A documentação interativa fica em **`http://localhost:3000/api/docs`** (Swagger UI) com o servidor rodando. Para testar rotas com cadeado, faça login em `POST /auth/login`, copie o `token` e clique em **Authorize**. A especificação está em [`src/docs/openapi.js`](src/docs/openapi.js).

### Endpoints Principais

Leitura de estações e leituras é pública; toda escrita exige `Authorization: Bearer <token>`. Rotas de operadores exigem token em tudo, porque têm e-mail e telefone. Exemplos prontos de cada chamada (inclusive os erros) estão em [`requests/api.http`](requests/api.http).

**Contrato Cogmo**

| Método | Endpoint | Descrição | Autenticação |
| --- | --- | --- | --- |
| GET | `/api/stations` | Lista as estações | Pública |
| GET | `/api/stations/{id}/summary` | Última leitura de nível (m) e de chuva (mm/h) | Pública |
| GET | `/api/stations/{id}/series?metric=level&hours=24` | Série de nível (m), `hours` de 1 a 72 | Pública |
| GET | `/api/stations/{id}/series?metric=rain&hours=24` | Série de chuva (mm/h), `hours` de 1 a 72 | Pública |

**Autenticação**

| Método | Endpoint | Descrição | Autenticação |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Cria usuário (senha com bcrypt) | Pública |
| POST | `/api/auth/login` | Retorna token JWT (validade 1 h) | Pública |

**CRUD das 3 entidades**

| Método | Endpoint | Descrição | Autenticação |
| --- | --- | --- | --- |
| GET | `/api/stations/{id}` | Busca uma estação | Pública |
| POST / PUT / DELETE | `/api/stations` · `/api/stations/{id}` | Cria, edita e remove estação | Token |
| GET | `/api/observations?station_id=&metric=` | Lista leituras (filtros opcionais) | Pública |
| GET | `/api/observations/{id}` | Busca uma leitura | Pública |
| POST / PUT / DELETE | `/api/observations` · `/api/observations/{id}` | Cria, edita e remove leitura | Token |
| GET / POST / PUT / DELETE | `/api/operators` · `/api/operators/{id}` | CRUD de operadores | Token |

**Relacionamentos e rota composta**

| Método | Endpoint | Relação | Autenticação |
| --- | --- | --- | --- |
| GET | `/api/stations/{id}/observations` | 1:N Estação → Leituras | Pública |
| POST | `/api/stations/{id}/observations` | 1:N Estação → Leituras | Token |
| GET | `/api/stations/{id}/operators` | N:N Estação ↔ Operadores | Token |
| POST | `/api/stations/{id}/operators` | N:N vincular (`{ operator_id, role }`) | Token |
| DELETE | `/api/stations/{id}/operators/{operatorId}` | N:N desvincular | Token |
| GET | `/api/observations/{id}/responsible` | 1:N Operador → Leituras (só id, nome e tipo) | Pública |
| PUT | `/api/observations/{id}/responsible` | Troca o responsável (`{ operator_id }`) | Token |
| GET | `/api/stations/{id}/dashboard` | Estação + leituras 24 h com responsável + operadores | Pública |

**Formato de erro** (igual em todas as rotas):

```json
{ "error": { "code": "INVALID_METRIC", "message": "metric deve ser level ou rain" } }
```

Status usados: 200, 201, 204, 400 (dado inválido), 401 (sem token), 404 (não existe), 409 (duplicado), 500 (erro inesperado, sem expor detalhes).

> **Detalhes:** consulte o Swagger para schemas de request/response, parâmetros e exemplos.

## Configuração do Ambiente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/cogmo-hidro-api/cogmo-hidro-api.git
   cd cogmo-hidro-api
   ```
2. **Instale as dependências** (Node.js 20 ou superior):
   ```bash
   npm install
   ```
3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o .env e troque o JWT_SECRET
   ```
4. **Crie e popule o banco:**
   ```bash
   npm run db:reset
   ```
5. **Inicie o servidor:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000/api/health` – a resposta deve ser `{ "ok": true }`.
6. **Confira as rotas** (em outro terminal, com a API rodando):
   ```bash
   npm run test:smoke   # ou: bash scripts/smoke-test.sh
   ```

### Ubuntu (instalação automática)

No Ubuntu 22.04/24.04 (ou WSL), o script abaixo faz os passos 2 a 4 sozinho: instala `git`, `curl`, `build-essential` e `python3` (necessários para o `better-sqlite3`), instala o Node.js 22 LTS se não houver Node 20+, roda `npm ci`, cria o `.env` com um `JWT_SECRET` aleatório e prepara o banco.

```bash
git clone https://github.com/cogmo-hidro-api/cogmo-hidro-api.git
cd cogmo-hidro-api
bash scripts/setup-ubuntu.sh          # opções: --fresh (recria o banco), --run (já sobe a API), --skip-apt
```

### Scripts do npm

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe a API com recarga automática (nodemon) |
| `npm start` | Sobe a API sem recarga |
| `npm run db:migrate` | Cria as tabelas (pode repetir: `CREATE TABLE IF NOT EXISTS`) |
| `npm run db:seed` | Insere os dados fictícios (pode repetir sem duplicar) |
| `npm run db:reset` | `db:migrate` + `db:seed` |
| `npm run db:fresh` | Apaga o arquivo do banco e roda `db:reset` (banco limpo para a demo) |
| `npm run test:smoke` | Testa as rotas principais com `curl` (precisa da API rodando) |

## Decisões Técnicas

- Horários sempre em **UTC, formato ISO 8601**.
- Nível em **metros (m)**, chuva em **milímetros por hora (mm/h)**; o banco impede misturar métrica e unidade.
- **Lacunas não são preenchidas**: hora sem leitura simplesmente não aparece na série.
- A janela de horas da série termina na **última leitura da estação**, porque o seed usa datas fixas para ser repetível.
- Todas as consultas SQL são **parametrizadas**.
- O aviso de **dados simulados** (`simulated` e `notice`) é colocado por um único middleware em `/api`, então nenhuma rota esquece.
- Rotas que mostram **e-mail e telefone** de operador exigem token; a rota pública de responsável mostra só id, nome e tipo.
- Leitura repetida (mesma estação, métrica e horário) dá **409**, garantido também pelo `UNIQUE` no banco.

## Deploy (opcional)

Fora do escopo do desafio. A aplicação roda apenas localmente.
