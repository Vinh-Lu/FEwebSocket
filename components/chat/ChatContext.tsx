"use client";

import React,{ createContext,useContext,useState,useEffect } from 'react';
import { useChatDatabase } from '@/hooks/chat/useChatDatabase';
import { useMessageHandler } from '@/hooks/chat/useMessageHandler';
import { useWebSocketConnections } from '@/hooks/chat/useWebSocketConnections';
import { useChatOperations } from '@/hooks/chat/useChatOperations';
import { useMessageOperations } from '@/hooks/chat/useMessageOperations';
import { useProjectManagement } from '@/hooks/chat/useProjectManagement';
import { useProductKeysStore } from '@/hooks/index-db/use-product-keys';
import { DEFAULT_PRODUCT_KEY,DEFAULT_PRODUCT_LABEL } from '@/utils/const';

const ChatContext = createContext(undefined);

export const ChatProvider = ({ children }) => {
  // Loading states
  const [isLoadingMessages,setIsLoadingMessages] = useState(false);
  const [hasMoreMessages,setHasMoreMessages] = useState({});
  const [messagePages,setMessagePages] = useState({});


  // Database hook
  const { dbInitialized,chatStore,messageStore,chats,messages,setChats,setMessages } = useChatDatabase();

  // Message handler hook
  const { handleUserMessage } = useMessageHandler(chats,chatStore,messageStore,setChats,setMessages);

  // Product keys from IndexedDB
  const { productKeys,activeProductKeys,addOrUpdateKey,removeKey,setActive,reload: reloadProductKeys } = useProductKeysStore();

  // Seed default product_key if missing
  useEffect(() => {
    if (!productKeys) return;
    const exists = productKeys.some((k: any) => k.key === DEFAULT_PRODUCT_KEY);
    if (!exists) {
      addOrUpdateKey({ key: DEFAULT_PRODUCT_KEY,label: DEFAULT_PRODUCT_LABEL,active: true });
    }
  },[productKeys,addOrUpdateKey]);

  // WebSocket connections hook (depends on activeProductKeys)
  const {
    wsConnected,
    connectedSessions,
    wsRef,
    connectToProject,
    disconnectFromProject,
    getProjectConnections
  } = useWebSocketConnections(dbInitialized,chats,handleUserMessage,activeProductKeys);

  // Chat operations hook
  const {
    addChat,
    deleteChat,
    getMessagesForChat,
    loadInitialMessages,
    markAsRead,
    editMessage,
    deleteMessage,
    loadMoreMessages
  } = useChatOperations(chatStore,messageStore,chats,messages);

  // Mark all chats of a project as read
  const markProjectAsRead = React.useCallback(async (projectKey: string) => {
    try {
      const targetChats = chats.filter(c => c.projectKey === projectKey && (c.unreadCount || 0) > 0);
      for (const chat of targetChats) {
        await chatStore.save({ ...chat,unreadCount: 0 });
      }
    } catch (e) {
      // ignore
    }
  },[chats,chatStore]);

  // Message operations hook
  const {
    replyingTo,
    sendMessage,
    sendMessageToSession,
    replyToMessage,
    cancelReply
  } = useMessageOperations(messageStore,chatStore,chats,wsRef);

  // Project management hook
  const {
    selectedProject,
    projectStats,
    getProjects,
    getSessionsForProject,
    selectProject,
    getSessionStatus
  } = useProjectManagement(chats,connectedSessions);

  return (
    <ChatContext.Provider value={{
      // Database state
      chats,
      messages,

      // Chat operations
      addChat,
      deleteChat,
      getMessagesForChat,
      loadInitialMessages,
      markAsRead,
      editMessage,
      deleteMessage,
      loadMoreMessages,

      // Message operations
      sendMessage,
      sendMessageToSession,
      replyToMessage,
      cancelReply,
      replyingTo,

      // Loading states
      isLoadingMessages,
      hasMoreMessages,

      // WebSocket state
      wsConnected,
      connectedSessions,

      // Project management
      getProjects,
      getSessionsForProject,
      selectProject,
      selectedProject,
      getSessionStatus,
      projectStats,

      // Multi-WebSocket admin functions
      connectToProject,
      disconnectFromProject,
      getProjectConnections,

      // Product keys management
      productKeys,
      activeProductKeys,
      addOrUpdateKey,
      removeKey,
      setActive,
      reloadProductKeys,

      // Project-level helpers
      markProjectAsRead
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
