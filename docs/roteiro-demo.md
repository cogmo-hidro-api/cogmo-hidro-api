# Roteiro da demonstração (~10 min)

Objetivo e direto: cada pessoa fala só da própria parte e mostra **uma chamada funcionando**. Tudo roda pelo `requests/api.http` (ou pelo Swagger em `/api/docs`), nunca digitando ao vivo.

## Antes de começar (5 min antes)

1. `npm run db:reset` (banco limpo com o seed)
2. `npm run dev`
3. Abrir `requests/api.http` no VS Code (extensão REST Client)
4. Rodar **Cadastrar usuário** e **Login** (o token fica salvo para as rotas protegidas)
5. Deixar abertos: `docs/der.png`, o Swagger (`localhost:3000/api/docs`), o GitHub (aba Pull requests) e o Trello

## Ordem

| # | Quem | Tempo | O que fala | Chamada do `api.http` |
| --- | --- | --- | --- | --- |
| 1 | Márcio (P5) | 1 min | Problema, objetivo e stack (Node.js, Express, SQLite). Frase obrigatória: *"os dados são simulados e não servem para alertas reais"*. | `Health check` |
| 2 | Daltro (P1) | 2 min | DER: por que cada FK, `UNIQUE` e `CHECK`. Roda o seed 2x e mostra que não duplica. | terminal: `npm run db:seed` duas vezes + contagem |
| 3 | Laércio (P4) | 1,5 min | Login devolve token; rota protegida sem token dá 401, com token dá 201. | `Login`, `Erro: listar sem token`, `Criar operador` |
| 4 | Kyara (P2) | 2 min | Lista de estações, resumo e o dashboard cruzando as 3 entidades. | `Listar estações`, `Resumo da estação 1`, `Dashboard da estação 1` |
| 5 | Márcio (P3) | 2 min | Série de nível e de chuva; `metric=temp` dá 400; `hours=73` dá 400; série com lacuna (hora que não aparece). | `Série de nível, 24 h`, `Série de chuva, 24 h`, `Erro: métrica inválida`, `Erro: hours = 73` |
| 6 | Márcio (P5) | 1,5 min | Organização: Trello, PRs revisados no GitHub, diário, Swagger. O que fariam depois. | navegador |

## Perguntas que a Cogmo avisa que vai fazer

| Pergunta | Resposta | Evidência |
| --- | --- | --- |
| Como organizaram a solução? | Camadas routes → controllers → services → repositories. Cada pessoa cuidou de uma fatia. | árvore de pastas em `src/` |
| Como trataram dados inválidos ou ausentes? | Validadores devolvem 400 com código; o que não existe dá 404; repetido dá 409; lacunas não são preenchidas. | `Erro: métrica inválida`, `Erro: estação inexistente na série`, série com buraco |
| Como evitaram misturar nível e chuva? | `CHECK` no banco amarra métrica e unidade; a série exige `metric` e devolve `unit`; uma chamada por métrica. | `001_init.sql` + resposta da série |
| O que fariam depois? | Uma coisa pequena: testes automatizados com Jest + Supertest, ou paginação nas leituras. | — |

## Perguntas prováveis do professor (PI)

| Pergunta | Resposta curta |
| --- | --- |
| Onde estão os 3 relacionamentos? | 1:N Estação → Leituras (`station_id`), N:N Estação ↔ Operador (`station_operators`), 1:N Operador → Leituras como responsável (`responsible_id`). |
| Onde está a rota composta? | `GET /api/stations/:id/dashboard`. |
| Como funciona a autenticação? | Login gera JWT (1 h); rotas de escrita usam o middleware `auth.js`, que lê `Authorization: Bearer <token>`. |
| Por que a série termina na última leitura e não "agora"? | O seed usa datas fixas para ser repetível; com o relógio do servidor, a série ficaria vazia dias depois. |
| Por que operadores exigem token até para listar? | Têm e-mail e telefone (dado pessoal). Na rota pública do responsável só aparecem id, nome e tipo. |
