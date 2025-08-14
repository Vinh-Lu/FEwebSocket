import { openDB,IDBPDatabase,StoreNames } from 'idb';

// Interface chung cho item lưu trữ
export interface StorableItem {
  [key: string]: any;
}

// 📣 Emit event mỗi khi thay đổi
function emitIndexedDBChange(dbName: string,storeName: string) {
  window.dispatchEvent(
    new CustomEvent('indexeddb-changed',{
      detail: { dbName,storeName },
    })
  );
}

// ✅ Hàm lấy database với keyPath động và auto-detect version
export async function getGenericDB<T extends StorableItem>(
  dbName: string,
  storeName: any,
  keyPath: string,
  version?: number
): Promise<IDBPDatabase<T>> {
  // Nếu không truyền version, tự động nâng version khi cần để tạo store còn thiếu
  if (!version) {
    try {
      const existingDB = await openDB(dbName);
      const currentVersion = existingDB.version;
      const hasStore = existingDB.objectStoreNames.contains(storeName);
      existingDB.close();

      version = hasStore ? currentVersion : currentVersion + 1;
    } catch (error) {
      // Nếu database chưa tồn tại, dùng version 1
      version = 1;
    }
  }

  return openDB<T>(dbName,version,{
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName,{ keyPath });
      }
    },
  });
}

// ✅ Get tất cả item trong store
export async function getAllGeneric<T extends StorableItem>(
  dbName: string,
  storeName: string,
  keyPath: string
): Promise<T[]> {
  const db = await getGenericDB<T>(dbName,storeName,keyPath);
  return db.getAll(storeName as StoreNames<T>);
}

// ✅ Put (create or update) item
export async function putGeneric<T extends StorableItem>(
  dbName: string,
  storeName: string,
  item: any,
  keyPath: string
): Promise<void> {
  const db = await getGenericDB<T>(dbName,storeName,keyPath);
  await db.put(storeName as StoreNames<T>,item);
  emitIndexedDBChange(dbName,storeName);
}

// ✅ Add mới item (sẽ lỗi nếu trùng key)
export async function addGeneric<T extends StorableItem>(
  dbName: string,
  storeName: string,
  item: any,
  keyPath: string
): Promise<void> {
  if (!item[keyPath]) {
    throw new Error(`Item is missing keyPath "${keyPath}"`);
  }
  const db = await getGenericDB<T>(dbName,storeName,keyPath);
  await db.add(storeName as StoreNames<T>,item);
  emitIndexedDBChange(dbName,storeName);
}

// ✅ Xóa item theo key
export async function removeGeneric<T extends StorableItem>(
  dbName: string,
  storeName: string,
  key: any,
  keyPath: string
): Promise<void> {
  const db = await getGenericDB<T>(dbName,storeName,keyPath);
  await db.delete(storeName as StoreNames<T>,key);
  emitIndexedDBChange(dbName,storeName);
}

// ✅ Xóa tất cả item trong store
export async function clearAllGeneric<T extends StorableItem>(
  dbName: string,
  storeName: string,
  keyPath: string
): Promise<void> {
  const db = await getGenericDB<T>(dbName,storeName,keyPath);
  await db.clear(storeName as StoreNames<T>);
  emitIndexedDBChange(dbName,storeName);
}

// ✅ Import JSON từ file
export async function importJSONFromFileGeneric<T extends StorableItem>(
  dbName: string,
  storeName: any,
  keyPath: string,
  file: File
): Promise<void> {
  const text = await file.text();
  const data: T[] = JSON.parse(text);
  await clearAllGeneric(dbName,storeName,keyPath); // sẽ emit
  const db = await getGenericDB<T>(dbName,storeName,keyPath);
  const tx = db.transaction(storeName,'readwrite');
  for (const item of data) {
    if (!item[keyPath]) {
      throw new Error(`Imported item is missing keyPath "${keyPath}"`);
    }
    await tx.store.put(item as StoreNames<T>);
  }
  await tx.done;
  emitIndexedDBChange(dbName,storeName); // emit sau import
}

// ✅ Export JSON ra file
export async function exportJSONToFileGeneric<T extends StorableItem>(
  dbName: string,
  storeName: string,
  keyPath: string,
  fileName: string = 'exported-data.json'
): Promise<void> {
  const data = await getAllGeneric<T>(dbName,storeName,keyPath);
  const blob = new Blob([JSON.stringify(data,null,2)],{
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// ✅ Get 1 item theo key
export async function getGeneric<T extends StorableItem>(
  dbName: string,
  storeName: any,
  key: any,
  keyPath: string
): Promise<T | undefined> {
  const db = await getGenericDB<T>(dbName,storeName,keyPath);
  return db.get(storeName,key);
}
