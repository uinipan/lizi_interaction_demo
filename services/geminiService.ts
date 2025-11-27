import { GoogleGenAI, Type } from "@google/genai";

// We use the vision capabilities to detect the "Vibe" of the room/person
// to automatically suggest colors or shapes.
export const analyzeVibe = async (imageBase64: string): Promise<{ color: string; suggestedShape: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Remove header if present (data:image/jpeg;base64,)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        },
        {
          text: `Analyze the image. Determine a hexadecimal color code that matches the mood or dominant color. 
          Also suggest a 3D shape from this list: ['Sphere', 'Heart', 'Flower', 'Saturn', 'Spiral'].
          Return JSON.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            color: { type: Type.STRING, description: "Hex color code e.g. #FF0000" },
            suggestedShape: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { color: "#ffffff", suggestedShape: "Sphere" };
    
    const result = JSON.parse(text);
    return {
      color: result.color || "#ffffff",
      suggestedShape: result.suggestedShape || "Sphere"
    };

  } catch (error) {
    console.error("Gemini Vibe Check Failed:", error);
    return { color: "#ffffff", suggestedShape: "Sphere" };
  }
};