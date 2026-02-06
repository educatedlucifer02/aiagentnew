import { SandboxRequest, SandboxResponse } from '@/app/types';

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_OUTPUT = 10000;

export class SandboxAgent {
  private baseUrl: string;
  private timeout: number;
  private maxOutputSize: number;

  constructor(options: {
    baseUrl?: string;
    timeout?: number;
    maxOutputSize?: number;
  } = {}) {
    this.baseUrl = options.baseUrl || process.env.SANDBOX_URL || 'http://localhost:3001';
    this.timeout = options.timeout || parseInt(process.env.SANDBOX_TIMEOUT || '') || DEFAULT_TIMEOUT;
    this.maxOutputSize = options.maxOutputSize || DEFAULT_MAX_OUTPUT;
  }

  async execute(request: SandboxRequest): Promise<SandboxResponse> {
    const startTime = Date.now();

    try {
      // Prepare the execution request
      const execRequest = {
        code: request.code,
        language: request.language,
        timeout: request.timeout || this.timeout,
        files: request.files || {},
        capture_output: true,
        stream_output: false,
      };

      // Execute code in sandbox
      const result = await this.executeInSandbox(execRequest);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: this.truncateOutput(result.output || '', this.maxOutputSize),
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };
    }
  }

  private async executeInSandbox(request: any): Promise<any> {
    // For Vercel/Render serverless environments, we'll use a simulated sandbox
    // In production, you would integrate with the actual sandbox-agent service

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Try to call external sandbox service
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Sandbox error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Fallback: Execute in simulated environment for serverless
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return this.simulateExecution(request);
      }

      throw error;
    }
  }

  private simulateExecution(request: any): any {
    // Simulated execution for serverless environments
    // This is a basic implementation - replace with actual sandbox in production
    const { code, language } = request;

    try {
      // Basic Python/JavaScript execution simulation
      if (language === 'python' || language === 'js' || language === 'javascript') {
        // For Python, we'll simulate basic operations
        // In production, use a proper sandbox like Docker, Firecracker, or E2B
        const output = this.simulateCodeExecution(code, language);
        return { output, success: true };
      }

      return {
        output: `[Sandbox] Code execution for ${language} simulated.\n\nTo enable real code execution:\n1. Deploy sandbox-agent service separately\n2. Set SANDBOX_URL environment variable\n3. Or use Docker containers for execution`,
        success: true,
      };
    } catch (error) {
      return {
        output: '',
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
      };
    }
  }

  private simulateCodeExecution(code: string, language: string): string {
    // Very basic simulation - DO NOT use in production
    // This is for demonstration purposes only

    let output = '';

    // Check for common patterns
    if (code.includes('print(')) {
      const printMatches = code.match(/print\(['"]([^'"]+)['"](?:,\s*.+)?\)/g);
      if (printMatches) {
        output = printMatches
          .map(match => match.match(/print\(['"]([^'"]+)['"]/)?.[1])
          .filter(Boolean)
          .join('\n');
      }
    }

    // Check for calculations
    if (code.includes('+') || code.includes('*') || code.includes('/') || code.includes('-')) {
      try {
        // Very basic and unsafe - never use eval in production
        const evalCode = code
          .replace(/def\s+\w+\([^)]*\):[\s\S]*?(?=\n(?:def|\w|\s*$))/g, '')
          .replace(/#.*$/gm, '')
          .trim();

        if (evalCode && !evalCode.includes('import')) {
          const result = new Function(`return ${evalCode}`)();
          if (output) output += '\n';
          output += `Calculation result: ${result}`;
        }
      } catch {
        // Ignore calculation errors in simulation
      }
    }

    if (!output) {
      output = `[${language.toUpperCase()}] Code received and prepared for execution.\n\n`;
      output += `Code length: ${code.length} characters\n`;
      output += `Lines: ${code.split('\n').length}\n\n`;
      output += `Note: This is a simulated response.\n`;
      output += `Deploy sandbox-agent for real code execution.`;
    }

    return output;
  }

  private truncateOutput(output: string, maxLength: number): string {
    if (output.length <= maxLength) return output;
    return output.slice(0, maxLength) + '\n\n[Output truncated]';
  }

  // Health check for sandbox service
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let sandboxInstance: SandboxAgent | null = null;

export function getSandboxAgent(): SandboxAgent {
  if (!sandboxInstance) {
    sandboxInstance = new SandboxAgent();
  }
  return sandboxInstance;
}

export { DEFAULT_TIMEOUT, DEFAULT_MAX_OUTPUT };
