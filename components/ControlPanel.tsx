import React from 'react';
import { GameState, Room, RunMode } from '../types';

interface ControlPanelProps {
  isRunning: boolean;
  isLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  gameState: GameState;
  runMode: RunMode;
  onModeChange: (mode: RunMode) => void;
}

const OSRSButton: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; className?: string }> = ({ onClick, disabled, children, className }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full border-2 border-gray-900 bg-gray-700 text-yellow-300 py-2 px-4 text-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors ${className}`}
        >
            {children}
        </button>
    );
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ isRunning, isLoading, onStart, onStop, gameState, runMode, onModeChange }) => {
  let statusText = 'IDLE';
  let statusColor = 'text-gray-400';

  if (isLoading) {
    statusText = 'THINKING...';
    statusColor = 'text-purple-400 animate-pulse';
  } else if (isRunning) {
    statusText = 'ACTIVE';
    statusColor = 'text-green-400';
  } else if (gameState.currentRoom === Room.COMPLETE) {
    statusText = 'COMPLETED';
    statusColor = 'text-yellow-300';
  }

  return (
    <div className="bg-gray-800 border-4 border-gray-600 p-4 flex flex-col justify-between h-full">
        <div>
            <h2 className="text-xl text-yellow-300 text-center mb-4">TOB BOT v1.0</h2>
            <div className="text-center bg-black border-2 border-gray-900 p-2 mb-4">
                <span className="text-gray-400">STATUS: </span>
                <span className={statusColor}>{statusText}</span>
            </div>
             <div className="text-center bg-black border-2 border-gray-900 p-2 mb-4">
                <span className="text-gray-400">ROOM: </span>
                <span className="text-white">{gameState.currentRoom}</span>
            </div>
             <div className="text-center bg-black border-2 border-gray-900 p-2">
                <span className="text-gray-400">MODE: </span>
                <span className="text-white">{runMode}</span>
            </div>
        </div>
        <div className="space-y-2">
            <h3 className="text-center text-xs text-gray-400">SELECT MODE</h3>
            <div className="flex gap-2">
                <OSRSButton onClick={() => onModeChange(RunMode.SIMULATION)} disabled={isRunning || runMode === RunMode.SIMULATION} className={runMode === RunMode.SIMULATION ? '!bg-gray-600' : ''}>
                    Simulation
                </OSRSButton>
                <OSRSButton onClick={() => onModeChange(RunMode.RUNELITE)} disabled={isRunning || runMode === RunMode.RUNELITE} className={runMode === RunMode.RUNELITE ? '!bg-gray-600' : ''}>
                    RuneLite
                </OSRSButton>
            </div>
        </div>
      <div className="space-y-4">
        <OSRSButton onClick={onStart} disabled={isRunning || gameState.currentRoom === Room.COMPLETE || runMode === RunMode.RUNELITE}>
          {gameState.currentRoom === Room.IDLE ? 'START BOT' : 'RESUME BOT'}
        </OSRSButton>
        <OSRSButton onClick={onStop} disabled={!isRunning}>
          STOP BOT
        </OSRSButton>
      </div>
    </div>
  );
};