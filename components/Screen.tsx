import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BiomeConfig, BlockType, InputState, PlayerState } from '../types';

interface ScreenProps {
  inputState: React.MutableRefObject<InputState>;
  biome: BiomeConfig;
  onLog: (msg: string) => void;
}

// Game Constants
const TILE_SIZE = 16;
const CHUNK_WIDTH = 64;
const CHUNK_HEIGHT = 48;
const RENDER_SCALE = 2;

export const Screen: React.FC<ScreenProps> = ({ inputState, biome, onLog }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game State refs (mutable to avoid re-renders during game loop)
  const playerRef = useRef<PlayerState>({
    x: 100,
    y: 0,
    vx: 0,
    vy: 0,
    facingRight: true,
    selectedBlock: BlockType.DIRT,
  });
  
  const worldRef = useRef<number[][]>([]);
  const inventoryRef = useRef<BlockType[]>([
    BlockType.DIRT, BlockType.STONE, BlockType.WOOD, BlockType.GRASS
  ]);
  const lastActionTime = useRef<number>(0);

  // Initialize World
  const generateWorld = useCallback(() => {
    const newWorld: number[][] = [];
    const { terrainRoughness, treeDensity } = biome;
    
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      newWorld[y] = [];
      for (let x = 0; x < CHUNK_WIDTH; x++) {
        newWorld[y][x] = BlockType.AIR;
      }
    }

    // Simple 1D Noise generation for terrain height
    let height = Math.floor(CHUNK_HEIGHT / 2);
    
    for (let x = 0; x < CHUNK_WIDTH; x++) {
      // Random walk based on roughness
      if (Math.random() < terrainRoughness) {
        height += Math.random() > 0.5 ? 1 : -1;
      }
      // Clamp height
      height = Math.max(10, Math.min(CHUNK_HEIGHT - 5, height));

      // Fill blocks
      for (let y = height; y < CHUNK_HEIGHT; y++) {
        if (y === CHUNK_HEIGHT - 1) {
            newWorld[y][x] = BlockType.BEDROCK;
        } else if (y === height) {
            newWorld[y][x] = BlockType.GRASS;
        } else if (y > height + 5) {
            newWorld[y][x] = Math.random() > 0.9 ? BlockType.ORE : BlockType.STONE;
        } else {
            newWorld[y][x] = BlockType.DIRT;
        }
      }

      // Trees
      if (x > 5 && x < CHUNK_WIDTH - 5 && newWorld[height][x] === BlockType.GRASS) {
        if (Math.random() < treeDensity) {
          // Grow tree
          const treeHeight = 3 + Math.floor(Math.random() * 3);
          for (let i = 1; i <= treeHeight; i++) {
             if (height - i >= 0) newWorld[height - i][x] = BlockType.WOOD;
          }
          // Leaves
          for (let lx = x - 1; lx <= x + 1; lx++) {
            for (let ly = height - treeHeight - 1; ly <= height - treeHeight; ly++) {
                if (lx >=0 && lx < CHUNK_WIDTH && ly >= 0) {
                   if (newWorld[ly][lx] === BlockType.AIR) newWorld[ly][lx] = BlockType.LEAVES;
                }
            }
          }
        }
      }
    }
    worldRef.current = newWorld;
    
    // Reset player
    playerRef.current.x = CHUNK_WIDTH * TILE_SIZE * 0.5;
    playerRef.current.y = 0; // Will fall to ground
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
  }, [biome]);

  // Re-generate world when biome changes
  useEffect(() => {
    generateWorld();
    onLog(`Entering ${biome.name}...`);
  }, [biome, generateWorld, onLog]);

  // The Game Loop
  const update = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const player = playerRef.current;
    const world = worldRef.current;
    const inputs = inputState.current;

    // --- Physics ---
    // Horizontal
    if (inputs.left) {
      player.vx = -2;
      player.facingRight = false;
    } else if (inputs.right) {
      player.vx = 2;
      player.facingRight = true;
    } else {
      player.vx *= 0.8; // Friction
    }

    // Apply Gravity
    player.vy += biome.gravity; 
    player.vy = Math.min(player.vy, 8); // Terminal velocity

    // Jump
    if (inputs.up && player.vy === 0) { // Simple ground check check
       // We need a better ground check, but for now checking if vy was reset by collision last frame roughly works
       // Actually, let's do proper collision first, then jump allowed if on ground.
    }
    
    // Calculate potential new position
    let newX = player.x + player.vx;
    let newY = player.y + player.vy;
    let onGround = false;

    // --- Collision Detection (AABB) ---
    // Player size is roughly TILE_SIZE x (TILE_SIZE * 1.8)
    const pW = TILE_SIZE * 0.6;
    const pH = TILE_SIZE * 1.6;
    
    const checkCollision = (checkX: number, checkY: number) => {
        // Get grid coords of corners
        const left = Math.floor((checkX - pW/2) / TILE_SIZE);
        const right = Math.floor((checkX + pW/2 - 0.1) / TILE_SIZE);
        const top = Math.floor((checkY - pH) / TILE_SIZE);
        const bottom = Math.floor((checkY - 0.1) / TILE_SIZE);

        // Check world bounds
        if (left < 0 || right >= CHUNK_WIDTH || bottom >= CHUNK_HEIGHT) return true;
        if (top < 0) return false; // Allow jumping above world

        // Check tiles
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                if (world[y] && world[y][x] !== BlockType.AIR) return true;
            }
        }
        return false;
    };

    // Y Collision
    if (checkCollision(player.x, newY)) {
        if (player.vy > 0) {
             // Hit ground
             onGround = true;
             // Snap to block top
             newY = Math.floor(newY / TILE_SIZE) * TILE_SIZE; 
        } else {
             // Hit head
             newY = Math.ceil(newY / TILE_SIZE) * TILE_SIZE + 0.1;
        }
        player.vy = 0;
    }
    player.y = newY;

    // X Collision
    if (checkCollision(newX, player.y)) {
        newX = player.x; // Stop
        player.vx = 0;
    }
    player.x = newX;

    // Handle Jump Input (must be on ground)
    if (inputs.up && onGround) {
        player.vy = -6; // Jump force
    }

    // --- Actions (Mine/Place) ---
    const now = Date.now();
    if ((inputs.actionA || inputs.actionB) && now - lastActionTime.current > 200) {
        // Target block: 1 tile in front, same height as center body
        const reach = TILE_SIZE * 1.5;
        const targetX = player.x + (player.facingRight ? reach : -reach);
        const targetY = player.y - pH * 0.5;

        const gx = Math.floor(targetX / TILE_SIZE);
        const gy = Math.floor(targetY / TILE_SIZE);

        if (gx >= 0 && gx < CHUNK_WIDTH && gy >= 0 && gy < CHUNK_HEIGHT) {
            if (inputs.actionA) {
                // Mine (A button)
                if (world[gy][gx] !== BlockType.BEDROCK) {
                    world[gy][gx] = BlockType.AIR;
                    lastActionTime.current = now;
                }
            } else if (inputs.actionB) {
                // Place (B button) - if air
                if (world[gy][gx] === BlockType.AIR) {
                    // Simple cycle of inventory for demo: Dirt -> Stone -> Wood
                    const blockToPlace = player.selectedBlock;
                    // Check if player is inside?
                    if (!checkCollision(targetX, targetY)) { // Wait this checks point, not box. 
                       // Simplified: just place it.
                       world[gy][gx] = blockToPlace;
                       lastActionTime.current = now;
                    }
                } else {
                    // If holding B on a block, maybe change selected block?
                    // Let's cycle selected block for Action B if target is NOT air?
                    // Or just a dedicated cycle logic. Let's make Action B strictly placement for now, 
                    // maybe cycle automatically or use a UI button for simplicity in this limited UI.
                    // Hack: Cycle block if clicking B on a solid block
                     const types = [BlockType.DIRT, BlockType.STONE, BlockType.WOOD, BlockType.GRASS, BlockType.LEAVES];
                     const idx = types.indexOf(player.selectedBlock);
                     player.selectedBlock = types[(idx + 1) % types.length];
                     onLog(`Equipped: ${BlockType[player.selectedBlock]}`);
                     lastActionTime.current = now;
                }
            }
        }
    }

    // --- Rendering ---
    // Clear
    ctx.fillStyle = biome.skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);

    // Camera follow player
    const camX = Math.floor(player.x - (canvas.width / RENDER_SCALE) / 2);
    const camY = Math.floor(player.y - (canvas.height / RENDER_SCALE) / 2);
    // Clamp camera
    const maxCamX = CHUNK_WIDTH * TILE_SIZE - (canvas.width / RENDER_SCALE);
    const maxCamY = CHUNK_HEIGHT * TILE_SIZE - (canvas.height / RENDER_SCALE);
    const clampedCamX = Math.max(0, Math.min(camX, maxCamX));
    const clampedCamY = Math.max(0, Math.min(camY, maxCamY));

    ctx.translate(-clampedCamX, -clampedCamY);

    // Draw World
    const startCol = Math.floor(clampedCamX / TILE_SIZE);
    const endCol = startCol + Math.ceil(canvas.width / RENDER_SCALE / TILE_SIZE) + 1;
    const startRow = Math.floor(clampedCamY / TILE_SIZE);
    const endRow = startRow + Math.ceil(canvas.height / RENDER_SCALE / TILE_SIZE) + 1;

    for (let y = startRow; y < endRow; y++) {
        if (!world[y]) continue;
        for (let x = startCol; x < endCol; x++) {
            const block = world[y][x];
            if (block !== BlockType.AIR) {
                ctx.fillStyle = biome.blockColors[block as BlockType] || '#FF00FF';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Simple shading/border
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE - 2, TILE_SIZE, 2);
                ctx.fillRect(x * TILE_SIZE + TILE_SIZE - 2, y * TILE_SIZE, 2, TILE_SIZE);
            }
        }
    }

    // Draw Player
    ctx.fillStyle = '#FF0000'; // Shirt
    ctx.fillRect(player.x - pW/2, player.y - pH, pW, pH);
    // Head
    ctx.fillStyle = '#FFCCAA'; // Skin
    ctx.fillRect(player.x - pW/2, player.y - pH, pW, pH * 0.4);
    
    // Draw Selection Cursor
    const reach = TILE_SIZE * 1.5;
    const targetX = player.x + (player.facingRight ? reach : -reach);
    const targetY = player.y - pH * 0.5;
    const cursorX = Math.floor(targetX / TILE_SIZE) * TILE_SIZE;
    const cursorY = Math.floor(targetY / TILE_SIZE) * TILE_SIZE;
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(cursorX, cursorY, TILE_SIZE, TILE_SIZE);

    ctx.restore();
    
    requestRef.current = requestAnimationFrame(() => update(time));
  }, [biome, inputState, onLog]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame((t) => update(t));
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update]);

  return (
    <canvas 
        ref={canvasRef} 
        width={320} 
        height={240} 
        className="w-full h-full bg-black"
    />
  );
};