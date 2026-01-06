# Prompt 06: AI Player

## Objective

Implement a proper AI opponent with strategic decision-making.

## Instructions

### Step 1: AI Player Service

Create `src/services/AIPlayerService.ts`:

```typescript
import { type PlayerAction } from '@/types';
import { type GameState, type IPlayerService } from '@/interfaces';
import { AI_CONFIG, WIN_SCORE } from '@/constants';
import { getOpponentIndex } from '@/engines';

/**
 * AI decision-making service.
 * Implements IPlayerService for dependency inversion.
 *
 * Strategy Overview:
 * - Conservative: Pass when accumulated temp score reaches threshold
 * - Adaptive: Take more risks when opponent is close to winning
 * - Unpredictable: Add randomness to prevent exploitation
 */
export class AIPlayerService implements IPlayerService {
  readonly requiresUserInput = false;

  /**
   * Determine the AI's next action based on game state.
   * Returns immediately (no user interaction needed).
   */
  async decideAction(state: Readonly<GameState>): Promise<PlayerAction> {
    return this.calculateOptimalAction(state);
  }

  /**
   * Core decision algorithm.
   * Weighs risk vs reward based on current scores.
   */
  private calculateOptimalAction(state: Readonly<GameState>): PlayerAction {
    const aiPlayer = state.players[state.activePlayerIndex];
    const opponentIndex = getOpponentIndex(state.activePlayerIndex);
    const opponent = state.players[opponentIndex];

    // Calculate risk factors
    const tempScore = aiPlayer.tempScore;
    const officialScore = aiPlayer.officialScore;
    const opponentOfficialScore = opponent.officialScore;
    const opponentTempScore = opponent.tempScore;

    // Would passing win the game?
    if (officialScore + tempScore >= WIN_SCORE) {
      return 'pass'; // Always pass if it wins
    }

    // Is opponent dangerously close to winning?
    const opponentDanger = opponentOfficialScore >= AI_CONFIG.OPPONENT_DANGER_THRESHOLD;

    // Calculate pass threshold (dynamic based on game state)
    let passThreshold = AI_CONFIG.SAFE_SCORE_THRESHOLD;

    if (opponentDanger) {
      // Take more risks if opponent is close to winning
      passThreshold = 25;
    }

    // Factor in opponent's temp score
    // If opponent has high temp, rolling odd would bank their score
    if (opponentTempScore >= 10) {
      // Be more conservative to avoid giving opponent points
      passThreshold = Math.max(10, passThreshold - 5);
    }

    // Add randomness for unpredictability
    const randomAdjustment = (Math.random() - 0.5) * 2 * AI_CONFIG.RANDOMNESS_FACTOR * passThreshold;
    const adjustedThreshold = passThreshold + randomAdjustment;

    // Make decision
    if (tempScore >= adjustedThreshold) {
      return 'pass';
    }

    return 'roll';
  }
}

/**
 * Factory function to create AI service.
 * Allows for future difficulty levels.
 */
export function createAIPlayerService(): IPlayerService {
  return new AIPlayerService();
}
```

Create `src/services/index.ts`:

```typescript
export * from './AIPlayerService';
```

### Step 2: AI Player Hook

