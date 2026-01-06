# Prompt 03: Game Engine

## Objective

Implement the pure game logic engines. These modules contain NO React code, NO side effects, and are fully unit-testable.

## Reference

Before implementing, review `GAME_RULES.md` for authoritative rule specifications.

## Instructions

### Step 1: Score Calculator

Create `src/engines/ScoreCalculator.ts`:

```typescript
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
```

### Step 2: Game Rules Engine

Create `src/engines/GameRulesEngine.ts`:

```typescript
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
```

### Step 3: Turn Controller

Create `src/engines/TurnController.ts`:

```typescript
import { type GamePhase, type PlayerAction } from '@/types';
import { type GameState } from '@/interfaces';

/**
 * Manages turn phase transitions.
 * Single Responsibility: Only handles phase logic, not scoring.
 */

/**
 * Determines available actions for current phase.
 */
export function getAvailableActions(phase: GamePhase): readonly PlayerAction[] {
  switch (phase) {
    case 'idle':
      return ['roll'];
    case 'rolling':
      return []; // No actions while dice rolling
    case 'deciding':
      return ['roll', 'pass'];
    case 'passing':
      return []; // Transition phase
    case 'gameOver':
      return []; // Game ended
    default:
      return [];
  }
}

/**
 * Checks if a specific action is allowed in current phase.
 */
export function isActionAllowed(phase: GamePhase, action: PlayerAction): boolean {
  const available = getAvailableActions(phase);
  return available.includes(action);
}

/**
 * Determines if it's the human player's turn to act.
 */
export function isHumanTurn(state: Readonly<GameState>): boolean {
  const activePlayer = state.players[state.activePlayerIndex];
  return activePlayer.isHuman;
}

/**
 * Determines if the game is in a state where dice can be rolled.
 */
export function canRoll(state: Readonly<GameState>): boolean {
  return state.phase === 'idle' || state.phase === 'deciding';
}

/**
 * Determines if the game is in a state where player can pass.
 */
export function canPass(state: Readonly<GameState>): boolean {
  return state.phase === 'deciding';
}

/**
 * Determines if the game is over.
 */
export function isGameOver(state: Readonly<GameState>): boolean {
  return state.phase === 'gameOver';
}

/**
 * Gets a human-readable description of the current phase.
 */
export function getPhaseDescription(state: Readonly<GameState>): string {
  const activePlayer = state.players[state.activePlayerIndex];

  switch (state.phase) {
    case 'idle':
      return `${activePlayer.name}'s turn - Roll the dice to begin!`;
    case 'rolling':
      return 'Rolling...';
    case 'deciding':
      return `${activePlayer.name} rolled ${state.lastRoll?.total}! Roll again or pass?`;
    case 'passing':
      return 'Banking scores...';
    case 'gameOver':
      return state.winner
        ? `${state.players.find(p => p.id === state.winner)?.name} wins!`
        : 'Game Over';
    default:
      return '';
  }
}
```

### Step 4: Barrel Export

Create `src/engines/index.ts`:

```typescript
export * from './ScoreCalculator';
export * from './GameRulesEngine';
export * from './TurnController';
```

## Completion Checklist

- [ ] `ScoreCalculator.ts` - Pure dice/score calculations
- [ ] `GameRulesEngine.ts` - Core game state transformations
- [ ] `TurnController.ts` - Phase management utilities
- [ ] `index.ts` - Barrel export
- [ ] All functions are pure (no side effects)
- [ ] All functions have JSDoc comments
- [ ] TypeScript compiles without errors

## Verification

```bash
# Ensure no type errors
npx tsc --noEmit
```

## Unit Test Suggestions

The engines are designed for easy testing:

```typescript
// Example test cases to implement
describe('ScoreCalculator', () => {
  it('calculates even total correctly', () => {
    const result = calculateDiceResult(2, 4);
    expect(result.total).toBe(6);
    expect(result.isEven).toBe(true);
  });

  it('identifies lower die correctly', () => {
    const result = calculateDiceResult(5, 2);
    expect(result.lowerDie).toBe(2);
  });
});

describe('GameRulesEngine', () => {
  it('forfeits active player temp on odd roll', () => {
    const state = createInitialState();
    // Set up temp score scenario
    // Apply odd roll
    // Assert temp score is 0
  });
});
```

## Next Step

Proceed to `04-dice-integration.md` to integrate @3d-dice/dice-box.
