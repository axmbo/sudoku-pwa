// Conventional Commits: tipo em inglês, descrição em pt-BR (PROCESSO.md §7).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Descrição em português começa minúscula, mas nomes próprios (ADR, Vite) são livres.
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0],
  },
};
