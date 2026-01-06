import { type PlayerIndex, type PlayerId } from '@/types';
import { type GameState, type Player, type DiceResult, type GameInitOptions } from '@/interfaces';
import { WIN_SCORE, DEFAULT_NAMES } from '@/constants';
import { calculateActivePlayerPoints, calculateOpponentPoints } from './ScoreCalculator';

/**
 * Pure game logic engine.
 * All functions take state and return new state (immutable).
 * See GAME_RULES.md for rule specifications.
 */

/**
 * Creates initial game state.
 */
export function createInitialState(options?: Partial<GameInitOptions>): GameState {
  const player1: Player = {
    id: 'player1',
    name: options?.player1Name ?? DEFAULT_NAMES.player1,
    isHuman: true,
    officialScore: 0,
    tempScore: 0,
  };

  const player2: Player = {
    id: 'player2',
    name: options?.player2Name ?? DEFAULT_NAMES.player2,
    isHuman: options?.player2IsHuman ?? false,
    officialScore: 0,
    tempScore: 0,
  };

  return {
    players: [player1, player2],
    activePlayerIndex: 0,
    phase: 'idle',
    lastRoll: null,
    turnNumber: 1,
    winner: null,
  };
}

/**
 * Gets the opponent's player index.
 */
export function getOpponentIndex(activeIndex: PlayerIndex): PlayerIndex {
  return activeIndex === 0 ? 1 : 0;
}

/**
 * Applies the result of an odd roll.
 * - Active player loses temp score
 * - Opponent banks their temp score
 * - Turn switches to opponent
 */
export function applyOddRoll(state: Readonly<GameState>, roll: DiceResult): GameState {
  const activeIdx = state.activePlayerIndex;
  const opponentIdx = getOpponentIndex(activeIdx);

  const activePlayer: Player = {
    ...state.players[activeIdx],
    tempScore: 0, // Forfeit temp score
  };

  const opponent: Player = {
    ...state.players[opponentIdx],
    officialScore: state.players[opponentIdx].officialScore + state.players[opponentIdx].tempScore,
    tempScore: 0, // Reset after banking
  };

  const newPlayers: readonly [Player, Player] =
    activeIdx === 0 ? [activePlayer, opponent] : [opponent, activePlayer];

  // Check if opponent won by banking
  const winner = checkWinCondition(newPlayers);

  return {
    ...state,
    players: newPlayers,
    activePlayerIndex: opponentIdx,
    phase: winner ? 'gameOver' : 'rolling',
    lastRoll: roll,
    turnNumber: state.turnNumber + 1,
    winner,
  };
}

/**
 * Applies the result of an even roll.
 * - Active player gains total as temp score
 * - Opponent gains lower die as temp score
 * - Active player must decide: roll again or pass
 */
export function applyEvenRoll(state: Readonly<GameState>, roll: DiceResult): GameState {
  const activeIdx = state.activePlayerIndex;
  const opponentIdx = getOpponentIndex(activeIdx);

  const activePoints = calculateActivePlayerPoints(roll);
  const opponentPoints = calculateOpponentPoints(roll);

  const activePlayer: Player = {
    ...state.players[activeIdx],
    tempScore: state.players[activeIdx].tempScore + activePoints,
  };

  const opponent: Player = {
    ...state.players[opponentIdx],
    tempScore: state.players[opponentIdx].tempScore + opponentPoints,
  };

  const newPlayers: readonly [Player, Player] =
    activeIdx === 0 ? [activePlayer, opponent] : [opponent, activePlayer];

  return {
    ...state,
    players: newPlayers,
    phase: 'deciding',
    lastRoll: roll,
  };
}

/**
 * Applies the active player's decision to pass.
 * - Active player banks their temp score
 * - Opponent's temp score is wiped
 * - Turn switches to opponent
 */
export function applyPass(state: Readonly<GameState>): GameState {
  const activeIdx = state.activePlayerIndex;
  const opponentIdx = getOpponentIndex(activeIdx);

  const activePlayer: Player = {
    ...state.players[activeIdx],
    officialScore: state.players[activeIdx].officialScore + state.players[activeIdx].tempScore,
    tempScore: 0,
  };

  const opponent: Player = {
    ...state.players[opponentIdx],
    tempScore: 0, // Wiped, not banked
  };

  const newPlayers: readonly [Player, Player] =
    activeIdx === 0 ? [activePlayer, opponent] : [opponent, activePlayer];

  // Check if active player won by banking
  const winner = checkWinCondition(newPlayers);

  return {
    ...state,
    players: newPlayers,
    activePlayerIndex: opponentIdx,
    phase: winner ? 'gameOver' : 'rolling',
    turnNumber: state.turnNumber + 1,
    winner,
  };
}

/**
 * Processes a complete dice roll and returns new state.
 * Dispatches to applyOddRoll or applyEvenRoll based on result.
 */
export function processRoll(state: Readonly<GameState>, roll: DiceResult): GameState {
  if (roll.isEven) {
    return applyEvenRoll(state, roll);
  } else {
    return applyOddRoll(state, roll);
  }
}

/**
 * Checks if any player has won.
 * @returns Winner's PlayerId or null if game continues
 */
export function checkWinCondition(players: readonly [Player, Player]): PlayerId | null {
  // Check player1 first (priority for tie resolution)
  if (players[0].officialScore >= WIN_SCORE) {
    return 'player1';
  }
  if (players[1].officialScore >= WIN_SCORE) {
    return 'player2';
  }
  return null;
}

/**
 * Sets the game phase to rolling (used when player chooses to roll again).
 */
export function setRollingPhase(state: Readonly<GameState>): GameState {
  return {
    ...state,
    phase: 'rolling',
  };
}

/**
 * Resets the game to initial state.
 */
export function resetGame(options?: Partial<GameInitOptions>): GameState {
  return createInitialState(options);
}
