import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { GameState, LogEntry } from './types';
import { LogSource, Room, GearSet, RunMode } from './types';
import { INITIAL_GAME_STATE, ROOM_SEQUENCE, BOSS_MAX_HEALTH, INITIAL_PLAYER_STATS } from './constants';
import { getBotNextAction } from './services/geminiService';
import { GameScreen } from './components/GameScreen';
import { LogDisplay } from './components/LogDisplay';
import { ControlPanel } from './components/ControlPanel';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [runMode, setRunMode] = useState<RunMode>(RunMode.SIMULATION);

  const simulationTimeoutRef = useRef<number | null>(null);

  const addLog = (message: string, source: LogSource) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, source }]);
  };

  const handleStop = useCallback(() => {
    setIsRunning(false);
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    addLog('Bot stopped.', LogSource.SYSTEM);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (runMode === RunMode.RUNELITE) {
        handleStop();
        setGameState(INITIAL_GAME_STATE);
        setLogs([]);
        addLog(`Switched to RuneLite Plugin Mode.`, LogSource.SYSTEM);
        addLog(`This application is now ready to receive game state from an external RuneLite plugin.`, LogSource.SYSTEM);
    } else {
        handleStop();
        setGameState(INITIAL_GAME_STATE);
        setLogs([]);
        addLog(`Switched to Simulation Mode.`, LogSource.SYSTEM);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runMode]);
  
  // --- RUNELITE PLUGIN INTEGRATION POINT ---
  /**
   * To connect a RuneLite plugin:
   * 1. The Java plugin would collect the real-time game state (player HP/prayer, boss HP, room, mechanics).
   * 2. It would send this GameState object as a JSON payload to a simple NodeJS/Express backend server.
   *    This server would act as a bridge to this web application.
   * 3. The backend would then forward the state to this web app via a WebSocket. This component
   *    would listen for those WebSocket messages and update its state using `setGameState()`.
   * 4. Upon receiving a new state, this component would call `getBotNextAction()` with it.
   * 5. The resulting BotAction object would be sent back through the WebSocket to the backend,
   *    and then back to the RuneLite plugin.
   * 6. The Java plugin would parse the BotAction and execute it in-game (e.g., clicking on the boss,
   *    switching gear, drinking a potion).
   *
   * This architecture decouples the AI "brain" (Gemini API calls) from the in-game "body" (RuneLite plugin).
   */

  const startNewRun = () => {
    const firstRoom = ROOM_SEQUENCE[0];
    const newGameState = {
      currentRoom: firstRoom,
      playerStats: { ...INITIAL_PLAYER_STATS },
      bossStats: {
        name: firstRoom,
        health: BOSS_MAX_HEALTH[firstRoom],
        maxHealth: BOSS_MAX_HEALTH[firstRoom],
      },
    };
    setGameState(newGameState);
    setLogs([]);
    addLog(`Starting new Theatre of Blood run. First room: ${firstRoom}.`, LogSource.SYSTEM);
    return newGameState;
  };

  const simulationLoop = useCallback(async (currentState: GameState) => {
    if (!isRunning) return;

    setIsLoading(true);
    addLog(`Analyzing situation in ${currentState.currentRoom}...`, LogSource.GEMINI);
    
    // --- Define Tick-Specific Mechanics ---
    const isBloatUp = currentState.currentRoom === Room.BLOAT && Math.random() > 0.4;
    const isXarpusStaring = currentState.currentRoom === Room.XARPUS && Math.random() > 0.5;
    let currentNyloStyle: GearSet | 'NONE' = 'NONE';
    if (currentState.currentRoom === Room.NYLOCAS) {
        const styles = [GearSet.MELEE, GearSet.RANGE, GearSet.MAGE];
        currentNyloStyle = styles[Math.floor(Math.random() * 3)];
    }

    // Pass tick-specific state into the prompt for a more informed decision
    const botAction = await getBotNextAction({ ...currentState, specialMechanics: { isBloatUp, isXarpusStaring, currentNyloStyle } });
    addLog(`Decision: ${botAction.action} on ${botAction.target}. Reason: ${botAction.reasoning}`, LogSource.GEMINI);

    // Deep copy state to mutate safely in this tick
    let nextState = JSON.parse(JSON.stringify(currentState));

    // --- Boss Mechanics Simulation ---
    // This section determines what the boss does and how it affects the player
    // based on the bot's chosen action for this tick.
    switch (nextState.currentRoom) {
        case Room.MAIDEN: {
            if (Math.random() < 0.3) {
                addLog('Maiden throws a blood splat!', LogSource.SYSTEM);
                if (botAction.action.toUpperCase() === 'DODGE') {
                    addLog('Bot correctly reacted by dodging the blood splat.', LogSource.BOT);
                } else {
                    const dmg = 15 + Math.floor(Math.random() * 10);
                    nextState.playerStats.health -= dmg;
                    addLog(`Bot failed to react correctly (${botAction.action}), taking ${dmg} damage from the splat.`, LogSource.ERROR);
                }
            }
            break;
        }
        case Room.BLOAT: {
            if (isBloatUp) {
                addLog('Bloat is active and sending flies!', LogSource.SYSTEM);
                if (['HIDE', 'DODGE'].includes(botAction.action.toUpperCase())) {
                    addLog('Bot correctly hides behind a pillar to avoid flies.', LogSource.BOT);
                } else {
                    const dmg = 20 + Math.floor(Math.random() * 5);
                    nextState.playerStats.health -= dmg;
                    addLog(`Bot failed to hide (${botAction.action}), taking ${dmg} damage.`, LogSource.ERROR);
                }
            } else {
                addLog('Bloat is down! Time to attack!', LogSource.SYSTEM);
            }
            break;
        }
        case Room.NYLOCAS: {
            addLog(`Nylocas are vulnerable to ${currentNyloStyle} attacks.`, LogSource.SYSTEM);
            const dmg = 5 + Math.floor(Math.random() * 5);
            nextState.playerStats.health -= dmg;
            addLog(`Nylocas deal chip damage of ${dmg}.`, LogSource.SYSTEM);
            break;
        }
        case Room.SOTETSEG: {
            if (Math.random() < 0.25) {
                addLog('Sotetseg fires a massive energy ball!', LogSource.SYSTEM);
                if (botAction.action.toUpperCase() === 'DODGE') {
                    addLog('Bot correctly dodged the energy ball.', LogSource.BOT);
                } else {
                    const dmg = 35 + Math.floor(Math.random() * 10);
                    nextState.playerStats.health -= dmg;
                    addLog(`Bot failed to dodge (${botAction.action}), taking ${dmg} damage!`, LogSource.ERROR);
                }
            }
            if (nextState.bossStats.health < nextState.bossStats.maxHealth * 0.66 && Math.random() < 0.1) {
                 addLog('Sotetseg teleports the player to a maze!', LogSource.SYSTEM);
                 if (botAction.action.toUpperCase() === 'SOLVE_MAZE') {
                    addLog('Bot correctly solves the maze!', LogSource.BOT);
                 } else {
                    nextState.playerStats.health -= 25;
                    addLog(`Bot failed the maze (${botAction.action}) and took damage!`, LogSource.ERROR);
                 }
            }
            break;
        }
        case Room.XARPUS: {
            if (isXarpusStaring) {
                addLog('Xarpus is staring intently... DO NOT ATTACK!', LogSource.SYSTEM);
            }
            if (Math.random() < 0.3) {
                addLog('Xarpus spits a poison pool!', LogSource.SYSTEM);
                 if (botAction.action.toUpperCase() === 'DODGE') {
                    addLog('Bot correctly moved away from the poison.', LogSource.BOT);
                } else {
                    const dmg = 10;
                    nextState.playerStats.health -= dmg;
                    addLog(`Bot stood in poison (${botAction.action}), taking ${dmg} damage.`, LogSource.ERROR);
                }
            }
            break;
        }
        case Room.VERZIK: {
            if (nextState.bossStats.health < nextState.bossStats.maxHealth * 0.35 && Math.random() < 0.2) {
                addLog('Verzik summons purple tornados!', LogSource.SYSTEM);
                if (botAction.action.toUpperCase() === 'DODGE') {
                    addLog('Bot correctly dodges the tornados.', LogSource.BOT);
                } else {
                    const dmg = 25;
                    nextState.playerStats.health -= dmg;
                    addLog(`Bot was hit by a tornado (${botAction.action}) for ${dmg} damage!`, LogSource.ERROR);
                }
            }
            if (nextState.bossStats.health < nextState.bossStats.maxHealth * 0.7 && Math.random() < 0.15) {
                 addLog('Verzik launches a green ball!', LogSource.SYSTEM);
                 const dmg = 40;
                 nextState.playerStats.health -= dmg;
                 addLog(`The green ball explodes, dealing ${dmg} damage! This is unavoidable.`, LogSource.SYSTEM);
            }
            break;
        }
        default: {
            const damage = Math.floor(Math.random() * 5);
            if (damage > 1) {
                nextState.playerStats.health -= damage;
                addLog(`Boss hits you for ${damage} chip damage!`, LogSource.SYSTEM);
            }
            break;
        }
    }
    nextState.playerStats.health = Math.max(0, nextState.playerStats.health);
    
    // --- Player Death Check ---
    if (nextState.playerStats.health <= 0) {
        addLog('WIPED! You have died.', LogSource.ERROR);
        setIsRunning(false);
        setGameState(INITIAL_GAME_STATE);
        return;
    }

    // --- Bot Action Processing ---
    switch (botAction.action.toUpperCase()) {
        case 'ATTACK':
            let botDamage = Math.floor(Math.random() * 30) + 10;
            let canAttack = true;
            if (nextState.currentRoom === Room.BLOAT && isBloatUp) {
                 addLog('Bot incorrectly tried to attack while Bloat is active. Action fails.', LogSource.ERROR);
                 canAttack = false;
            } else if (nextState.currentRoom === Room.XARPUS && isXarpusStaring) {
                const reflectedDmg = 15 + Math.floor(Math.random() * 5);
                nextState.playerStats.health -= reflectedDmg;
                addLog(`Bot incorrectly attacked during the stare and took ${reflectedDmg} reflected damage!`, LogSource.ERROR);
                canAttack = false;
            } else if (nextState.currentRoom === Room.NYLOCAS) {
                 if (nextState.playerStats.currentGear !== currentNyloStyle) {
                    botDamage = Math.floor(botDamage / 4);
                    addLog(`Damage reduced to ${botDamage} due to wrong gear. Bot should have switched gear first.`, LogSource.ERROR);
                 } else {
                    addLog('Bot attacks with the correct style, dealing full damage.', LogSource.BOT);
                 }
            }
            
            if (canAttack) {
                nextState.bossStats.health = Math.max(0, nextState.bossStats.health - botDamage);
                addLog(`Bot attacks ${nextState.bossStats.name} for ${botDamage} damage.`, LogSource.BOT);
            }
            break;
        case 'EAT':
            const healAmount = botAction.itemToUse?.toLowerCase().includes('brew') ? 16 : 22;
            nextState.playerStats.health = Math.min(nextState.playerStats.maxHealth, nextState.playerStats.health + healAmount);
            addLog(`Bot eats a ${botAction.itemToUse || 'Shark'}, healing to ${nextState.playerStats.health} HP.`, LogSource.BOT);
            break;
        case 'PRAY':
             const prayerRestore = botAction.itemToUse?.toLowerCase().includes('restore') ? 25 : 10;
             nextState.playerStats.prayer = Math.min(nextState.playerStats.maxPrayer, nextState.playerStats.prayer + prayerRestore);
             addLog(`Bot sips a ${botAction.itemToUse || 'Prayer Potion'}, restoring prayer to ${nextState.playerStats.prayer}.`, LogSource.BOT);
            break;
        case 'SWITCH_GEAR':
            if (botAction.gearToSwitch && Object.values(GearSet).includes(botAction.gearToSwitch)) {
                nextState.playerStats.currentGear = botAction.gearToSwitch;
                addLog(`Bot is switching to ${botAction.gearToSwitch} gear.`, LogSource.BOT);
                if (nextState.currentRoom === Room.NYLOCAS) {
                    if (botAction.gearToSwitch === currentNyloStyle) {
                        addLog('This is the correct gear for the current Nylocas spawn.', LogSource.BOT);
                    } else {
                        addLog(`Bot switched to the wrong gear! Current weakness is ${currentNyloStyle}.`, LogSource.ERROR);
                    }
                }
            } else {
                addLog(`Bot attempted to switch gear but no valid gear was specified.`, LogSource.ERROR);
            }
            break;
        default:
             addLog(`Bot is performing action: ${botAction.action}.`, LogSource.BOT);
            break;
    }
    
    nextState.playerStats.health = Math.max(0, nextState.playerStats.health);
    nextState.playerStats.prayer = Math.max(0, nextState.playerStats.prayer - 2);

    // Check for room completion
    if (nextState.bossStats.health <= 0) {
        addLog(`${nextState.currentRoom} has been defeated!`, LogSource.SYSTEM);
        const currentRoomIndex = ROOM_SEQUENCE.indexOf(nextState.currentRoom);
        const nextRoom = ROOM_SEQUENCE[currentRoomIndex + 1];

        if (nextRoom === Room.COMPLETE) {
            addLog('Congratulations! Theatre of Blood completed!', LogSource.SYSTEM);
            nextState.currentRoom = Room.COMPLETE;
            setIsRunning(false);
        } else {
            addLog(`Moving to the next room: ${nextRoom}.`, LogSource.SYSTEM);
            nextState.currentRoom = nextRoom;
            nextState.bossStats = {
                name: nextRoom,
                health: BOSS_MAX_HEALTH[nextRoom],
                maxHealth: BOSS_MAX_HEALTH[nextRoom],
            };
        }
    }

    setGameState(nextState);
    setIsLoading(false);

    if (isRunning && nextState.currentRoom !== Room.COMPLETE) {
      simulationTimeoutRef.current = window.setTimeout(() => simulationLoop(nextState), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const handleStart = () => {
    if (runMode === RunMode.RUNELITE) {
        addLog("Cannot start from UI in RuneLite mode. The RuneLite plugin must initiate actions.", LogSource.ERROR);
        return;
    }

    setIsRunning(true);
    let stateToSimulate = gameState;
    if (gameState.currentRoom === Room.IDLE || gameState.currentRoom === Room.COMPLETE) {
        stateToSimulate = startNewRun();
    } else {
        addLog('Resuming bot...', LogSource.SYSTEM);
    }
    
    simulationTimeoutRef.current = window.setTimeout(() => simulationLoop(stateToSimulate), 1000);
  };
  
  return (
    <div className="min-h-screen p-4 md:p-8" style={{ textShadow: '1px 1px 2px black' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8" style={{height: 'calc(100vh - 4rem)'}}>
        <div className="lg:col-span-2 h-full">
            <GameScreen gameState={gameState} runMode={runMode} isRunning={isRunning} />
        </div>
        <div className="grid grid-rows-2 gap-4 md:gap-8 h-full">
            <LogDisplay logs={logs} />
            <ControlPanel 
                isRunning={isRunning} 
                isLoading={isLoading} 
                onStart={handleStart} 
                onStop={() => {
                  setIsRunning(false);
                  if (simulationTimeoutRef.current) clearTimeout(simulationTimeoutRef.current);
                  addLog('Bot stopped by user.', LogSource.SYSTEM);
                  setIsLoading(false);
                }} 
                gameState={gameState} 
                runMode={runMode} 
                onModeChange={setRunMode}
            />
        </div>
      </div>
    </div>
  );
}