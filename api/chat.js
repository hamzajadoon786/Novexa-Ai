export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method disallowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Mistral Core token unconfigured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { messages, image, document, model, webSearch } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Malformed payload matrix' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let targetingModel = model || 'mistral-large-latest';
    let contentStream = [];
    const lastMessage = messages[messages.length - 1];

    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      targetingModel = 'pixtral-12b-latest';
      contentStream.push({ type: 'text', text: lastMessage.content });
      contentStream.push({ type: 'image_url', image_url: { url: image } });
    } else if (document && document.content) {
      contentStream = `Context from attached artifact [File: ${document.name}]:\n"""\n${document.content}\n"""\n\nPrompt: ${lastMessage.content}`;
    } else {
      contentStream = lastMessage.content;
    }

    if (webSearch) {
      contentStream = `[System directive: Execute web search validation optimization prior to resolving prompt.] ${typeof contentStream === 'string' ? contentStream : lastMessage.content}`;
    }

    const payloadMessages = [
      ...messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: contentStream }
    ];

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: targetingModel,
        messages: payloadMessages,
        temperature: 0.2,
        stream: true
      })
    });

    if (!response.ok) {
      const errTxt = await response.text();
      return new Response(JSON.stringify({ error: `Mistral communication barrier: ${errTxt}` }), { status: response.status, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
        }
