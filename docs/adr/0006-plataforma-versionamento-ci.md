# ADR 0006: Plataforma de versionamento, CI e hospedagem (GitHub × GitLab)

- **Status:** Aceito pelo Diretor em 22/11/2026, com rebase merge no lugar de "merge sem squash" (ver Consequências). Validar o selo "Verified" com um PR de teste no passo 6 da Fase 0.
- **Data:** 22/11/2026
- **Autor:** agente `devsecops`

## Contexto

O Sudoku PWA é um repositório público (MIT), PWA estática (Vite), com um único mantenedor humano. Requisitos (BOOTSTRAP 4A e plano da Fase 0):

- `main` protegida: sem push direto, checks obrigatórios, histórico linear (merge sem squash), 0 aprovações obrigatórias (o Diretor é autor e mantenedor; ninguém aprova o próprio PR).
- Commits assinados com chave SSH em software, assinatura não exigida na `main`.
- Tags de release assinadas com chave em hardware; o pipeline recusa tag não assinada ou fora da lista permitida.
- Atestado de proveniência do build; SAST, varredura de dependências e de segredos, push protection, sem custo.
- Pages com HTTPS e domínio próprio, deploy via CI; atualização automática de dependências, incluindo `.nvmrc` (Node fixado).
- Pipelines econômicos; templates de issue/PR; baixo lock-in.

## Opções consideradas

Plano gratuito, repositório público. Células com fato extraído da documentação oficial em 22/11/2026; "não confirmado" quando a documentação consultada não afirma.

