#!/usr/bin/env bash
# Teste de fumaça da API (Linux/macOS/Git Bash) — equivalente ao harness/check.ps1 da Cogmo,
# adaptado ao formato desta API (ids numéricos, { simulated, notice, data }).
# Uso: com a API rodando (npm run dev), execute:  bash scripts/smoke-test.sh [URL_BASE]
set -u
BASE="${1:-http://localhost:3000/api}"
PASS=0; FAIL=0
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT

command -v curl >/dev/null || { echo "Instale o curl: sudo apt install -y curl"; exit 1; }

# check "descrição" STATUS_ESPERADO MÉTODO CAMINHO [CORPO_JSON] [TOKEN] [TEXTO_QUE_DEVE_APARECER]
check() {
  local desc="$1" expected="$2" method="$3" path="$4" body="${5:-}" token="${6:-}" contains="${7:-}"
  local args=(-s -o "$TMP" -w '%{http_code}' -X "$method" "$BASE$path")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' -d "$body")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  local status; status="$(curl "${args[@]}")"
  if [ "$status" = "$expected" ] && { [ -z "$contains" ] || grep -q -- "$contains" "$TMP"; }; then
    PASS=$((PASS+1)); printf '  \033[32mOK\033[0m    [%s] %s\n' "$status" "$desc"
  else
    FAIL=$((FAIL+1)); printf '  \033[31mFALHA\033[0m [%s] %s (esperado %s)\n' "$status" "$desc" "$expected"
    head -c 300 "$TMP"; echo
  fi
}

echo "Conferindo API em $BASE"
check "health"                                   200 GET  /health "" "" '"ok":true'

echo "-- Contrato Cogmo"
check "lista de estações (dados simulados)"      200 GET  /stations "" "" '"simulated":true'
check "lista em ordem alfabética (Aurora 1º)"     200 GET  /stations "" "" '"data":\[{"id":1'
check "resumo estação 1 (level_m e rain_mm_h)"   200 GET  /stations/1/summary "" "" '"level_m"'
check "resumo estação sem leituras (null)"       200 GET  /stations/4/summary "" "" '"level_m":null'
check "série de nível 24 h (unit m)"             200 GET  "/stations/1/series?metric=level&hours=24" "" "" '"unit":"m"'
check "série de chuva 12 h (unit mm/h)"          200 GET  "/stations/1/series?metric=rain&hours=12" "" "" '"unit":"mm/h"'
check "série vazia (estação sem leituras)"       200 GET  "/stations/4/series?metric=level" "" "" '"points":\[\]'
check "erro: estação inexistente (summary)"      404 GET  /stations/999/summary "" "" STATION_NOT_FOUND
check "erro: métrica inválida"                   400 GET  "/stations/1/series?metric=vento&hours=24" "" "" INVALID_METRIC
check "erro: hours=100"                          400 GET  "/stations/1/series?metric=level&hours=100" "" "" INVALID_HOURS

echo "-- Autenticação"
EMAIL="smoke.$(date +%s)@cogmo.test"
check "cadastro de usuário"                      201 POST /auth/register "{\"name\":\"Smoke\",\"email\":\"$EMAIL\",\"password\":\"123456\"}"
TOKEN="$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"123456\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"
[ -n "$TOKEN" ] && echo "  token obtido" || echo "  (sem token: rotas protegidas vão falhar)"

echo "-- Estações (P2)"
CODE="EST-T$(date +%s | tail -c 6)"
check "buscar estação 1"                         200 GET    /stations/1 "" "" '"code":"EST-001"'
check "erro: id inválido"                        400 GET    /stations/abc "" "" INVALID_ID
check "erro: criar sem token"                    401 POST   /stations '{"code":"X"}'
check "erro: campos obrigatórios"                400 POST   /stations '{"code":"X"}' "$TOKEN" INVALID_INPUT
check "erro: UF inválida"                        400 POST   /stations "{\"code\":\"$CODE\",\"name\":\"T\",\"river\":\"R\",\"municipality\":\"M\",\"state\":\"Distrito\"}" "$TOKEN" INVALID_STATE
check "erro: latitude fora do limite"            400 POST   /stations "{\"code\":\"$CODE\",\"name\":\"T\",\"river\":\"R\",\"municipality\":\"M\",\"state\":\"DF\",\"latitude\":120}" "$TOKEN" INVALID_COORDINATES
check "criar estação"                            201 POST   /stations "{\"code\":\"$CODE\",\"name\":\"Estação Teste\",\"river\":\"Rio Fictício\",\"municipality\":\"Cidade Fictícia\",\"state\":\"df\",\"latitude\":-15.79,\"longitude\":-47.88}" "$TOKEN" '"state":"DF"'
NEW_ID="$(sed -n 's/.*"id":\([0-9]*\).*/\1/p' "$TMP")"
check "erro: código repetido"                    409 POST   /stations "{\"code\":\"$CODE\",\"name\":\"T\",\"river\":\"R\",\"municipality\":\"M\",\"state\":\"DF\"}" "$TOKEN" STATION_CODE_EXISTS
check "editar só o nome (PUT parcial)"           200 PUT    "/stations/$NEW_ID" '{"name":"Estação Teste (editada)"}' "$TOKEN" 'editada'
check "erro: editar com corpo vazio"             400 PUT    "/stations/$NEW_ID" '{}' "$TOKEN" INVALID_INPUT
check "erro: editar para código existente"       409 PUT    "/stations/$NEW_ID" '{"code":"EST-001"}' "$TOKEN" STATION_CODE_EXISTS
check "remover estação"                          204 DELETE "/stations/$NEW_ID" "" "$TOKEN"
check "estação removida não existe mais"         404 GET    "/stations/$NEW_ID" "" "" STATION_NOT_FOUND

echo "-- Dashboard (rota composta)"
check "dashboard estação 1"                      200 GET /stations/1/dashboard "" "" '"operators"'
check "dashboard mostra responsável"             200 GET /stations/1/dashboard "" "" '"responsible":{"id"'
check "dashboard não expõe e-mail"               200 GET /stations/1/dashboard
if grep -q '@' "$TMP"; then FAIL=$((FAIL+1)); echo "  FALHA: e-mail apareceu no dashboard"; fi
check "dashboard estação sem leituras"           200 GET /stations/4/dashboard "" "" '"observations":\[\]'
check "erro: dashboard estação inexistente"      404 GET /stations/999/dashboard "" "" STATION_NOT_FOUND

echo
echo "Resultado: $PASS OK, $FAIL falha(s). Dados simulados, sem finalidade operacional."
[ "$FAIL" -eq 0 ]
