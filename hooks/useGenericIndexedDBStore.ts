// src/hooks/useGenericIndexedDBStore.ts
import { useCallback,useEffect,useState } from 'react';
import {
  getAllGeneric,
  putGeneric,
  removeGeneric,
  clearAllGeneric,
  getGeneric,
  importJSONFromFileGeneric,
  exportJSONToFileGeneric,
  addGeneric,
} from '@/providers/indexDB';

export function useGenericIndexedDBStore<T extends { [key: string]: any }>(
  dbName: string | null,
  storeName: string,
  keyPath: string,
  options?: { maxItems?: number }
) {
  const [items,setItems] = useState<T[]>([]);
  const maxItems = options?.maxItems ?? 100;

  const reload = useCallback(async () => {
    if (!dbName) return;
    const all = await getAllGeneric<T>(dbName,storeName,keyPath);
    const sorted = all.sort((a: any,b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    setItems(sorted.slice(0,maxItems));
  },[dbName,storeName,keyPath,maxItems]);

  const save = useCallback(
    async (item: T) => {
      if (!dbName) return;
      const now = Date.now();
      await putGeneric<T>(dbName,storeName,{ ...item,updatedAt: now },keyPath);
    },
    [dbName,storeName,keyPath]
  );

  const remove = useCallback(
    async (key: string | number) => {
      if (!dbName) return;
      await removeGeneric(dbName,storeName,key,keyPath);
    },
    [dbName,storeName,keyPath]
  );

  const clear = useCallback(async () => {
    if (!dbName) return;
    await clearAllGeneric(dbName,storeName,keyPath);
  },[dbName,storeName,keyPath]);

  const importFromFile = useCallback(
    async (file: File) => {
      if (!dbName) return;
      await importJSONFromFileGeneric<T>(dbName,storeName,keyPath,file);
    },
    [dbName,storeName,keyPath]
  );

  const exportToFile = useCallback(
    async (fileName?: string) => {
      if (!dbName) return;
      await exportJSONToFileGeneric<T>(dbName,storeName,keyPath,fileName);
    },
    [dbName,storeName,keyPath]
  );

  const getByKey = useCallback(
    async (key: string | number) => {
      if (!dbName) return undefined;
      return await getGeneric<T>(dbName,storeName,key,keyPath);
    },
    [dbName,storeName,keyPath]
  );

  // Initial load
  useEffect(() => {
    reload();
  },[reload]);

  // Listen to changes
  useEffect(() => {
    if (!dbName) return;

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.dbName === dbName && detail?.storeName === storeName) {
        reload();
      }
    };
    window.addEventListener('indexeddb-changed',onChange);
    return () => window.removeEventListener('indexeddb-changed',onChange);
  },[dbName,storeName,reload]);

  return {
    items,
    setItems, // expose setItems for external state update
    save,
    remove,
    clear,
    reload,
    importFromFile,
    exportToFile,
    getByKey,
  };
}
