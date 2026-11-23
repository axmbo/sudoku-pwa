# Runbook: assinatura de commits e tags

Fontes: [ADR 0006](../adr/0006-plataforma-versionamento-ci.md), `PROCESSO.md` §7, `docs/process/passo-6-entrevista.md` (respostas de 22/11/2026). Modelo híbrido: commits assinados com chave SSH em software; tags de release assinadas com chave FIDO2 em hardware. A assinatura de commit atesta a origem, não a revisão humana (a revisão é o merge do PR).

**Guardrail:** nenhum agente lê, copia, gera ou move chave privada nem pede passphrase. Os passos marcados "Diretor" rodam no terminal do Diretor, **um por vez**, só avançando após a verificação. A IA só lê saídas públicas (`.pub`, `git config`, resultado de verificação).

Premissas: Ubuntu 22.04, Git 2.34.1+, OpenSSH 8.9p1, `libfido2-1` 1.10.0, e-mail `contact@axmbo.dev` (verificado no GitHub), conta `axmbo`, um só notebook, repo público, config Git **local** ao repo.

## Etapa 1. Chave de commit em software (Diretor)

Por que separada da de acesso: a chave de acesso (`id_ed25519-github`) autentica no GitHub e fica carregada no agente o tempo todo; a de assinatura só prova autoria. Misturar amplia o dano de um vazamento e impede revogar uma sem perder a outra. Não reutilize nenhuma das três chaves existentes.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_sign_sudoku -C "sudoku-pwa commit signing"
```

Digite uma passphrase forte quando pedido.

Verificação: `ls -l ~/.ssh/id_ed25519_sign_sudoku*` lista dois arquivos (privada com modo `-rw-------`, e `.pub`). `ssh-keygen -lf ~/.ssh/id_ed25519_sign_sudoku.pub` imprime `256 SHA256:... sudoku-pwa commit signing (ED25519)`.

Desfazer: `rm ~/.ssh/id_ed25519_sign_sudoku ~/.ssh/id_ed25519_sign_sudoku.pub` (nada depende dela ainda).

## Etapa 2. Carregar no ssh-agent por sessão (Diretor)

```bash
ssh-add ~/.ssh/id_ed25519_sign_sudoku     # pede a passphrase
```

Verificação: `ssh-add -l` lista a chave com o comentário `sudoku-pwa commit signing`.

Efeito nos commits da IA: o Claude Code commita sem prompt; com a chave fora do agente, o `git commit` **falha** (nada é gravado). Mensagem típica, que varia com a versão: `error: ... No private key found for public key ...` ou `Couldn't load public key`, seguida de `fatal: failed to write commit object`. Correção: rodar o `ssh-add` acima e repetir o commit. O terminal do VS Code precisa herdar o mesmo `SSH_AUTH_SOCK` do shell onde você rodou o `ssh-add`.

Desfazer: `ssh-add -d ~/.ssh/id_ed25519_sign_sudoku.pub` (ou `ssh-add -D` tira todas as chaves; a de acesso também).

## Etapa 3. Config Git local (Diretor)

Dentro do repo (sem `--global`):

```bash
git config --local gpg.format ssh
git config --local user.signingkey ~/.ssh/id_ed25519_sign_sudoku.pub
git config --local commit.gpgsign true
git config --local tag.gpgsign true
git config --local gpg.ssh.allowedSignersFile "$(git rev-parse --show-toplevel)/.github/allowed_signers"
```

`tag.gpgsign true` faz toda tag anotada exigir assinatura; a etapa 5 troca a chave só para tags. O `allowedSignersFile` vai como caminho absoluto, porque um relativo seria resolvido a partir do diretório corrente e a verificação falharia fora da raiz.

Verificação: `git config --local --get-regexp '^(gpg|user|commit|tag)\.'` mostra as cinco chaves acima (mais `user.*` já existentes).

Desfazer: `git config --local --unset <chave>` para cada uma (commits voltam a sair sem assinatura).

## Etapa 4. allowed_signers versionado (IA escreve; Diretor cola a pública)

O Diretor cola no chat o conteúdo de `cat ~/.ssh/id_ed25519_sign_sudoku.pub` (pública, sem segredo). A IA cria `.github/allowed_signers` (uma linha por chave, formato `email namespaces="git" tipo chave`):

```
contact@axmbo.dev namespaces="git" ssh-ed25519 AAAA...(chave de commit)
```

