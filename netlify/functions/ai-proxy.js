const PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    auth: key => ({ Authorization: `Bearer ${key}` }),
    body: ({ model, prompt }) => ({ model, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
    read: json => json.choices?.[0]?.message?.content,
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    auth: key => ({ Authorization: `Bearer ${key}` }),
    body: ({ model, prompt }) => ({ model, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
    read: json => json.choices?.[0]?.message?.content,
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    auth: key => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
    body: ({ model, prompt }) => ({ model, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
    read: json => json.content?.[0]?.text,
  },
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const provider = PROVIDERS[payload.provider];
    if (!provider || !payload.key || !payload.prompt) {
      return { statusCode: 400, headers: corsHeaders(), body: 'Missing provider, key, or prompt' };
    }

    const upstream = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...provider.auth(payload.key),
      },
      body: JSON.stringify(provider.body(payload)),
    });
    const json = await upstream.json();
    if (!upstream.ok || json.error) {
      return {
        statusCode: upstream.status || 502,
        headers: corsHeaders(),
        body: JSON.stringify({ error: json.error?.message || JSON.stringify(json.error || json) }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ text: provider.read(json) || 'No response.' }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: corsHeaders(),
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}
