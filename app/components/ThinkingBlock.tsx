'use client';

import React, { useState } from 'react';

interface ThinkingBlockProps {
  thinking: string;
  isExpanded?: boolean;
}

export default function ThinkingBlock({ thinking, isExpanded = false }: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(isExpanded);

  if (!thinking.trim()) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-kimi-textSecondary hover:text-kimi-text transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>Thinking process</span>
        {isOpen && (
          <span className="text-xs text-gray-400">
            ({thinking.length} characters)
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-2 p-4 bg-kimi-thinking rounded-xl border border-kimi-border/50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-kimi-primary/10 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-3 h-3 text-kimi-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-kimi-textSecondary leading-relaxed whitespace-pre-wrap">
                {thinking}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
