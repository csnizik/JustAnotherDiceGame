# Just Another Dice Game - Style Guide

## TypeScript Conventions

### Strict Mode

The project uses TypeScript strict mode. All strict checks must pass:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Type Definitions

**Interfaces for Object Shapes**
```typescript
// ✅ Good - Use interface for data structures
interface Player {
  id: PlayerId;
  name: string;
  officialScore: number;
  tempScore: number;
}

// ❌ Bad - Don't use type for object shapes
type Player = {
  id: PlayerId;
  // ...
};
```

**Types for Unions, Primitives, Computed Types**
```typescript
// ✅ Good - Use type for unions and primitives
type PlayerId = 'player1' | 'player2';
type PlayerIndex = 0 | 1;
type GamePhase = 'idle' | 'rolling' | 'deciding' | 'gameOver';

// ✅ Good - Use type for computed/mapped types
type ReadonlyPlayer = Readonly<Player>;
```

**Prefix Interfaces with `I` Only for Abstractions**
```typescript
// ✅ Good - I prefix for dependency injection abstractions
interface IPlayerService {
  makeDecision(state: GameState): PlayerAction;
}

// ✅ Good - No prefix for data shape interfaces
interface Player { }
interface GameState { }
interface DiceResult { }
```

### Function Signatures

**Explicit Return Types**
```typescript
// ✅ Good - Explicit return type
function calculateTotal(die1: number, die2: number): number {
  return die1 + die2;
}

// ❌ Bad - Implicit return type
function calculateTotal(die1: number, die2: number) {
  return die1 + die2;
}
```

**Readonly Parameters for Objects**
```typescript
// ✅ Good - Prevents accidental mutation
function applyRoll(state: Readonly<GameState>): GameState {
  return { ...state, /* changes */ };
}
```

### Const Assertions

```typescript
// ✅ Good - Use const assertion for literal types
const PLAYER_IDS = ['player1', 'player2'] as const;
type PlayerId = typeof PLAYER_IDS[number];

// ✅ Good - Const assertion for config objects
const GAME_CONFIG = {
  WIN_SCORE: 50,
  DICE_COUNT: 2,
} as const;
```

### No Magic Numbers

```typescript
// ❌ Bad
if (player.officialScore >= 50) { }

// ✅ Good
import { WIN_SCORE } from '@/constants';
if (player.officialScore >= WIN_SCORE) { }
```

## React Conventions

### Component Structure

```typescript
// Component file structure
import { type FC } from 'react';

// 1. Types/Interfaces at top
interface PlayerScoreProps {
  player: Player;
  isActive: boolean;
}

// 2. Component definition
export const PlayerScore: FC<PlayerScoreProps> = ({ player, isActive }) => {
  // 3. Hooks first
  const [isAnimating, setIsAnimating] = useState(false);

  // 4. Derived state / computations
  const totalScore = player.officialScore + player.tempScore;

  // 5. Effects
  useEffect(() => {
    // ...
  }, [dependency]);

  // 6. Handlers
  const handleClick = (): void => {
    // ...
  };

  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Functional Components Only

```typescript
// ✅ Good - Functional component with FC type
export const GameStatus: FC<GameStatusProps> = ({ phase, winner }) => {
  return <div>{/* ... */}</div>;
};

// ❌ Bad - Class component
class GameStatus extends React.Component { }
```

### Props Interface Naming

```typescript
// ✅ Good - ComponentName + Props
interface PlayerControlsProps { }
interface ScoreDisplayProps { }

// ❌ Bad - Generic or unclear naming
interface Props { }
interface IProps { }
```

### Hooks

**Custom Hook Naming**
```typescript
// ✅ Good - use prefix, descriptive name
function useDiceBox(): UseDiceBoxReturn { }
function useGameState(): UseGameStateReturn { }

