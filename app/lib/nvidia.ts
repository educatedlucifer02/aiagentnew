import { ChatRequest, StreamChunk, ModelConfig } from '@/app/types';

const DEFAULT_CONFIG: ModelConfig = {
  name: 'moonshotai/kimi-k2.5',
  endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
  maxTokens: 16384,
  temperature: 1.0,
};

export class NvidiaClient {
  private apiKey: string;
  private config: ModelConfig;

  constructor(apiKey: string, config: Partial<ModelConfig> = {}) {
    this.apiKey = apiKey;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const payload = {
      model: this.config.name,
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature || this.config.temperature,
      top_p: 1.0,
      stream: true,
      chat_template_kwargs: { thinking: true },
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (!data) continue;

          if (data === '[DONE]') {
            yield { id: 'final', content: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const chunk = this.parseChunk(parsed);
            if (chunk) {
              yield chunk;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    yield { id: 'final', content: '', done: true };
  }

  private parseChunk(data: any): StreamChunk | null {
    const choice = data.choices?.[0];
    if (!choice) return null;

    const delta = choice.delta || {};
    const content = delta.content || '';
    const thinking = delta.thinking || '';

    return {
      id: data.id || `chunk-${Date.now()}`,
      content,
      thinking,
      done: choice.finish_reason != null,
    };
  }

  async sendMessage(request: ChatRequest): Promise<string> {
    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const payload = {
      model: this.config.name,
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature || this.config.temperature,
      top_p: 1.0,
      stream: false,
      chat_template_kwargs: { thinking: true },
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

// Singleton instance
let clientInstance: NvidiaClient | null = null;

export function getNvidiaClient(): NvidiaClient {
  if (!clientInstance) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY is not configured');
    }
    clientInstance = new NvidiaClient(apiKey);
  }
  return clientInstance;
}

export { DEFAULT_CONFIG };
