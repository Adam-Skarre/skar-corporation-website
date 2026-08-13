const ALLOWED_ORIGINS = new Set([
  'https://skartech.com',
  'https://www.skartech.com',
  'https://adam-skarre.github.io'
]);

const SYSTEM_PROMPT = `You are SKAR AI, an engineering and operational decision assistant from Skar Technologies.

Help the user reason through processes, queues, constraints, technical tradeoffs, rework, measurement, and consequential decisions. Ask focused follow-up questions when context is missing. Use rough estimates when the user labels them as estimates, and distinguish evidence from inference. Give practical next actions and measurements. Do not pretend to have inspected files, systems, or data the user has not supplied. Do not claim certainty beyond the evidence. Keep answers direct, structured, and conversational. For medical, legal, financial, safety-critical, or other high-stakes matters, state the limits of the response and recommend appropriate qualified review.`;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) }
  });
}

function outputText(response) {
  if (typeof response.output_text === 'string' && response.output_text.trim()) return response.output_text.trim();
  const parts = [];
  for (const item of Array.isArray(response.output) ? response.output : []) {
    for (const content of Array.isArray(item.content) ? item.content : []) {
      if (content.type === 'output_text' && typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (!ALLOWED_ORIGINS.has(origin) && !localOrigin) return json({ error: 'Origin not allowed.' }, 403, origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/skar-ai') return json({ error: 'Not found.' }, 404, origin);
    if (!env.OPENAI_API_KEY) return json({ error: 'SKAR AI is not configured.' }, 503, origin);

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return json({ error: 'Invalid request.' }, 400, origin);
    }

    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .filter(message => message && (message.role === 'user' || message.role === 'assistant') && typeof message.text === 'string')
      .slice(-20)
      .map(message => ({ role: message.role, content: message.text.trim().slice(0, 4000) }))
      .filter(message => message.content);

    if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'A user message is required.' }, 400, origin);
    const totalCharacters = messages.reduce((sum, message) => sum + message.content.length, 0);
    if (totalCharacters > 24000) return json({ error: 'This conversation is too long. Start a new chat to continue.' }, 413, origin);

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-5.6',
          instructions: SYSTEM_PROMPT,
          input: messages,
          max_output_tokens: 1200
        })
      });
    } catch (_) {
      return json({ error: 'The model service could not be reached.' }, 502, origin);
    }

    if (!response.ok) {
      const requestId = response.headers.get('x-request-id');
      return json({ error: 'The model service returned an error.', requestId }, response.status === 429 ? 429 : 502, origin);
    }

    const result = await response.json();
    const answer = outputText(result);
    if (!answer) return json({ error: 'The model returned an empty response.' }, 502, origin);
    return json({ answer }, 200, origin);
  }
};
