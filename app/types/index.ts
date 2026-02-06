// Message Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  timestamp: number;
  files?: FileAttachment[];
  codeBlocks?: CodeBlock[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  output?: string;
  status: 'pending' | 'running' | 'success' | 'error';
}

// Chat Types
export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// API Types
export interface ChatRequest {
  messages: Message[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatResponse {
  message: Message;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  id: string;
  content: string;
  thinking?: string;
  done: boolean;
}

// Sandbox Types
export interface SandboxRequest {
  code: string;
  language: string;
  timeout?: number;
  files?: Record<string, string>;
}

export interface SandboxResponse {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

// Configuration Types
export interface ModelConfig {
  name: string;
  endpoint: string;
  maxTokens: number;
  temperature: number;
}

export interface AppConfig {
  model: ModelConfig;
  sandbox: {
    timeout: number;
    maxOutputSize: number;
  };
}

// UI State Types
export interface UIState {
  isTyping: boolean;
  isThinking: boolean;
  isSandboxRunning: boolean;
  sidebarOpen: boolean;
  currentChat: Chat | null;
  chats: Chat[];
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    thinking: string;
    code: string;
    success: string;
    error: string;
    warning: string;
  };
}
