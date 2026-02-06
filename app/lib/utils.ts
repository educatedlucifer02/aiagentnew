import { v4 as uuidv4 } from 'uuid';
import { Message, Chat, CodeBlock, FileAttachment } from '@/app/types';

// Generate unique IDs
export function generateId(): string {
  return uuidv4();
}

// Format timestamp
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Parse code blocks from content
export function parseCodeBlocks(content: string): CodeBlock[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      id: generateId(),
      language: match[1] || 'text',
      code: match[2].trim(),
      status: 'pending',
    });
  }

  return blocks;
}

// Extract thinking content
export function extractThinking(content: string): { thinking: string; content: string } {
  const thoughtRegex = /<thinking>([\s\S]*?)<\/thinking>/i;
  const match = content.match(thoughtRegex);

  if (match) {
    return {
      thinking: match[1].trim(),
      content: content.replace(thoughtRegex, '').trim(),
    };
  }

  return { thinking: '', content };
}

// Highlight code syntax
export function highlightCode(code: string, language: string): string {
  // Using highlight.js or basic HTML escaping
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Basic syntax highlighting
  let highlighted = escapeHtml(code);

  // Simple keyword highlighting
  const keywords = [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch',
    'def', 'print', 'import', 'from', 'class', 'def', 'return', 'if', 'elif',
    'else', 'for', 'while', 'try', 'except', 'with', 'as', 'lambda', 'True',
    'False', 'None', 'and', 'or', 'not', 'in', 'is', 'yield', 'global',
  ];

  const stringRegex = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
  const commentRegex = /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const numberRegex = /\b(\d+\.?\d*)\b/g;

  // Apply highlighting (simplified version)
  highlighted = highlighted
    .replace(/&lt;pre&gt;|&\lt;\/pre&gt;/g, '')
    .replace(/&lt;code&gt;|&lt;\/code&gt;/g, '');

  return `<pre><code class="language-${language}">${highlighted}</code></pre>`;
}

// Markdown rendering
export function renderMarkdown(text: string): string {
  // Basic markdown to HTML conversion
  let html = text;

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered lists
  html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Local storage helpers
export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      console.warn('Failed to save to localStorage');
    }
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
    } catch {
      console.warn('Failed to load from localStorage');
    }
  }
  return defaultValue;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
}

// Validate file
export function validateFile(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
}): boolean {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options;

  if (file.size > maxSize) {
    return false;
  }

  if (allowedTypes.length > 0) {
    const fileType = file.type || getFileExtension(file.name);
    if (!allowedTypes.some(type => fileType.includes(type) || type.includes(fileType))) {
      return false;
    }
  }

  return true;
}

function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext;
}

// Read file content
export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Export chat to JSON
export function exportChat(chat: Chat): string {
  return JSON.stringify(chat, null, 2);
}

// Import chat from JSON
export function importChat(json: string): Chat | null {
  try {
    const chat = JSON.parse(json);
    if (chat.id && chat.messages) {
      return chat as Chat;
    }
    return null;
  } catch {
    return null;
  }
}
