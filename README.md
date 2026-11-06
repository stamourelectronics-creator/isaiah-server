# IsaiahAI CodePro Gateway

A Node.js HTTP service for the IsaiahAI CodePro Windows client. It uses Groq's `openai/gpt-oss-120b` model with Groq-hosted browser search and sandboxed code execution.

## Hosting

This repository is prepared for Railway. It is **not** a GitHub Pages server and does not use Cloudflare.

1. Connect this repository to a Railway project.
2. Add the following Railway service variables:
   - `GROQ_API_KEY`: a newly rotated Groq API key (stored in Railway's private variables, never in Git).
   - `CODEPRO_CLIENT_TOKEN`: a long random client token. The Windows client sends it as a Bearer token.
3. Deploy. Railway detects the Node app and runs `npm start`.
4. Verify `https://YOUR-SERVICE.up.railway.app/health`; it should report the model and both configuration flags as true.

## API

- `GET /health` — health/configuration status; never returns secrets.
- `POST /api/agent` — Server-Sent Events progress and text stream.
- `POST /api/chat` — JSON response, or SSE when the request body contains `"stream": true`.

Both POST endpoints require `Authorization: Bearer YOUR_CODEPRO_CLIENT_TOKEN`.

Example body:

```json
{
  "messages": [
    { "role": "user", "content": "Research the latest Node.js LTS release and write a short summary." }
  ]
}
```

The model can autonomously use Groq's built-in `browser_search` and `code_interpreter` tools. Code execution happens in Groq's remote Python sandbox; it does not execute arbitrary commands on the user's Windows computer. Local Windows actions need a separate desktop-side permissioned tool bridge.

## Local development

Use Node.js 20 or later:

```powershell
$env:GROQ_API_KEY="your-new-groq-key"
$env:CODEPRO_CLIENT_TOKEN="a-long-random-client-token"
npm start
```

Never commit `.env` files, API credentials, or client tokens. The previous Cloudflare Worker scaffold has been removed.
