# 🤖 PR Review Agent

> An intelligent GitHub bot that automatically reviews pull requests using GPT-4, providing conversational, actionable feedback with inline code comments.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## Features

- 🤖 **AI-Powered Reviews**: Uses GPT-4 to analyze code and provide intelligent feedback
- � **Conversational Tone**: Reviews written like a friendly senior dev, not a formal report
- 📝 **Inline Code Comments**: Posts comments directly on specific lines of code
- � **Secure**: Webhook signature verification prevents unauthorized access
- 📊 **Complexity Analysis**: Automatically assesses PR size and complexity
- 🎯 **Smart File Selection**: Prioritizes most relevant files for review
- 🧠 **Learning System**: Learns from your codebase patterns and conventions
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
```bash
# Generate a secure random secret
openssl rand -hex 32
```
Copy the output and use it in both `.env` (as `GITHUB_WEBHOOK_SECRET`) and GitHub webhook settings

### Running the Bot

```bash
# Start the bot
npm start
```

The server will start on `http://localhost:3000`

### Local Development with Cloudflare Tunnel

For local testing, you need to expose your local server to the internet so GitHub can send webhooks:

**1. Install Cloudflare Tunnel (cloudflared)**
```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Windows
# Download from https://github.com/cloudflare/cloudflared/releases
```

**2. Start the tunnel**
```bash
# In a separate terminal, run:
cloudflared tunnel --url http://localhost:3000
```

**3. Copy the public URL**
You'll see output like:
```
Your quick Tunnel has been created! Visit it at:
https://random-words-here.trycloudflare.com
```

**Important**: Each time you restart the tunnel, you get a new random URL. You'll need to update your GitHub webhook URL accordingly.

**Alternative**: For a permanent URL, create a named Cloudflare tunnel (requires free Cloudflare account)

## Setting Up GitHub Webhook

**For each repository you want to watch:**

1. Go to your repository → **Settings** → **Webhooks** → **Add webhook**

2. **Payload URL**: 
   - Local dev: `https://your-tunnel-url.trycloudflare.com/api/webhook`
   - Production: `https://your-server.com/api/webhook`

3. **Content type**: `application/json`

4. **Secret**: Paste your `GITHUB_WEBHOOK_SECRET` value

5. **Which events would you like to trigger this webhook?**
   - Select "Let me select individual events"
   - ✅ Check **Pull requests** only
   - ❌ Uncheck everything else (including "Pushes")

6. **Active**: ✅ Make sure this is checked

7. Click **Add webhook**

**Verify it works:**
- After adding the webhook, GitHub will send a test ping
- Check the "Recent Deliveries" tab to see if it succeeded (green checkmark)
- If it failed, check your bot logs and webhook URL

**Testing the bot:**
1. Create a test PR in your repository
2. The bot should post a review within a few seconds
3. Check bot logs for any errors

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

The bot posts conversational reviews with inline code comments:

**Main Review Comment:**
```markdown
Quick review! Overall looks solid 👍

Found an unused variable in script.js that we should clean up. The commit 
message is clear and descriptive though, nice work!

---

📊 **Quick Stats**: 1 file, 1 change (+1/-0) • Complexity: low

*🤖 Automated review by PR Review Agent*
```

**Inline Code Comment** (posted directly on the problematic line):

> **script.js:174**
> 
> Hey! This `notUsedVariable` isn't being used anywhere. Mind removing it to keep things clean? 🧹

### Review Style

- **Conversational**: Written like a friendly teammate, not a formal report
- **Specific**: Points to exact files and line numbers
- **Actionable**: Clear suggestions on what to fix
- **Encouraging**: Highlights good practices too
- **Brief**: Gets to the point quickly

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
│   │   ├── reviewService.js      # Review orchestration
│   │   ├── learningService.js    # Learning system orchestration
│   │   ├── knowledgeService.js   # Knowledge storage
│   │   └── patternExtractor.js   # Pattern extraction from PRs
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
├── knowledge/            # Learned patterns per repository
│   └── owner-repo/
│       ├── patterns.md   # Common code patterns
│       ├── conventions.md # Coding conventions
│       └── domain.md     # Domain knowledge
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

- **Check tunnel is running**: `cloudflared tunnel --url http://localhost:3000`
- **Verify webhook URL**: Must match your current tunnel URL (changes on restart)
- **Check webhook secret**: Must match exactly in `.env` and GitHub settings
- **Review GitHub webhook delivery logs**: Settings → Webhooks → Recent Deliveries
- **Check bot logs**: Look for incoming webhook events
- **Verify events**: Only "Pull requests" should be checked in webhook settings

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

## Learning System

The bot learns from your codebase over time:

- **Pattern Recognition**: Identifies common code patterns and conventions
- **Domain Knowledge**: Builds understanding of your project's domain
- **Context-Aware Reviews**: Uses learned knowledge to provide more relevant feedback
- **Per-Repository**: Each repo has its own knowledge base

**Enable learning** in `.env`:
```bash
ENABLE_LEARNING=true
KNOWLEDGE_DIR=./knowledge
```

Knowledge is stored in markdown files under `./knowledge/owner-repo/`

## Security

- Webhook signatures verified using HMAC SHA-256
- Environment variables for sensitive data
- No secrets in code or logs
- Rate limiting on GitHub API
- Proper error handling prevents information leakage

## Contributing

Contributions are welcome! Whether you want to:

- 🐛 Report a bug
- 💡 Suggest a new feature
- 📝 Improve documentation
- 🔧 Submit a pull request

Feel free to open an issue or PR. Please read our contribution guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Run tests**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/pr-review-agent.git
cd pr-review-agent

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Add your credentials to .env

# Run tests
npm test

# Start development server
npm start
```

### Code Style

- Follow existing code patterns
- Add tests for new features
- Keep commits atomic and well-described
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this project helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🔀 Contributing code

## Acknowledgments

- Built with [OpenAI GPT-4](https://openai.com/)
- Powered by [GitHub API](https://docs.github.com/en/rest)
- Tunneling via [Cloudflare](https://www.cloudflare.com/)

---

**Made with ❤️ for the developer community**
