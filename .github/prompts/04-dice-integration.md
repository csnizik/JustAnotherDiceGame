# Prompt 04: Dice Box Integration

## Objective

Integrate @3d-dice/dice-box for 3D dice rendering and roll animations.

## Reference

- [@3d-dice/dice-box documentation](https://fantasticdice.games/docs/usage/config)

## Instructions

### Step 1: Dice Utilities

Create `src/utils/diceUtils.ts`:

```typescript
import { type DiceResult } from '@/interfaces';
import { type DieFace } from '@/types';
import { calculateDiceResult } from '@/engines';

/**
 * Parses dice-box roll result into our DiceResult format.
 * dice-box returns an array of roll objects.
 */
export interface DiceBoxRollValue {
  value: number;
  // dice-box includes other properties we don't need
}

/**
 * Extracts die values from dice-box result format.
 * @throws Error if result doesn't contain exactly 2 valid dice
 */
export function parseDiceBoxResult(rollResults: DiceBoxRollValue[]): DiceResult {
  if (rollResults.length !== 2) {
    throw new Error(`Expected 2 dice, got ${rollResults.length}`);
  }

  const die1 = rollResults[0]?.value;
  const die2 = rollResults[1]?.value;

  if (die1 === undefined || die2 === undefined) {
    throw new Error('Invalid dice result: missing values');
  }

  return calculateDiceResult(die1, die2);
}

/**
 * Generates random die values for testing without dice-box.
 */
export function generateRandomRoll(): DiceResult {
  const die1 = (Math.floor(Math.random() * 6) + 1) as DieFace;
  const die2 = (Math.floor(Math.random() * 6) + 1) as DieFace;
  return calculateDiceResult(die1, die2);
}
```

Update `src/utils/index.ts`:

```typescript
export * from './typeGuards';
export * from './diceUtils';
```

### Step 2: Dice Box Hook

Create `src/hooks/useDiceBox.ts`:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import DiceBox from '@3d-dice/dice-box';
import { type DiceResult, type IDiceCallbacks } from '@/interfaces';
import { parseDiceBoxResult, type DiceBoxRollValue } from '@/utils';

interface UseDiceBoxOptions {
  /** Container element ID for the dice canvas */
  containerId: string;
  /** Callbacks for roll lifecycle */
  callbacks: IDiceCallbacks;
}

interface UseDiceBoxReturn {
  /** Whether dice-box is initialized and ready */
  isReady: boolean;
  /** Whether dice are currently rolling */
  isRolling: boolean;
  /** Trigger a dice roll */
  roll: () => Promise<void>;
  /** Error if initialization failed */
  error: Error | null;
}

/**
 * Hook to manage @3d-dice/dice-box lifecycle.
 *
 * Handles initialization, cleanup, and roll triggering.
 * Converts dice-box results to our DiceResult format.
 */
export function useDiceBox({ containerId, callbacks }: UseDiceBoxOptions): UseDiceBoxReturn {
  const diceBoxRef = useRef<DiceBox | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Store callbacks in ref to avoid re-initialization on callback changes
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Initialize dice-box
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      setError(new Error(`Container element "${containerId}" not found`));
      return;
    }

    const initDiceBox = async (): Promise<void> => {
      try {
        const diceBox = new DiceBox('#' + containerId, {
          assetPath: '/dice-box-assets/',
          theme: 'default',
          scale: 6,
          throwForce: 5,
          spinForce: 4,
          lightIntensity: 1,
          shadowTransparency: 0.8,
        });

        await diceBox.init();

        // Set up roll complete handler
        diceBox.onRollComplete = (results: DiceBoxRollValue[]) => {
          try {
            const diceResult = parseDiceBoxResult(results);
            setIsRolling(false);
            callbacksRef.current.onRollComplete(diceResult);
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to parse roll');
            setIsRolling(false);
            callbacksRef.current.onRollError?.(error);
          }
        };

        diceBoxRef.current = diceBox;
        setIsReady(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize dice-box');
        setError(error);
      }
    };

    initDiceBox();

    // Cleanup on unmount
    return () => {
      if (diceBoxRef.current) {
        diceBoxRef.current.clear();
        diceBoxRef.current = null;
      }
    };
  }, [containerId]);

  // Roll function
  const roll = useCallback(async (): Promise<void> => {
    if (!diceBoxRef.current || !isReady || isRolling) {
      return;
    }

    setIsRolling(true);
    callbacksRef.current.onRollStart?.();

    try {
      // Roll 2d6 (two six-sided dice)
      await diceBoxRef.current.roll('2d6');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Roll failed');
      setIsRolling(false);
      callbacksRef.current.onRollError?.(error);
    }
  }, [isReady, isRolling]);

  return {
    isReady,
    isRolling,
    roll,
    error,
  };
}
```

### Step 3: Game State Hook

Create `src/hooks/useGameState.ts`:

```typescript
import { useState, useCallback, useMemo } from 'react';
import { type GameState, type DiceResult, type GameInitOptions } from '@/interfaces';
import {
  createInitialState,
  processRoll,
  applyPass,
  setRollingPhase,
  resetGame,
} from '@/engines';
import { canRoll, canPass, isGameOver } from '@/engines';

interface UseGameStateReturn {
  /** Current game state */
  state: GameState;

  /** Process a dice roll result */
  handleRollComplete: (result: DiceResult) => void;

