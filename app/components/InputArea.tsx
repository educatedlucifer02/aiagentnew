'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { FileAttachment } from '@/app/types';
import { formatFileSize, validateFile, readFileContent } from '@/app/lib/utils';

interface InputAreaProps {
  onSend: (content: string, files?: File[]) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

export default function InputArea({ onSend, isDisabled, placeholder }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if ((!message.trim() && files.length === 0) || isDisabled) return;

    onSend(message, files.length > 0 ? files : undefined);
    setMessage('');
    setFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).filter(file => {
      if (!validateFile(file, { maxSize: 10 * 1024 * 1024 })) {
        alert(`File ${file.name} is too large or invalid`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border-t border-kimi-border px-6 py-4">
      <div className="max-w-3xl mx-auto">
        {/* Attached Files */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-kimi-surface rounded-lg text-sm"
              >
                <svg className="w-4 h-4 text-kimi-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-gray-700 max-w-32 truncate">{file.name}</span>
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                >
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Container */}
        <div
          className={`relative rounded-2xl border transition-all duration-200 ${
            isDragging
              ? 'border-kimi-primary bg-kimi-primary/5'
              : 'border-kimi-border focus-within:border-kimi-primary/50 focus-within:shadow-input'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Message Kimi Agent..."}
            disabled={isDisabled}
            className="w-full px-5 py-4 pr-24 bg-transparent resize-none outline-none text-sm text-kimi-text placeholder-gray-400 disabled:opacity-50"
            rows={1}
          />

          {/* Actions */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              accept=".txt,.csv,.json,.py,.js,.md,.pdf,.md"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
              className="p-2 text-gray-400 hover:text-kimi-primary hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Attach files"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <button
              onClick={handleSubmit}
              disabled={(!message.trim() && files.length === 0) || isDisabled}
              className="p-2 bg-kimi-primary text-white rounded-lg hover:bg-kimi-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Helper Text */}
        <p className="mt-2 text-xs text-gray-400 text-center">
          Kimi K2.5 can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}
