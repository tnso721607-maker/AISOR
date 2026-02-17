
import { GoogleGenAI, Type } from "@google/genai";
import { SORItem } from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-flash-preview for general site analysis with image input
export async function analyzeSiteImage(
  base64Image: string, 
  mimeType: string,
  workType: 'New Construction' | 'Maintenance' | 'Damage Repair',
  facilities: string[],
  facilityDimensions: Record<string, string>,
  relevantDbItems: SORItem[]
): Promise<any> {
  const ai = getClient();
  
  // Format the DB items into a simple string for the prompt
  const dbInventoryString = relevantDbItems.map(item => 
    `- [Category: ${item.source}] Item: "${item.name}", Unit: "${item.unit}", Benchmark Scope: "${item.scopeOfWork}"`
  ).join('\n');

  // Format dimensions per facility for the prompt
  const dimensionsContext = facilities.map(f => 
    `- Facility: ${f}, Dimensions/Quantity: ${facilityDimensions[f] || 'Not specified'}`
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
            text: `Act as a precision technical estimator for Petrol Pump facilities. 
            The user is conducting a "${workType}" for multiple facilities.
            
            FACILITY SPECIFIC CONTEXT & DIMENSIONS:
            ${dimensionsContext}
            
            DB INVENTORY (ONLY USE ITEMS FROM THIS LIST):
            ${dbInventoryString}
            
            STRICT WORKFLOW INSTRUCTIONS:
            1. Analyze the image for overall site conditions.
            2. For EACH selected facility listed above, perform a SEPARATE and SEQUENTIAL estimation logic:
               - Take Facility A: Evaluate image + specific dimensions -> Select exact DB items -> Calculate quantities.
               - Take Facility B: Evaluate image + specific dimensions -> Select exact DB items -> Calculate quantities.
               - Repeat for all.
            3. YOUR OUTPUT MUST BE GROUPED FACILITY-WISE. Do not mix items from different facilities in the same section.
            4. If an item is required for multiple facilities, list it under each facility section separately with its own calculated quantity.
            
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
            facilityEstimates: {
              type: Type.ARRAY,
              description: "Array of estimates grouped by facility name.",
              items: {
                type: Type.OBJECT,
                properties: {
                  facility: { type: Type.STRING, description: "Name of the facility from the selection." },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        item: { type: Type.STRING, description: "MUST be the exact name from the provided database items." },
                        unit: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        estimatedScope: { type: Type.STRING, description: "Technical justification for this specific quantity based on facility dimensions." }
                      },
                      required: ["item", "unit", "quantity", "estimatedScope"]
                    }
                  }
                },
                required: ["facility", "items"]
              }
            }
          },
          required: ["summary", "problems", "facilityEstimates"]
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
