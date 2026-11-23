# ADR 0004: Persistência local

- **Status:** Aceito pelo Diretor em 22/11/2026, após duas rodadas do `revisor`.
- **Data:** 22/11/2026
- **Autor:** agente `arquiteto`

## Contexto

Dados a guardar: jogo em andamento (grade, anotações, pilha de undo/redo, timer), estatísticas, histórico do desafio diário (incluindo o puzzle jogado), configurações. Requisitos: versionamento de schema com migração; durabilidade (`navigator.storage.persist()`); atualizar o Service Worker não pode quebrar jogos salvos; sem coleta de dados (tudo local); funcionar offline.

## Opções consideradas

| Critério | localStorage | IndexedDB direto | IndexedDB + `idb-keyval` 6.3.0 |
|---|---|---|---|
| API | síncrona, só strings, bloqueia a thread principal | assíncrona, verbosa | assíncrona, promessas, 805 B gzip |
| Limite | 5 MiB por origem (MDN) | cota de armazenamento do navegador (até 60% do disco no Chrome, MDN) | idem IndexedDB |
| Workers | indisponível | disponível | disponível |
| Escrita atômica multi-chave | não | sim (transação) | `setMany` usa uma única transação `readwrite` (conferido no código-fonte 6.3.0 pelo `revisor`, 22/11/2026) |
| Migração de schema | manual | `onupgradeneeded` (acoplado a versão do banco) | manual, por campo de versão |
| Despejo | MDN não afirma | sujeito a despejo em best-effort; `persist()` protege | idem |

## Decisão

**IndexedDB via `idb-keyval`, com um único object store e chaves fixas**: `game`, `stats`, `daily-history`, `settings`, `meta`.

- Cada valor é um envelope `{ schemaVersion: number, data }`. A migração é **nossa**: funções puras `vN -> vN+1` em módulo testável (property-based: migrar e validar). Não usar `onupgradeneeded` para dados de domínio; o banco fica sempre na versão 1.
- **Versão desconhecida (maior que a do app):** não sobrescrever nem apagar. Abrir em modo leitura e avisar o jogador para recarregar o app. Cobre rollback de deploy e abas antigas. (Exportar JSON nesse caso fica para o pós-MVP, junto com o item abaixo.)
- **Falha de validação ao ler:** mover o valor para a chave `corrupt:<chave>:<data>` e começar limpo, nunca descartar em silêncio.
- Escrita do jogo em andamento a cada jogada, por `set` de chave única; se houver agrupamento de escritas, ele **nunca adia além de `visibilitychange` (hidden) e `pagehide`**: nesses eventos a gravação é imediata e inclui o tempo decorrido do timer, porque o Android pode matar o app em segundo plano sem outro aviso (princípio 8). Isso é critério de teste da spec de persistência; atualizações que tocam duas chaves (fim de partida: `game` + `stats`) usam `setMany`.
- O envelope `game` guarda o puzzle completo: pistas, **solução** (81 dígitos), nível, seed e versão do gerador, além de valores, anotações, histórico de undo/redo e timer. Assim a vitória (grade igual à solução) não exige rodar o solver ao reabrir.
- `daily-history` é indexado por **data local + nível** (um desafio por nível por dia, ADR 0005) e guarda os `givens`, a versão do algoritmo e o resultado, para não depender de regerar.
- **`navigator.storage.persist()`** chamado da thread principal (indisponível em Workers) após a primeira partida concluída, em contexto seguro. Pode ser negado em silêncio (Chromium decide por interação; Firefox pede consentimento); `false` não significa perda iminente. A UI não depende do resultado.
- **Safari:** dados de script de origem sem interação por 7 dias podem ser apagados com prevenção de rastreamento ativa (MDN). Se o app instalado é isento: **não confirmado**. Mitigação prevista: exportar/importar JSON de estatísticas nas configurações — **pós-MVP** (decisão do Diretor, 22/11/2026); no MVP o risco fica aceito e documentado.
- **Service Worker:** pré-cache só de assets estáticos; o SW nunca lê nem escreve IndexedDB. Dados e versão do app evoluem de forma independente. Com `vite-plugin-pwa`, usar atualização por aviso (`registerType: 'prompt'`) para nunca recarregar no meio de uma partida (o tipo `registerType: 'prompt' | 'autoUpdate'` existe no `vite-plugin-pwa` 2.0.0, conferido pelo `revisor`).
- Abstração `Storage` (interface em `src/persistence/`) com implementação em memória para testes; domínio não conhece IndexedDB.

## Consequências

- Positivas: não bloqueia a thread principal, sem teto prático de 5 MiB, schema migrável com teste, dependência de 805 B.
- Negativas: assincronia em toda a camada de persistência; testes de componente precisam de `fake-indexeddb` ou da implementação em memória (preferida); Safari pode despejar dados.
- E2E obrigatório: salvar jogo na versão N, atualizar SW para N+1, retomar jogo.

## Fontes (consultadas em 22/11/2026)

- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- https://github.com/jakearchibald/idb-keyval
- https://bundlephobia.com/package/idb-keyval@latest
- https://vite-pwa-org.netlify.app/guide/register-service-worker.html (página consultada não cobre `registerType`)
