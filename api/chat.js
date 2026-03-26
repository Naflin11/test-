const { GoogleGenAI } = require("@google/genai");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing"
      });
    }

    const { message, history = [] } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message required" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // 🔥 WEBSITE KNOWLEDGE (SOURCE OF TRUTH)
    const websiteKnowledge = `
Nash Tax & Bookkeeping helps individuals and businesses stay compliant, organized, and financially confident.

Services:
- Individual Taxes (credits, deductions, filing, year-round support)
- Business Taxes (planning, expense tracking, reporting)
- Bookkeeping (monthly reconciliations, reports, audit-ready books)
- Payroll (accurate payroll, employee support)
- Business Formation (registration and setup)

Process:
1. Discovery call
2. Secure document upload
3. Reporting and ongoing support

Other:
- Free consultation available
- Remote-friendly services
- Secure document handling

Contact:
- Phone: +1 (914) 413 4870
- Email: Tax@nashath.us
- Location: Dallas, TX
- Hours: 9AM–6PM
`;

    // 🔥 IMPROVED SYSTEM PROMPT (CONVERSATIONAL)
    const systemInstruction = `
You are a helpful assistant for Nash Tax & Bookkeeping.

Your role:
- Help website visitors understand services and next steps
- Be friendly, natural, and conversational (not robotic)
- Speak like a real human assistant

Use the website knowledge as your main source, but:
- Explain things naturally
- Rephrase and simplify
- Combine information when helpful

Do NOT:
- Invent pricing, tax rates, deadlines, or legal advice
- Give final tax/legal decisions

If the question is specific or unclear:
- Give general guidance
- Then suggest contacting the team

Tone:
- Friendly, professional, human-like
- Short, clear responses (3–5 sentences max)

Website knowledge:
${websiteKnowledge}
`;

    // 🔥 BETTER CONVERSATION FORMAT
    const formattedHistory = history
      .slice(-8)
      .map((h) => `${h.role === "assistant" ? "Assistant" : "User"}: ${h.content}`)
      .join("\n");

    const prompt = `
Conversation:
${formattedHistory || "No previous conversation"}

User: ${message}

Respond naturally like a helpful assistant.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.5,
        maxOutputTokens: 300
      }
    });

    return res.status(200).json({
      reply: response.text || "Sorry, something went wrong."
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Server error"
    });
  }
};