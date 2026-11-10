# IsaiahAI CodePro Gateway

A Node.js HTTP gateway for IsaiahAI CodePro. It keeps provider credentials on the server and exposes a streaming agent API to the IsaiahSearch desktop client.

## Providers

The desktop CodePro agent tries providers in this order: Gemini (when `GEMINI_API_KEY_CODEPRO` is configured), Cloudflare Workers AI, then Groq. The website model routes are also hosted here: IsaiahAI 5.3 Flash, Isaiah Max 6.0, IsaiahAI 7.0 SUPER, and CodePro use separate Gemini key slots. Open-Isaiah uses a configurable external key-pool service and an OpenAI-compatible chat endpoint.

The default Gemini models are `gemini-3.5-flash-lite` for IsaiahAI 5.3 Flash and `gemini-3.8-flash` for Isaiah Max 6.0, 7.0 SUPER, and CodePro. If a primary model stalls or fails, the gateway retries with `gemini-3.5-flash` by default. Each provider attempt has a bounded timeout (`GEMINI_REQUEST_TIMEOUT_MS`, 20 seconds by default). Thinking mode supports low, medium, and high effort for supported Gemini 3 models. Automatic mode leaves the provider's dynamic thinking enabled.

At least one provider key must be configured. For reliable service, configure both. All credentials belong in Railway's private Variables panel (or a local untracked `.env` file for development), never in Git, the desktop installer, or the renderer.

## Railway deployment

This repository is connected to the Railway service `codepro-gateway`.

Configure these private Railway variables:

- `GEMINI_API_KEY_53_60`: private Gemini key for IsaiahAI 5.3 Flash and Isaiah Max 6.0.
- `GEMINI_API_KEY_70`: private Gemini key for IsaiahAI 7.0 SUPER.
- `GEMINI_API_KEY_CODEPRO`: private Gemini key for the CodePro Windows agent.
- `GEMINI_53_MODEL`, `GEMINI_60_70_MODEL`, `GEMINI_CODEPRO_MODEL`: optional model identifiers; defaults are listed above.
- `GEMINI_FALLBACK_MODEL`: optional shared fallback model; defaults to `gemini-3.5-flash`.
- `GEMINI_REQUEST_TIMEOUT_MS`: optional per-model attempt timeout in milliseconds; defaults to `20000` and is clamped between 10000 and 60000.
- `GEMINI_SEARCH_GROUNDING_ENABLED`: defaults to `false` so chats work with standard free-tier keys. Set to `true` only when the Gemini account tier has Google Search grounding access. When disabled, the API returns a normal model answer with `searchUnavailable: true`; the website tells users the answer has no live web verification.
- `OPEN_ISAIAH_KEYS_URL`: HTTPS endpoint returning a JSON array of API keys, or `{ "keys": [...] }`, for the Open-Isaiah pool.
- `OPEN_ISAIAH_API_URL`: HTTPS OpenAI-compatible `/chat/completions`-style endpoint used with a key returned above.
- `OPEN_ISAIAH_KEYS_TOKEN`: optional bearer token required to fetch the key pool.
- `OPEN_ISAIAH_MODEL`: optional upstream model name; defaults to `open-isaiah`.
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
