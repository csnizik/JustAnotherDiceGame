import { type PlayerAction } from '@/types';
import { type DiceResult } from './IDiceResult';

/**
 * Actions available during a player's turn.
 * Interface segregation: components only depend on actions they use.
 */
export interface ITurnActions {
  /** Initiate a dice roll */
  roll: () => void;

  /** Pass turn to opponent (bank scores) */
  pass: () => void;
}

/**
 * Callbacks for dice roll lifecycle.
 */
export interface IDiceCallbacks {
  /** Called when dice start rolling */
  onRollStart?: () => void;

  /** Called when dice settle with final result */
  onRollComplete: (result: DiceResult) => void;

  /** Called if dice roll fails */
  onRollError?: (error: Error) => void;
}

/**
 * Decision made by a player after an even roll.
 */
export interface TurnDecision {
  action: PlayerAction;
  timestamp: number;
}
