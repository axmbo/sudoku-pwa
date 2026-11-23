# ADR 0007: Convenções de API do domínio (recusa como valor, `unknown` na fronteira, índices 0–8, imutabilidade)

- **Status:** Aceito (Diretor, 23/11/2026)
- **Data:** 23/11/2026
- **Autor:** agente `arquiteto`

## Contexto

A spec 001 é a primeira a definir API pública em `src/domain/`; as specs 002 a 005 vão importá-la. Quatro escolhas se repetirão em todas e são caras de desfazer depois que houver consumidores: como o domínio informa recusa, que tipo de entrada ele aceita nas funções de jogada, como numera linhas e colunas, e se o estado é mutável. A constituição (princípio 5) exige domínio puro; a skill `dominio-sudoku` fixa linha e coluna em 0–8 no código e 1–9 na UI.

## Opções consideradas

| Tema | Opção A (proposta) | Opção B |
|---|---|---|
| Recusa | Valor de retorno: `Result<T, Reason>` com `Reason` união de literais | Lançar exceção tipada |
| Entrada das jogadas | Parâmetros `unknown`, validados no domínio | Tipos estreitos (`Digit`, `Index`); validação só na UI |
| Numeração | 0–8 no domínio; a UI soma 1 | 1–9 também no domínio |
| Estado | Imutável (`readonly` + `Object.freeze`), operações devolvem novo valor | Mutável com cópia na borda |

## Decisão

1. **Recusa como valor.** Recusa de entrada é fluxo normal, não falha de programa: `type Result<T, R extends string> = { ok: true; value: T } | { ok: false; reason: R }`. O motivo é um literal em inglês (`'cell-is-given'`); a UI mapeia para mensagem pt-BR. Exceção fica para violação de contrato interno (bug), nunca para entrada do jogador. Motivo: o motivo é distinguível por checagem de tipo e a precedência vira função pura testável.
2. **`unknown` na fronteira.** Funções que recebem entrada do jogador (`createBoard`, `placeValue`, `eraseValue`) aceitam `unknown` e validam; a spec 001 exige recusar "algo que não é número" (CA-001-20/21/22). Funções internas usam tipos estreitos (`Digit`, `Index`).
3. **Índices 0–8 no domínio**, conforme a skill `dominio-sudoku`. A conversão para 1–9 é da UI (spec 005). Consequência: "linha ou coluna não é inteiro de 1 a 9" (CA-001-21) é testado no domínio como "não é inteiro de 0 a 8"; aprovado pelo Diretor em 23/11/2026, com nota na spec 001.
4. **Imutabilidade.** Tipos `readonly`, estado congelado em runtime, operações devolvem novo valor com compartilhamento estrutural. Habilita `undo`/`redo` por snapshot (spec 004) e torna o conflito derivável (invariante 9).

## Consequências

- Positivas: API uniforme para 002–005; recusa testável sem `try/catch`; sem estado oculto.
- Negativas: `unknown` repete validação se a UI já validou (custo desprezível); cada jogada aloca um array de 81 células (≈ 81 objetos; o impacto no orçamento do ADR 0001 ainda **não foi medido** e se espera irrelevante).
- Reverter depois de 002–005 implicaria reescrever chamadores e testes.

## Fontes

- `specs/001-tabuleiro-conflitos/spec.md` (CA-001-20 a 25), consultada em 23/11/2026.
- `docs/constituicao.md`, princípio 5; skill `dominio-sudoku` (glossário). Sem fonte externa: decisão de convenção de projeto.
