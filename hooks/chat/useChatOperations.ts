"use client";

import { useCallback } from 'react';

export const useChatOperations = (chatStore,messageStore,chats,messages) => {
  const addChat = useCallback(async (title,properties = {}) => {
    const newChat = {
      id: Date.now().toString(),
      title,
      lastActivity: new Date().toISOString(),
      unreadCount: 0,
      status: 'unassigned', // open, pending, unassigned, processing
      isTeamChat: false,
      isBot: false,
      ...properties // Override with any provided properties
    };

    try {
      await chatStore.save(newChat);
      return newChat.id;
    } catch (error) {
      console.error('Error saving chat:',error);
      throw error;
    }
  },[chatStore]);

  const deleteChat = useCallback(async (chatId) => {
    try {
      await chatStore.remove(chatId);

      // Delete all messages for this chat
      const chatMessages = messages.filter(msg => msg.chatId === chatId);
      for (const msg of chatMessages) {
        await messageStore.remove(msg.id);
      }
    } catch (error) {
      console.error('Error deleting chat:',error);
      throw error;
    }
  },[chatStore,messageStore,messages]);

  const getMessagesForChat = useCallback((chatId) => {
    return messages
      .filter(msg => msg.chatId === chatId)
      .sort((a,b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return aTime - bTime;
      });
  },[messages]);

  const loadInitialMessages = useCallback(async (chatId) => {
    // Messages are already loaded by the generic store
    // No additional action needed
    console.log('Messages for chat',chatId,':',getMessagesForChat(chatId));
  },[getMessagesForChat]);

  const markAsRead = useCallback(async (chatId) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      if (chat && chat.unreadCount > 0) {
        const updatedChat = { ...chat,unreadCount: 0 };
        await chatStore.save(updatedChat);
      }
    } catch (error) {
      console.error('Error marking as read:',error);
    }
  },[chatStore,chats]);

  const editMessage = useCallback(async (messageId,newText) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message && message.sender === 'user') {
        const updatedMessage = {
          ...message,
          text: newText,
          edited: true,
          editedAt: new Date().toISOString()
        };
        await messageStore.save(updatedMessage);
      }
    } catch (error) {
      console.error('Error editing message:',error);
    }
  },[messageStore,messages]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message && message.sender === 'user') {
        const deletedMessage = {
          ...message,
          deleted: true,
          deletedAt: new Date().toISOString()
        };
        await messageStore.save(deletedMessage);
      }
    } catch (error) {
      console.error('Error deleting message:',error);
    }
  },[messageStore,messages]);

  const loadMoreMessages = useCallback(async (chatId) => {
    // For now, return false as generic store loads all messages
    // Can implement pagination later if needed
    return false;
  },[]);

  return {
    addChat,
    deleteChat,
    getMessagesForChat,
    loadInitialMessages,
    markAsRead,
    editMessage,
    deleteMessage,
    loadMoreMessages
  };
};