A linha da chave de tag entra na etapa 5. Commite o arquivo (já assinado, se as etapas 2 e 3 estão feitas).

Verificação:

```bash
git log --show-signature -1     # Good "git" signature for contact@axmbo.dev with ED25519 key SHA256:...
git verify-commit HEAD          # mesma linha "Good ..." em stderr, código de saída 0
```

Sem a linha no arquivo, a saída é `No principal matches` ou `Good ... signature with ED25519 key` sem o e-mail: confira o e-mail e o `namespaces`.

Desfazer: reverter o commit do arquivo. Commits antigos continuam sem assinatura (não se reescreve histórico publicado).

## Etapa 5. Chave de hardware Thetis para tags (Diretor)

A Thetis aceitou `ed25519-sk` (22/11/2026). Com outra chave, tente `ed25519-sk` (exige FIDO2) e, se o dispositivo recusar, use `ecdsa-sk` (aceito por chaves só U2F). Plugue a chave e rode:

```bash
ssh-keygen -t ed25519-sk -f ~/.ssh/id_ed25519_sk_tag -C "sudoku-pwa release tags (Thetis)"
```

Toque na chave quando ela piscar. **Como reconhecer a recusa:** erro imediato do tipo `Key enrollment failed: requested feature not supported` (ou `invalid format`/`unsupported option`) significa que a chave não faz Ed25519. Nada foi criado; rode:

```bash
ssh-keygen -t ecdsa-sk -f ~/.ssh/id_ecdsa_sk_tag -C "sudoku-pwa release tags (Thetis)"
```

Se aparecer `device not found` ou `No FIDO SecurityKeyProvider`, o problema é o acesso ao dispositivo, não o tipo: replugue e, se persistir, instale `libu2f-udev` e replugue (não confirmado para este modelo). Nos passos seguintes, use o nome do arquivo que foi criado.

**Recomendação (não confirmada contra este modelo):**
- **Sem `-O resident`.** A credencial residente ocupa slot limitado, exige PIN FIDO2 e muitas chaves U2F antigas não a suportam. Como há só um notebook, o arquivo `id_ed25519_sk_tag` (um "key handle", inútil sem o dispositivo) basta; faça backup dele num local seguro. Perdê-lo sem credencial residente significa registrar nova chave (etapa 8).
- **Sem `-O verify-required` por ora.** Exige PIN FIDO2 configurado e suporte do verificador; o toque físico já dá presença. Reavalie se a chave tiver PIN e `ssh-keygen -Y verify` do pipeline aceitar (ver pendências).

Carregue e use só para tags (o `-c` não altera a config local):

```bash
ssh-add ~/.ssh/id_ed25519_sk_tag
git -c user.signingkey=$HOME/.ssh/id_ed25519_sk_tag.pub tag -s v0.0.0-assinatura-teste -m "teste de assinatura"
```

Depois a IA acrescenta a pública, com `sk-ssh-ed25519@openssh.com` (ou `sk-ecdsa-sha2-nistp256@openssh.com`) no lugar de `ssh-ed25519`, mesmo e-mail e `namespaces="git"`, a dois arquivos:

- `.github/allowed_signers`, para a verificação local de commits e tags;
- `.github/allowed_signers_tags`, **só com chaves de hardware**, que é o arquivo usado pelo pipeline de tag. O `namespaces` não separa commit de tag (o git usa `"git"` nos dois), então só um arquivo separado impede que a chave de commit em software libere uma release.

Verificação: `git verify-tag v0.0.0-assinatura-teste` imprime `Good "git" signature for contact@axmbo.dev with ED25519-SK key SHA256:...`.

Desfazer: `git tag -d v0.0.0-assinatura-teste` (e `git push --delete origin <tag>` se já enviada); `rm` dos arquivos da chave de tag.

## Etapa 6. Cadastro no GitHub como Signing Key (Diretor)

O cadastro é da conta, mas só se confirma com o repo criado e um commit enviado. As duas chaves públicas entram como **Signing Key** (não Authentication Key). O token atual do `gh` não tem o escopo necessário:

```bash
gh auth refresh -h github.com -s admin:ssh_signing_key
gh ssh-key add ~/.ssh/id_ed25519_sign_sudoku.pub --type signing --title "sudoku-pwa commits"
gh ssh-key add ~/.ssh/id_ed25519_sk_tag.pub --type signing --title "sudoku-pwa tags (Thetis)"
```