  /** Handle player choosing to roll again */
  handleRollAgain: () => void;

  /** Handle player choosing to pass */
  handlePass: () => void;

  /** Start a new game */
  handleNewGame: (options?: Partial<GameInitOptions>) => void;

  /** Whether rolling is allowed */
  canRoll: boolean;

  /** Whether passing is allowed */
  canPass: boolean;

  /** Whether game is over */
  isGameOver: boolean;
}

/**
 * Central game state management hook.
 * Orchestrates state updates through the game engine.
 */
export function useGameState(initialOptions?: Partial<GameInitOptions>): UseGameStateReturn {
  const [state, setState] = useState<GameState>(() => createInitialState(initialOptions));

  const handleRollComplete = useCallback((result: DiceResult): void => {
    setState(currentState => processRoll(currentState, result));
  }, []);

  const handleRollAgain = useCallback((): void => {
    setState(currentState => {
      if (!canRoll(currentState)) return currentState;
      return setRollingPhase(currentState);
    });
  }, []);

  const handlePass = useCallback((): void => {
    setState(currentState => {
      if (!canPass(currentState)) return currentState;
      return applyPass(currentState);
    });
  }, []);

  const handleNewGame = useCallback((options?: Partial<GameInitOptions>): void => {
    setState(resetGame(options));
  }, []);

  const derivedState = useMemo(
    () => ({
      canRoll: canRoll(state),
      canPass: canPass(state),
      isGameOver: isGameOver(state),
    }),
    [state]
  );

  return {
    state,
    handleRollComplete,
    handleRollAgain,
    handlePass,
    handleNewGame,
    ...derivedState,
  };
}
```

### Step 4: Turn Manager Hook

Create `src/hooks/useTurnManager.ts`:

```typescript
import { useCallback, useEffect, useRef } from 'react';
import { type GameState, type DiceResult } from '@/interfaces';
import { isHumanTurn } from '@/engines';

interface UseTurnManagerOptions {
  state: GameState;
  onRollComplete: (result: DiceResult) => void;
  onPass: () => void;
  rollDice: () => Promise<void>;
  isRolling: boolean;
}

interface UseTurnManagerReturn {
  /** Whether it's the human player's turn */
  isHumanTurn: boolean;

  /** Trigger the roll action (handles human vs AI) */
  triggerRoll: () => void;

  /** Trigger the pass action */
  triggerPass: () => void;
}

/**
 * Orchestrates turn flow between human and AI players.
 * Automatically triggers AI actions when it's the AI's turn.
 */
export function useTurnManager({
  state,
  onPass,
  rollDice,
  isRolling,
}: UseTurnManagerOptions): UseTurnManagerReturn {
  const isHuman = isHumanTurn(state);
  const hasTriggeredAI = useRef(false);

  // Auto-trigger AI roll when it becomes AI's turn
  useEffect(() => {
    const shouldAIAct =
      !isHuman &&
      (state.phase === 'idle' || state.phase === 'rolling' || state.phase === 'deciding') &&
      !isRolling &&
      state.phase !== 'gameOver';

    if (shouldAIAct && !hasTriggeredAI.current) {
      hasTriggeredAI.current = true;

      // AI decision delay for UX
      const delay = state.phase === 'deciding' ? 1500 : 800;

      const timer = setTimeout(() => {
        // AI logic will be implemented in useAIPlayer
        // For now, just trigger roll
        if (state.phase === 'deciding') {
          // Simple AI: pass if temp score > 15
          const aiPlayer = state.players[state.activePlayerIndex];
          if (aiPlayer.tempScore >= 15) {
            onPass();
          } else {
            rollDice();
          }
        } else {
          rollDice();
        }
      }, delay);

      return () => clearTimeout(timer);
    }

    // Reset flag when turn changes
    if (isHuman) {
      hasTriggeredAI.current = false;
    }
  }, [isHuman, state.phase, isRolling, state, rollDice, onPass]);

  const triggerRoll = useCallback((): void => {
    if (isHuman && !isRolling) {
      rollDice();
    }
  }, [isHuman, isRolling, rollDice]);

  const triggerPass = useCallback((): void => {
    if (isHuman) {
      onPass();
    }
  }, [isHuman, onPass]);

  return {
    isHumanTurn: isHuman,
    triggerRoll,
    triggerPass,
  };
}
```

### Step 5: Barrel Export

Create `src/hooks/index.ts`:

```typescript
export * from './useDiceBox';
export * from './useGameState';
export * from './useTurnManager';
```

## Completion Checklist

- [ ] `src/utils/diceUtils.ts` - Dice-box result parsing
- [ ] `src/hooks/useDiceBox.ts` - Dice-box lifecycle management
- [ ] `src/hooks/useGameState.ts` - Game state management
- [ ] `src/hooks/useTurnManager.ts` - Turn orchestration
- [ ] `src/hooks/index.ts` - Barrel export
- [ ] Dice-box assets copied to `/public/dice-box-assets/`
- [ ] All hooks follow React conventions

## Verification

```bash
# Ensure no type errors
npx tsc --noEmit
```

## Notes on dice-box

- dice-box requires a DOM container element
- Initialization is async
- Results come via the `onRollComplete` callback
- The library handles physics and rendering

## Next Step

Proceed to `05-components.md` to build the React UI components.
