
import { GameState, PlayerStats, Room, GearSet } from './types';

export const INITIAL_PLAYER_STATS: PlayerStats = {
  health: 99,
  maxHealth: 99,
  prayer: 99,
  maxPrayer: 99,
  currentGear: GearSet.MELEE,
};

export const ROOM_SEQUENCE: Room[] = [
    Room.MAIDEN,
    Room.BLOAT,
    Room.NYLOCAS,
    Room.SOTETSEG,
    Room.XARPUS,
    Room.VERZIK,
    Room.COMPLETE
];

export const BOSS_MAX_HEALTH: Record<Room, number> = {
    [Room.IDLE]: 0,
    [Room.MAIDEN]: 1000,
    [Room.BLOAT]: 1000,
    [Room.NYLOCAS]: 1000,
    [Room.SOTETSEG]: 1000,
    [Room.XARPUS]: 1000,
    [Room.VERZIK]: 1500,
    [Room.COMPLETE]: 0,
};

export const INITIAL_GAME_STATE: GameState = {
  currentRoom: Room.IDLE,
  playerStats: { ...INITIAL_PLAYER_STATS },
  bossStats: {
    name: Room.IDLE,
    health: 0,
    maxHealth: 0,
  },
};
