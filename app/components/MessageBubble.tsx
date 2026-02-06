'use client';

import React, { useState } from 'react';
import { Message } from '@/app/types';
import { formatTimestamp, copyToClipboard, renderMarkdown } from '@/app/lib/utils';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export default function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    await copyToClipboard(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    if (!message.content) return null;

    // Parse code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = message.content.slice(lastIndex, match.index);
        parts.push({
          type: 'text',
          content: renderMarkdown(textBefore),
        });
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        code: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < message.content.length) {
      const textAfter = message.content.slice(lastIndex);
      parts.push({
        type: 'text',
        content: renderMarkdown(textAfter),
      });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <CodeBlock
            key={index}
            language={part.language}
            code={part.code}
          />
        );
      }
      return (
        <div
          key={index}
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: part.content }}
        />
      );
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser
          ? 'bg-kimi-primary text-white'
          : 'bg-gradient-to-br from-kimi-primary to-kimi-secondary text-white'
      }`}>
        {isUser ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-kimi-text">
            {isUser ? 'You' : 'Kimi Agent'}
          </span>
          <span className="text-xs text-kimi-textSecondary">
            {formatTimestamp(message.timestamp)}
          </span>
          {isAssistant && (
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy response"
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className={`rounded-2xl px-5 py-4 ${
          isUser
            ? 'bg-kimi-primary text-white inline-block'
            : 'bg-white border border-kimi-border shadow-card'
        }`}>
          {isUser ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          ) : (
            <div className="text-sm leading-relaxed">
              {renderContent()}
            </div>
          )}
        </div>

        {/* Files */}
        {message.files && message.files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 justify-start">
            {message.files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
