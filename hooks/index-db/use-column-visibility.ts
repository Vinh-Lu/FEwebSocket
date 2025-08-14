import { useGenericIndexedDBStore } from '@/hooks/useGenericIndexedDBStore';

export interface ColumnVisibility {
  path: string;
  hiddenColumns: string[];
  columnOrder?: string[];
  updatedAt?: number;
}

export function useColumnVisibility() {
  return useGenericIndexedDBStore<ColumnVisibility>(
    'column-visibility',
    'columns',
    'path',
    { maxItems: 50 }
  );
} 