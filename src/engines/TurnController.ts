import { type GamePhase, type PlayerAction } from '@/types';
import { type GameState } from '@/interfaces';

/**
 * Manages turn phase transitions.
 * Single Responsibility: Only handles phase logic, not scoring.
 */

/**
 * Determines available actions for current phase.
 */
export function getAvailableActions(phase: GamePhase): readonly PlayerAction[] {
  switch (phase) {
    case 'idle':
      return ['roll'];
    case 'rolling':
      return []; // No actions while dice rolling
    case 'deciding':
      return ['roll', 'pass'];
    case 'passing':
      return []; // Transition phase
    case 'gameOver':
      return []; // Game ended
    default:
      return [];
  }
}

/**
 * Checks if a specific action is allowed in current phase.
 */
export function isActionAllowed(phase: GamePhase, action: PlayerAction): boolean {
  const available = getAvailableActions(phase);
  return available.includes(action);
}

/**
 * Determines if it's the human player's turn to act.
 */
export function isHumanTurn(state: Readonly<GameState>): boolean {
  const activePlayer = state.players[state.activePlayerIndex];
  return activePlayer.isHuman;
}

/**
 * Determines if the game is in a state where dice can be rolled.
 */
export function canRoll(state: Readonly<GameState>): boolean {
  return state.phase === 'idle' || state.phase === 'deciding';
}

/**
 * Determines if the game is in a state where player can pass.
 */
export function canPass(state: Readonly<GameState>): boolean {
  return state.phase === 'deciding';
}

/**
 * Determines if the game is over.
 */
export function isGameOver(state: Readonly<GameState>): boolean {
  return state.phase === 'gameOver';
}

/**
 * Gets a human-readable description of the current phase.
 */
export function getPhaseDescription(state: Readonly<GameState>): string {
  const activePlayer = state.players[state.activePlayerIndex];

  switch (state.phase) {
    case 'idle':
      return `${activePlayer.name}'s turn - Roll the dice to begin!`;
    case 'rolling':
      return 'Rolling...';
    case 'deciding':
      return `${activePlayer.name} rolled ${state.lastRoll?.total}! Roll again or pass?`;
    case 'passing':
      return 'Banking scores...';
    case 'gameOver':
      return state.winner
        ? `${state.players.find(p => p.id === state.winner)?.name} wins!`
        : 'Game Over';
    default:
      return '';
  }
}
