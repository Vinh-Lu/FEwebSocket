"use client";

import { useState,useCallback } from 'react';

const generateAssistantResponse = (userText) => {
  const responses = [
    "Tôi hiểu bạn đang hỏi về: " + userText,
    "Cảm ơn bạn đã liên hệ. Tôi sẽ hỗ trợ bạn về vấn đề này.",
    "Đây là một câu hỏi thú vị. Hãy để tôi giải thích chi tiết.",
    "Tôi có thể giúp bạn với vấn đề này. Bạn có thể cung cấp thêm thông tin không?",
    "Dựa trên câu hỏi của bạn, tôi khuyến nghị bạn nên xem xét các phương án sau."
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

export const useMessageOperations = (messageStore,chatStore,chats,wsRef) => {
  const [replyingTo,setReplyingTo] = useState(null);

  const sendMessage = useCallback(async (chatId,text) => {
    const chat = chats.find(c => c.id === chatId);

    const adminMessage = {
      id: Date.now().toString(),
      text,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      chatId,
      replyTo: replyingTo?.text
    };

    try {
      // Save admin message to IndexedDB
      await messageStore.save(adminMessage);

      // Clear reply state
      setReplyingTo(null);

      // Update chat last activity
      if (chat) {
        const updatedChat = {
          ...chat,
          lastActivity: new Date().toISOString(),
          lastMessage: adminMessage,
          unreadCount: 0
        };
        await chatStore.save(updatedChat);

        // Nếu là WebSocket chat, gửi tin nhắn qua WebSocket tương ứng
        if (chat.isWebSocketChat && wsRef.current?.sendMessage) {
          const messageSent = wsRef.current.sendMessage({
            type: 'admin_message',
            projectKey: chat.projectKey || 'admin-dashboard',
            sessionId: chat.sessionId || chat.id,
            message: text,
            timestamp: new Date().toISOString(),
            userId: 'admin'
          });

          if (messageSent) {
            console.log('Sent admin message via WebSocket to project:',chat.projectKey,'message:',text);
          } else {
            console.warn('Failed to send message via WebSocket - connection not available for project:',chat.projectKey);
          }
        }
      }

      // Nếu không phải WebSocket chat, simulate response như cũ
      if (!chat?.isWebSocketChat) {
        setTimeout(async () => {
          const assistantMessage = {
            id: (Date.now() + 1).toString(),
            text: generateAssistantResponse(text),
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            chatId
          };

          try {
            await messageStore.save(assistantMessage);

            if (chat) {
              const finalUpdatedChat = {
                ...chat,
                lastActivity: new Date().toISOString(),
                lastMessage: assistantMessage,
                unreadCount: 0
              };
              await chatStore.save(finalUpdatedChat);
            }
          } catch (error) {
            console.error('Error saving assistant message:',error);
          }
        },1000);
      }

    } catch (error) {
      console.error('Error sending message:',error);
      throw error;
    }
  },[messageStore,chatStore,chats,replyingTo,wsRef]);

  const sendMessageToSession = useCallback(async (projectKey,sessionId,text) => {
    const chat = chats.find(c => c.projectKey === projectKey && c.sessionId === sessionId);

    if (!chat) {
      console.error('Chat session not found:',{ projectKey,sessionId });
      return;
    }

    const adminMessage = {
      id: Date.now().toString(),
      text,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      chatId: chat.id,
      replyTo: replyingTo?.text
    };

    try {
      // Save admin message to IndexedDB
      await messageStore.save(adminMessage);

      // Clear reply state
      setReplyingTo(null);

      // Update chat last activity
      const updatedChat = {
        ...chat,
        lastActivity: new Date().toISOString(),
        lastMessage: adminMessage,
        unreadCount: 0
      };
      await chatStore.save(updatedChat);

      // Send message via WebSocket to specific project
      if (wsRef.current?.sendMessage) {
        const messageSent = wsRef.current.sendMessage({
          type: 'admin_message',
          projectKey: projectKey,
          sessionId: sessionId,
          message: text,
          timestamp: new Date().toISOString(),
          userId: 'admin'
        });

        if (messageSent) {
          console.log('Sent admin message to session:',{ projectKey,sessionId,text });
        } else {
          console.warn('Failed to send message to session - connection not available:',{ projectKey,sessionId });
        }
      }

    } catch (error) {
      console.error('Error sending message to session:',error);
      throw error;
    }
  },[chats,messageStore,chatStore,replyingTo,wsRef]);

  const replyToMessage = useCallback((message) => {
    setReplyingTo(message);
  },[]);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  },[]);

  return {
    replyingTo,
    sendMessage,
    sendMessageToSession,
    replyToMessage,
    cancelReply
  };
};
