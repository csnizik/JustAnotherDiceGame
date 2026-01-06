import { type PlayerId, type PlayerIndex, type GamePhase } from '@/types';
import { type Player } from './IPlayer';
import { type DiceResult } from './IDiceResult';

/**
 * Complete game state at any point in time.
 * Designed for immutable updates.
 */
export interface GameState {
  /** Tuple of exactly two players: [player1, player2] */
  readonly players: readonly [Player, Player];

  /** Index of the currently active player */
  activePlayerIndex: PlayerIndex;

  /** Current game phase */
  phase: GamePhase;

  /** Result of the most recent dice roll, null if none */
  lastRoll: DiceResult | null;

  /** Sequential turn counter */
  turnNumber: number;

  /** Winner's ID when game is over, null during play */
  winner: PlayerId | null;
}

/**
 * Minimal state needed to initialize a new game.
 */
export interface GameInitOptions {
  player1Name: string;
  player2Name: string;
  player2IsHuman: boolean;
}
