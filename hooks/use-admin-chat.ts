import { useState,useCallback,useEffect,useRef } from 'react';
import type { WebSocketMessage } from '@/packages/chat-widget/src/services/websocket';
import { ChatWebSocketService,createChatWebSocket,FREE_WEBSOCKET_ENDPOINTS } from '@/packages/chat-widget/src/services/websocket';
import { useGenericIndexedDBStore } from '@/hooks/useGenericIndexedDBStore';
import { initChatDB } from '@/providers/chatDB';

export interface AdminChatMessage extends WebSocketMessage {
  id: string;
  read: boolean;
  saved: boolean;
  receivedAt: string;
  adminNote?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AdminChatSession {
  sessionId: string;
  projectKey: string;
  projectName?: string;
  firstMessage?: AdminChatMessage;
  lastMessage?: AdminChatMessage;
  messageCount: number;
  unreadCount: number;
  isActive: boolean;
  lastActivity: Date;
  userAgent?: string;
  tags?: string[];
}

export interface AdminChatConfig {
  adminId?: string;
  adminName?: string;
  autoConnect?: boolean;
  maxMessages?: number;
  endpoint?: string;
  projectFilter?: string; // Filter messages by specific project
}

export const useAdminChat = (config: AdminChatConfig = {}) => {
  const {
    adminId = `admin-${Date.now()}`,
    adminName = 'Admin',
    autoConnect = true,
    maxMessages = 1000,
    endpoint = FREE_WEBSOCKET_ENDPOINTS.ECHO_WEBSOCKET,
    projectFilter // If set, only listen to specific project
  } = config;

  // Core states
  const [isConnected,setIsConnected] = useState(false);
  const [connectionStatus,setConnectionStatus] = useState<'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'ERROR'>('CLOSED');
  const [dbInitialized,setDbInitialized] = useState(false);
  const [totalUnreadCount,setTotalUnreadCount] = useState(0);

  // Session tracking
  const [activeSessions,setActiveSessions] = useState<Map<string,AdminChatSession>>(new Map());
  const [selectedSession,setSelectedSession] = useState<string | null>(null);

  // Project tracking
  const [activeProjects,setActiveProjects] = useState<Set<string>>(new Set());
  const [projectStats,setProjectStats] = useState<Map<string,{
    sessionCount: number;
    messageCount: number;
    unreadCount: number;
    lastActivity: Date;
  }>>(new Map());

  const wsRef = useRef<ChatWebSocketService | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize database
  useEffect(() => {
    const initDB = async () => {
      try {
        await initChatDB();
        setDbInitialized(true);
        console.log('Admin Chat DB initialized');
      } catch (error) {
        console.error('Failed to initialize admin chat DB:',error);
      }
    };
    initDB();
  },[]);

  // IndexedDB store for admin messages
  const messageStore = useGenericIndexedDBStore(
    dbInitialized ? 'FutaChatDB' : null,
    'admin_messages',
    'id',
    { maxItems: maxMessages }
  );

  const messages = (dbInitialized ? messageStore.items : []) as AdminChatMessage[];

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback(async (wsMessage: WebSocketMessage) => {

    // Apply project filter if set
    if (projectFilter && wsMessage.projectKey !== projectFilter) {
      return;
    }

    // Create admin message
    const adminMessage: AdminChatMessage = {
      ...wsMessage,
      id: `${wsMessage.projectKey}-${wsMessage.sessionId}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
      read: false,
      saved: false,
      receivedAt: new Date().toISOString(),
      priority: 'normal'
    };

    // Save to IndexedDB
    if (dbInitialized && messageStore.save) {
      try {
        await messageStore.save(adminMessage);
        adminMessage.saved = true;
        console.log('Admin message saved:',adminMessage.id);
      } catch (error) {
        console.error('Failed to save admin message:',error);
      }
    }

    // Update session tracking
    updateSessionTracking(adminMessage);

    // Update project tracking
    updateProjectTracking(adminMessage);

    // Update unread count
    if (wsMessage.type === 'user_message') {
      setTotalUnreadCount(prev => prev + 1);
    }

  },[dbInitialized,messageStore,projectFilter]);

  // Update session tracking
  const updateSessionTracking = useCallback((message: AdminChatMessage) => {
    const sessionKey = `${message.projectKey}-${message.sessionId}`;

    setActiveSessions(prev => {
      const newSessions = new Map(prev);

      if (newSessions.has(sessionKey)) {
        // Update existing session
        const session = newSessions.get(sessionKey)!;
        session.lastMessage = message;
        session.messageCount += 1;
        session.lastActivity = new Date(message.timestamp);

        if (!message.read && message.type === 'user_message') {
          session.unreadCount += 1;
        }

        session.isActive = message.type === 'user_join' || (message.type !== 'user_leave');
      } else {
        // Create new session
        const newSession: AdminChatSession = {
          sessionId: message.sessionId,
          projectKey: message.projectKey,
          projectName: message.projectName,
          firstMessage: message,
          lastMessage: message,
          messageCount: 1,
          unreadCount: message.read ? 0 : (message.type === 'user_message' ? 1 : 0),
          isActive: message.type !== 'user_leave',
          lastActivity: new Date(message.timestamp),
          userAgent: message.userAgent,
          tags: []
        };
        newSessions.set(sessionKey,newSession);
      }

      return newSessions;
    });
  },[]);

  // Update project tracking
  const updateProjectTracking = useCallback((message: AdminChatMessage) => {
    setActiveProjects(prev => new Set([...prev,message.projectKey]));

    setProjectStats(prev => {
      const newStats = new Map(prev);
      const existing = newStats.get(message.projectKey) || {
        sessionCount: 0,
        messageCount: 0,
        unreadCount: 0,
        lastActivity: new Date(message.timestamp)
      };

      existing.messageCount += 1;
      existing.lastActivity = new Date(message.timestamp);

      if (!message.read && message.type === 'user_message') {
        existing.unreadCount += 1;
      }

      newStats.set(message.projectKey,existing);
      return newStats;
    });
  },[]);

  // WebSocket connection handlers
  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setConnectionStatus('OPEN');
    reconnectAttempts.current = 0;
    console.log('Admin WebSocket connected');
  },[]);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setConnectionStatus('CLOSED');
    console.log('Admin WebSocket disconnected');
  },[]);

  const handleError = useCallback((error: Event) => {
    console.error('Admin WebSocket error:',error);
    setConnectionStatus('ERROR');
  },[]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (wsRef.current || !dbInitialized) return;

    try {
      setConnectionStatus('CONNECTING');

      wsRef.current = createChatWebSocket({
        url: endpoint,
        projectKey: projectFilter || 'admin-dashboard', // Listen to all if no filter
        sessionId: adminId,
        onMessage: handleWebSocketMessage,
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onError: handleError
      });

      await wsRef.current.connect();
    } catch (error) {
      console.error('Failed to connect admin WebSocket:',error);
      setConnectionStatus('ERROR');
    }
  },[dbInitialized,endpoint,projectFilter,adminId,handleWebSocketMessage,handleConnect,handleDisconnect,handleError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('CLOSED');
  },[]);

  // Send admin message to specific session
  const sendAdminMessage = useCallback(async (
    message: string,
    targetProjectKey: string,
    targetSessionId: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ) => {
    if (!wsRef.current?.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    const adminReply: WebSocketMessage = {
      type: 'admin_message',
      projectKey: targetProjectKey,
      sessionId: targetSessionId,
      message,
      timestamp: new Date().toISOString(),
      userId: adminId,
      userName: adminName
    };

    // Send via WebSocket
    wsRef.current.sendMessage(adminReply);

    // Save admin's reply to DB
    const adminMessage: AdminChatMessage = {
      ...adminReply,
      id: `admin-${adminId}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
      read: true, // Admin's own messages are pre-read
      saved: false,
      receivedAt: new Date().toISOString(),
      priority
    };

    if (dbInitialized && messageStore.save) {
      try {
        await messageStore.save(adminMessage);
        console.log('Admin reply saved:',adminMessage.id);
      } catch (error) {
        console.error('Failed to save admin reply:',error);
      }
    }

    return adminMessage.id;
  },[wsRef,adminId,adminName,dbInitialized,messageStore]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && !message.read && messageStore.save) {
      const updatedMessage = { ...message,read: true };
      await messageStore.save(updatedMessage);

      // Update unread count
      if (message.type === 'user_message') {
        setTotalUnreadCount(prev => Math.max(0,prev - 1));
      }
    }
  },[messages,messageStore]);

  // Mark all messages in session as read
  const markSessionAsRead = useCallback(async (sessionKey: string) => {
    const sessionMessages = messages.filter(m =>
      `${m.projectKey}-${m.sessionId}` === sessionKey && !m.read
    );

    for (const message of sessionMessages) {
      if (messageStore.save) {
        await messageStore.save({ ...message,read: true });
      }
    }

    // Update unread counts
    const userMessages = sessionMessages.filter(m => m.type === 'user_message');
    setTotalUnreadCount(prev => Math.max(0,prev - userMessages.length));
  },[messages,messageStore]);

  // Get messages for specific session
  const getSessionMessages = useCallback((sessionKey: string) => {
    const [projectKey,sessionId] = sessionKey.split('-');
    return messages.filter(m =>
      m.projectKey === projectKey && m.sessionId === sessionId
    ).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },[messages]);

  // Select session for detailed view
  const selectSession = useCallback((sessionKey: string | null) => {
    setSelectedSession(sessionKey);

    // Mark session as read when selected
    if (sessionKey) {
      markSessionAsRead(sessionKey);
    }
  },[markSessionAsRead]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && dbInitialized) {
      connect();
    }

    return () => {
      disconnect();
    };
  },[autoConnect,dbInitialized,connect,disconnect]);

  // Update session counts from project stats
  useEffect(() => {
    setProjectStats(prev => {
      const newStats = new Map(prev);

      activeSessions.forEach((session,sessionKey) => {
        const existing = newStats.get(session.projectKey) || {
          sessionCount: 0,
          messageCount: 0,
          unreadCount: 0,
          lastActivity: new Date()
        };

        existing.sessionCount = Array.from(activeSessions.values())
          .filter(s => s.projectKey === session.projectKey).length;

        newStats.set(session.projectKey,existing);
      });

      return newStats;
    });
  },[activeSessions]);

  // Computed values
  const selectedSessionMessages = selectedSession ? getSessionMessages(selectedSession) : [];
  const unreadSessions = Array.from(activeSessions.values()).filter(s => s.unreadCount > 0);
  const recentMessages = messages.slice(-20);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    dbInitialized,

    // Messages and sessions
    messages,
    recentMessages,
    activeSessions,
    selectedSession,
    selectedSessionMessages,
    unreadSessions,

    // Project tracking
    activeProjects,
    projectStats,

    // Stats
    totalUnreadCount,
    totalSessions: activeSessions.size,
    totalMessages: messages.length,

    // Actions
    connect,
    disconnect,
    sendAdminMessage,
    markMessageAsRead,
    markSessionAsRead,
    selectSession,
    getSessionMessages,

    // Utilities
    adminId,
    adminName,
    projectFilter
  };
};
