"use client";

import { useCallback } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  chatId: string; // sẽ là projectKey
  edited?: boolean;
  replyTo?: string;
  deleted?: boolean;
}

interface Chat {
  id: string;
  title: string;
  lastMessage?: Message;
  lastActivity: Date;
  unreadCount: number;
}

interface MessagePage {
  messages: Message[];
  hasMore: boolean;
  lastMessageId?: string;
}

const DB_NAME = 'FutaChatDB';
const DB_VERSION = 1;
const CHAT_STORE = 'chats';
const MESSAGE_STORE = 'messages';
const PAGE_SIZE = 50; // Số message mỗi page

class ChatIndexedDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve,reject) => {
      const request = indexedDB.open(DB_NAME,DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create chats store
        if (!db.objectStoreNames.contains(CHAT_STORE)) {
          const chatStore = db.createObjectStore(CHAT_STORE,{ keyPath: 'id' });
          chatStore.createIndex('lastActivity','lastActivity',{ unique: false });
        }

        // Create messages store
        if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
          const messageStore = db.createObjectStore(MESSAGE_STORE,{ keyPath: 'id' });
          messageStore.createIndex('chatId','chatId',{ unique: false });
          messageStore.createIndex('timestamp','timestamp',{ unique: false });
          messageStore.createIndex('chatId_timestamp',['chatId','timestamp'],{ unique: false });
        }
      };
    });
  }

  async getAllChats(): Promise<Chat[]> {
    if (!this.db) await this.init();

    return new Promise((resolve,reject) => {
      const transaction = this.db!.transaction([CHAT_STORE],'readonly');
      const store = transaction.objectStore(CHAT_STORE);
      const index = store.index('lastActivity');
      const request = index.getAll();

      request.onsuccess = () => {
        const chats = request.result.map((chat: any) => ({
          ...chat,
          lastActivity: new Date(chat.lastActivity),
          lastMessage: chat.lastMessage ? {
            ...chat.lastMessage,
            timestamp: new Date(chat.lastMessage.timestamp)
          } : undefined
        }));

        // Sort by lastActivity descending
        chats.sort((a,b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        resolve(chats);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveChat(chat: Chat): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve,reject) => {
      const transaction = this.db!.transaction([CHAT_STORE],'readwrite');
      const store = transaction.objectStore(CHAT_STORE);
      const request = store.put({
        ...chat,
        lastActivity: chat.lastActivity.toISOString(),
        lastMessage: chat.lastMessage ? {
          ...chat.lastMessage,
          timestamp: chat.lastMessage.timestamp.toISOString()
        } : undefined
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChat(chatId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve,reject) => {
      const transaction = this.db!.transaction([CHAT_STORE,MESSAGE_STORE],'readwrite');

      // Delete chat
      const chatStore = transaction.objectStore(CHAT_STORE);
      chatStore.delete(chatId);

      // Delete all messages for this chat
      const messageStore = transaction.objectStore(MESSAGE_STORE);
      const index = messageStore.index('chatId');
      const request = index.getAll(chatId);

      request.onsuccess = () => {
        const messages = request.result;
        messages.forEach(message => {
          messageStore.delete(message.id);
        });
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getMessagesPaginated(chatId: string,lastMessageId?: string): Promise<MessagePage> {
    if (!this.db) await this.init();

    return new Promise((resolve,reject) => {
      const transaction = this.db!.transaction([MESSAGE_STORE],'readonly');
      const store = transaction.objectStore(MESSAGE_STORE);
      const index = store.index('chatId_timestamp');

      let messages: Message[] = [];
      let cursor: IDBCursorWithValue | null = null;
      let skipCount = 0;
      let foundStartPoint = !lastMessageId; // If no lastMessageId, start from beginning

      const request = index.openCursor(IDBKeyRange.bound([chatId,new Date(0)],[chatId,new Date()]),'next');

      request.onsuccess = (event) => {
        cursor = (event.target as IDBRequest).result;

        if (cursor) {
          const message = {
            ...cursor.value,
            timestamp: new Date(cursor.value.timestamp)
          };

          // Skip until we find the last message ID (for pagination)
          if (!foundStartPoint) {
            if (cursor.value.id === lastMessageId) {
              foundStartPoint = true;
            }
            cursor.continue();
            return;
          }

          // Collect messages after the start point
          if (messages.length < PAGE_SIZE) {
            messages.push(message);
            cursor.continue();
          } else {
            // We have enough messages, check if there are more
            resolve({
              messages,
              hasMore: true,
              lastMessageId: messages[messages.length - 1]?.id
            });
            return;
          }
        } else {
          // No more messages
          resolve({
            messages,
            hasMore: false,
            lastMessageId: messages[messages.length - 1]?.id
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveMessage(message: Message): Promise<void> {
    if (!this.db) await this.init();

    // Đảm bảo chatId là projectKey
    const msgToSave = {
      ...message,
      chatId: message.projectKey || message.chatId, // Ưu tiên projectKey
      timestamp: message.timestamp.toISOString()
    };

    return new Promise((resolve,reject) => {
      const transaction = this.db!.transaction([MESSAGE_STORE],'readwrite');
      const store = transaction.objectStore(MESSAGE_STORE);
      const request = store.put(msgToSave);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLatestMessages(chatId: string,limit: number = PAGE_SIZE): Promise<Message[]> {
    if (!this.db) await this.init();

    return new Promise((resolve,reject) => {
      const transaction = this.db!.transaction([MESSAGE_STORE],'readonly');
      const store = transaction.objectStore(MESSAGE_STORE);
      const index = store.index('chatId_timestamp');

      const messages: Message[] = [];
      const request = index.openCursor(
        IDBKeyRange.bound([chatId,new Date(0)],[chatId,new Date()]),
        'prev' // Start from newest
      );

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor && messages.length < limit) {
          const message = {
            ...cursor.value,
            timestamp: new Date(cursor.value.timestamp)
          };
          messages.push(message);
          cursor.continue();
        } else {
          // Reverse to get chronological order
          resolve(messages.reverse());
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export const useChatIndexedDB = () => {
  const db = new ChatIndexedDB();

  const getAllChats = useCallback(async (): Promise<Chat[]> => {
    return await db.getAllChats();
  },[]);

  const saveChat = useCallback(async (chat: Chat): Promise<void> => {
    return await db.saveChat(chat);
  },[]);

  const deleteChat = useCallback(async (chatId: string): Promise<void> => {
    return await db.deleteChat(chatId);
  },[]);

  // Các hàm lấy/lưu message sẽ dùng projectKey làm chatId
  const getMessagesPaginated = useCallback(async (projectKey: string,lastMessageId?: string): Promise<MessagePage> => {
    return await db.getMessagesPaginated(projectKey,lastMessageId);
  },[]);

  const saveMessage = useCallback(async (message: Message): Promise<void> => {
    // Đảm bảo chatId là projectKey
    return await db.saveMessage({ ...message,chatId: message.projectKey || message.chatId });
  },[]);

  const getLatestMessages = useCallback(async (projectKey: string,limit?: number): Promise<Message[]> => {
    return await db.getLatestMessages(projectKey,limit);
  },[]);

  return {
    getAllChats,
    saveChat,
    deleteChat,
    getMessagesPaginated,
    saveMessage,
    getLatestMessages
  };
};

export default useChatIndexedDB;
export type { MessagePage };
