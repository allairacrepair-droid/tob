export enum Room {
  IDLE = 'IDLE',
  MAIDEN = 'The Maiden of Sugadinti',
  BLOAT = 'The Pestilent Bloat',
  NYLOCAS = 'Nylocas Vasilias',
  SOTETSEG = 'Sotetseg',
  XARPUS = 'Xarpus',
  VERZIK = 'Verzik Vitur',
  COMPLETE = 'Theatre Complete',
}

export enum GearSet {
    MELEE = 'MELEE',
    RANGE = 'RANGE',
    MAGE = 'MAGE',
}

export enum RunMode {
    SIMULATION = 'Simulation Mode',
    RUNELITE = 'RuneLite Plugin Mode',
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  prayer: number;
  maxPrayer: number;
  currentGear: GearSet;
}

export interface BossStats {
  name: Room;
  health: number;
  maxHealth: number;
}

export interface GameState {
  currentRoom: Room;
  playerStats: PlayerStats;
  bossStats: BossStats;
}

export interface BotAction {
  action: string;
  target: string;
  reasoning: string;
  itemToUse?: string;
  gearToSwitch?: GearSet;
}

export enum LogSource {
    BOT = 'BOT',
    SYSTEM = 'SYSTEM',
    GEMINI = 'GEMINI',
    ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string;
  message: string;
  source: LogSource;
}