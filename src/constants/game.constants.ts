import { type PlayerId } from '@/types';

/** Score required to win the game */
export const WIN_SCORE = 50 as const;

/** Number of dice used in the game */
export const DICE_COUNT = 2 as const;

/** Minimum possible die value */
export const DIE_MIN = 1 as const;

/** Maximum possible die value */
export const DIE_MAX = 6 as const;

/** Player identifiers */
export const PLAYER_IDS: readonly [PlayerId, PlayerId] = ['player1', 'player2'] as const;

/** Default player names */
export const DEFAULT_NAMES = {
  player1: 'You',
  player2: 'Computer',
} as const;

/** AI decision thresholds */
export const AI_CONFIG = {
  /** Temp score at which AI prefers to pass */
  SAFE_SCORE_THRESHOLD: 15,
  /** Opponent official score at which AI takes more risks */
  OPPONENT_DANGER_THRESHOLD: 40,
  /** Random factor range for unpredictability (0-1) */
  RANDOMNESS_FACTOR: 0.2,
} as const;
