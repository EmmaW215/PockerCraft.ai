import { GoogleGenAI, Type } from "@google/genai";
import { BiomeConfig, DEFAULT_BIOME, BlockType } from "../types";

const apiKey = process.env.API_KEY || '';

// Fallback if no key is provided, though the app assumes a key is present in a real env
const mockAi = !apiKey;

export const generateBiome = async (prompt: string): Promise<BiomeConfig> => {
  if (mockAi) {
    console.warn("No API Key found. Returning default biome.");
    return { ...DEFAULT_BIOME, name: `Mock: ${prompt}` };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a unique 2D voxel game biome based on this theme: "${prompt}".
      Return colors in hex format.
      Gravity should be between 0.2 (low) and 0.8 (high).
      Roughness 0.0 (flat) to 1.0 (jagged).
      TreeDensity 0.0 (none) to 0.3 (dense).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            skyColor: { type: Type.STRING, description: "Hex color code for background" },
            blockColors: {
              type: Type.OBJECT,
              properties: {
                dirt: { type: Type.STRING },
                grass: { type: Type.STRING },
                stone: { type: Type.STRING },
                wood: { type: Type.STRING },
                leaves: { type: Type.STRING },
                ore: { type: Type.STRING },
              }
            },
            gravity: { type: Type.NUMBER },
            terrainRoughness: { type: Type.NUMBER },
            treeDensity: { type: Type.NUMBER },
          },
          required: ["name", "skyColor", "blockColors", "gravity", "terrainRoughness", "treeDensity"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");

    // Map JSON response keys to our Enum based object
    const config: BiomeConfig = {
      name: data.name || "Unknown Biome",
      skyColor: data.skyColor || DEFAULT_BIOME.skyColor,
      blockColors: {
        [BlockType.DIRT]: data.blockColors?.dirt || DEFAULT_BIOME.blockColors[BlockType.DIRT],
        [BlockType.GRASS]: data.blockColors?.grass || DEFAULT_BIOME.blockColors[BlockType.GRASS],
        [BlockType.STONE]: data.blockColors?.stone || DEFAULT_BIOME.blockColors[BlockType.STONE],
        [BlockType.WOOD]: data.blockColors?.wood || DEFAULT_BIOME.blockColors[BlockType.WOOD],
        [BlockType.LEAVES]: data.blockColors?.leaves || DEFAULT_BIOME.blockColors[BlockType.LEAVES],
        [BlockType.ORE]: data.blockColors?.ore || DEFAULT_BIOME.blockColors[BlockType.ORE],
        [BlockType.BEDROCK]: "#000000", // Constant
      },
      gravity: data.gravity ?? 0.5,
      terrainRoughness: data.terrainRoughness ?? 0.5,
      treeDensity: data.treeDensity ?? 0.1,
    };

    return config;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback on error
    return DEFAULT_BIOME;
  }
};