Create `src/hooks/useAIPlayer.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { type GameState } from '@/interfaces';
import { type PlayerAction } from '@/types';
import { createAIPlayerService } from '@/services';
import { isHumanTurn, canRoll, canPass, isGameOver } from '@/engines';

interface UseAIPlayerOptions {
  state: GameState;
  onRoll: () => void;
  onPass: () => void;
  isRolling: boolean;
  /** Delay before AI acts (ms) for better UX */
  actionDelay?: number;
}

interface UseAIPlayerReturn {
  /** Whether AI is currently "thinking" */
  isThinking: boolean;
}

/**
 * Hook to automate AI player turns.
 * Watches game state and triggers actions when it's AI's turn.
 */
export function useAIPlayer({
  state,
  onRoll,
  onPass,
  isRolling,
  actionDelay = 1200,
}: UseAIPlayerOptions): UseAIPlayerReturn {
  const aiServiceRef = useRef(createAIPlayerService());
  const isThinkingRef = useRef(false);
  const actionInProgressRef = useRef(false);

  const executeAIAction = useCallback(
    async (action: PlayerAction): Promise<void> => {
      // Add delay for UX
      await new Promise(resolve => setTimeout(resolve, actionDelay));

      if (action === 'roll') {
        onRoll();
      } else {
        onPass();
      }

      actionInProgressRef.current = false;
      isThinkingRef.current = false;
    },
    [actionDelay, onRoll, onPass]
  );

  useEffect(() => {
    // Don't act if game is over
    if (isGameOver(state)) {
      return;
    }

    // Don't act if it's human's turn
    if (isHumanTurn(state)) {
      actionInProgressRef.current = false;
      isThinkingRef.current = false;
      return;
    }

    // Don't act if dice are rolling
    if (isRolling) {
      return;
    }

    // Don't act if action already in progress
    if (actionInProgressRef.current) {
      return;
    }

    // Don't act if no action available
    if (!canRoll(state) && !canPass(state)) {
      return;
    }

    // It's AI's turn and we can act
    actionInProgressRef.current = true;
    isThinkingRef.current = true;

    // Decide and execute
    const performAction = async (): Promise<void> => {
      const action = await aiServiceRef.current.decideAction(state);
      await executeAIAction(action);
    };

    performAction();
  }, [state, isRolling, executeAIAction]);

  return {
    isThinking: isThinkingRef.current,
  };
}
```

Update `src/hooks/index.ts`:

```typescript
export * from './useDiceBox';
export * from './useGameState';
export * from './useTurnManager';
export * from './useAIPlayer';
```

### Step 3: Update Turn Manager

Update `src/hooks/useTurnManager.ts` to use the new AI hook:

```typescript
import { useCallback } from 'react';
import { type GameState, type DiceResult } from '@/interfaces';
import { isHumanTurn } from '@/engines';
import { useAIPlayer } from './useAIPlayer';

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

  /** Whether AI is thinking */
  isAIThinking: boolean;

  /** Trigger the roll action (for human) */
  triggerRoll: () => void;

  /** Trigger the pass action (for human) */
  triggerPass: () => void;
}

/**
 * Orchestrates turn flow between human and AI players.
 * Delegates AI logic to useAIPlayer hook.
 */
export function useTurnManager({
  state,
  onPass,
  rollDice,
  isRolling,
}: UseTurnManagerOptions): UseTurnManagerReturn {
  const isHuman = isHumanTurn(state);

  // AI automation
  const { isThinking: isAIThinking } = useAIPlayer({
    state,
    onRoll: rollDice,
    onPass,
    isRolling,
  });

  // Human actions
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
    isAIThinking,
    triggerRoll,
    triggerPass,
  };
}
```

### Step 4: Update Player Controls

Update the `PlayerControls` component to show AI thinking state:

Update `src/components/PlayerControls/PlayerControls.tsx`:

```typescript
import { type FC } from 'react';
import { Button } from '@/components/shared';
import './PlayerControls.css';

interface PlayerControlsProps {
  canRoll: boolean;
  canPass: boolean;
  isRolling: boolean;
  isHumanTurn: boolean;
  isAIThinking?: boolean;
  onRoll: () => void;
  onPass: () => void;
}

export const PlayerControls: FC<PlayerControlsProps> = ({
  canRoll,
  canPass,
  isRolling,
  isHumanTurn,
  isAIThinking = false,
  onRoll,
  onPass,
}) => {
  if (!isHumanTurn) {
    return (
      <div className="player-controls player-controls--waiting">
        <span className="player-controls__message">
          {isAIThinking ? 'Computer is thinking...' : 'Computer\'s turn...'}
        </span>
        <div className="player-controls__dots">
          <span className="player-controls__dot" />
          <span className="player-controls__dot" />
          <span className="player-controls__dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="player-controls">
      <Button
        onClick={onRoll}
        disabled={!canRoll || isRolling}
        size="large"
        variant="primary"
      >
        {isRolling ? 'Rolling...' : canPass ? 'Roll Again' : 'Roll Dice'}
      </Button>

      {canPass && (
        <Button onClick={onPass} disabled={isRolling} size="large" variant="secondary">
          Pass (Bank Score)
        </Button>
      )}
    </div>
  );
};
```

