import React from 'react';
import { PocketConsole } from './components/PocketConsole';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-950">
      <div className="absolute top-4 left-4 text-zinc-600 text-xs font-mono hidden md:block">
         <p>CONTROLS:</p>
         <p>Arrows: Move</p>
         <p>Z: Mine / Jump</p>
         <p>X: Place Block / Cycle</p>
      </div>
      <PocketConsole />
      <div className="mt-8 text-zinc-500 text-xs font-['Press_Start_2P'] opacity-50 text-center px-4">
         Powered by React & Gemini API
      </div>
    </div>
  );
};

export default App;