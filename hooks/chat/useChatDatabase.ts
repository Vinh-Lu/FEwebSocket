"use client";

import { useState,useEffect } from 'react';
import { useGenericIndexedDBStore } from '@/hooks/useGenericIndexedDBStore';
import { initChatDB } from '@/providers/chatDB';

export const useChatDatabase = () => {
  const [dbInitialized,setDbInitialized] = useState(false);

  // Initialize chat database first
  useEffect(() => {
    const initDB = async () => {
      try {
        await initChatDB();
        setDbInitialized(true);
        console.log('Chat DB initialized successfully');
      } catch (error) {
        console.error('Failed to initialize chat DB:',error);
      }
    };

    initDB();
  },[]);

  // Use generic IndexedDB stores only after DB is initialized
  const chatStore = useGenericIndexedDBStore(
    dbInitialized ? 'FutaChatDB' : null,
    'chats',
    'id',
    { maxItems: 100 }
  );

  const messageStore = useGenericIndexedDBStore(
    dbInitialized ? 'FutaChatDB' : null,
    'messages',
    'id',
    { maxItems: 1000 }
  );

  const chats = dbInitialized ? chatStore.items : [];
  const messages = dbInitialized ? messageStore.items : [];

  // Expose setChats and setMessages for global state update
  const setChats = chatStore.setItems;
  const setMessages = messageStore.setItems;

  return {
    dbInitialized,
    chatStore,
    messageStore,
    chats,
    messages,
    setChats,
    setMessages
  };
};