| Critério | GitHub (Free) | GitLab.com (Free) |
|---|---|---|
| Minutos de CI | Runners padrão hospedados são gratuitos em repo público e não consomem a franquia incluída. Documentação não diz "ilimitado": teto não confirmado. Repo privado: US$ 12/mês incluídos (cerca de 2.000 min Linux 2-core a US$ 0,006/min, cálculo nosso). Runners maiores são cobrados mesmo em repo público | 400 min/mês por grupo de topo; sem franquia extra para projeto público em geral. Fator de custo Linux small = 1 (medium 2, large 3). Programa GitLab for Open Source dá fator 0,5 (elegibilidade do projeto não confirmada) |
| SAST | CodeQL (code scanning) disponível por padrão em repo público, sem custo | SAST com analisadores open source e relatório JSON baixável no Free. Findings no MR, Vulnerability Management e Advanced SAST só no Ultimate |
| Dependências | Dependabot alerts e security updates em todos os planos; dependency review em repo público | Dependency scanning: tier não confirmado (página consultada não informa) |
| Segredos e push protection | Secret scanning e push protection ativos por padrão em repo público | Secret detection "limitada" no Free; secret push protection somente Ultimate |
| Pages | Incluído no Free para repo público. HTTPS automático em `github.io` e em domínio próprio (certificado Let's Encrypt, "Enforce HTTPS"). Limite 1 GB publicado; deploy por workflow de Actions personalizado sem o limite de 10 builds/h | Incluído no Free, sem custo adicional. HTTPS em `gitlab.io`; domínio próprio com Let's Encrypt opcional. Deploy por job `pages` no CI |
| Proteção de branch | Rulesets disponíveis em repo público no Free (documentação). Regras: checks obrigatórios, histórico linear, assinatura exigível, restringir criação de tags (tag rulesets) | Branches protegidas no Free. Checks (pipeline must succeed) e merge fast-forward no Free (merge methods: Free). Push rules (rejeitar commits não assinados) só Premium/Ultimate, o que não nos afeta, pois a assinatura não é exigida na `main` |
| Aprovações = 0 | Regra de PR é opcional num ruleset; valor mínimo aceito não confirmado na documentação, validar na UI | Aprovação obrigatória é opcional; não confirmado em página consultada |
| Histórico linear | Regra "Require linear history" exige squash ou rebase; **não aceita merge commit**. Com rebase merge o histórico é linear sem squash (ver Consequências) | Merge fast-forward disponível no Free (semi-linear também); rebase automático antes do merge disponível |
| Verificação de assinatura SSH | Commits e tags verificados (Git 2.34+, chave cadastrada como signing key) | Commits e tags verificados no Free (Git 2.34+, OpenSSH 8.8+); verificação de tag GA no GitLab 19.1; exige e-mail verificado igual ao do commit |
| Proteção de tags | Tag rulesets (restrição de criação/remoção). Lista de chaves permitidas não é nativa: verificar no workflow | Protected tags no Free (por papel; usuário/grupo só Premium). Lista de chaves permitidas não nativa: verificar no job |
| Proveniência | Artifact Attestations: SLSA v1.0 Build L2 (L3 com workflow reutilizável), assinadas via Sigstore público, verificação `gh attestation verify`; disponível em repo público nos planos Free, Pro e Team | `RUNNER_GENERATE_ARTIFACTS_METADATA=true` gera in-toto/SLSA 1.0 provenance **sem assinatura/Sigstore documentada** (página não menciona). Para equivalência seria preciso Cosign à parte |
| Templates issue/PR | Suportados (`.github/`) | Suportados (`.gitlab/`); detalhe não verificado nesta consulta |
| Atualização de deps e `.nvmrc` | Dependabot: ecossistemas listados não incluem `.nvmrc`/`.node-version` (não confirmado se há suporte; indício de que não). Renovate: manager `nvm` mantém `.nvmrc`; app Mend Renovate disponível; custo não confirmado | Dependabot não existe. Renovate: manager `nvm` atualiza `.nvmrc`; app Mend Renovate para GitLab.com ou self-hosted via CI; custo não confirmado |
| Lock-in | Sintaxe de Actions proprietária; ações de terceiros e Attestations ancoradas na plataforma | Sintaxe `.gitlab-ci.yml` proprietária; `pages` e SLSA metadata ancorados na plataforma |

## Decisão recomendada

**Adotar o GitHub** (repositório público, Actions, Pages, rulesets, CodeQL, Artifact Attestations) e **Renovate** para dependências (inclui `.nvmrc`), com Dependabot apenas para alertas de segurança.

Motivos decisivos: (1) CodeQL, secret scanning e push protection gratuitos em repo público, enquanto no GitLab Free o SAST não tem UI/MR e a push protection é Ultimate; (2) CI de repo público sem consumo de franquia, contra 400 min/mês no GitLab; (3) proveniência assinada via Sigstore pronta, enquanto o GitLab gera metadado sem assinatura documentada; (4) rulesets cobrem checks, linearidade e proteção de tags no Free.

## Consequências

**Positivas**
- Todos os requisitos de segurança sem custo e sem ferramenta de terceiros além do Renovate.
- Proveniência verificável por qualquer consumidor (`gh attestation verify`).
- Pages com HTTPS e domínio próprio no mesmo pipeline.

**Negativas**
- "Require linear history" do GitHub bloqueia merge commit: o merge sem squash deve ser **rebase merge** (reescreve SHAs dos commits do PR; commits assinados no PR perdem a assinatura original, pois o GitHub reassina ou não conforme a configuração). Impacto na assinatura de commits precisa ser validado antes de ativar a regra.
- Lista de chaves permitidas para tags não é nativa: exige etapa própria no workflow de release.
- Teto de minutos em repo público não confirmado; monitorar consumo (analista-pdca).
- Concentração em um fornecedor.

**Mitigações de lock-in**
- Lógica do pipeline em scripts versionados (`scripts/ci/*`, comandos `npm run`), com os workflows como casca fina.
- Evitar ações de terceiros não essenciais; fixar as usadas por SHA.
- Build estático reprodutível: migrar Pages para outro host exige só trocar o job de deploy.
- Este ADR vale revisão se houver mudança de quota ou plano.

## Pontos não confirmados

Teto de minutos de CI em repo público; aprovação mínima 0 nas regras de PR (ambas plataformas); suporte do Dependabot a `.nvmrc`; custo do Renovate (apps hospedados); dependency scanning no GitLab Free; elegibilidade ao GitLab for Open Source.

## Fontes (consultadas em 22/11/2026)

- https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions
- https://docs.github.com/en/get-started/learning-about-github/githubs-plans
- https://docs.github.com/en/code-security/getting-started/github-security-features
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification
- https://docs.github.com/en/actions/concepts/security/artifact-attestations
- https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories
- https://docs.gitlab.com/ci/pipelines/compute_minutes/
- https://about.gitlab.com/pricing/
- https://docs.gitlab.com/user/application_security/sast/
- https://docs.gitlab.com/user/application_security/secret_detection/secret_push_protection/
- https://docs.gitlab.com/user/project/pages/
- https://docs.gitlab.com/user/project/repository/push_rules/
- https://docs.gitlab.com/user/project/merge_requests/methods/
- https://docs.gitlab.com/user/project/protected_tags/
- https://docs.gitlab.com/user/project/repository/signed_commits/ssh/
- https://docs.gitlab.com/ci/runners/configure_runners/#artifact-attestation
- https://docs.renovatebot.com/modules/manager/nvm/
- https://docs.renovatebot.com/modules/platform/gitlab/
