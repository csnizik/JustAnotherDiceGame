# Prompt 02: Interfaces and Types

## Objective

Define all TypeScript interfaces and types before implementation. This ensures type safety throughout the project and establishes contracts between modules.

## Instructions

### Step 1: Create Type Definitions

Create `src/types/game.types.ts`:

```typescript
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
```

Create `src/types/index.ts`:

```typescript
export * from './game.types';
```

### Step 2: Create Core Interfaces

Create `src/interfaces/IDiceResult.ts`:

```typescript
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
```

Create `src/interfaces/IPlayer.ts`:

```typescript
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
```

Create `src/interfaces/IGameState.ts`:

```typescript
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
```

Create `src/interfaces/ITurnActions.ts`:

```typescript
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
```

Create `src/interfaces/IPlayerService.ts`:

```typescript
import { type PlayerAction } from '@/types';
import { type GameState } from './IGameState';

/**
 * Abstraction for player decision-making.
 * Allows swapping human input for AI without changing game logic.
 * 
 * Follows Dependency Inversion: game engine depends on this abstraction,
 * not on concrete HumanPlayer or AIPlayer implementations.
 */
export interface IPlayerService {
  /**
   * Determine the player's next action given current game state.
   * For human players, this may involve UI interaction.
   * For AI players, this computes the optimal move.
   */
  decideAction: (state: Readonly<GameState>) => Promise<PlayerAction>;

  /**
   * Whether this service requires user interaction.
   * Used to determine if UI controls should be shown.
   */
  readonly requiresUserInput: boolean;
}
```

Create `src/interfaces/index.ts`:

```typescript
export * from './IDiceResult';
export * from './IPlayer';
export * from './IGameState';
export * from './ITurnActions';
export * from './IPlayerService';
```

### Step 3: Create Constants

Create `src/constants/game.constants.ts`:

```typescript
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
```

Create `src/constants/index.ts`:

```typescript
export * from './game.constants';
```

### Step 4: Create Utility Types

Create `src/utils/typeGuards.ts`:

```typescript
import { type DieFace } from '@/types';
import { DIE_MIN, DIE_MAX } from '@/constants';

/**
 * Type guard to validate a number is a valid die face.
 */
export function isDieFace(value: unknown): value is DieFace {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= DIE_MIN &&
    value <= DIE_MAX
  );
}

/**
 * Type guard to check if a value is a non-null object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
```

Create `src/utils/index.ts`:

```typescript
export * from './typeGuards';
```

## Completion Checklist

- [ ] `src/types/game.types.ts` - Core type definitions
- [ ] `src/interfaces/IDiceResult.ts` - Dice roll result interface
- [ ] `src/interfaces/IPlayer.ts` - Player interface
- [ ] `src/interfaces/IGameState.ts` - Game state interface
- [ ] `src/interfaces/ITurnActions.ts` - Turn action interfaces
- [ ] `src/interfaces/IPlayerService.ts` - Player service abstraction
- [ ] `src/interfaces/index.ts` - Barrel export
- [ ] `src/constants/game.constants.ts` - Game constants
- [ ] `src/utils/typeGuards.ts` - Type guard functions
- [ ] All files compile without errors

## Verification

Run TypeScript compiler to verify all types are valid:

```bash
npx tsc --noEmit
```

## Next Step

Proceed to `03-game-engine.md` to implement the core game logic.
