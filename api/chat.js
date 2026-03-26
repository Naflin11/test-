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

    const websiteKnowledge = `
Business name: Nash Tax & Bookkeeping

Brand message:
- Tax Compliance Made Easy For You
- Helping individuals and businesses stay compliant, organized, and financially confident.

Main services:
- Individual Taxes
- Business Taxes
- Bookkeeping
- Payroll
- Business Formation

Service details:
- Individual Taxes: Maximize returns and file with confidence using a clean, guided process. Includes credits and deductions, accurate filing, and year-round support.
- Business Taxes: Tax planning and filing that protects cash flow and reduces risk. Includes quarterly strategy, expense tracking, and clean reporting.
- Bookkeeping: Monthly reconciliations and reports that are tidy, consistent, and useful. Includes monthly close, P&L + Balance sheet, and audit-ready books.
- Payroll: Accurate payroll processing with structured compliance-friendly support. Includes monthly payroll runs, employee support, and on-time delivery.
- Business Formation: Business registration and setup support.

Why clients choose Nash:
- Trusted financial partners
- Reliable and efficient process
- Personalized support

3-step process:
1. Discovery Call: We understand your goals and recommend the best plan.
2. Secure Document Upload: Clear checklists and simple document sharing.
3. Reporting & Support: Clean reports and reminders so clients are always prepared.

FAQ answers:
- Free consultations: Yes. We start with a short call to understand needs and recommend the best path.
- Document handling: We follow a secure document workflow with clear checklists and consistent updates.
- Remote support: Yes. Many services can be delivered remotely. Details are confirmed during consultation.

Contact details:
- Phone: +1 (914) 413 4870
- Email: Tax@nashath.us
- Location: Dallas, TX
- Remote-friendly: Yes
- Business hours: 9AM–6PM
- Reply within business hours: 9AM–6PM

Important rules:
- Only answer using this approved website knowledge.
- Do not invent pricing, tax rates, deadlines, legal conclusions, office policies, or extra services.
- Do not provide final tax or legal advice.
- If the answer is not clearly available here or the question is case-specific, say:
  "Please contact Nash Tax & Bookkeeping directly for personalized assistance."
    `.trim();

    const systemInstruction = `
You are the website assistant for Nash Tax & Bookkeeping.

Your job:
- Answer visitor questions using only the approved website knowledge provided.
- Be professional, warm, clear, and concise.
- Help users understand services, process, remote support, and how to contact the team.
- Keep answers practical and natural.
- Use short paragraphs or bullet points when helpful.
- Keep most answers under 120 words.
- Never invent facts.
- Never provide final legal, tax, or compliance advice.
- If the question asks for case-specific advice, missing details, or something not in the approved knowledge, reply:
  "Please contact Nash Tax & Bookkeeping directly for personalized assistance."

Approved website knowledge:
${websiteKnowledge}
    `.trim();

    const sanitizedHistory = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              typeof item.role === "string" &&
              typeof item.content === "string" &&
              item.content.trim()
          )
          .slice(-10)
      : [];

    const formattedConversation = sanitizedHistory
      .map((item) => {
        const speaker = item.role === "assistant" ? "Assistant" : "User";
        return `${speaker}: ${item.content.trim()}`;
      })
      .join("\n");

    const prompt = `
Conversation so far:
${formattedConversation || "No previous conversation."}

Latest user question:
${message.trim()}

Write a complete and helpful answer for the website visitor using only the approved website knowledge.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 300
      }
    });

    const reply =
      response.text?.trim() ||
      "Sorry, I couldn't generate a response right now.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Gemini chat API error:", error);

    return res.status(500).json({
      error:
        error.message || "Something went wrong while processing your request."
    });
  }
};