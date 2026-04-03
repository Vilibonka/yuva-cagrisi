#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$BACKEND_DIR"

if [ ! -f ".env" ]; then
  echo ".env dosyasi bulunamadi. Once .env.example dosyasini .env olarak kopyalayin."
  exit 1
fi

docker compose up -d postgres
npm install
npx prisma generate

echo
echo "Sonraki komutlar:"
echo "  npm run prisma:migrate -- --name init"
echo "  npm run start:dev"
