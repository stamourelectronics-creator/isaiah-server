# IsaiahAI CodePro Gateway

A Node.js HTTP gateway for IsaiahAI CodePro. It keeps provider credentials on the server and exposes a streaming agent API to the IsaiahSearch desktop client.

## Providers

The CodePro agent uses Groq's `openai/gpt-oss-120b` as its primary model with medium reasoning effort by default. The desktop Reasoning control can request high effort. When Groq is unavailable, it can fall back to Gemini (when `GEMINI_API_KEY_CODEPRO` is configured), then Cloudflare Workers AI (when both its token and account ID are configured). The `/api/agent` endpoint and `/api/chat` requests with `model: "isaiah_codepro"` use the same Groq-first agent pipeline. The website's other model routes are also hosted here: IsaiahAI 5.3 Flash, Isaiah Max 6.0, IsaiahAI 7.0 SUPER, and Open-Isaiah.

The default Gemini models are `gemini-3.5-flash-lite` for IsaiahAI 5.3 Flash and `gemini-3.8-flash` for Isaiah Max 6.0, 7.0 SUPER, and CodePro. If a primary model stalls or fails, the gateway retries with `gemini-3.5-flash` by default. Each provider attempt has a bounded timeout (`GEMINI_REQUEST_TIMEOUT_MS`, 20 seconds by default). Thinking mode supports low, medium, and high effort for supported Gemini 3 models. Automatic mode leaves the provider's dynamic thinking enabled.

At least one CodePro provider must be configured. Configure Groq as the primary provider and an optional Gemini or Cloudflare fallback for resilience. GPT-OSS reasoning defaults to medium with a 4,096-token completion budget; high effort and the larger budget are used only when the desktop Reasoning control is enabled. Reasoning tokens are not included in user-facing responses. The server does not run local computer commands: the IsaiahSearch desktop may request one local project command at a time, but only after the user approves it in a native dialog. The desktop restricts commands to its selected project folder and blocks shell chaining, system-setting changes, credential access, network-transfer tools, and outside paths. All credentials belong in Railway's private Variables panel (or a local untracked `.env` file for development), never in Git, the desktop installer, or the renderer.

## Railway deployment

This repository is connected to the Railway service `codepro-gateway`.

Configure these private Railway variables:

- `GEMINI_API_KEY_53_60`: private Gemini key for IsaiahAI 5.3 Flash and Isaiah Max 6.0.
- `GEMINI_API_KEY_70`: private Gemini key for IsaiahAI 7.0 SUPER.
- `GEMINI_API_KEY_CODEPRO`: private Gemini key for the CodePro Windows agent.
- `GEMINI_53_MODEL`, `GEMINI_60_70_MODEL`, `GEMINI_CODEPRO_MODEL`: optional model identifiers; defaults are listed above.
- `GEMINI_FALLBACK_MODEL`: optional shared fallback model; defaults to `gemini-3.5-flash`.
- `ISAIAH_SUPER_SUMMARY_MODEL`: optional separate fast Flash model for IsaiahAI 7.0 SUPER Search Assist overviews and reasoning summaries; defaults to `GEMINI_FALLBACK_MODEL`.
- `GEMINI_REQUEST_TIMEOUT_MS`: optional per-model attempt timeout in milliseconds; defaults to `20000` and is clamped between 10000 and 60000.
- `GEMINI_SEARCH_GROUNDING_ENABLED`: defaults to `false` so chats work with standard free-tier keys. Set to `true` only when the Gemini account tier has Google Search grounding access. When disabled, the API returns a normal model answer with `searchUnavailable: true`; the website tells users the answer has no live web verification.
- `OPEN_ISAIAH_PROVIDER`: set to `gemini` to run Open-Isaiah through the existing private Gemini model-key slots; set to `openrouter` to use the OpenRouter path.
- `OPEN_ISAIAH_API_KEY`: optional dedicated private key for Open-Isaiah. When omitted in Gemini mode, the gateway reuses `GEMINI_API_KEY_70`, then `GEMINI_API_KEY_53_60`, then `GEMINI_API_KEY`.
- `OPEN_ISAIAH_GEMINI_MODEL`: optional Gemini model override for Open-Isaiah; defaults to the configured Isaiah Max / 7.0 model.
- `OPEN_ISAIAH_API_URL`: optional Gemini API base URL for deployments that customize the upstream endpoint.
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with permission to run Workers AI models.
- `CLOUDFLARE_ACCOUNT_ID`: 32-character Cloudflare account ID.
- `CLOUDFLARE_MODEL`: optional; defaults to `@cf/zai-org/glm-4.7-flash`.
- `GROQ_API_KEY`: private Groq API key; primary provider for IsaiahAI CodePro and Breakaway 1.0.
- `GROQ_MODEL`: optional; defaults to `openai/gpt-oss-120b`.
- `GROQ_REQUEST_TIMEOUT_MS`: optional Groq request timeout; defaults to `90000` and is clamped between 15000 and 180000.
- `CODEPRO_CLIENT_TOKEN`: optional client access token. When set, POST requests require it as a Bearer token. Desktop installers must not contain provider API keys.

Deploy from `main`. Verify `GET /health` returns `providerReady: true`, `codeproProvider: "Groq"`, and `groqConfigured: true` when Groq is set. Health output reports provider readiness only and never exposes secret values. The legacy `cloudflareConfigured` property remains as a compatibility flag for older desktop clients and means that at least one provider is ready; use `cloudflareTokenConfigured` to check actual Cloudflare configuration.

## API

- `GET /health` — gateway and provider-configuration status; never returns secrets.
- `POST /api/agent` — Groq-first CodePro agent stream, with optional provider fallbacks.
- `POST /api/chat` — JSON response, or SSE when the body includes `"stream": true`; `model: "isaiah_codepro"` uses the same CodePro agent pipeline.

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
