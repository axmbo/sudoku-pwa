#!/usr/bin/env bash
# Emite a versão do Playwright instalada, para compor a chave de cache do navegador.
# Uso no workflow: bash scripts/ci/playwright-version.sh >> "$GITHUB_OUTPUT"
set -euo pipefail
version="$(node -p "require('@playwright/test/package.json').version")"
echo "version=${version}"
