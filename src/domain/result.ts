/** Resultado de uma operação que pode ser recusada: recusa é valor, não exceção (ADR 0007). */
export type Result<T, R extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: R };
