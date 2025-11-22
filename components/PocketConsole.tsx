import React, { useState, useRef, useEffect } from 'react';
import { Screen } from './Screen';
import { InputState, BiomeConfig, DEFAULT_BIOME } from '../types';
import { generateBiome } from '../services/geminiService';
import { Loader2, Sparkles } from 'lucide-react';

export const PocketConsole: React.FC = () => {
  const inputState = useRef<InputState>({
    left: false, right: false, up: false, down: false, actionA: false, actionB: false
  });

  const [currentBiome, setCurrentBiome] = useState<BiomeConfig>(DEFAULT_BIOME);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [logMsg, setLogMsg] = useState("Ready.");

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowLeft': inputState.current.left = true; break;
        case 'ArrowRight': inputState.current.right = true; break;
        case 'ArrowUp': inputState.current.up = true; break;
        case 'ArrowDown': inputState.current.down = true; break;
        case 'z': case 'Z': inputState.current.actionA = true; break; // A
        case 'x': case 'X': inputState.current.actionB = true; break; // B
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        switch(e.key) {
          case 'ArrowLeft': inputState.current.left = false; break;
          case 'ArrowRight': inputState.current.right = false; break;
          case 'ArrowUp': inputState.current.up = false; break;
          case 'ArrowDown': inputState.current.down = false; break;
          case 'z': case 'Z': inputState.current.actionA = false; break;
          case 'x': case 'X': inputState.current.actionB = false; break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleAIRequest = async () => {
    if (!promptText.trim()) return;
    setShowPromptModal(false);
    setIsGenerating(true);
    setLogMsg("Contacting Gemini...");
    
    const newBiome = await generateBiome(promptText);
    setCurrentBiome(newBiome);
    setLogMsg(`Generated: ${newBiome.name}`);
    setIsGenerating(false);
    setPromptText("");
  };

  // Helper for touch buttons
  const bindTouch = (key: keyof InputState) => ({
    onMouseDown: () => { inputState.current[key] = true; },
    onMouseUp: () => { inputState.current[key] = false; },
    onMouseLeave: () => { inputState.current[key] = false; },
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); inputState.current[key] = true; },
    onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); inputState.current[key] = false; }
  });

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      
      {/* CASE BODY */}
      <div className="bg-indigo-600 p-6 rounded-b-3xl rounded-t-xl shadow-2xl border-b-8 border-indigo-800 w-[350px] sm:w-[400px] select-none relative">
        
        {/* SCREEN BEZEL */}
        <div className="bg-zinc-800 p-8 rounded-t-lg rounded-bl-[3rem] rounded-br-lg mb-8 shadow-inner relative">
           <div className="flex justify-between items-center mb-1 px-2">
                <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[10px] text-zinc-400 font-['Press_Start_2P'] uppercase">Battery</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-['Press_Start_2P']">GEMINI-BOY</span>
           </div>
           
           {/* SCREEN DISPLAY */}
           <div className="w-full aspect-[4/3] bg-[#9bbc0f] border-4 border-black shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-hidden relative rounded-sm">
              {isGenerating ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black text-green-400 font-mono p-4 text-center">
                   <Loader2 className="animate-spin mb-4 h-8 w-8" />
                   <p className="text-xs font-['Press_Start_2P']">CONSTRUCTING WORLD...</p>
                </div>
              ) : (
                <Screen inputState={inputState} biome={currentBiome} onLog={setLogMsg} />
              )}

              {/* UI Overlay inside screen */}
              <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-[10px] font-['VT323'] p-1 px-2 flex justify-between">
                 <span>{logMsg}</span>
              </div>
           </div>
        </div>

        {/* CONTROLS AREA */}
        <div className="grid grid-cols-3 gap-4 mb-8">
            {/* D-PAD */}
            <div className="col-span-1 flex items-center justify-center">
               <div className="relative w-24 h-24">
                  <div className="absolute top-0 left-8 w-8 h-24 bg-zinc-900 rounded-md shadow-md"></div>
                  <div className="absolute top-8 left-0 w-24 h-8 bg-zinc-900 rounded-md shadow-md"></div>
                  
                  {/* Touch Zones */}
                  <button {...bindTouch('up')} className="absolute top-0 left-8 w-8 h-8 hover:bg-zinc-700 active:bg-zinc-600 rounded-t-md transition-colors" aria-label="Up"></button>
                  <button {...bindTouch('down')} className="absolute bottom-0 left-8 w-8 h-8 hover:bg-zinc-700 active:bg-zinc-600 rounded-b-md transition-colors" aria-label="Down"></button>
                  <button {...bindTouch('left')} className="absolute top-8 left-0 w-8 h-8 hover:bg-zinc-700 active:bg-zinc-600 rounded-l-md transition-colors" aria-label="Left"></button>
                  <button {...bindTouch('right')} className="absolute top-8 right-0 w-8 h-8 hover:bg-zinc-700 active:bg-zinc-600 rounded-r-md transition-colors" aria-label="Right"></button>
                  <div className="absolute top-8 left-8 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center pointer-events-none">
                     <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900"></div>
                  </div>
               </div>
            </div>

            {/* START/SELECT/GENERATE */}
            <div className="col-span-1 flex flex-col justify-end items-center gap-3 pb-2">
               <div className="flex gap-4 transform rotate-[-15deg] mt-8">
                  <div className="flex flex-col items-center">
                     <button 
                        onClick={() => setShowPromptModal(true)}
                        className="w-12 h-3 bg-zinc-900 rounded-full border-b-2 border-zinc-950 active:border-b-0 active:translate-y-[2px] mb-1 transition-all hover:bg-zinc-800"
                     ></button>
                     <span className="text-[8px] font-bold text-indigo-900 tracking-widest uppercase">AI Gen</span>
                  </div>
                  <div className="flex flex-col items-center">
                     <button 
                       onClick={() => setCurrentBiome(DEFAULT_BIOME)}
                       className="w-12 h-3 bg-zinc-900 rounded-full border-b-2 border-zinc-950 active:border-b-0 active:translate-y-[2px] mb-1 transition-all hover:bg-zinc-800"
                     ></button>
                     <span className="text-[8px] font-bold text-indigo-900 tracking-widest uppercase">Reset</span>
                  </div>
               </div>
            </div>

            {/* A/B BUTTONS */}
            <div className="col-span-1 flex items-center justify-center relative">
                <div className="transform rotate-[-15deg] flex gap-4 mt-4">
                    <div className="flex flex-col items-center mt-4">
                         <button {...bindTouch('actionB')} className="w-10 h-10 rounded-full bg-red-700 shadow-[0_3px_0_rgb(120,0,0)] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center group">
                            <span className="text-red-900 font-bold text-xs group-active:text-red-950">B</span>
                         </button>
                         <span className="text-[10px] font-bold text-indigo-900 mt-1">Place</span>
                    </div>
                    <div className="flex flex-col items-center -mt-2">
                         <button {...bindTouch('actionA')} className="w-10 h-10 rounded-full bg-red-700 shadow-[0_3px_0_rgb(120,0,0)] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center group">
                             <span className="text-red-900 font-bold text-xs group-active:text-red-950">A</span>
                         </button>
                         <span className="text-[10px] font-bold text-indigo-900 mt-1">Mine/Jump</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Speaker Grille */}
        <div className="absolute bottom-6 right-8 flex gap-1 transform rotate-[-15deg]">
            <div className="w-1 h-8 bg-indigo-800 rounded-full opacity-50"></div>
            <div className="w-1 h-8 bg-indigo-800 rounded-full opacity-50"></div>
            <div className="w-1 h-8 bg-indigo-800 rounded-full opacity-50"></div>
            <div className="w-1 h-8 bg-indigo-800 rounded-full opacity-50"></div>
        </div>

      </div>

      {/* PROMPT MODAL */}
      {showPromptModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border-2 border-indigo-500 p-6 rounded-lg max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <Sparkles size={20} />
              <h3 className="font-['Press_Start_2P'] text-sm uppercase">Generate World</h3>
            </div>
            <p className="text-zinc-400 text-xs mb-4 font-['VT323'] text-lg">
                Describe a theme (e.g., "Mars Colony", "Candy Kingdom", "Radioactive Wasteland"). 
                Gemini will configure the physics and colors.
            </p>
            <input
              autoFocus
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter theme..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded font-['VT323'] text-xl focus:outline-none focus:border-indigo-500 mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleAIRequest()}
            />
            <div className="flex justify-end gap-2 font-['Press_Start_2P'] text-[10px]">
              <button 
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 rounded"
              >
                CANCEL
              </button>
              <button 
                onClick={handleAIRequest}
                disabled={!promptText}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded disabled:opacity-50"
              >
                GENERATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};