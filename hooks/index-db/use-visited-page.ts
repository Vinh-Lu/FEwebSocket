import { useGenericIndexedDBStore } from '@/hooks/useGenericIndexedDBStore';

export interface SearchHistory {
  path: string;
  label: string;
  updatedAt?: number;
}

export function useVisitedPages() {
  return useGenericIndexedDBStore<SearchHistory>(
    'visited-pages',
    'pages',
    'path',
    { maxItems: 10 }
  );
}