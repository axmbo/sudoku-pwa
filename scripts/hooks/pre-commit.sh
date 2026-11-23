#!/usr/bin/env sh
# Roda só sobre os arquivos staged; o `npm run check` completo fica para o push/CI.
set -eu

staged=$(git diff --cached --name-only --diff-filter=ACMR)
[ -z "$staged" ] && exit 0

code=$(printf '%s\n' "$staged" | grep -E '\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$' || true)

printf '%s\n' "$staged" | xargs npx --no-install prettier --check --ignore-unknown

if [ -n "$code" ]; then
  printf '%s\n' "$code" | xargs npx --no-install eslint --max-warnings 0 --no-warn-ignored
  npx --no-install tsc -p tsconfig.json
  # Commit só de testes é a fase RED do TDD: o vermelho é esperado, então não roda os testes.
  production=$(printf '%s\n' "$code" | grep -Ev '(\.(test|spec)\.[cm]?[jt]sx?$|(^|/)(e2e|tests|__arbitraries__)/)' || true)
  if [ -n "$production" ]; then
    printf '%s\n' "$code" | xargs npx --no-install vitest related --run --passWithNoTests
  else
    echo 'pre-commit: só arquivos de teste (fase RED); testes não executados.'
  fi
fi
