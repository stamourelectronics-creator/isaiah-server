# IsaiahAI Private Model Gateway

This repository contains server code only. Never commit API keys, .env files, tokens, or credentials here.

## Runtime secret

Deploy this Worker to Cloudflare Workers, then add a secret named GROQ_API_KEY in Worker settings (or with wrangler secret put GROQ_API_KEY). Use the newly rotated Groq key. Never place it in GitHub source, the mobile site, or the Windows executable.

## Deploy

1. Install Wrangler and authenticate with your Cloudflare account.
2. Run npm install.
3. Run npx wrangler secret put GROQ_API_KEY and paste the rotated key into the terminal prompt.
4. Run npm run deploy.
5. Configure the resulting Worker URL in the Windows CodePro app. Keep mobile on its current Netlify endpoint until the gateway is deployed and tested.

## Endpoints

- GET /health reports service status and whether the secret is configured.
- POST /api/chat forwards chat requests to Groq using the server-side secret.

This is a deployment scaffold, not a deployed service. Add production authentication and rate limiting before exposing it broadly.
