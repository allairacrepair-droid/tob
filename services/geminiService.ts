import { GoogleGenAI, Type } from '@google/genai';
import type { GameState, BotAction } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'MISSING_API_KEY' });

const botActionSchema = {
  type: Type.OBJECT,
  properties: {
    action: {
      type: Type.STRING,
      description: 'The primary action to take (e.g., ATTACK, EAT, DODGE, SWITCH_GEAR, HIDE, SOLVE_MAZE).',
    },
    target: {
      type: Type.STRING,
      description: 'The target of the action (e.g., "Sotetseg", "Nylocas", "Self").',
    },
    itemToUse: {
        type: Type.STRING,
        description: 'Optional: The item to use for the action (e.g., "Saradomin Brew", "Super Restore", "Dragon Claws").',
    },
    gearToSwitch: {
        type: Type.STRING,
        description: 'Optional: The gear set to switch to (MELEE, RANGE, MAGE). Use when action is SWITCH_GEAR.',
        enum: ['MELEE', 'RANGE', 'MAGE'],
    },
    reasoning: {
      type: Type.STRING,
      description: 'A brief explanation for why this action was chosen.',
    },
  },
  required: ['action', 'target', 'reasoning'],
};

export const getBotNextAction = async (gameState: GameState & { specialMechanics?: any }): Promise<BotAction> => {
  const { currentRoom, playerStats, bossStats, specialMechanics = {} } = gameState;

  let mechanicInfo = '';
  if (specialMechanics.isBloatUp) mechanicInfo += 'Bloat is currently active; you must HIDE. ';
  if (specialMechanics.isXarpusStaring) mechanicInfo += 'Xarpus is staring; DO NOT ATTACK. ';
  if (specialMechanics.currentNyloStyle && specialMechanics.currentNyloStyle !== 'NONE') {
    mechanicInfo += `Nylocas are weak to ${specialMechanics.currentNyloStyle}. SWITCH_GEAR if necessary. `;
  }

  const prompt = `
    Current Location: Theatre of Blood - ${currentRoom}.
    Player Status: Health=${playerStats.health}/${playerStats.maxHealth}, Prayer=${playerStats.prayer}/${playerStats.maxPrayer}, Current Gear=${playerStats.currentGear}.
    Boss Status: ${bossStats.name} at ${Math.round((bossStats.health / bossStats.maxHealth) * 100)}% health.
    IMMEDIATE THREATS: ${mechanicInfo || 'None'}
    
    Analyze the situation and provide the next optimal action. React to immediate threats above all else.
    Your action MUST be appropriate for the current mechanics.
    - Maiden: Dodge blood splats.
    - Bloat: HIDE when he is up, ATTACK when he is down.
    - Nylocas: Use 'SWITCH_GEAR' to match their color (${specialMechanics.currentNyloStyle}).
    - Sotetseg: DODGE the big red ball. SOLVE_MAZE if teleported.
    - Xarpus: DODGE poison. DO NOT ATTACK while he is staring.
    - Verzik: DODGE purple tornados.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class Old School RuneScape player controlling a bot to complete the Theatre of Blood. Your response must be a single, optimal action in JSON format based on the game state provided, prioritizing survival and mechanics over damage.",
        responseMimeType: 'application/json',
        responseSchema: botActionSchema,
        temperature: 0.7, 
      },
    });
    
    const jsonText = response.text.trim();
    const action = JSON.parse(jsonText);
    return action as BotAction;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback action if API fails
    return {
      action: 'WAIT',
      target: 'Self',
      reasoning: 'AI decision system failed. Waiting for recovery.',
    };
  }
};
