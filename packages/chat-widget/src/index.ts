// Main export file for the chat widget package
export { default as ProjectChatWidget } from './components/ProjectChatWidget';
export { useChatWidget } from './hooks/useChatWidget';
export { ChatWebSocketService,createChatWebSocket,FREE_WEBSOCKET_ENDPOINTS } from './services/websocket';

// Export types
export type { ProjectConfig,ChatWidgetMessage,ChatSession } from './types';
export type { WebSocketMessage,WebSocketConfig } from './services/websocket';

// Default export
export { default } from './components/ProjectChatWidget';
