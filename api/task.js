export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method disallowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Mistral authorization unconfigured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { action, targetText, systemInstruction } = await req.json();

    if (!targetText) {
      return new Response(JSON.stringify({ error: 'Missing baseline content array' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let defaultPrompt = `Execute specialized processing operation: ${action} over the target parameters below. Return response cleanly.`;
    if (systemInstruction) defaultPrompt = `${systemInstruction}`;

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: defaultPrompt },
          { role: 'user', content: targetText }
        ],
        temperature: 0.3
      })
    });

    const body = await res.json();
    return new Response(JSON.stringify({ result: body.choices[0].message.content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  }
