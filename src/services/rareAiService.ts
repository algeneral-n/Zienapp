
import { GoogleGenAI } from "@google/genai";
import { contentService } from "./contentService";
import blueprint from "../constants/contentBlueprint.json";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const rareAiService = {
  async askRare(question: string, context: { module?: string; role?: string; language: string }) {
    // 1. Fetch Knowledge base
    let knowledge = "";
    try {
      const articles = await contentService.getArticles(context.module, context.language);
      const faqs = await contentService.getFAQs(context.module, context.language);
      
      knowledge = `
        Knowledge Base:
        ${articles.map(a => `Article: ${a.title_key}\nSummary: ${a.summary_key}`).join('\n')}
        ${faqs.map(f => `FAQ: ${f.question_key}\nAnswer: ${f.short_answer_key}`).join('\n')}
      `;
    } catch (err) {
      // Fallback to blueprint
      knowledge = `
        Knowledge Base (Blueprint):
        ${blueprint.faqs.filter(f => f.language === context.language).map(f => `FAQ: ${f.question_key}\nAnswer: ${f.short_answer_key}`).join('\n')}
      `;
    }

    const systemInstruction = `
      You are RARE AI, the intelligent enterprise shield for ZIEN platform.
      Current Context:
      - Language: ${context.language}
      - User Role: ${context.role || 'unknown'}
      - Active Module: ${context.module || 'general'}

      Rules:
      1. Use the provided Knowledge Base to answer.
      2. If the question is a Workflow, provide clear steps.
      3. If the question is about Permissions, explain the role requirements.
      4. Always respond in ${context.language}.
      5. If you don't know, suggest contacting support.
      
      ${knowledge}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text;
  }
};
