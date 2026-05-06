import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { text } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    }

    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze the sentiment of the following text and provide a result exactly in this JSON format:
{
  "positive": number (0-100),
  "neutral": number (0-100),
  "negative": number (0-100),
  "insight": "Short summary in French of why it's positive/negative"
}
The three numbers must add up exactly to 100.
Text: "${text}"`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Nettoyage potentiel de la réponse si l'IA ajoute des backticks markdown
    const jsonString = responseText.replace(/```json|```/gi, '').trim();

    return new Response(jsonString, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
