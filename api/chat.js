const { GoogleGenAI } = require("@google/genai");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "Gemini chat API is live"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in environment variables."
      });
    }

    const { message, history = [] } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const systemInstruction = `
You are the website assistant for Nash Tax & Bookkeeping.

Your role:
- Help visitors with bookkeeping, payroll, tax filing, business registration, and consultation questions.
- Be professional, friendly, warm, and concise.
- Give general information only.
- Do not provide final legal, tax, accounting, or compliance advice.
- Do not invent tax rates, fees, filing deadlines, office hours, laws, or guarantees.
- If the question is case-specific, uncertain, or needs a professional review, ask the visitor to contact Nash Tax & Bookkeeping directly.
- Keep answers short and practical, usually under 120 words.
- Encourage users to contact the business when they need personalized support.

Approved business context:
- Business name: Nash Tax & Bookkeeping
- Core services: bookkeeping, payroll, tax filing, business registration, consultations
- Tone: trustworthy, premium, professional, approachable
    `.trim();

    const formattedHistory = history
      .filter((item) => item && item.role && item.content)
      .slice(-12)
      .map((item) => {
        const speaker = item.role === "assistant" ? "Assistant" : "User";
        return `${speaker}: ${item.content}`;
      })
      .join("\n");

    const prompt = `
${formattedHistory ? formattedHistory + "\n" : ""}User: ${message}
Assistant:
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 220
      }
    });

    return res.status(200).json({
      reply:
        response.text ||
        "Sorry, I couldn't generate a response right now."
    });
  } catch (error) {
    console.error("Gemini chat API error:", error);

    return res.status(500).json({
      error:
        error.message ||
        "Something went wrong while processing your request."
    });
  }
};