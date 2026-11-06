# IsaiahAI CodePro Gateway

A Node.js HTTP service for IsaiahAI CodePro clients. It uses Groq's `openai/gpt-oss-120b` model with Groq-hosted browser search and sandboxed code execution. The Windows desktop client supplies a local PowerShell/CMD bridge; the model requests one shell step at a time and receives the actual output and exit code before continuing.

## Hosting

This repository is prepared for Railway. It is **not** a GitHub Pages server and does not use Cloudflare.

1. Connect this repository to a Railway project.
2. Add the following Railway service variables:
   - `GROQ_API_KEY`: a newly rotated Groq API key (stored in Railway's private variables, never in Git).
   - `CODEPRO_CLIENT_TOKEN`: optional. Leave it blank for the public Windows installer client; when set, requests must include it as a Bearer token. Public mode is protected by per-IP request limits.
3. Deploy. Railway detects the Node app and runs `npm start`.
4. Verify `https://YOUR-SERVICE.up.railway.app/health`; it should report the model and both configuration flags as true.

## API

- `GET /health` — health/configuration status; never returns secrets.
- `POST /api/agent` — Server-Sent Events progress and text stream.
- `POST /api/chat` — JSON response, or SSE when the request body contains `"stream": true`.

When `CODEPRO_CLIENT_TOKEN` is set, POST endpoints require `Authorization: Bearer YOUR_CODEPRO_CLIENT_TOKEN`. Leave it blank for the public desktop client build; do not put the Groq provider key in client code. Public requests are rate-limited by source IP.

Example body:

```json
{
  "messages": [
    { "role": "user", "content": "Research the latest Node.js LTS release and write a short summary." }
  ]
}
```

The model can autonomously use Groq's built-in `browser_search` and `code_interpreter` tools. Code execution happens in Groq's remote Python sandbox. Windows shell operations are handed off to the IsaiahSearch desktop client through one `powershell` or `cmd` fenced command block at a time. The client runs the command locally under the current Windows user, streams output, returns exit codes, and the model inspects the result before continuing. Shell agent mode is explicitly enabled in the app; high-impact system commands always require a separate confirmation.

## Local development

Use Node.js 20 or later:

```powershell
$env:GROQ_API_KEY="your-new-groq-key"
$env:CODEPRO_CLIENT_TOKEN="a-long-random-client-token"
npm start
```

Never commit `.env` files, API credentials, or client tokens. The previous Cloudflare Worker scaffold has been removed.
