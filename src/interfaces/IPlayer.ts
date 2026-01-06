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
 * Factory function signature for creating players.
 */
export type CreatePlayerFn = (
  id: PlayerId,
  name: string,
  isHuman: boolean
) => Player;
