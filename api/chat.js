import { Mistral } from '@mistralai/mistralai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Method disallowed context.' });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'System API deployment configuration is unassigned.' });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'System input processing requires clear structural arrays.' });
    }

    const client = new Mistral({ apiKey });
    
    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: messages
    });

    const aiMessage = response.choices[0].message.content;
    return res.status(200).json({ message: aiMessage });

  } catch (error) {
    console.error('Processing Execution fault:', error);
    return res.status(500).json({ error: 'Engine system fault during model execution context.' });
  }
      }
