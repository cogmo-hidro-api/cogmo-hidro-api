#!/usr/bin/env bash
# Instalação e configuração da cogmo-hidro-api no Ubuntu (22.04 / 24.04, também WSL).
#
# Uso (na raiz do repositório):
#   bash scripts/setup-ubuntu.sh            # instala tudo, cria .env e prepara o banco
#   bash scripts/setup-ubuntu.sh --fresh    # idem, mas apaga o banco e recria do zero
#   bash scripts/setup-ubuntu.sh --run      # ao final, já sobe a API (npm run dev)
#   bash scripts/setup-ubuntu.sh --skip-apt # não usa apt/sudo (Node 20+ já instalado)
#
# O que ele faz:
#   1. Instala pacotes do sistema: git, curl, build-essential e python3
#      (o better-sqlite3 é nativo; se não houver binário pronto, ele é compilado)
#   2. Instala o Node.js 22 LTS pela NodeSource se não houver Node 20 ou superior
#   3. npm ci (versões exatas do package-lock.json)
#   4. Cria o .env a partir do .env.example com um JWT_SECRET aleatório
#   5. Cria as tabelas e roda o seed (npm run db:reset, ou db:fresh com --fresh)
set -euo pipefail

FRESH=0; RUN=0; SKIP_APT=0
for arg in "$@"; do
  case "$arg" in
    --fresh) FRESH=1 ;;
    --run) RUN=1 ;;
    --skip-apt) SKIP_APT=1 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Opção desconhecida: $arg (use --help)"; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."
step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

SUDO=""
if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi

node_major() { command -v node >/dev/null 2>&1 && node -p 'process.versions.node.split(".")[0]' || echo 0; }

if [ "$SKIP_APT" -eq 0 ]; then
  step "1/5 Pacotes do sistema (git, curl, build-essential, python3)"
  $SUDO apt-get update -y
  $SUDO apt-get install -y git curl ca-certificates build-essential python3

  if [ "$(node_major)" -lt 20 ]; then
    step "2/5 Instalando Node.js 22 LTS (NodeSource)"
    curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO -E bash -
    $SUDO apt-get install -y nodejs
  else
    step "2/5 Node.js $(node -v) já instalado"
  fi
else
  step "1-2/5 Pulando apt (--skip-apt)"
fi

if [ "$(node_major)" -lt 20 ]; then
  echo "Node.js 20 ou superior é obrigatório (encontrado: $(node -v 2>/dev/null || echo nenhum))."
  exit 1
fi
echo "Node $(node -v) · npm $(npm -v)"

step "3/5 Dependências do projeto (npm ci)"
if [ -f package-lock.json ]; then npm ci; else npm install; fi

step "4/5 Arquivo .env"
if [ -f .env ]; then
  echo ".env já existe: mantido como está."
else
  cp .env.example .env
  SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${SECRET}|" .env
  echo ".env criado com JWT_SECRET aleatório (não envie este arquivo para o Git)."
fi

step "5/5 Banco SQLite (migrate + seed)"
if [ -f src/database/seed.js ]; then
  if [ "$FRESH" -eq 1 ] && grep -q '"db:fresh"' package.json; then npm run db:fresh; else npm run db:reset; fi
else
  # O seed é da parte P1. Se ela ainda não estiver nesta branch, cria só as tabelas.
  npm run db:migrate
  echo "AVISO: src/database/seed.js não existe nesta branch (parte P1 ainda não integrada)."
  echo "       As tabelas foram criadas, mas estão vazias. Traga a branch do P1 e rode: npm run db:reset"
fi

cat <<'MSG'

Pronto! Próximos passos:
  npm run dev                      # sobe a API em http://localhost:3000
  bash scripts/smoke-test.sh       # em outro terminal: confere as rotas (30 checagens)
  http://localhost:3000/api/docs   # Swagger
Os dados são SIMULADOS e não servem para alertas reais.
MSG

if [ "$RUN" -eq 1 ]; then
  step "Subindo a API (Ctrl+C para parar)"
  exec npm run dev
fi
