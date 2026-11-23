# Passo 6 da Fase 0 — Entrevista de assinatura (rodada única)

Responsável: `devsecops`. Respondente: Diretor. Nenhuma configuração foi feita. Referências: `docs/historico/BOOTSTRAP.md` (modelo híbrido e passo 3A), `PROCESSO.md` linha 136, `docs/process/plano-fase-0.md` (passo 6).

Responda pelo número, com a letra da opção (ou texto livre). Nunca cole chave privada nem passphrase; a chave pública e os fingerprints não são segredo.

## Já apurado (comandos de leitura)

- Ubuntu 22.04, Git 2.34.1 (mínimo para assinatura SSH), OpenSSH 8.9p1 (aceita chaves FIDO `ed25519-sk`), gh 2.100, bash no VS Code.
- Git: só `user.name` (Alexandre Leite) e `user.email` (contact@axmbo.dev). Não há `gpg.format`, `user.signingkey`, `commit.gpgsign` nem `tag.gpgsign`: **nada de assinatura configurado**.
- `~/.ssh` tem 3 chaves públicas: `id_ed25519.pub`, `id_ed25519_2025.pub`, `id_ed25519-github.pub`.
- `ssh-agent` ativo (`SSH_AUTH_SOCK` definido) com 3 chaves ED25519 carregadas. Dois comentários indicam um e-mail pessoal (diferente do `user.email`); um deles pode ser o e-mail do GitHub.
- `gpg` instalado; `ykman` ausente; nenhuma chave GPG secreta foi listada.
- O repositório não tem remoto; o GitHub está decidido (ADR 0006), mas o repo ainda não existe.

## Perguntas

1. **Para que serve cada uma das 3 chaves existentes, e qual delas autentica no GitHub hoje?**
   Porquê: a chave de assinatura deve ser nova e separada da de acesso; preciso saber o que não reutilizar.
   Opções: (a) `-github` é a de acesso e as outras são de servidores/legado; (b) outra distribuição (descreva); (c) não sei, preciso de um passo de verificação.

2. **Como será a passphrase da nova chave de assinatura e do agente?**
   Porquê: o Claude Code commita sem prompt interativo; com passphrase, a chave precisa estar carregada no `ssh-agent` antes, senão o commit da IA falha.
   Opções: (a) com passphrase, carregada no agente por sessão (`ssh-add`); (b) com passphrase e agente com tempo limite; (c) sem passphrase (menos seguro; aceita o risco?).

3. **Qual dispositivo de hardware você tem para assinar tags de release?**
   Porquê: define o tipo de chave do passo 6 do roteiro e as ferramentas a instalar.
   Opções: (a) YubiKey (indique modelo/firmware, se souber); (b) outra chave FIDO2 (SoloKey, Nitrokey, Titan); (c) carteira de hardware (Ledger/Trezor) com SSH/GPG; (d) nenhum ainda (então a tag assinada fica adiada ou usa chave em software provisória).

4. **Você já usou esse dispositivo para SSH ou GPG, e com qual protocolo?**
   Porquê: `ed25519-sk` (FIDO, exige toque; precisa de `libfido2`) é o caminho mais simples no OpenSSH 8.9; GPG/OpenPGP card exige `ykman`/`gpg-agent` e é mais trabalhoso.
   Opções: (a) nunca usei; (b) usei FIDO/SSH `-sk`; (c) usei OpenPGP card/GPG; (d) outro.

5. **Você tem uma segunda chave de hardware (reserva) ou plano de recuperação se perder a primeira?**
   Porquê: tag assinada só por uma chave, se perdida, trava releases; a lista de assinantes permitidos deve prever a reserva.
   Opções: (a) sim, duas chaves; (b) só uma, aceito registrar outra depois; (c) prefiro que o ADR/runbook trate a rotação sem reserva.

6. **Você commita de mais de uma máquina?**
   Porquê: cada máquina precisa da chave de assinatura (uma por máquina, ou a mesma copiada pelo Diretor) e entra no `allowed_signers`.
   Opções: (a) só este notebook; (b) mais uma máquina (qual SO); (c) várias, incluindo Codespaces/CI.

7. **A configuração do Git deve valer globalmente ou só neste repositório? E qual e-mail aparece nos commits?**
   Porquê: global assina tudo (inclusive outros projetos), local isola; o e-mail do commit precisa estar verificado no GitHub para o selo "Verified".
   Opções: (a) só este repo, com contact@axmbo.dev; (b) global, com contact@axmbo.dev; (c) só este repo, com o e-mail `noreply` do GitHub; (d) outro e-mail (qual).

8. **Dados da conta e do repositório GitHub para o cadastro da chave de assinatura.**
   Porquê: a chave pública é cadastrada como "Signing Key" na conta; preciso saber se o e-mail do item 7 já está verificado e onde o repo será criado.
   Opções: (a) conta pessoal já existente, e-mail verificado, repo na conta; (b) conta pessoal, e-mail ainda não verificado; (c) organização (nome); (d) conta ainda a criar. Informe também visibilidade do repo: público ou privado.

## Respostas do Diretor (22/11/2026)

1. (a) `id_ed25519-github` é a de acesso; as outras são de servidores/legado.
2. (a) Com passphrase, carregada no `ssh-agent` por sessão.
3. (b) Chave FIDO2 (não YubiKey).
4. (a) Nunca usou para SSH/GPG.
5. (b) Só uma chave; reserva registrada depois.
6. (a) Só este notebook.
7. (a) Configuração só neste repo, com contact@axmbo.dev.
8. Conta pessoal `axmbo`; repo público. Verificação do e-mail: pendente.

## Próximo passo (após as respostas)

Passo a passo de 7 etapas, uma por vez, cada uma com verificação, conforme `BOOTSTRAP.md` passo 3A. A criação da chave e qualquer comando com chave privada são executados pelo Diretor; o `devsecops` só lê saídas públicas. A etapa de cadastro na plataforma e a regra de tag no pipeline dependem de o repositório remoto existir.
