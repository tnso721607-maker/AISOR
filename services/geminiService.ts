
import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-flash-preview for general site analysis with image input
export async function analyzeSiteImage(base64Image: string, mimeType: string): Promise<any> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: `Act as an expert petrol pump facility inspector and site engineer. Analyze this site image.
            1. Identify specific problems/defects in:
               - Civil works (pavement cracks, canopy damage, paint, drainage)
               - Electrical works (lighting, exposed wiring, DU display, earthing)
               - Mechanical works (DU nozzles, hoses, air towers, STP issues)
               - Safety (fire extinguishers, signage, hazards)
            2. Generate a structured Bill of Materials (BOM) for the necessary repair/maintenance work.
            
            Return the analysis in a strict JSON format.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            problems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ['Civil', 'Electrical', 'Mechanical', 'Safety', 'General'] },
                  description: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] }
                },
                required: ["category", "description", "severity"]
              }
            },
            bom: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  estimatedScope: { type: Type.STRING }
                },
                required: ["item", "unit", "quantity", "estimatedScope"]
              }
            }
          },
          required: ["summary", "problems", "bom"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Vision analysis error:", error);
    throw error;
  }
}

// Using gemini-3-pro-preview for complex matching tasks
export async function findBestMatchingItem(targetItemName: string, targetScope: string, dbItems: { id: string; name: string }[]): Promise<string | null> {
  if (dbItems.length === 0) return null;
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `I have a tender item: "${targetItemName}" with scope: "${targetScope}".
      From the database list below, find the ID of the best matching item.
      Return "none" if no reasonable match is found.
      
      Database Items:
      ${dbItems.map(item => `- ${item.name} (ID: ${item.id})`).join('\n')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { matchedId: { type: Type.STRING } },
          required: ["matchedId"]
        },
      },
    });
    const result = JSON.parse(response.text || '{}');
    return result.matchedId && result.matchedId !== "none" ? result.matchedId : null;
  } catch (error) {
    console.error("Match error:", error);
    return null;
  }
}

export async function parseBulkItems(text: string): Promise<any[]> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract a list of tender items from this text: "${text}". 
      Include name, quantity, requestedScope, and any provided estimatedRate.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              requestedScope: { type: Type.STRING },
              estimatedRate: { type: Type.NUMBER }
            },
            required: ["name", "quantity", "requestedScope"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Parse bulk items error:", e);
    return [];
  }
}

export async function parseRatesFromText(text: string): Promise<any[]> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract Schedule of Rates (SOR) items (name, unit, rate, scopeOfWork, source) from this text: "${text}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              unit: { type: Type.STRING },
              rate: { type: Type.NUMBER },
              scopeOfWork: { type: Type.STRING },
              source: { type: Type.STRING },
            },
            required: ["name", "unit", "rate", "scopeOfWork", "source"]
          },
        },
      },
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Parse rates error:", error);
    return [];
  }
}

export const geminiService = {
  analyzeSiteImage,
  findBestMatchingItem,
  parseBulkItems,
  parseRatesFromText
};
