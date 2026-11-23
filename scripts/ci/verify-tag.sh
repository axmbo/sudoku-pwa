#!/usr/bin/env bash
# Verifica que uma tag de release é anotada, tem o nome gravado igual ao ref,
# aponta para commit da main, é assinada (SSH) e de chave autorizada.
# Uso: scripts/ci/verify-tag.sh <tag> <allowed_signers> <ref-da-main>
# Runbook: docs/runbooks/assinatura.md (etapas 5 e 7).
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Uso: $0 <tag> <allowed_signers> <ref-da-main>" >&2
  exit 2
fi

tag="$1"
signers="$2"
main_ref="$3"

tipo="$(git cat-file -t "refs/tags/${tag}" 2>/dev/null || true)"
if [ "$tipo" != "tag" ]; then
  echo "Erro: a tag '${tag}' é leve ou não existe (tipo: '${tipo:-n/d}'); release exige tag anotada e assinada." >&2
  exit 1
fi

# Impede replay: objeto de tag antigo reaproveitado sob outro nome v*.
nome_gravado="$(git cat-file tag "refs/tags/${tag}" | sed -n 's/^tag //p;/^$/q' | head -n 1)"
if [ "$nome_gravado" != "$tag" ]; then
  echo "Erro: o nome gravado na tag ('${nome_gravado:-n/d}') difere do ref '${tag}'." >&2
  exit 1
fi

if ! git merge-base --is-ancestor "refs/tags/${tag}^{commit}" "$main_ref" 2>/dev/null; then
  echo "Erro: o commit da tag '${tag}' não é alcançável de '${main_ref}'; release só sai da main." >&2
  exit 1
fi

if ! git cat-file tag "refs/tags/${tag}" | grep -q -- '-----BEGIN SSH SIGNATURE-----'; then
  echo "Erro: a tag '${tag}' não tem assinatura SSH." >&2
  exit 1
fi

if [ ! -s "$signers" ]; then
  echo "Erro: arquivo allowed_signers ausente ou vazio: $signers" >&2
  exit 1
fi

if ! git -c gpg.format=ssh -c "gpg.ssh.allowedSignersFile=${signers}" verify-tag "refs/tags/${tag}"; then
  echo "Erro: assinatura da tag '${tag}' inválida ou de chave fora do allowed_signers." >&2
  exit 1
fi

echo "OK: tag '${tag}' anotada, assinada e de chave autorizada."
