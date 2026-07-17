export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Mistral API key is missing on the server environment.' });
  }

  try {
    const { messages, image } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid or missing messages array.' });
    }

    let model = 'mistral-large-latest';
    let payloadContent = [];

    const lastUserMessage = messages[messages.length - 1];
    
    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      model = 'pixtral-12b-latest';
      payloadContent.push({ type: 'text', text: lastUserMessage.content });
      payloadContent.push({ type: 'image_url', image_url: { url: image } });
    } else {
      payloadContent = lastUserMessage.content;
    }

    const formattedMessages = [
      ...messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: payloadContent
      }
    ];

    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!mistralResponse.ok) {
      const errorData = await mistralResponse.json();
      return res.status(mistralResponse.status).json({ error: errorData.message || 'Mistral API request failed' });
    }

    const data = await mistralResponse.json();
    const assistantReply = data.choices[0].message.content;

    return res.status(200).json({ reply: assistantReply });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
                                 }
