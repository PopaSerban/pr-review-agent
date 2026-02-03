# PR Review Agent

A GitHub bot that automatically reviews pull requests and learns from your codebase over time.

## What It Does

- Watches your GitHub repos for new PRs
- Analyzes code changes using GPT-4
- Posts helpful reviews with specific feedback
- Learns your team's coding style and preferences
- Blocks merging until review is complete

## Setup

1. Clone this repo
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install dependencies: `npm install`
4. Run the server: `npm start`

## Configuration

You need:
- A GitHub personal access token with repo access
- An OpenAI API key
- A webhook secret (make one up, use it in GitHub webhook settings)
- List of repos to watch (format: `owner/repo,owner/repo2`)

## Development

```bash
npm run dev        # Run with auto-reload
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
```

## How It Works

1. GitHub sends a webhook when someone opens a PR
2. The bot fetches the code changes
3. GPT-4 analyzes the changes with context from your codebase
4. A review is posted back to GitHub
5. The bot learns from each PR to give better reviews next time

## Project Structure

```
src/
├── config/      # Configuration and validation
├── models/      # Data models
├── controllers/ # Request handlers
├── services/    # Business logic
├── middleware/  # Express middleware
├── routes/      # API routes
└── utils/       # Helper functions
```

## License

MIT
