
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
            The user is conducting a "${workType}" audit for multiple facilities.
            
            FACILITY SPECIFIC CONTEXT & DIMENSIONS:
            ${dimensionsContext}
            
            DB INVENTORY (ONLY USE ITEMS FROM THIS LIST):
            ${dbInventoryString}
            
            STRICT SITE ANALYSIS & ESTIMATION WORKFLOW:
            1. **Visual State Assessment**: Identify the CURRENT condition of the site from the image.
               - Detect what is ALREADY INSTALLED or ERECTED.
               - If the work type is "New Construction" and you see a component already in place (e.g., Canopy Structural Steel is clearly visible and erected), **DO NOT** include it in the BOM.
               - Focus on "Missing Components" required to complete the facility (e.g., if steel is there, maybe roofing sheets, ceiling, or lighting are still needed).
            
            2. **Task Context**:
               - **New Construction**: Only estimate items that are NOT visible or are clearly incomplete in the photo.
               - **Maintenance**: Identify existing items that look worn, rusted, or dirty and require the specific maintenance SOR items.
               - **Damage Repair**: Specifically look for structural damage, cracks, or broken elements and match them to repair SOR items.
            
            3. **Sequential Estimation**: For EACH selected facility:
               - Take Facility X -> Cross-reference image vs. provided dimensions -> Perform "Gap Analysis" (Missing vs. Present) -> Select appropriate DB items.
            
            4. **Output Structure**: Group items FACILITY-WISE. Be technically descriptive in the 'estimatedScope' about why an item was included (e.g., "Structural steel excluded as existing frame is erected; roofing sheets required for completion").
            
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
                        estimatedScope: { type: Type.STRING, description: "Technical justification based on site photo vs facility dimensions." }
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
