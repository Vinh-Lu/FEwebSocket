// WebSocket service for real-time messaging
export interface WebSocketMessage {
  type: 'user_message' | 'admin_message' | 'typing' | 'user_join' | 'user_leave';
  projectKey: string;
  sessionId: string;
  message?: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  projectName?: string;
}

export interface WebSocketConfig {
  url: string;
  projectKey: string;
  sessionId: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export class ChatWebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve,reject) => {
      try {
        // Sử dụng WebSocket Echo Service miễn phí hoặc wss://echo.websocket.org
        const wsUrl = this.config.url || 'wss://echo.websocket.org';
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = (event) => {
          console.log('WebSocket connected:',event);
          this.reconnectAttempts = 0;
          this.startHeartbeat();

          // Send join message
          this.sendMessage({
            type: 'user_join',
            projectKey: this.config.projectKey,
            sessionId: this.config.sessionId,
            timestamp: new Date().toISOString(),
            userId: this.config.sessionId,
            userName: `User_${this.config.sessionId.slice(-6)}`
          });

          this.config.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;

            // For admin dashboard, listen to all messages
            // For specific projects, filter by projectKey
            if (this.config.projectKey === 'admin-dashboard' || data.projectKey === this.config.projectKey) {
              this.config.onMessage?.(data);
            }
          } catch (error) {
            console.warn('Failed to parse WebSocket message:',error);

            // Handle echo server response (fallback)
            if (event.data && typeof event.data === 'string') {
              try {
                const echoData = JSON.parse(event.data);
                if (this.config.projectKey === 'admin-dashboard' || echoData.projectKey === this.config.projectKey) {
                  this.config.onMessage?.(echoData);
                }
              } catch {
                // Ignore non-JSON echo responses
              }
            }
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:',event);
          this.stopHeartbeat();
          this.config.onDisconnect?.();

          // Auto reconnect if not intentional close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:',error);
          this.config.onError?.(error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private reconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2,this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:',error);
      });
    },delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping',timestamp: new Date().toISOString() }));
      }
    },30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendMessage(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:',message);
    }
  }

  sendUserMessage(message: string): void {
    this.sendMessage({
      type: 'user_message',
      projectKey: this.config.projectKey,
      sessionId: this.config.sessionId,
      message,
      timestamp: new Date().toISOString(),
      userId: this.config.sessionId
    });
  }

  sendAdminMessage(message: string): void {
    this.sendMessage({
      type: 'admin_message',
      projectKey: this.config.projectKey,
      sessionId: this.config.sessionId,
      message,
      timestamp: new Date().toISOString(),
      userId: 'admin'
    });
  }

  setTyping(isTyping: boolean): void {
    this.sendMessage({
      type: 'typing',
      projectKey: this.config.projectKey,
      sessionId: this.config.sessionId,
      message: isTyping ? 'start' : 'stop',
      timestamp: new Date().toISOString(),
      userId: this.config.sessionId
    });
  }

  disconnect(): void {
    this.sendMessage({
      type: 'user_leave',
      projectKey: this.config.projectKey,
      sessionId: this.config.sessionId,
      timestamp: new Date().toISOString(),
      userId: this.config.sessionId
    });

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000,'Client disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'CLOSED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

// Utility function to create WebSocket service
export const createChatWebSocket = (config: WebSocketConfig): ChatWebSocketService => {
  return new ChatWebSocketService(config);
};

// Free WebSocket endpoints for testing
export const FREE_WEBSOCKET_ENDPOINTS = {
  ECHO_WEBSOCKET: 'wss://testwebsocket-production.up.railway.app',
  SOCKETIO_TEST: 'wss://socketio-chat-h9jt.herokuapp.com/socket.io/?EIO=3&transport=websocket',
  WEBSOCKET_KING: 'wss://ws.websocket.in/v1/echo'
};
