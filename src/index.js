const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8"
};
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: corsHeaders }); }
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: "IsaiahAI Private Gateway", groqConfigured: Boolean(env.GROQ_API_KEY) });
    if (request.method !== "POST" || url.pathname !== "/api/chat") return json({ error: "Not found" }, 404);
    if (!env.GROQ_API_KEY) return json({ error: "CodePro service is not configured on the server." }, 503);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }
    const messages = Array.isArray(body.messages) ? body.messages : [...(Array.isArray(body.history) ? body.history : []), ...(body.message ? [{ role: "user", content: String(body.message) }] : [])];
    if (!messages.length) return json({ error: "A message is required." }, 400);
    const safeMessages = messages.filter(m => m && ["system", "user", "assistant"].includes(m.role) && typeof m.content === "string").slice(-40);
    if (!safeMessages.length) return json({ error: "No valid chat messages were supplied." }, 400);
    try {
      const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": "Bearer " + env.GROQ_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ model: typeof body.model === "string" && body.model.startsWith("openai/") ? body.model : "openai/gpt-oss-120b", messages: safeMessages, temperature: 0.7, max_completion_tokens: 4096 }) });
      const payload = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return json({ error: payload.error?.message || "Groq request failed (" + upstream.status + ")." }, upstream.status >= 500 ? 502 : upstream.status);
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== "string") return json({ error: "Groq returned an empty response." }, 502);
      return json({ content, model: payload.model || "openai/gpt-oss-120b" });
    } catch { return json({ error: "The CodePro provider could not be reached." }, 502); }
  }
};