// ❌ Bad - Missing use prefix
function diceBoxHook() { }
```

**Return Type Interfaces**
```typescript
// ✅ Good - Explicit return interface
interface UseGameStateReturn {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  rollDice: () => void;
  pass: () => void;
}

function useGameState(): UseGameStateReturn {
  // ...
}
```

### Event Handlers

```typescript
// ✅ Good - Typed event handlers
const handleRoll = (event: React.MouseEvent<HTMLButtonElement>): void => {
  event.preventDefault();
  rollDice();
};

// ✅ Good - When event object not needed
const handlePass = (): void => {
  passTurn();
};
```

### Conditional Rendering

```typescript
// ✅ Good - Early return for conditional rendering
if (phase === 'gameOver') {
  return <WinnerAnnouncement winner={winner} />;
}

return <GameBoard />;

// ✅ Good - Ternary for simple conditions
return isLoading ? <Spinner /> : <Content />;

// ✅ Good - && for presence checks
return (
  <>
    {lastRoll && <RollResult roll={lastRoll} />}
  </>
);
```

## File Organization

### Barrel Exports

Each directory with multiple exports should have an `index.ts`:

```typescript
// components/ScoreDisplay/index.ts
export { ScoreDisplay } from './ScoreDisplay';
export { PlayerScore } from './PlayerScore';

// Usage elsewhere
import { ScoreDisplay, PlayerScore } from '@/components/ScoreDisplay';
```

### Import Order

```typescript
// 1. React
import { useState, useEffect, type FC } from 'react';

// 2. External libraries
import DiceBox from '@3d-dice/dice-box';

// 3. Internal absolute imports (aliased)
import { GameRulesEngine } from '@/engines';
import { useGameState } from '@/hooks';
import { type GameState } from '@/interfaces';

// 4. Relative imports
import { PlayerScore } from './PlayerScore';

// 5. Styles
import './ScoreDisplay.css';
```

### Path Aliases

Configure these aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/engines/*": ["./src/engines/*"],
      "@/interfaces/*": ["./src/interfaces/*"],
      "@/types/*": ["./src/types/*"],
      "@/constants/*": ["./src/constants/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Components | PascalCase | `PlayerControls.tsx` |
| Hooks | camelCase with `use` | `useGameState.ts` |
| Interfaces (data) | PascalCase | `GameState` |
| Interfaces (abstractions) | PascalCase with `I` | `IPlayerService` |
| Types | PascalCase | `GamePhase` |
| Constants | SCREAMING_SNAKE_CASE | `WIN_SCORE` |
| Functions | camelCase | `calculateScore` |
| Event handlers | camelCase with `handle` | `handleRoll` |
| Boolean props/vars | camelCase with `is/has/can` | `isActive`, `hasWon` |

## Comments and Documentation

### JSDoc for Public APIs

```typescript
/**
 * Calculates the result of a dice roll.
 *
 * @param die1 - Value of the first die (1-6)
 * @param die2 - Value of the second die (1-6)
 * @returns DiceResult containing total, individual values, and derived properties
 *
 * @example
 * const result = calculateDiceResult(3, 4);
 * // { die1: 3, die2: 4, total: 7, isEven: false, lowerDie: 3, higherDie: 4 }
 */
export function calculateDiceResult(die1: number, die2: number): DiceResult {
  // ...
}
```

### Inline Comments

```typescript
// ✅ Good - Explains WHY, not WHAT
// Active player's score calculated first to determine winner priority
const activePlayerWins = checkWin(state.players[state.activePlayerIndex]);

// ❌ Bad - Explains obvious WHAT
// Add scores together
const total = score1 + score2;
```

## Error Handling

```typescript
// ✅ Good - Type-safe error handling
function handleDiceRoll(result: unknown): DiceResult {
  if (!isValidDiceResult(result)) {
    throw new Error('Invalid dice result received from dice-box');
  }
  return result;
}

// Type guard
function isValidDiceResult(value: unknown): value is DiceResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'die1' in value &&
    'die2' in value
  );
}
```
