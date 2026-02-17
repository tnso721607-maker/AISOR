
import { GoogleGenAI, Type } from "@google/genai";
import { SORItem } from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-flash-preview for general site analysis with image input
export async function analyzeSiteImage(
  base64Image: string, 
  mimeType: string,
  workType: 'New Construction' | 'Maintenance' | 'Damage Repair',
  facilities: string[],
  dimensions: string,
  relevantDbItems: SORItem[]
): Promise<any> {
  const ai = getClient();
  
  // Format the DB items into a simple string for the prompt
  const dbInventoryString = relevantDbItems.map(item => 
    `- [Category: ${item.source}] Item: "${item.name}", Unit: "${item.unit}", Benchmark Scope: "${item.scopeOfWork}"`
  ).join('\n');

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
            text: `Act as an expert technical estimator for Petrol Pump facilities. 
            The user is conducting a "${workType}" for multiple combined facilities: ${facilities.join(', ')}.
            The specified area/dimensions for this overall work are: "${dimensions}".
            
            YOU MUST USE ONLY the following items from the provided Database inventory to generate the estimate:
            ${dbInventoryString}
            
            INSTRUCTIONS:
            1. Analyze the image to identify site conditions across all selected facilities.
            2. Match requirements for all selected facilities: ${facilities.join(', ')}.
            3. Calculate quantities based on the dimensions: "${dimensions}".
            4. Ensure the BOM covers items from all selected categories where appropriate based on the image and work type.
            
            Return the analysis in a strict JSON format matching the schema.`
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
                  item: { type: Type.STRING, description: "MUST be the exact name from the provided database items." },
                  unit: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  estimatedScope: { type: Type.STRING, description: "Contextual explanation for why this item/quantity is needed." }
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

// Rest of the service remains unchanged...
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
              description: "The ID of the matching item or an empty string if no reasonable match if found." 
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
