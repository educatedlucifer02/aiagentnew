'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, Chat, UIState } from '@/app/types';
import { generateId, formatTimestamp } from '@/app/lib/utils';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import Sidebar from './Sidebar';
import ThinkingBlock from './ThinkingBlock';

interface ChatInterfaceProps {
  initialChat?: Chat;
}

export default function ChatInterface({ initialChat }: ChatInterfaceProps) {
  const [error, setError] = useState<string | null>(null);

  const [uiState, setUiState] = useState<UIState>({
    isTyping: false,
    isThinking: false,
    isSandboxRunning: false,
    sidebarOpen: true,
    currentChat: initialChat || null,
    chats: [],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const scrollToThinking = () => {
    thinkingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    // Clear previous error banner
    setError(null);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      files: files?.map(file => ({
        id: generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    };

    const updatedChat: Chat = {
      ...uiState.currentChat || {
        id: generateId(),
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      messages: [...(uiState.currentChat?.messages || []), userMessage],
      updatedAt: Date.now(),
    };

    setUiState(prev => ({
      ...prev,
      currentChat: updatedChat,
      isTyping: true,
    }));

    scrollToBottom('auto');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedChat.messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch {
          try {
            const text = await response.text();
            if (text) message = text;
          } catch {
            // ignore
          }
        }
        throw new Error(message);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let assistantThinking = '';

      // Create initial assistant message
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        thinking: '',
        timestamp: Date.now(),
      };

      setUiState(prev => ({
        ...prev,
        currentChat: {
          ...updatedChat,
          messages: [...updatedChat.messages, assistantMessage],
        },
        isThinking: true,
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim();
            if (!payload) continue;

            // Server-side stream terminator
            if (payload === '[DONE]') {
              setUiState(prev => ({
                ...prev,
                isTyping: false,
                isThinking: false,
              }));
              return;
            }

            try {
              const data = JSON.parse(payload);

              if (data.thinking) {
                assistantThinking += data.thinking;
                setUiState(prev => ({
                  ...prev,
                  currentChat: prev.currentChat ? {
                    ...prev.currentChat,
                    messages: prev.currentChat.messages.map((msg, idx) =>
                      idx === prev.currentChat!.messages.length - 1
                        ? { ...msg, thinking: assistantThinking }
                        : msg
                    ),
                  } : null,
                }));
                scrollToThinking();
              }

              if (data.content) {
                assistantContent += data.content;
                setUiState(prev => ({
                  ...prev,
                  currentChat: prev.currentChat ? {
                    ...prev.currentChat,
                    messages: prev.currentChat.messages.map((msg, idx) =>
                      idx === prev.currentChat!.messages.length - 1
                        ? { ...msg, content: assistantContent }
                        : msg
                    ),
                  } : null,
                }));
                scrollToBottom();
              }

              if (data.done) {
                setUiState(prev => ({
                  ...prev,
                  isTyping: false,
                  isThinking: false,
                }));
                return;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // If the stream ends unexpectedly, ensure UI unblocks
      setUiState(prev => ({
        ...prev,
        isTyping: false,
        isThinking: false,
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      setUiState(prev => ({
        ...prev,
        isTyping: false,
        isThinking: false,
      }));

      // Add error message to chat
      const errorResponse: Message = {
        id: generateId(),
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}. Please check your API configuration and try again.`,
        timestamp: Date.now(),
      };

      setUiState(prev => ({
        ...prev,
        currentChat: prev.currentChat ? {
          ...prev.currentChat,
          messages: [...prev.currentChat.messages, errorResponse],
        } : null,
      }));
    }
  };

  const handleNewChat = () => {
    setUiState(prev => ({
      ...prev,
      currentChat: null,
    }));
  };

  const handleSelectChat = (chat: Chat) => {
    setUiState(prev => ({
      ...prev,
      currentChat: chat,
    }));
  };

  const toggleSidebar = () => {
    setUiState(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen,
    }));
  };

  const currentMessages = uiState.currentChat?.messages || [];
  const lastMessage = currentMessages[currentMessages.length - 1];
  const isThinking = uiState.isThinking && lastMessage?.role === 'assistant';

  return (
    <div className="flex h-screen bg-kimi-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={uiState.sidebarOpen}
        chats={uiState.chats}
        currentChat={uiState.currentChat}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${uiState.sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-kimi-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-kimi-text">Kimi Agent</h1>
            <span className="px-2 py-1 bg-kimi-primary/10 text-kimi-primary text-xs rounded-full">
              K2.5
            </span>
          </div>

          <div className="flex items-center gap-2">
            {uiState.isThinking && (
              <div className="flex items-center gap-2 text-kimi-textSecondary text-sm">
                <div className="w-2 h-2 bg-kimi-primary rounded-full animate-pulse-soft" />
                Thinking...
              </div>
            )}
            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Check API health"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </a>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Expand Sidebar Button (when collapsed) */}
        {!uiState.sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed left-4 top-4 z-40 p-2 bg-white border border-kimi-border rounded-lg shadow-card hover:bg-gray-50 transition-colors"
            title="Expand sidebar"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                {/* Logo */}
                <div className="w-20 h-20 bg-gradient-to-br from-kimi-primary to-kimi-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                {/* Title */}
                <h2 className="text-3xl font-bold text-kimi-text mb-2">
                  Kimi Agent
                </h2>
                <span className="px-3 py-1 bg-kimi-primary/10 text-kimi-primary text-sm rounded-full mb-6">
                  Powered by Kimi K2.5
                </span>

                {/* Description */}
                <p className="text-kimi-textSecondary max-w-lg mb-8">
                  A powerful AI assistant powered by Kimi K2.5 with advanced reasoning, 
                  code execution, and multi-modal capabilities.
                </p>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mb-8">
                  <div className="p-4 bg-white rounded-xl border border-kimi-border shadow-card text-left hover:shadow-lg transition-shadow">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-kimi-text mb-1">Code Execution</h3>
                    <p className="text-sm text-kimi-textSecondary">Write and run Python code directly in the chat</p>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-kimi-border shadow-card text-left hover:shadow-lg transition-shadow">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-kimi-text mb-1">Advanced Reasoning</h3>
                    <p className="text-sm text-kimi-textSecondary">Deep thinking and problem-solving capabilities</p>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-kimi-border shadow-card text-left hover:shadow-lg transition-shadow">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-kimi-text mb-1">Natural Conversation</h3>
                    <p className="text-sm text-kimi-textSecondary">Engage in meaningful, contextual dialogues</p>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-kimi-border shadow-card text-left hover:shadow-lg transition-shadow">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-kimi-text mb-1">File Analysis</h3>
                    <p className="text-sm text-kimi-textSecondary">Upload and analyze documents and code files</p>
                  </div>
                </div>

                {/* Example Prompts */}
                <div className="w-full max-w-lg text-left">
                  <p className="text-sm text-kimi-textSecondary mb-3">Try asking me:</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        const inputArea = document.querySelector('textarea');
                        if (inputArea) {
                          inputArea.value = 'Write a Python function to calculate Fibonacci numbers';
                          inputArea.focus();
                        }
                      }}
                      className="w-full text-left px-4 py-3 bg-kimi-surface hover:bg-kimi-border/50 rounded-xl text-sm text-kimi-text transition-colors"
                    >
                      "Write a Python function to calculate Fibonacci numbers"
                    </button>
                    <button 
                      onClick={() => {
                        const inputArea = document.querySelector('textarea');
                        if (inputArea) {
                          inputArea.value = 'Analyze this dataset and create a visualization';
                          inputArea.focus();
                        }
                      }}
                      className="w-full text-left px-4 py-3 bg-kimi-surface hover:bg-kimi-border/50 rounded-xl text-sm text-kimi-text transition-colors"
                    >
                      "Analyze this dataset and create a visualization"
                    </button>
                    <button 
                      onClick={() => {
                        const inputArea = document.querySelector('textarea');
                        if (inputArea) {
                          inputArea.value = 'Explain quantum computing in simple terms';
                          inputArea.focus();
                        }
                      }}
                      className="w-full text-left px-4 py-3 bg-kimi-surface hover:bg-kimi-border/50 rounded-xl text-sm text-kimi-text transition-colors"
                    >
                      "Explain quantum computing in simple terms"
                    </button>
                  </div>
                </div>

                <p className="mt-8 text-xs text-gray-400">
                  Kimi K2.5 can make mistakes. Please verify important information.
                </p>
              </div>
            ) : (
              <>
                {currentMessages.map((message, index) => (
                  <div key={message.id} className="mb-6">
                    {message.role === 'assistant' && message.thinking && (
                      <ThinkingBlock
                        thinking={message.thinking}
                        isExpanded={index === currentMessages.length - 1 && uiState.isThinking}
                      />
                    )}
                    <MessageBubble
                      message={message}
                      isLatest={index === currentMessages.length - 1}
                    />
                  </div>
                ))}

                {isThinking && (
                  <div className="flex items-center gap-3 text-kimi-textSecondary text-sm py-4">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-kimi-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-kimi-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-kimi-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Generating response...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <InputArea
          onSend={handleSendMessage}
          isDisabled={uiState.isTyping}
          placeholder="Message Kimi Agent... (Use Ctrl+Enter for new line)"
        />
      </div>
    </div>
  );
}
