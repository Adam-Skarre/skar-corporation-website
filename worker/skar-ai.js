const ALLOWED_ORIGINS = new Set([
  'https://skartech.com',
  'https://www.skartech.com',
  'https://adam-skarre.github.io'
]);

const SYSTEM_PROMPT = `You are SKAR AI, an evidence-aware engineering, business, and product workspace from Skar Technologies.

Help users analyze consequential decisions, compare options, inspect evidence, plan complex work, clarify technical systems, and create useful professional artifacts. You may draft specifications, analyses, plans, models, tables, and code when asked, but never claim to have executed, tested, searched, or inspected anything you have not actually received. Treat attached material as user-provided context, not automatically verified fact.

Core behavior:
- Lead with the useful conclusion or artifact.
- Clearly distinguish observations, assumptions, inferences, and recommendations.
- Preserve uncertainty and name missing evidence instead of inventing it.
- Use concise Markdown with a title and descriptive section headings.
- Make next actions owned, bounded, and measurable.
- Ask one focused question when the missing answer would materially change the work.
- Never fabricate citations, sources, calculations, people, results, or system access.
- Keep consequential judgment with a responsible person.

For medical, legal, financial, safety-critical, or other high-stakes matters, explain the limits and recommend appropriate qualified review.`;

const MODE_INSTRUCTIONS = {
  decision: 'Prepare an inspectable decision brief. Include the working conclusion, supporting evidence, assumptions, risks or open questions, recommended next action, and success signal.',
  plan: 'Build a practical action plan. Include the objective, scope, sequenced work, owners or decision rights, milestones, dependencies, risks, and measures of completion.',
  compare: 'Compare the options using explicit decision criteria. Identify tradeoffs, uncertainty, reversible versus irreversible choices, evidence gaps, and the next test before commitment.',
  evidence: 'Review the supplied evidence. Separate facts from claims and assumptions, identify contradictions and source limitations, assess what the material supports, and define a verification plan.'
};

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
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (url.pathname !== '/skar-ai') return json({ error: 'Not found.' }, 404, origin);
    if (request.method === 'GET') {
      if (!env.OPENAI_API_KEY) return json({ status: 'guided', product: 'SKAR AI' }, 503, origin);
      return json({ status: 'ready', product: 'SKAR AI' }, 200, origin);
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, origin);
    if (!env.OPENAI_API_KEY) return json({ error: 'SKAR AI is not configured.' }, 503, origin);

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return json({ error: 'Invalid request.' }, 400, origin);
    }

    const mode = Object.hasOwn(MODE_INSTRUCTIONS, body.mode) ? body.mode : 'decision';
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .filter(message => message && (message.role === 'user' || message.role === 'assistant') && typeof message.text === 'string')
      .slice(-20)
      .map(message => ({ role: message.role, content: message.text.trim().slice(0, message.role === 'user' ? 14000 : 7000) }))
      .filter(message => message.content);

    if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'A user message is required.' }, 400, origin);
    const totalCharacters = messages.reduce((sum, message) => sum + message.content.length, 0);
    if (totalCharacters > 32000) return json({ error: 'This workspace is too long. Start a new workspace or remove some attached material.' }, 413, origin);

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
          instructions: `${SYSTEM_PROMPT}\n\nCurrent workspace mode: ${MODE_INSTRUCTIONS[mode]}`,
          input: messages,
          max_output_tokens: 1800
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
