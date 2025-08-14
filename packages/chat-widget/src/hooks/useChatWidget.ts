import { useState,useCallback,useEffect,useRef } from 'react';
import type { ProjectConfig,ChatWidgetMessage,ChatSession } from '../types';
import { ChatWebSocketService,createChatWebSocket,FREE_WEBSOCKET_ENDPOINTS,WebSocketMessage } from '../services/websocket';
const SESSION_ID_KEY = 'chat_global_sessionId';
// SessionStorage helpers for chat messages
const getSessionStorageKey = (sessionId: string) => `chat_messages_${sessionId}`;
const getSessionIdKey = (projectKey: string) => `chat_sessionId_${projectKey}`;

// Get or create persistent sessionId for a project
const getOrCreateSessionId = (): string => {
  try {
    const existingSessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (existingSessionId) {
      console.log('Reusing existing global session:',existingSessionId);
      return existingSessionId;
    }

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
    sessionStorage.setItem(SESSION_ID_KEY,newSessionId);
    console.log('Created new global session:',newSessionId);
    return newSessionId;
  } catch (error) {
    console.error('Failed to get/create global session ID:',error);
    return `session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
  }
};


const saveMessagesToSession = (sessionId: string,messages: ChatWidgetMessage[]) => {
  try {
    const key = getSessionStorageKey(sessionId);
    sessionStorage.setItem(key,JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages to sessionStorage:',error);
  }
};

const loadMessagesFromSession = (sessionId: string): ChatWidgetMessage[] => {
  try {
    const key = getSessionStorageKey(sessionId);
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to load messages from sessionStorage:',error);
    return [];
  }
};

const updateMessageInSession = (sessionId: string,messageId: string,updates: Partial<ChatWidgetMessage>) => {
  try {
    const messages = loadMessagesFromSession(sessionId);
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg,...updates } : msg
    );
    saveMessagesToSession(sessionId,updatedMessages);
    return updatedMessages;
  } catch (error) {
    console.error('Failed to update message in sessionStorage:',error);
    return loadMessagesFromSession(sessionId);
  }
};

const markAllMessagesAsRead = (sessionId: string) => {
  try {
    const messages = loadMessagesFromSession(sessionId);
    const updatedMessages = messages.map(msg => ({ ...msg,isRead: true }));
    saveMessagesToSession(sessionId,updatedMessages);
    return updatedMessages;
  } catch (error) {
    console.error('Failed to mark messages as read in sessionStorage:',error);
    return loadMessagesFromSession(sessionId);
  }
};

export const useChatWidget = (projectConfig: ProjectConfig) => {
  const [isOpen,setIsOpen] = useState(false);
  const [isMinimized,setIsMinimized] = useState(false);
  const [sessionId] = useState(() => getOrCreateSessionId(projectConfig.projectKey));
  const [messages,setMessages] = useState<ChatWidgetMessage[]>([]);
  const [unreadCount,setUnreadCount] = useState(0);
  const [isConnected,setIsConnected] = useState(false);
  const [isTyping,setIsTyping] = useState(false);
  const [connectionStatus,setConnectionStatus] = useState<string>('CLOSED');
  const [sessionInitialized,setSessionInitialized] = useState(false);

  const wsRef = useRef<ChatWebSocketService | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sessionStorage messages
  useEffect(() => {
    try {
      // Load existing messages from sessionStorage
      const savedMessages = loadMessagesFromSession(sessionId);
      console.log("savedMessages",savedMessages);

      setMessages(savedMessages);

      // Calculate unread count from saved messages
      const unreadAdminMessages = savedMessages.filter(
        msg => msg.sender === 'admin' && !msg.isRead
      ).length;
      setUnreadCount(unreadAdminMessages);

      setSessionInitialized(true);

      console.log('Chat Widget session initialized, loaded',savedMessages.length,'messages, unread:',unreadAdminMessages);
    } catch (error) {
      console.error('Failed to initialize chat session:',error);
      setSessionInitialized(true); // Still mark as initialized
    }
  },[sessionId]);

  // Initialize WebSocket connection
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const wsService = createChatWebSocket({
          url: FREE_WEBSOCKET_ENDPOINTS.ECHO_WEBSOCKET,
          projectKey: projectConfig.projectKey,
          sessionId,
          onMessage: async (wsMessage: WebSocketMessage) => {
            // Handle incoming WebSocket messages
            if (wsMessage.sessionId === sessionId) {
              if (wsMessage.type === 'admin_message' && wsMessage.message) {
                // Tin nhắn từ admin cho session này
                await addMessage(wsMessage.message,'admin');
              }
            } else if (wsMessage.type === 'typing' && wsMessage.sessionId !== sessionId) {
              // Typing indicator từ user khác
              setIsTyping(wsMessage.message === 'start');
              if (wsMessage.message === 'start') {
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  setIsTyping(false);
                },3000);
              }
            }
          },
          onConnect: () => {
            setIsConnected(true);
            setConnectionStatus('OPEN');
            console.log('WebSocket connected for project:',projectConfig.projectKey);
          },
          onDisconnect: () => {
            setIsConnected(false);
            setConnectionStatus('CLOSED');
            console.log('WebSocket disconnected for project:',projectConfig.projectKey);
          },
          onError: (error) => {
            console.error('WebSocket error:',error);
            setConnectionStatus('ERROR');
          }
        });

        wsRef.current = wsService;
        await wsService.connect();
      } catch (error) {
        console.error('Failed to initialize WebSocket:',error);
      }
    };

    initWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  },[projectConfig.projectKey,sessionId]);

  // Initialize with custom greeting based on project
  useEffect(() => {
    if (!sessionInitialized) return;

    // Check if greeting already exists
    const hasGreeting = messages.some(msg => msg.id === '1' && msg.sender === 'admin');

    if (!hasGreeting) {
      const defaultGreeting = projectConfig.customGreeting ||
        `Xin chào! Chúng tôi là team hỗ trợ ${projectConfig.projectName}. Chúng tôi có thể giúp gì cho bạn hôm nay?`;

      const greetingMessage: ChatWidgetMessage = {
        id: '1',
        text: defaultGreeting,
        sender: 'admin',
        timestamp: new Date(),
        isRead: true,
        projectKey: projectConfig.projectKey,
        sessionId
      };

      // Save to sessionStorage and update state
      const updatedMessages = [greetingMessage,...messages];
      saveMessagesToSession(sessionId,updatedMessages);
      setMessages(updatedMessages);
    }
  },[sessionInitialized,messages,projectConfig,sessionId]);

  const addMessage = useCallback(
    async (text: string,sender: 'user' | 'admin') => {

      const newMessage: ChatWidgetMessage = {
        id: Date.now().toString(),
        text,
        sender,
        timestamp: new Date(),
        isRead: sender === 'user' || (isOpen && !isMinimized),
        projectKey: projectConfig.projectKey,
        sessionId,
      };

      try {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === newMessage.id)) {
            return prev;
          }

          const updatedMessages = [...prev,newMessage];
          saveMessagesToSession(sessionId,updatedMessages);
          return updatedMessages;
        });
      } catch (error) {
        console.error('Failed to save message to sessionStorage:',error);
        setMessages((prev) =>
          prev.some((msg) => msg.id === newMessage.id)
            ? prev
            : [...prev,newMessage]
        );
      }

      if (sender === 'admin' && (!isOpen || isMinimized)) {
        setUnreadCount((prev) => prev + 1);
      }


      return newMessage.id;
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      // Update all messages in this session to read in sessionStorage
      const updatedMessages = markAllMessagesAsRead(sessionId);
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Failed to update messages in sessionStorage:',error);
      // Fallback to state only
      setMessages(prev =>
        prev.map(msg => ({ ...msg,isRead: true }))
      );
    }

    setUnreadCount(0);
  },[sessionId]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    markAllAsRead();
  },[markAllAsRead]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  },[]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
    setIsOpen(false);
  },[]);

  const toggleChat = useCallback(() => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  },[isOpen,openChat,closeChat]);

  // Simulate admin responses with project context
  const simulateAdminResponse = useCallback(async (userMessage: string) => {
    const responses = [
      `Cảm ơn bạn đã liên hệ với ${projectConfig.projectName}. Chúng tôi sẽ hỗ trợ bạn ngay.`,
      `Cho tôi xin thêm thông tin để team ${projectConfig.projectName} có thể hỗ trợ bạn tốt hơn.`,
      `Tôi hiểu vấn đề của bạn. Team ${projectConfig.projectName} sẽ xử lý ngay.`,
      'Bạn có thể cung cấp thêm chi tiết không?',
      `Chúng tôi sẽ kiểm tra và phản hồi bạn sớm nhất có thể. Nếu cần hỗ trợ khẩn cấp, vui lòng liên hệ: ${projectConfig.supportEmail || 'support@company.com'}`
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    setTimeout(async () => {
      await addMessage(randomResponse,'admin');
    },1500 + Math.random() * 1500); // Random delay between 1.5-3s
  },[addMessage,projectConfig]);

  const sendUserMessage = useCallback(async (text: string) => {
    console.log("sendUserMessage");

    const messageId = await addMessage(text,'user');

    // Send message via WebSocket if connected với thông tin project
    if (wsRef.current?.isConnected()) {
      wsRef.current.sendMessage({
        type: 'user_message',
        projectKey: projectConfig.projectKey,
        sessionId,
        message: text,
        timestamp: new Date().toISOString(),
        userId: sessionId,
        projectName: projectConfig.projectName
      });
    } else {
      // Fallback to simulated response if WebSocket not available
      setTimeout(async () => {
        await simulateAdminResponse(text);
      },100);
    }

    return messageId;
  },[]);  // Typing indicator functions
  const startTyping = useCallback(() => {
    if (wsRef.current?.isConnected()) {
      wsRef.current.setTyping(true);
    }
  },[]);

  const stopTyping = useCallback(() => {
    if (wsRef.current?.isConnected()) {
      wsRef.current.setTyping(false);
    }
  },[]);

  // Get chat session data for reporting
  const getChatSession = useCallback((): ChatSession => {
    return {
      sessionId,
      projectKey: projectConfig.projectKey,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      startTime: messages[0]?.timestamp || new Date(),
      lastActivity: messages[messages.length - 1]?.timestamp || new Date(),
      messages
    };
  },[sessionId,projectConfig.projectKey,messages]);

  // Clear current session and create new one
  const clearSession = useCallback(() => {
    try {
      const sessionIdKey = getSessionIdKey(projectConfig.projectKey);
      const messagesKey = getSessionStorageKey(sessionId);

      // Remove from sessionStorage
      sessionStorage.removeItem(sessionIdKey);
      sessionStorage.removeItem(messagesKey);

      // Reset state
      setMessages([]);
      setUnreadCount(0);

      console.log('Session cleared for project:',projectConfig.projectKey);

      // Note: sessionId stays the same until component remounts
      // To get a completely new session, component needs to be remounted
    } catch (error) {
      console.error('Failed to clear session:',error);
    }
  },[sessionId,projectConfig.projectKey]);

  return {
    // State
    isOpen,
    isMinimized,
    messages,
    unreadCount,
    sessionId,
    projectConfig,
    isConnected,
    isTyping,
    connectionStatus,
    sessionInitialized,

    // Actions
    sendUserMessage,
    addMessage,
    markAllAsRead,
    openChat,
    closeChat,
    minimizeChat,
    toggleChat,
    getChatSession,
    startTyping,
    stopTyping,
    clearSession
  };
};
