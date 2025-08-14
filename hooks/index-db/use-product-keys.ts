"use client";

import { useMemo } from 'react';
import { useGenericIndexedDBStore } from '@/hooks/useGenericIndexedDBStore';

export interface ProductKeyItem {
  key: string; // product_key / projectKey
  label?: string;
  active?: boolean; // whether to auto connect
  endpoint?: string; // optional custom endpoint
  updatedAt?: number;
}

/**
 * Manage product keys (project keys) persisted in IndexedDB for chat connections and filtering
 */
export function useProductKeysStore() {
  const store = useGenericIndexedDBStore<ProductKeyItem>(
    'chat-config',
    'product_keys',
    'key',
    { maxItems: 500 }
  );

  const productKeys = store.items;

  const activeProductKeys = useMemo(
    () => productKeys.filter(k => k.active !== false).map(k => k.key),
    [productKeys]
  );

  const addOrUpdateKey = async (item: ProductKeyItem) => {
    await store.save({ ...item,active: item.active ?? true });
  };

  const removeKey = async (key: string) => {
    await store.remove(key);
  };

  const setActive = async (key: string,active: boolean) => {
    const exists = productKeys.find(k => k.key === key);
    if (exists) {
      await store.save({ ...exists,active });
    } else {
      await store.save({ key,active });
    }
  };

  return {
    productKeys,
    activeProductKeys,
    addOrUpdateKey,
    removeKey,
    setActive,
    reload: store.reload,
  };
}

export default useProductKeysStore;


