import { GoogleGenAI, Type } from "@google/genai";
import { AIReport, UserRole, RAREMode, RAREContext } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type RAREAgentType = 'accounting' | 'hr' | 'sales' | 'fleet' | 'meetings' | 'gm' | 'secretary' | 'founder';

interface RAREAgentConfig {
  name: string;
  systemInstruction: string;
}

const AGENT_CONFIGS: Record<RAREAgentType, RAREAgentConfig> = {
  accounting: {
    name: "RARE Accounting",
    systemInstruction: "You are RARE Accounting, a specialized AI for financial management. You help with invoices, payments, taxes, and financial reports. You are tenant-isolated and only have access to the current company's data. Provide professional, accurate financial advice and summaries."
  },
  hr: {
    name: "RARE HR",
    systemInstruction: "You are RARE HR, a specialized AI for human resources. You help with employee files, attendance, salaries, and leave requests. You are tenant-isolated. Ensure privacy and compliance with labor laws."
  },
  sales: {
    name: "RARE Sales",
    systemInstruction: "You are RARE Sales, a specialized AI for CRM and marketing. You help with quotes, contracts, and client interactions. You are tenant-isolated. Focus on growth and client satisfaction."
  },
  fleet: {
    name: "RARE Fleet",
    systemInstruction: "You are RARE Fleet, a specialized AI for logistics and vehicle management. You help with tasks, maps, and vehicle tracking. You are tenant-isolated."
  },
  meetings: {
    name: "RARE Meetings",
    systemInstruction: "You are RARE Meetings, a specialized AI for meeting summarization and coordination. You help summarize discussions and track action items. You are tenant-isolated."
  },
  gm: {
    name: "RARE GM",
    systemInstruction: "You are RARE GM, the executive AI assistant for the General Manager. You provide high-level analytics, strategic recommendations, and business oversight. You are tenant-isolated."
  },
  secretary: {
    name: "RARE Secretary",
    systemInstruction: "You are RARE Secretary, the administrative AI assistant. You help with scheduling, document management, and administrative tasks. You are tenant-isolated."
  },
  founder: {
    name: "RARE Founder",
    systemInstruction: "You are RARE Founder, the platform-level AI assistant for the ZIEN platform owner. You help manage tenants, analyze platform growth, suggest marketing campaigns, and monitor system health. You have access to platform-wide metadata but respect tenant privacy."
  }
};

const MODE_INSTRUCTIONS: Record<RAREMode, string> = {
  help: "Focus on explaining the current page, providing how-to steps, and guiding the user through the interface.",
  analyze: "Focus on analyzing the data visible on the current page. Provide insights, identify trends, and suggest improvements or alerts.",
  act: "Focus on taking action. Suggest creating drafts (invoices, tasks, contracts) or preparing specific system actions. Always ask for confirmation before final execution.",
  report: "Focus on generating structured reports (daily, weekly, monthly) or executive summaries based on the current context."
};

export interface RAREOptions {
  useSearch?: boolean;
  useMaps?: boolean;
  fastMode?: boolean;
  latLng?: { latitude: number, longitude: number };
}

export async function generateRAREAnalysis(
  agentType: RAREAgentType,
  query: string,
  context: RAREContext & { mode: RAREMode, additionalData?: any, files?: { data: string, mimeType: string }[] },
  options: RAREOptions = {}
): Promise<string> {
  const config = AGENT_CONFIGS[agentType];
  const modeInstruction = MODE_INSTRUCTIONS[context.mode];
  
  const systemInstruction = `
    ${config.systemInstruction}
    Current Mode: ${context.mode.toUpperCase()} - ${modeInstruction}
    
    Context Pack:
    - Company: ${context.companyName}
    - User Role: ${context.userRole}
    - Page: ${context.pageCode}
    - Module: ${context.moduleCode || 'N/A'}
    - Language: ${context.language}
    - Theme: ${context.theme}
    - Selected Entity ID: ${context.selectedEntityId || 'None'}
    - Additional Data: ${JSON.stringify(context.additionalData || {})}
    
    Rules:
    - Never leak data from other companies.
    - Be concise and professional.
    - Use Markdown for formatting.
    - If the user role doesn't have permission for the data requested, politely decline.
    - For 'ACT' mode, provide a structured draft if applicable.
    - If asked to translate, provide natural, culturally appropriate translations rather than literal word-for-word translations.
  `;

  const parts: any[] = [{ text: query }];
  let hasImages = false;
  
  if (context.files && context.files.length > 0) {
    context.files.forEach(file => {
      if (file.mimeType.startsWith('image/')) {
        hasImages = true;
      }
      parts.push({
        inlineData: {
          data: file.data,
          mimeType: file.mimeType
        }
      });
    });
  }

  let model = "gemini-3-flash-preview";
  let tools: any[] = [];
  let toolConfig: any = undefined;

  if (hasImages) {
    model = "gemini-3.1-pro-preview";
  } else if (options.fastMode) {
    model = "gemini-2.5-flash-lite-latest";
  } else if (options.useMaps) {
    model = "gemini-2.5-flash";
    tools = [{ googleMaps: {} }];
    if (options.latLng) {
      toolConfig = {
        retrievalConfig: {
          latLng: options.latLng
        }
      };
    }
  } else if (options.useSearch) {
    model = "gemini-3-flash-preview";
    tools = [{ googleSearch: {} }];
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.7,
        ...(tools.length > 0 && { tools }),
        ...(toolConfig && { toolConfig })
      },
    });

    let resultText = response.text || "I'm sorry, I couldn't generate a response at this time.";
    
    // Append Maps links if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && options.useMaps) {
      const links = chunks
        .filter((c: any) => c.maps?.uri)
        .map((c: any) => `- [${c.maps.title || 'View on Maps'}](${c.maps.uri})`)
        .join('\n');
      if (links) {
        resultText += `\n\n**Locations:**\n${links}`;
      }
    }

    return resultText;
  } catch (error) {
    console.error(`Error in RARE ${agentType} analysis:`, error);
    return "An error occurred while communicating with the AI agent.";
  }
}

export async function transcribeAudio(audioData: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: audioData,
              mimeType: mimeType
            }
          },
          { text: "Please transcribe this audio accurately." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return "Error transcribing audio.";
  }
}

export async function generateBusinessReport(
  companyName: string,
  data: any
): Promise<string> {
  const prompt = `Generate a comprehensive business report for ${companyName} based on the following data: ${JSON.stringify(data)}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior business analyst. Create professional, data-driven reports with clear sections and actionable insights.",
      },
    });

    return response.text || "Failed to generate report.";
  } catch (error) {
    console.error("Error generating business report:", error);
    return "Error generating report.";
  }
}
