# PR Review Agent

An intelligent GitHub bot that automatically reviews pull requests using GPT-4. Provides constructive, actionable feedback on code changes.

## Features

- 🤖 **AI-Powered Reviews**: Uses GPT-4 to analyze code and provide intelligent feedback
- 🔒 **Secure**: Webhook signature verification prevents unauthorized access
- 📊 **Complexity Analysis**: Automatically assesses PR size and complexity
- 🎯 **Smart File Selection**: Prioritizes most relevant files for review
- ⚡ **Async Processing**: Responds to webhooks immediately, processes in background
- 🛡️ **Robust Error Handling**: Retry logic and graceful degradation
- ✅ **Well Tested**: Comprehensive test suite with high coverage

## Quick Start

### Prerequisites

- Node.js 18+
- GitHub account with repo access
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/PopaSerban/pr-review-agent.git
cd pr-review-agent

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Configuration

Edit `.env` with your credentials:

```bash
# GitHub Configuration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_WEBHOOK_SECRET=your_secret_here
WATCHED_REPOS=owner/repo1,owner/repo2

# OpenAI Configuration
OPENAI_API_KEY=sk_your_key_here
GPT_MODEL=gpt-4

# Optional: Learning Mode
ENABLE_LEARNING=false
KNOWLEDGE_DIR=./knowledge

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### Getting Your Tokens

**GitHub Token**:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Copy the token to `GITHUB_TOKEN`

**OpenAI API Key**:
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `OPENAI_API_KEY`

**Webhook Secret**:
- Generate a random string: `openssl rand -hex 32`
- Use this in both `.env` and GitHub webhook settings

### Running the Bot

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Run tests
npm test
```

The server will start on `http://localhost:3000`

## Setting Up GitHub Webhook

1. Go to your repository → Settings → Webhooks → Add webhook
2. **Payload URL**: `https://your-server.com/api/webhook`
3. **Content type**: `application/json`
4. **Secret**: Use the same value as `GITHUB_WEBHOOK_SECRET`
5. **Events**: Select "Pull requests"
6. Save the webhook

## How It Works

```
┌─────────────┐
│   GitHub    │
│  (PR Event) │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Webhook Validation             │
│  - Verify HMAC signature        │
│  - Check event type             │
│  - Filter watched repos         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Fetch PR Data                  │
│  - Get files, diffs, metadata   │
│  - Analyze complexity           │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Generate AI Review             │
│  - Build intelligent prompts    │
│  - Call GPT-4 API               │
│  - Format response              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Post Review to GitHub          │
│  - Formatted markdown           │
│  - Complexity analysis          │
│  - AI insights                  │
└─────────────────────────────────┘
```

## Example Review

The bot posts reviews like this:

```markdown
## PR Review Summary

**Complexity**: low
**Files Changed**: 3
**Total Changes**: 50 (+30/-20)
**File Types**: js, css

### Analysis
- ✅ Reasonable size for review

---

## AI Code Review

### Overall Assessment
The changes look good overall. The new feature is well-implemented with proper error handling.

### Specific Feedback

**src/app.js**
- Good use of async/await for API calls
- Consider adding input validation on line 45
- The error handling could be more specific

**src/utils.js**
- Nice helper function, very reusable
- Consider adding JSDoc comments

### Security
No security concerns identified.

### Performance
The database queries could benefit from indexing on the user_id field.

---
*Automated review by PR Review Agent*
```

## Project Structure

```
pr-review-agent/
├── src/
│   ├── config/           # Configuration and validation
│   │   ├── config.js     # Environment variables
│   │   ├── github.js     # GitHub API client
│   │   ├── validator.js  # Config validation
│   │   └── index.js      # Validated config export
│   ├── models/
│   │   └── Review.js     # Review data model
│   ├── controllers/
│   │   └── webhookController.js  # Webhook handler
│   ├── services/
│   │   ├── githubService.js      # GitHub API operations
│   │   ├── gptService.js         # OpenAI API integration
│   │   ├── promptService.js      # Prompt engineering
│   │   └── reviewService.js      # Review orchestration
│   ├── middleware/
│   │   ├── webhookValidator.js   # Signature verification
│   │   ├── errorHandler.js       # Global error handling
│   │   └── logger.js             # Request logging
│   ├── routes/
│   │   ├── webhook.js    # Webhook routes
│   │   ├── health.js     # Health check
│   │   └── index.js      # Route aggregator
│   ├── utils/
│   │   ├── logger.js     # Winston logger
│   │   ├── errors.js     # Custom error classes
│   │   └── helpers.js    # Utility functions
│   └── app.js            # Express app setup
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── .env.example          # Environment template
├── package.json
└── README.md
```

## Development

### Running Tests

```bash
# All tests with coverage
npm test

# Watch mode
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Code Quality

The project maintains high code quality standards:
- Comprehensive test coverage
- Clean MVC architecture
- Proper error handling
- Structured logging
- Security best practices

## Deployment

### Using a Server

1. Set up a server with Node.js 18+
2. Clone the repository
3. Set environment variables
4. Install dependencies: `npm install`
5. Start with PM2: `pm2 start src/app.js --name pr-review-agent`
6. Set up reverse proxy (nginx) for HTTPS
7. Configure GitHub webhook to point to your server

### Environment Variables in Production

```bash
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
# ... other vars from .env.example
```

## Troubleshooting

### Webhook not triggering

- Verify webhook URL is accessible from internet
- Check webhook secret matches in both places
- Review GitHub webhook delivery logs

### Reviews not posting

- Verify GitHub token has `repo` scope
- Check bot has write access to repository
- Review application logs for errors

### GPT-4 errors

- Verify OpenAI API key is valid
- Check you have GPT-4 API access
- Monitor rate limits in logs

### High token usage

- Reduce number of files analyzed (currently top 3)
- Truncate patches more aggressively
- Use GPT-3.5-turbo instead of GPT-4

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/webhook` - GitHub webhook receiver

## Security

- Webhook signatures verified using HMAC SHA-256
- Environment variables for sensitive data
- No secrets in code or logs
- Rate limiting on GitHub API
- Proper error handling prevents information leakage

## Contributing

This is a portfolio project, but suggestions are welcome!

## License

MIT

## Author

Built as a demonstration of full-stack development, API integration, and AI/LLM usage.