Add animated dots to the CSS:

Update `src/components/PlayerControls/PlayerControls.css`:

```css
.player-controls {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 20px;
}

.player-controls--waiting {
  flex-direction: column;
  align-items: center;
  min-height: 80px;
}

.player-controls__message {
  font-size: 18px;
  color: #666;
  font-style: italic;
}

.player-controls__dots {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.player-controls__dot {
  width: 12px;
  height: 12px;
  background: #4a90d9;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.player-controls__dot:nth-child(1) {
  animation-delay: -0.32s;
}

.player-controls__dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
```

### Step 5: Update Game Component

Update `src/components/Game/Game.tsx` to pass AI thinking state:

```typescript
import { type FC, useCallback } from 'react';
import { useGameContext } from '@/context';
import { useDiceBox, useTurnManager } from '@/hooks';
import { DiceBoard } from '@/components/DiceBoard';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { PlayerControls } from '@/components/PlayerControls';
import { GameStatus, WinnerAnnouncement } from '@/components/GameStatus';
import './Game.css';

const DICE_CONTAINER_ID = 'dice-container';

export const Game: FC = () => {
  const {
    state,
    handleRollComplete,
    handlePass,
    handleNewGame,
    canRoll,
    canPass,
    isGameOver,
  } = useGameContext();

  const { isReady, isRolling, roll, error } = useDiceBox({
    containerId: DICE_CONTAINER_ID,
    callbacks: {
      onRollComplete: handleRollComplete,
      onRollError: err => console.error('Dice roll error:', err),
    },
  });

  const { isHumanTurn, isAIThinking, triggerRoll, triggerPass } = useTurnManager({
    state,
    onRollComplete: handleRollComplete,
    onPass: handlePass,
    rollDice: roll,
    isRolling,
  });

  const handleRoll = useCallback((): void => {
    if (isReady && canRoll) {
      triggerRoll();
    }
  }, [isReady, canRoll, triggerRoll]);

  const handlePassClick = useCallback((): void => {
    triggerPass();
  }, [triggerPass]);

  if (error) {
    return (
      <div className="game game--error">
        <p>Failed to initialize dice: {error.message}</p>
      </div>
    );
  }

  const winner = isGameOver
    ? state.players.find(p => p.id === state.winner)
    : null;

  return (
    <div className="game">
      <header className="game__header">
        <h1 className="game__title">Just Another Dice Game</h1>
      </header>

      <ScoreDisplay />

      <GameStatus />

      <DiceBoard containerId={DICE_CONTAINER_ID} />

      <PlayerControls
        canRoll={canRoll && isReady}
        canPass={canPass}
        isRolling={isRolling}
        isHumanTurn={isHumanTurn}
        isAIThinking={isAIThinking}
        onRoll={handleRoll}
        onPass={handlePassClick}
      />

      {winner && <WinnerAnnouncement winner={winner} onNewGame={() => handleNewGame()} />}
    </div>
  );
};
```

## Completion Checklist

- [ ] `AIPlayerService.ts` - Strategic decision-making
- [ ] `useAIPlayer.ts` - AI turn automation hook
- [ ] Updated `useTurnManager.ts` - Integration with AI hook
- [ ] Updated `PlayerControls.tsx` - AI thinking state display
- [ ] Updated `Game.tsx` - Pass AI thinking state
- [ ] AI makes reasonable decisions (passes with high temp, takes risks when behind)
- [ ] AI has visible "thinking" delay for UX

## Verification

```bash
npm run dev
```

Test the AI by:
1. Rolling and passing to let AI take turns
2. Verify AI passes when it has accumulated ~15+ points
3. Verify AI takes more risks when behind
4. Verify animated "thinking" indicator appears

## AI Strategy Summary

| Condition | Behavior |
|-----------|----------|
| Can win by passing | Always pass |
| Opponent score ≥ 40 | Increase risk tolerance (pass at 25) |
| Opponent temp ≥ 10 | Decrease risk tolerance (avoid banking their score) |
| Default | Pass at ~15 temp score |
| All decisions | ±20% random variation for unpredictability |

## Next Step

Proceed to `07-polish.md` for final UX refinements.
