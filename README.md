# Kimi Agent - AI Chat with Code Execution

A powerful AI agent web interface powered by Kimi K2.5 with integrated code execution sandbox. Features a modern Kimi-style UI with thinking process visualization, streaming responses, and full code execution capabilities.

## Features

- **Kimi-Style UI**: Clean, modern interface inspired by Kimi AI
- **Streaming Responses**: Real-time message streaming with typing indicators
- **Thinking Visualization**: Display the model's reasoning process
- **Code Execution**: Integrated sandbox for running Python/JavaScript code
- **File Attachments**: Support for uploading files to chats
- **Markdown Support**: Rich text rendering with syntax highlighting
- **Responsive Design**: Works on desktop and mobile devices
- **Deployment Ready**: Optimized for Vercel and Render deployment

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **AI Model**: Kimi K2.5 (via NVIDIA API)
- **Code Execution**: Sandbox Agent
- **Deployment**: Vercel / Docker (Render)

## Prerequisites

- Node.js 18+
- NVIDIA API Key (for Kimi K2.5 access)
- Sandbox Agent service (optional, for code execution)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd kimi-agent
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your API key:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your NVIDIA API key:

```env
NVIDIA_API_KEY=nvapi-your-api-key-here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Add the `NVIDIA_API_KEY` environment variable in Vercel settings
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your Git repository
3. Configure the build and start commands:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add the `NVIDIA_API_KEY` environment variable
5. Deploy!

#### Using Docker on Render

You can also deploy using the included Dockerfile:

1. Create a new Web Service with Docker
2. Connect your repository
3. Set the Docker path to `Dockerfile`
4. Add environment variables
5. Deploy!

## API Endpoints

### Chat API

```
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": true,
  "maxTokens": 16384,
  "temperature": 1.0
}
```

### Sandbox API

```
POST /api/sandbox
Content-Type: application/json

{
  "code": "print('Hello, World!')",
  "language": "python",
  "timeout": 30000
}
```

## Sandbox Agent Integration

For full code execution capabilities, deploy the [sandbox-agent](https://github.com/educatedlucifer02/sandbox-agent) service separately:

1. Deploy sandbox-agent to a server or cloud service
2. Set the `SANDBOX_URL` environment variable to point to your sandbox service
3. Code execution will be enabled automatically

Without a sandbox service, the application uses a simulated execution mode for demonstration.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NVIDIA_API_KEY` | Your NVIDIA API key | Yes |
| `SANDBOX_URL` | URL of sandbox agent service | No |
| `SANDBOX_TIMEOUT` | Code execution timeout (ms) | No |
| `MODEL_NAME` | Model name to use | No |
| `MODEL_ENDPOINT` | NVIDIA API endpoint | No |

## Project Structure

```
kimi-agent/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Chat API endpoint
│   │   └── sandbox/route.ts   # Sandbox API endpoint
│   ├── components/
│   │   ├── ChatInterface.tsx  # Main chat UI
│   │   ├── MessageBubble.tsx  # Message display
│   │   ├── ThinkingBlock.tsx  # Thinking visualization
│   │   ├── CodeBlock.tsx      # Code display & execution
│   │   ├── InputArea.tsx      # Message input
│   │   └── Sidebar.tsx        # Chat history sidebar
│   ├── lib/
│   │   ├── nvidia.ts          # NVIDIA API client
│   │   ├── sandbox.ts         # Sandbox integration
│   │   └── utils.ts           # Utility functions
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── public/                    # Static assets
├── styles/
│   └── globals.css            # Global styles
├── .vercel.json               # Vercel configuration
├── Dockerfile                 # Docker configuration
├── render.yaml                # Render configuration
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- [Moonshot AI](https://www.moonshot.cn/) for Kimi K2.5
- [NVIDIA](https://www.nvidia.com/) for API access
- [Sandbox Agent](https://github.com/educatedlucifer02/sandbox-agent) for code execution
