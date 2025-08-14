// Simple IndexedDB utility for chat widget package
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: Date;
  isRead?: boolean;
  projectKey?: string;
  sessionId?: string;
}

class ChatWidgetDB {
  private dbName = 'ChatWidgetDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve,reject) => {
      const request = indexedDB.open(this.dbName,this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages',{ keyPath: 'id' });
          messageStore.createIndex('sessionId','sessionId',{ unique: false });
          messageStore.createIndex('projectKey','projectKey',{ unique: false });
          messageStore.createIndex('timestamp','timestamp',{ unique: false });
        }
      };
    });
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve,reject) => {
      const transaction = this.db!.transaction(['messages'],'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.put(message);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve,reject) => {
      const transaction = this.db!.transaction(['messages'],'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const messages = request.result.sort((a,b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        resolve(messages);
      };
    });
  }

  async updateMessages(sessionId: string,updates: Partial<ChatMessage>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const messages = await this.getMessages(sessionId);
    const transaction = this.db.transaction(['messages'],'readwrite');
    const store = transaction.objectStore('messages');

    for (const message of messages) {
      const updatedMessage = { ...message,...updates };
      store.put(updatedMessage);
    }

    return new Promise((resolve,reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async clearMessages(sessionId?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve,reject) => {
      const transaction = this.db!.transaction(['messages'],'readwrite');
      const store = transaction.objectStore('messages');

      if (sessionId) {
        const index = store.index('sessionId');
        const request = index.openCursor(sessionId);

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } else {
        store.clear();
      }

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }
}

// Export singleton instance
export const chatWidgetDB = new ChatWidgetDB();