Alternativa manual: GitHub → Settings → SSH and GPG keys → New SSH key → *Key type: Signing Key*.

Verificação: `gh ssh-key list` mostra as duas com tipo `signing`. Após o primeiro push, o commit assinado exibe o selo **Verified** na página do commit. Tag: o selo aparece na página de releases/tags.

Desfazer: `gh ssh-key delete <id>`; opcional `gh auth refresh -h github.com -r admin:ssh_signing_key` para retirar o escopo.

## Etapa 7. Pipeline de tag (mecanismo; implementação no workflow de release)

No gatilho `push` de tags `v*`, o job de release, antes de qualquer publicação:
1. Obtém `.github/allowed_signers_tags` **da `main`** (nunca da própria tag, para um PR não se autorizar). Esse arquivo só tem chaves de hardware.
2. Confere que a tag é anotada, que o nome gravado no objeto da tag é igual ao ref (impede reaproveitar uma tag assinada antiga com outro nome `v*`) e que o commit alvo é alcançável da `main`.
3. Roda `git verify-tag "$GITHUB_REF_NAME"` com `gpg.ssh.allowedSignersFile` apontando para esse arquivo.
4. Falha o job se alguma checagem falhar: tag leve, nome divergente, commit fora da `main`, tag sem assinatura, assinatura inválida ou chave fora do arquivo.

Critérios do gate, citados pelos testes de `tests/repo/verify-tag.test.ts`:

- **REL-01:** tag cujo nome gravado no objeto difere do ref é recusada, e a mensagem cita o nome gravado.
- **REL-02:** tag cujo commit alvo não é alcançável da `main` é recusada, e a mensagem cita o ref da `main`.
- **REL-03:** o `release.yml` lê o `.github/allowed_signers_tags` da `main`, que só tem chaves `sk-`, e faz o checkout com histórico completo (`fetch-depth: 0`), de que a checagem do REL-02 depende.
- **REL-04:** são recusadas a tag leve, a tag anotada sem assinatura SSH (com mensagem própria) e a verificação com `allowed_signers` ausente ou vazio.
- **REL-05:** uma tag com anotação longa, maior que o buffer de um pipe (cerca de 64 KB), passa por todas as checagens até a mensagem própria de cada uma, sem o script abortar por SIGPIPE (código 141).

A lógica fica em `scripts/ci/verify-tag.sh <tag> <allowed_signers> <ref-da-main>`, com teste automatizado em `tests/repo/`, e o workflow é `.github/workflows/release.yml` (casca fina; job `verify-tag`, que refaz o fetch da tag anotada porque o checkout pode reescrevê-la como leve). Teste de aceitação: empurrar uma tag sem assinatura deve falhar o job (provado em 22/11/2026). Empurrar uma tag válida, assinada com a chave de hardware, deve passar (prova pendente até o merge na `main`, porque o arquivo é lido de lá).

## Etapa 8. Rotação, perda e chave reserva (Diretor decide; IA edita o arquivo)

- **Perda ou suspeita da chave de commit:** gere outra (etapa 1), troque `user.signingkey`, cadastre a nova, adicione-a ao `allowed_signers` (nunca ao `allowed_signers_tags`), remova a antiga do GitHub e do arquivo. Commits antigos permanecem verificáveis só se a linha antiga ficar no arquivo (decida; se a perda foi por vazamento, retire).
- **Perda da chave de tag:** sem reserva, nenhuma release nova passa no pipeline. Registre outra chave Thetis (ou de outro fabricante) pelas etapas 5 e 6 e acrescente-a ao `allowed_signers` e ao `allowed_signers_tags` por commit na `main` (o merge é do Diretor). Retire a perdida do arquivo e do GitHub; tags já publicadas continuam válidas como histórico.
- **Chave reserva (decisão do Diretor: só uma agora):** quando adquirir a segunda, repita as etapas 5 e 6 e guarde-a fora do notebook. Registre-a no arquivo e crie uma nota em `docs/estado.md`.

## Pendências não confirmadas

1. A Thetis faz Ed25519 (confirmado em 22/11/2026); seguem sem confirmação o PIN FIDO2 e o `-O verify-required`.
2. Se o `ssh-keygen -Y verify` do runner aceita chaves `-sk` sem `verify-required` no `allowed_signers_tags`. Fecha com a prova positiva da etapa 7, depois do merge.
3. Texto exato das mensagens de erro na versão 8.9p1; as citadas são típicas.
