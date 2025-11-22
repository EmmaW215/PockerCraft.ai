export enum BlockType {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  BEDROCK = 6,
  ORE = 7,
}

export interface BiomeConfig {
  name: string;
  skyColor: string;
  blockColors: {
    [key in BlockType]?: string;
  };
  gravity: number;
  terrainRoughness: number; // 0.0 to 1.0
  treeDensity: number; // 0.0 to 1.0
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingRight: boolean;
  selectedBlock: BlockType;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean; // Jump
  down: boolean;
  actionA: boolean; // Mine/Place
  actionB: boolean; // Toggle Inventory / Special
}

export const DEFAULT_BIOME: BiomeConfig = {
  name: "Overworld",
  skyColor: "#87CEEB",
  blockColors: {
    [BlockType.DIRT]: "#8B4513",
    [BlockType.GRASS]: "#32CD32",
    [BlockType.STONE]: "#808080",
    [BlockType.WOOD]: "#A0522D",
    [BlockType.LEAVES]: "#228B22",
    [BlockType.BEDROCK]: "#2F2F2F",
    [BlockType.ORE]: "#FFD700",
  },
  gravity: 0.5,
  terrainRoughness: 0.5,
  treeDensity: 0.1,
};