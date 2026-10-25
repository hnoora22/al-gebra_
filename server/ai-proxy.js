/* Optional: live AI tutor proxy (Cloudflare Worker).
   Keeps your API key off the website. The site sends the chat history and the student's
   profile; this returns { reply }. NOT TESTED against the live API yet: test it before the demo.

   Deploy:
     1. npm create cloudflare@latest al-gebra-ai   (choose "Hello World" Worker), replace its code with this file
     2. npx wrangler secret put ANTHROPIC_API_KEY
     3. (optional) set ALLOWED_ORIGIN to your site, e.g. https://yourname.github.io
     4. npx wrangler deploy, then paste the Worker URL into js/config.js as AI_PROXY_URL
*/
const STYLE_HINTS = {
  visual: 'Lead with a picture, number line or color-coded steps described in words.',
  verbal: 'Lead with a plain-language explanation or a short story.',
  hands: 'Give the student a small problem to try first, then explain.',
  logic: 'Lead with the rule and number the steps.',
};

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });
    let body;
    try { body = await request.json(); } catch { return new Response('Bad request', { status: 400, headers: cors }); }
    const p = body.profile || {};
    const messages = (body.messages || []).slice(-10).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 2000) }));
    if (!messages.length || messages[0].role !== 'user') return new Response('Bad request', { status: 400, headers: cors });
    const system = `You are a friendly Algebra 1 tutor for a student in grade ${p.grade || '8-9'}. Skill level: ${p.level || 'unknown'}. ` +
      `${STYLE_HINTS[p.style] || ''} Keep answers under 150 words. Guide with hints and worked examples; do not just hand over answers to homework. Use plain text, no markdown.`;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.MODEL || 'claude-sonnet-5-5', max_tokens: 500, system, messages }),
    });
    if (!r.ok) return new Response(JSON.stringify({ error: 'upstream' }), { status: 502, headers: { ...cors, 'content-type': 'application/json' } });
    const j = await r.json();
    const reply = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
    return new Response(JSON.stringify({ reply }), { headers: { ...cors, 'content-type': 'application/json' } });
  },
};
