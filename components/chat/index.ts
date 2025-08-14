// Export unified Chat module
export { default as Chat } from './Chat';

// Export chat widget for external use
export { default as ProjectChatWidget } from './ProjectChatWidget';

// Export individual chat components
export { default as ChatNavSidebar } from './ChatNavSidebar';
export { default as ChatSidebar } from './ChatSidebar';
export { default as ChatMain } from './ChatMain';
export { default as ChatHeader } from './ChatHeader';
export { default as ChatMessages } from './ChatMessages';
export { default as ChatInput } from './ChatInput';
export { default as ChatBubble } from './ChatBubble';
export { default as ChatSettings } from './ChatSettings';
export { ChatProvider,useChat } from './ChatContext';