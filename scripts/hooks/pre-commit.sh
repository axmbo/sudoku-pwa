#!/usr/bin/env sh
# Roda só sobre os arquivos staged; o `npm run check` completo fica para o push/CI.
set -eu

staged=$(git diff --cached --name-only --diff-filter=ACMR)
[ -z "$staged" ] && exit 0

code=$(printf '%s\n' "$staged" | grep -E '\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$' || true)

printf '%s\n' "$staged" | xargs npx --no-install prettier --check --ignore-unknown

if [ -n "$code" ]; then
  printf '%s\n' "$code" | xargs npx --no-install eslint --max-warnings 0 --no-warn-ignored
  # Commit só de testes é a fase RED do TDD: o vermelho é esperado, então não roda os testes.
  production=$(printf '%s\n' "$code" | grep -Ev '(\.(test|spec)\.[cm]?[jt]sx?$|(^|/)(e2e|tests|__arbitraries__)/)' || true)
  if [ -n "$production" ]; then
    npx --no-install tsc -p tsconfig.json
    printf '%s\n' "$code" | xargs npx --no-install vitest related --run --passWithNoTests
  else
    # Na fase RED o tsc só pode reclamar de símbolo inexistente (ver tsc-red-filter.mjs).
    if tsc_output=$(npx --no-install tsc -p tsconfig.json 2>&1); then
      :
    elif printf '%s\n' "$tsc_output" | node "$(git rev-parse --show-toplevel)/scripts/hooks/tsc-red-filter.mjs" 2>/dev/null; then
      echo 'pre-commit: fase RED; typecheck tolerou só símbolo inexistente.'
    else
      printf '%s\n' "$tsc_output"
      exit 1
    fi
    echo 'pre-commit: só arquivos de teste (fase RED); testes não executados.'
  fi
fi
