# Deployment Guide

This guide provides detailed instructions for deploying the Kimi Agent application to various platforms.

## Pre-Deployment Checklist

Before deploying, ensure you have:

1. **NVIDIA API Key**: Obtain from [NVIDIA API Catalog](https://build.nvidia.com/moonshotai/kimi-k2-5)
2. **Node.js 18+**: Verify installation with `node --version`
3. **Git Repository**: Your code pushed to GitHub/GitLab/Bitbucket

## Local Development

### Quick Start

```bash
# Clone and enter directory
git clone <your-repo-url>
cd kimi-agent

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Setup

Create a `.env.local` file with your credentials:

```env
NVIDIA_API_KEY=nvapi-your-api-key-here
```

## Vercel Deployment (Recommended)

Vercel provides the easiest deployment experience for Next.js applications.

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel
```

### Method 2: Git Integration

1. Push your code to a Git repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your Git repository
5. Configure environment variables:
   - `NVIDIA_API_KEY`: Your NVIDIA API key
6. Click "Deploy"

Vercel will automatically detect Next.js and configure the build settings.

### Vercel Configuration

The `.vercel.json` file is pre-configured with:
- Framework: Next.js
- Build command: `npm run build`
- Serverless function timeout: 30 seconds

### Vercel Environment Variables

Add these in Vercel project settings:

| Variable | Value |
|----------|-------|
| `NVIDIA_API_KEY` | `nvapi-...` (your API key) |

## Render Deployment

Render provides both web services and background workers.

### Option 1: Web Service (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the build settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables:
   - Key: `NVIDIA_API_KEY`
   - Value: Your NVIDIA API key
6. Click "Create Web Service"

### Option 2: Docker Deployment

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Choose "Docker" as the runtime
4. Set the Docker path to `Dockerfile`
5. Add environment variables
6. Click "Create Web Service"

### Render Configuration

The `render.yaml` file provides a blueprint for Render deployment. You can also use it to create multiple services.

### Render Environment Variables

Add these in Render service settings:

| Variable | Value |
|----------|-------|
| `NVIDIA_API_KEY` | `nvapi-...` (your API key) |
| `NODE_ENV` | `production` |

## Docker Deployment

You can deploy the application using Docker to any platform that supports containers.

### Build Docker Image

```bash
# Build the image
docker build -t kimi-agent .

# Run the container
docker run -p 3000:3000 -e NVIDIA_API_KEY=your-key kimi-agent
```

### Push to Container Registry

```bash
# Tag for registry
docker tag kimi-agent your-registry/kimi-agent

# Push to registry
docker push your-registry/kimi-agent
```

### Deploy to Cloud Platforms

#### AWS ECS

1. Push image to Amazon ECR
2. Create ECS task definition
3. Configure service with the task definition

#### Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy kimi-agent \
  --image gcr.io/PROJECT_ID/kimi-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name kimi-agent \
  --image your-registry/kimi-agent \
  --cpu 1 \
  --memory 2 \
  --environment-variables NVIDIA_API_KEY=your-key
```

## Sandbox Agent Setup

For full code execution capabilities, deploy the sandbox-agent service separately.

### Deploying Sandbox Agent

1. Clone the [sandbox-agent repository](https://github.com/educatedlucifer02/sandbox-agent)
2. Follow their deployment instructions
3. Set the `SANDBOX_URL` environment variable to point to your sandbox service

### Without Sandbox

The application includes a simulated sandbox mode that works without a separate service. Code execution will be simulated for demonstration purposes.

## Verification

After deployment, verify your setup:

### Health Check

Visit the health endpoint:

```
https://your-domain.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "api": "ok",
    "nvidia": "ok",
    "sandbox": "simulated"
  }
}
```

### Test Chat

1. Open your deployed application
2. Send a test message: "Hello, Kimi!"
3. Verify you receive a streaming response
4. Test with code: "Write a Python function to calculate fibonacci"

## Troubleshooting

### Common Issues

#### API Key Not Working

- Verify the key is correctly set in environment variables
- Check for extra spaces or newline characters
- Ensure the key has access to Kimi K2.5 model

#### Deployment Failures

- Check build logs for specific errors
- Verify Node.js version compatibility
- Ensure all dependencies are in `package.json`

#### CORS Errors

- Verify the API is accessible from your frontend domain
- Check browser console for specific CORS messages

#### Slow Responses

- Monitor NVIDIA API rate limits
- Check sandbox service health
- Consider upgrading server resources

### Getting Help

- Open an issue on GitHub
- Check existing issues for solutions
- Review NVIDIA API documentation

## Scaling Considerations

### Vercel

- Automatic scaling included
- Consider Pro plan for higher limits
- Monitor usage in Vercel dashboard

### Render

- Adjust plan based on traffic
- Configure auto-scaling settings
- Monitor in Render dashboard

### Custom Server

- Implement horizontal scaling with load balancer
- Use Redis for session storage
- Consider GPU instances for better performance

## Security Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **HTTPS**: Ensure SSL/TLS is enabled
3. **Rate Limiting**: Implement API rate limits
4. **Input Validation**: Sanitize all user inputs
5. **Dependencies**: Keep packages updated

## Monitoring

### Built-in Monitoring

- Health check endpoint: `/api/health`
- Response times logged in console

### External Monitoring

- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure error tracking (Sentry)
- Monitor metrics (DataDog, New Relic)

## Performance Optimization

### Frontend

- Enable gzip compression (Vercel does this automatically)
- Use Next.js Image optimization
- Implement code splitting

### Backend

- Use streaming for faster perceived performance
- Cache frequent responses
- Optimize database queries

## Cost Estimation

### Vercel (Hobby)

- Free for personal projects
- 100GB bandwidth/month
- Limited serverless execution

### Vercel (Pro)

- $20/month
- 1TB bandwidth
- More execution time

### Render

- Free tier available
- $7/month for web service
- Pay for resources used

## Conclusion

This deployment guide covers the most common deployment scenarios. For specific platform issues, refer to their official documentation:

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Docker Docs](https://docs.docker.com)
