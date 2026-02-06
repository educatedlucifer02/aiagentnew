'use client';

import React, { useState } from 'react';
import { CodeBlock as CodeBlockType } from '@/app/types';
import { copyToClipboard } from '@/app/lib/utils';

interface CodeBlockProps {
  language: string;
  code: string;
  output?: string;
  status?: 'pending' | 'running' | 'success' | 'error';
}

export default function CodeBlock({
  language,
  code,
  output,
  status,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(status === 'running');
  const [localOutput, setLocalOutput] = useState(output || '');

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setLocalOutput('Running code...\n');

    try {
      const response = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          timeout: 30000,
        }),
      });

      if (!response.ok) {
        throw new Error('Execution failed');
      }

      const result = await response.json();

      if (result.success) {
        setLocalOutput(prev => prev + result.output);
      } else {
        setLocalOutput(prev => prev + `Error: ${result.error}`);
      }
    } catch (error) {
      setLocalOutput(prev => prev + `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getLanguageLabel = (lang: string): string => {
    const labels: Record<string, string> = {
      js: 'JavaScript',
      javascript: 'JavaScript',
      py: 'Python',
      python: 'Python',
      ts: 'TypeScript',
      typescript: 'TypeScript',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      md: 'Markdown',
      bash: 'Bash',
      sh: 'Shell',
    };
    return labels[lang.toLowerCase()] || lang.toUpperCase();
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'running':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-kimi-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-kimi-code border-b border-kimi-border/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-gray-400">
            {getLanguageLabel(language)}
          </span>
          {status && (
            <span className={`text-xs ${getStatusColor(status)}`}>
              {status === 'running' && 'Running...'}
              {status === 'success' && 'Success'}
              {status === 'error' && 'Error'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-500 text-xs rounded hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Run
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/10 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="bg-kimi-code overflow-x-auto">
        <pre className="p-4 text-sm text-gray-200 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>

      {/* Output */}
      {(localOutput || isRunning) && (
        <div className="border-t border-kimi-border/50">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border-b border-kimi-border/50">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs text-gray-400">Output</span>
          </div>
          <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
            <code className={localOutput.includes('Error') ? 'text-red-400' : 'text-green-400'}>
              {localOutput || (isRunning && 'Executing...')}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
