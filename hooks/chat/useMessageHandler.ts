"use client";
import { useCallback,useRef } from 'react';

export const useMessageHandler = (chats,chatStore,messageStore,setChats,setMessages) => {
  const processedMapRef = useRef(new Map());

  const handleUserMessage = useCallback(async (wsMessage) => {
    const { projectKey,sessionId,message,timestamp,projectName,type } = wsMessage;

    // Dedupe user messages within a short window
    if (type === 'user_message') {
      const sig = `${projectKey}|${sessionId}|${timestamp}|${message}`;
      const now = Date.now();
      const seenAt = processedMapRef.current.get(sig) || 0;
      if (seenAt && now - seenAt < 60_000) {
        return;
      }
      processedMapRef.current.set(sig,now);
      // cleanup
      if (processedMapRef.current.size > 2000) {
        const threshold = now - 5 * 60_000;
        for (const [k,v] of processedMapRef.current.entries()) {
          if (v < threshold) processedMapRef.current.delete(k);
        }
      }
    }

    // --- tìm hoặc tạo chat ---
    let existingChat = chats.find(
      (chat) => chat.sessionId === sessionId && chat.projectKey === projectKey
    );

    if (!existingChat) {
      const newChat = {
        id: sessionId,
        title: `${projectName || projectKey} - ${sessionId.slice(-8)}`,
        lastActivity: timestamp || new Date().toISOString(),
        unreadCount: 1,
        status: 'open',
        isTeamChat: false,
        isBot: false,
        sessionId,
        projectKey,
        projectName: projectName || projectKey,
        isWebSocketChat: true,
      };

      try {
        await chatStore.save(newChat);
        // Rely on IndexedDB change event to refresh chats, avoid double-add
        existingChat = newChat;
      } catch (error) {
        console.error('Error creating chat session:',error);
        return;
      }
    }

    // --- xác định sender ---
    let sender = 'user';
    if (type === 'admin_message') sender = 'admin';

    const wsSavedMessage = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
      text: message,
      sender,
      timestamp: timestamp || new Date().toISOString(),
      chatId: existingChat.id,
      isWebSocketMessage: true,
    };

    try {
      await messageStore.save(wsSavedMessage);

      // --- update chat ---
      const updatedChat = {
        ...existingChat,
        lastActivity: wsSavedMessage.timestamp,
        lastMessage: wsSavedMessage,
        unreadCount:
          sender === 'user'
            ? (existingChat.unreadCount || 0) + 1
            : existingChat.unreadCount || 0,
      };
      await chatStore.save(updatedChat);
      // Rely on IndexedDB change event to refresh chats/messages
    } catch (error) {
      console.error('Error saving websocket message:',error);
    }
  },[chats,chatStore,messageStore,setChats,setMessages]);

  return {
    handleUserMessage,
  };
};
