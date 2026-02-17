
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

// Using gemini-3-flash-preview to parse raw text into SOR database items
export async function parseRatesFromText(text: string): Promise<any[]> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract Schedule of Rates (SOR) items from the following text. 
      For each item, identify the name, unit of measurement, rate in ₹, scope of work description, and source reference.
      
      Text:
      ${text}`,
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
              source: { type: Type.STRING }
            },
            required: ["name", "unit", "rate", "scopeOfWork", "source"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Bulk rate parsing error:", error);
    return [];
  }
}

// Added parseBulkItems to extract structured tender items from raw text
export async function parseBulkItems(text: string): Promise<any[]> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract items from this tender/quotation text into a structured list.
      For each item, identify the name, quantity, requested scope of work, and estimated rate/price if mentioned.
      
      Text:
      ${text}`,
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
  } catch (error) {
    console.error("Bulk tender parsing error:", error);
    return [];
  }
}

// Added findBestMatchingItem to perform semantic matching between a tender item and database entries
export async function findBestMatchingItem(name: string, scope: string, dbItems: { id: string, name: string }[]): Promise<string | null> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Match this tender requirement to the most appropriate database item.
      Tender Item Name: ${name}
      Requested Scope: ${scope}
      
      Available Database Items:
      ${JSON.stringify(dbItems)}
      
      Analyze the technical similarity. Return the "id" of the best match. 
      If no match is found, return an empty string.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { 
              type: Type.STRING, 
              description: "The ID of the matching item or an empty string if no reasonable match is found." 
            }
          },
          required: ["id"]
        }
      }
    });
    const result = JSON.parse(response.text || '{}');
    return result.id || null;
  } catch (error) {
    console.error("Semantic matching error:", error);
    return null;
  }
}

export const geminiService = {
  analyzeSiteImage,
  parseRatesFromText,
  parseBulkItems,
  findBestMatchingItem
};
