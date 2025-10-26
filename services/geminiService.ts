
import { GoogleGenAI, Type } from "@google/genai";
import type { TreeData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Converts a File object to a base64 string.
 */
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

/**
 * Identifies a tree from an image file using the Gemini API.
 */
export const identifyTree = async (imageFile: File): Promise<TreeData> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            imagePart,
            { text: "Identify the tree in this image." },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commonName: {
              type: Type.STRING,
              description: "The common name of the tree."
            },
            scientificName: {
              type: Type.STRING,
              description: "The scientific (Latin) name of the tree."
            },
            description: {
              type: Type.STRING,
              description: "A brief, interesting paragraph about the tree, including its characteristics and typical habitat."
            },
            careTips: {
              type: Type.ARRAY,
              description: "A short list of 3-4 essential care tips for this tree if it were in a garden.",
              items: {
                type: Type.STRING
              }
            }
          },
          required: ["commonName", "scientificName", "description"]
        }
      }
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);
    return data;
  } catch (error) {
    console.error("Error identifying tree:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to identify the tree. The model responded with an error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while identifying the tree. Please try again.");
  }
};
