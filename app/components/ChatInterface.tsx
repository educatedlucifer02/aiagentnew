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
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
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

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

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
      <div className={`flex-1 flex flex-col transition-all duration-300 ${uiState.sidebarOpen ? 'ml-0' : 'ml-0'}`}>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-kimi-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-kimi-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-kimi-text mb-2">
                  How can I help you today?
                </h2>
                <p className="text-kimi-textSecondary max-w-md">
                  Ask me anything, write code, analyze data, or start a conversation.
                  I can also run Python code in a sandbox environment.
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
