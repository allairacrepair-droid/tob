import React from 'react';
import type { GameState } from '../types';
import { Room, RunMode } from '../types';

interface GameScreenProps {
  gameState: GameState;
  runMode: RunMode;
  isRunning: boolean;
}

const StatusBar: React.FC<{ value: number; maxValue: number; color: string; label: string; icon: string }> = ({ value, maxValue, color, label, icon }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-yellow-300">{label}</span>
        <span className="text-white">{icon} {value}/{maxValue}</span>
      </div>
      <div className="w-full bg-gray-700 border-2 border-gray-900 h-6">
        <div className={color} style={{ width: `${percentage}%`, height: '100%' }}></div>
      </div>
    </div>
  );
};


export const GameScreen: React.FC<GameScreenProps> = ({ gameState, runMode, isRunning }) => {
  const { playerStats, bossStats, currentRoom } = gameState;
  const isFighting = currentRoom !== Room.IDLE && currentRoom !== Room.COMPLETE;
  const showRuneLiteOverlay = runMode === RunMode.RUNELITE && !isRunning;

  return (
    <div className="bg-gray-800 border-4 border-gray-600 p-4 flex flex-col justify-between h-full">
      <div className="text-center">
        <h2 className="text-xl text-yellow-300 mb-2">
          {isFighting ? `Boss: ${bossStats.name}` : 'Awaiting Commands'}
        </h2>
        {isFighting && (
           <div className="w-full bg-gray-700 border-2 border-gray-900 h-8 mb-4">
             <div className="bg-red-500 h-full text-center flex items-center justify-center" style={{ width: `${(bossStats.health / bossStats.maxHealth) * 100}%` }}>
                <span className="text-xs font-bold text-shadow-lg">{Math.round((bossStats.health / bossStats.maxHealth) * 100)}%</span>
             </div>
           </div>
        )}
        <div className="w-full h-64 bg-black border-2 border-gray-900 flex items-center justify-center text-gray-500 relative">
           {showRuneLiteOverlay && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-center p-4 z-10">
                    <h3 className="text-lg text-purple-400 mb-2">RuneLite Mode Active</h3>
                    <p className="text-sm text-gray-300">Waiting for connection from the RuneLite plugin...</p>
                    <p className="text-xs text-gray-500 mt-4">The plugin will send game state updates here, and this app will return the bot's next action.</p>
                </div>
           )}
           {isFighting ? <img src={`https://picsum.photos/seed/${bossStats.name}/400/256`} alt="Boss visual" className="object-cover w-full h-full"/> : <span>BOT OFFLINE</span>}
        </div>
      </div>
      
      <div className="space-y-4">
        <StatusBar value={playerStats.health} maxValue={playerStats.maxHealth} color="bg-red-500" label="Hitpoints" icon="❤️" />
        <StatusBar value={playerStats.prayer} maxValue={playerStats.maxPrayer} color="bg-blue-500" label="Prayer" icon="🙏" />
      </div>
    </div>
  );
};