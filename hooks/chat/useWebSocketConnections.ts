"use client";

import { useState,useEffect,useRef,useCallback } from 'react';
import { createChatWebSocket,FREE_WEBSOCKET_ENDPOINTS } from '@/packages/chat-widget/src/services/websocket';

// Single WebSocket connection (admin-dashboard) that listens to all projects
export const useWebSocketConnections = (dbInitialized,chats,handleUserMessage) => {
  const [wsConnected,setWsConnected] = useState(false);
  const [connectedSessions,setConnectedSessions] = useState(new Set()); // `${projectKey}_${sessionId}`
  const wsRef = useRef<any>(null);

  useEffect(() => {
    if (!dbInitialized) return;

    const wsService = createChatWebSocket({
      url: FREE_WEBSOCKET_ENDPOINTS.ECHO_WEBSOCKET,
      projectKey: 'admin-dashboard',
      sessionId: `admin-listener-${Date.now()}`,
      onMessage: async (wsMessage) => {
        const { projectKey,sessionId,type,projectName } = wsMessage;

        // Only persist user messages on admin dashboard to avoid duplicate admin echoes
        if (type === 'user_message') {
          await handleUserMessage({
            ...wsMessage,
            projectKey,
            projectName: projectName || projectKey
          });
        } else if (type === 'user_join') {
          setConnectedSessions(prev => new Set([...prev,`${projectKey}_${sessionId}`]));
        } else if (type === 'user_leave') {
          setConnectedSessions(prev => {
            const next = new Set(prev);
            next.delete(`${projectKey}_${sessionId}`);
            return next;
          });
        }
      },
      onConnect: () => {
        setWsConnected(true);
      },
      onDisconnect: () => {
        setWsConnected(false);
        setConnectedSessions(new Set());
      },
      onError: (error) => {
        console.error('Admin WebSocket error:',error);
      }
    });

    wsRef.current = wsService;
    wsService.connect().catch((e) => console.error('Admin WS connect error:',e));

    return () => {
      try {
        wsService.disconnect();
      } catch { }
      wsRef.current = null;
    };
  },[dbInitialized]);

  // API compatibility for UI
  const connectToProject = useCallback(async () => true,[]);
  const disconnectFromProject = useCallback(() => true,[]);
  const getProjectConnections = useCallback(() => {
    // Aggregate connected projects from sessions
    const projectKeys = new Set<string>();
    connectedSessions.forEach((key: any) => {
      if (typeof key === 'string') {
        const [projectKey] = key.split('_');
        if (projectKey) projectKeys.add(projectKey);
      }
    });

    const list = Array.from(projectKeys).map(projectKey => ({
      projectKey,
      isConnected: true,
      hasReconnectTimer: false
    }));

    // Always include admin-dashboard
    return [{ projectKey: 'admin-dashboard',isConnected: wsConnected,hasReconnectTimer: false },...list];
  },[connectedSessions,wsConnected]);

  return {
    wsConnected,
    connectedSessions,
    wsRef,
    connectToProject,
    disconnectFromProject,
    getProjectConnections
  };
};
