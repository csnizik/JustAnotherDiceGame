import { type DieFace } from '@/types';
import { type DiceResult } from '@/interfaces';
import { isDieFace } from '@/utils';

/**
 * Pure functions for dice and score calculations.
 * Single Responsibility: Only calculates, never mutates state.
 */

/**
 * Creates a DiceResult from two die values.
 *
 * @param die1 - First die value
 * @param die2 - Second die value
 * @returns Complete DiceResult with derived properties
 * @throws Error if die values are invalid
 *
 * @example
 * calculateDiceResult(3, 4) // { die1: 3, die2: 4, total: 7, isEven: false, ... }
 */
export function calculateDiceResult(die1: number, die2: number): DiceResult {
  if (!isDieFace(die1) || !isDieFace(die2)) {
    throw new Error(`Invalid die values: ${die1}, ${die2}. Must be 1-6.`);
  }

  const total = die1 + die2;
  const lowerDie = Math.min(die1, die2) as DieFace;
  const higherDie = Math.max(die1, die2) as DieFace;

  return {
    die1,
    die2,
    total,
    isEven: total % 2 === 0,
    lowerDie,
    higherDie,
  };
}

/**
 * Calculates points awarded to active player on even roll.
 * Active player receives the total of both dice.
 */
export function calculateActivePlayerPoints(result: DiceResult): number {
  return result.total;
}

/**
 * Calculates points awarded to opponent on even roll.
 * Opponent receives the lower die value.
 */
export function calculateOpponentPoints(result: DiceResult): number {
  return result.lowerDie;
}
