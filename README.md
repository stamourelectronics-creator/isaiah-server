# IsaiahAI CodePro Gateway

A Node.js HTTP gateway for IsaiahAI CodePro. It keeps provider credentials on the server and exposes a streaming agent API to the IsaiahSearch desktop client.

## Providers

The gateway tries providers in this order:

1. **Cloudflare Workers AI** — primary provider when `CLOUDFLARE_API_TOKEN` is set, using `@cf/zai-org/glm-4.7-flash` by default.
2. **Groq** — automatic fallback when Cloudflare is not configured or its request fails. The default fallback model is `openai/gpt-oss-120b`.

At least one provider key must be configured. For reliable service, configure both. All credentials belong in Railway's private Variables panel (or a local untracked `.env` file for development), never in Git, the desktop installer, or the renderer.

## Railway deployment

This repository is connected to the Railway service `codepro-gateway`.

Configure these private Railway variables:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with permission to run Workers AI models.
- `CLOUDFLARE_ACCOUNT_ID`: 32-character Cloudflare account ID.
- `CLOUDFLARE_MODEL`: optional; defaults to `@cf/zai-org/glm-4.7-flash`.
- `GROQ_API_KEY`: Groq API key used as an automatic fallback.
- `GROQ_MODEL`: optional; defaults to `openai/gpt-oss-120b`.
- `CODEPRO_CLIENT_TOKEN`: optional client access token. When set, POST requests require it as a Bearer token. Desktop installers must not contain provider API keys.

Deploy from `main`. Verify `GET /health` returns `providerReady: true`. It also reports `cloudflareTokenConfigured` and `groqFallbackConfigured` separately without exposing secret values. The legacy `cloudflareConfigured` property remains as a compatibility flag for older desktop clients and means that at least one provider is ready; use `cloudflareTokenConfigured` to check actual Cloudflare configuration.

## API

- `GET /health` — gateway and provider-configuration status; never returns secrets.
- `POST /api/agent` — Server-Sent Events status and response stream.
- `POST /api/chat` — JSON response, or SSE when the body includes `"stream": true`.

Example request body:

```json
{
  "messages": [
    { "role": "user", "content": "Explain this code and suggest a safe improvement." }
  ]
}
```

Requests are rate-limited per source IP. Treat client input and browser content as untrusted. The Windows shell bridge, browser navigation, and page inspection are provided by the IsaiahSearch desktop client, not by this server.

## Local development

Use Node.js 20 or later:

```powershell
Copy-Item .env.example .env
# Fill in at least one provider key in the untracked .env file.
npm start
``

Run `npm run check` to validate JavaScript syntax. Never commit `.env`, provider API keys, or client access tokens.
