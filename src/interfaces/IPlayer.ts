import { type PlayerId } from '@/types';

/**
 * Represents a player in the game.
 * Separates official (banked) score from temporary (at-risk) score.
 */
export interface Player {
  /** Unique player identifier */
  readonly id: PlayerId;

  /** Display name */
  readonly name: string;

  /** True if controlled by human, false if AI */
  readonly isHuman: boolean;

  /** Banked score that counts toward victory */
  officialScore: number;

  /** At-risk score that may be lost on odd roll */
  tempScore: number;
}

/**
 * Factory function for creating player instances.
 * This function signature enables flexible player creation and can be used
 * with dependency injection to provide different player creation strategies
 * for human and AI players.
 *
 * @param id - Unique identifier for the player
 * @param name - Display name for the player
 * @param isHuman - True if the player is controlled by a human, false if AI
 * @returns A new Player instance
 *
 * @example
 * const createPlayer: CreatePlayerFn = (id, name, isHuman) => ({
 *   id,
 *   name,
 *   isHuman,
 *   officialScore: 0,
 *   tempScore: 0
 * });
 * const player1 = createPlayer('player1', 'Alice', true);
 */
export type CreatePlayerFn = (
  id: PlayerId,
  name: string,
  isHuman: boolean
) => Player;
