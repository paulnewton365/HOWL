// Vercel Serverless Function — proxies requests to the Anthropic API.
// Keeps ANTHROPIC_API_KEY server-side. Supports the optional web_search tool
// so Claude can research the brand at the URL the user submits.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
  }

  try {
    const {
      messages,
      model,
      max_tokens,
      temperature,
      system,
      useWebSearch,
      webSearchMaxUses,
    } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required.' });
    }

    const requestBody = {
      model: model || 'claude-sonnet-4-6',
      max_tokens: max_tokens || 8000,
      temperature: temperature ?? 0.2,
      messages,
      ...(system && { system }),
    };

    if (useWebSearch) {
      requestBody.tools = [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: webSearchMaxUses || 6,
        },
      ];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: error.error?.message || `Anthropic API error: ${response.status}`,
      });
    }

    const data = await response.json();

    // Flatten text blocks for easy consumption on the client.
    if (data.content && Array.isArray(data.content)) {
      const textBlocks = data.content.filter(b => b.type === 'text');
      if (textBlocks.length > 0) {
        data.text = textBlocks.map(b => b.text).join('\n');
      }
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('claude proxy error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
