export const directoryQueryKeys = {
  all: ['education-establishments'] as const,
  search: (query: string) =>
    ['education-establishments', 'search', query.trim().toLowerCase()] as const,
  uai: (uai: string) => ['education-establishments', 'uai', uai] as const,
};
