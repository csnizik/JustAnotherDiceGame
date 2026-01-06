import { type DieFace } from '@/types';

/**
 * Represents the outcome of rolling two dice.
 * All properties are readonly to enforce immutability.
 */
export interface DiceResult {
  /** Value of the first die (1-6) */
  readonly die1: DieFace;

  /** Value of the second die (1-6) */
  readonly die2: DieFace;

  /** Sum of both dice (2-12) */
  readonly total: number;

  /** True if total is even (2, 4, 6, 8, 10, 12) */
  readonly isEven: boolean;

  /** The smaller of the two die values */
  readonly lowerDie: DieFace;

  /** The larger of the two die values */
  readonly higherDie: DieFace;
}
