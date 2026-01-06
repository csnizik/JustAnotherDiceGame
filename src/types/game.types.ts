/**
 * Core game type definitions.
 * Uses literal types and unions for type safety.
 */

/** Unique identifier for each player */
export type PlayerId = 'player1' | 'player2';

/** Index into the players tuple */
export type PlayerIndex = 0 | 1;

/** Current phase of the game state machine */
export type GamePhase =
  | 'idle'        // Game not started
  | 'rolling'     // Dice are being rolled
  | 'deciding'    // Player choosing to roll again or pass
  | 'passing'     // Player chose to pass, scores updating
  | 'gameOver';   // A player has won

/** Actions available to a player */
export type PlayerAction = 'roll' | 'pass';

/** Valid die face values */
export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;
