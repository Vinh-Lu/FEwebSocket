export interface ProjectConfig {
  projectKey: string;
  projectName: string;
  projectColor?: string;
  projectLogo?: string;
  supportEmail?: string;
  customGreeting?: string;
}

export interface ChatWidgetMessage {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: Date;
  isRead?: boolean;
  projectKey?: string;
  sessionId?: string;
}

export interface ChatSession {
  sessionId: string;
  projectKey: string;
  userAgent: string;
  startTime: Date;
  lastActivity: Date;
  messages: ChatWidgetMessage[];
}
