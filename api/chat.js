export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are Novexa AI, a professional, intelligent, friendly and helpful AI assistant. Always give clear, accurate and useful answers."
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages,
          temperature: 0.7,
          max_tokens: 1024
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error:
          data.error?.message ||
          "Mistral API Error"
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content ||
        "No response received."
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Internal Server Error"
    });

  }
  }
