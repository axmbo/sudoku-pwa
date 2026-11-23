#!/usr/bin/env bash
# Verifica que uma tag de release é anotada, assinada (SSH) e de chave autorizada.
# Uso: scripts/ci/verify-tag.sh <tag> <allowed_signers>
# Runbook: docs/runbooks/assinatura.md (etapa 7).
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Uso: $0 <tag> <allowed_signers>" >&2
  exit 2
fi

tag="$1"
signers="$2"

if [ ! -s "$signers" ]; then
  echo "Erro: arquivo allowed_signers ausente ou vazio: $signers" >&2
  exit 1
fi

tipo="$(git cat-file -t "refs/tags/${tag}" 2>/dev/null || true)"
if [ "$tipo" != "tag" ]; then
  echo "Erro: a tag '${tag}' é leve ou não existe (tipo: '${tipo:-n/d}'); release exige tag anotada e assinada." >&2
  exit 1
fi

if ! git cat-file tag "refs/tags/${tag}" | grep -q -- '-----BEGIN SSH SIGNATURE-----'; then
  echo "Erro: a tag '${tag}' não tem assinatura SSH." >&2
  exit 1
fi

if ! git -c gpg.format=ssh -c "gpg.ssh.allowedSignersFile=${signers}" verify-tag "refs/tags/${tag}"; then
  echo "Erro: assinatura da tag '${tag}' inválida ou de chave fora do allowed_signers." >&2
  exit 1
fi

echo "OK: tag '${tag}' anotada, assinada e de chave autorizada."
