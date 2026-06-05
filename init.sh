#!/usr/bin/env sh
set -eu

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm was not found in PATH."
  echo "Enable it with: corepack enable && corepack prepare pnpm@9.15.9 --activate"
  exit 1
fi

echo "==> Install dependencies"
pnpm install

echo "==> Run base verification"
pnpm verify

echo "==> Install Playwright Chromium"
pnpm exec playwright install chromium

echo "==> Run UI smoke verification"
pnpm test:ui

echo "Base harness is verified."
echo "Start dev server with: pnpm dev"
