# Prompt 07: Polish and Refinements

## Objective

Add final polish including animations, accessibility, error boundaries, and UX improvements.

## Instructions

### Step 1: Score Animation Hook

Create `src/hooks/useScoreAnimation.ts`:

```typescript
import { useState, useEffect, useRef } from 'react';

interface UseScoreAnimationOptions {
  value: number;
  duration?: number;
}

interface UseScoreAnimationReturn {
  displayValue: number;
  isAnimating: boolean;
}

/**
 * Animates a number value change for smooth score updates.
 */
export function useScoreAnimation({
  value,
  duration = 500,
}: UseScoreAnimationOptions): UseScoreAnimationReturn {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(value);

  useEffect(() => {
    if (value === previousValue.current) {
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    setIsAnimating(true);

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOut);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        previousValue.current = value;
      }
    };

    requestAnimationFrame(animate);
    previousValue.current = value;
  }, [value, duration]);

  return { displayValue, isAnimating };
}
```

Update `src/hooks/index.ts`:

```typescript
export * from './useDiceBox';
export * from './useGameState';
export * from './useTurnManager';
export * from './useAIPlayer';
export * from './useScoreAnimation';
```

### Step 2: Error Boundary Component

Create `src/components/shared/ErrorBoundary/ErrorBoundary.tsx`:

```typescript
import { Component, type ReactNode, type ErrorInfo } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Game error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__message">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button className="error-boundary__button" onClick={this.handleReset}>
              Restart Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Create `src/components/shared/ErrorBoundary/ErrorBoundary.css`:

```css
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  padding: 24px;
}

.error-boundary__content {
  background: white;
  padding: 48px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
}

.error-boundary__title {
  color: #e74c3c;
  margin: 0 0 16px;
}

.error-boundary__message {
  color: #666;
  margin: 0 0 24px;
}

.error-boundary__button {
  background: #4a90d9;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.error-boundary__button:hover {
  background: #357abd;
}
```

Create `src/components/shared/ErrorBoundary/index.ts`:

```typescript
export { ErrorBoundary } from './ErrorBoundary';
```

Update `src/components/shared/index.ts`:

```typescript
export * from './Button';
export * from './ErrorBoundary';
```

### Step 3: Update PlayerScore with Animation

Update `src/components/ScoreDisplay/PlayerScore.tsx`:

```typescript
import { type FC } from 'react';
import { type Player } from '@/interfaces';
import { useScoreAnimation } from '@/hooks';
import './PlayerScore.css';

interface PlayerScoreProps {
  player: Player;
  isActive: boolean;
}

export const PlayerScore: FC<PlayerScoreProps> = ({ player, isActive }) => {
  const { displayValue: officialScore, isAnimating: isOfficialAnimating } =
    useScoreAnimation({ value: player.officialScore });

  const { displayValue: tempScore, isAnimating: isTempAnimating } =
    useScoreAnimation({ value: player.tempScore, duration: 300 });

  const classes = ['player-score', isActive ? 'player-score--active' : ''].join(' ');

  return (
    <div className={classes} role="region" aria-label={`${player.name}'s score`}>
      <div className="player-score__header">
        <span className="player-score__name">{player.name}</span>
        {isActive && (
          <span className="player-score__indicator" aria-label="Current turn">
            ●
          </span>
        )}
      </div>

      <div className="player-score__scores">
        <div className="player-score__official">
          <span className="player-score__label">Score</span>
          <span
            className={`player-score__value ${
              isOfficialAnimating ? 'player-score__value--animating' : ''
            }`}
          >
            {officialScore}
          </span>
        </div>

        <div className="player-score__temp">
          <span className="player-score__label">At Risk</span>
          <span
            className={`player-score__value player-score__value--temp ${
              isTempAnimating ? 'player-score__value--animating' : ''
            }`}
          >
            {tempScore > 0 ? `+${tempScore}` : '0'}
          </span>
        </div>
      </div>

      <div className="player-score__total">
        <span className="player-score__label">Potential</span>
        <span className="player-score__value">{officialScore + tempScore}</span>
      </div>
    </div>
  );
};
```

Update `src/components/ScoreDisplay/PlayerScore.css`:

```css
/* Add to existing styles */

.player-score__value--animating {
  animation: scoreChange 0.3s ease;
}

@keyframes scoreChange {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
    color: #4a90d9;
  }
  100% {
    transform: scale(1);
  }
}
```

### Step 4: Loading State Component

Create `src/components/shared/LoadingSpinner/LoadingSpinner.tsx`:

```typescript
import { type FC } from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="loading-spinner" role="status" aria-label={message}>
      <div className="loading-spinner__ring" />
      <span className="loading-spinner__message">{message}</span>
    </div>
  );
};
```

Create `src/components/shared/LoadingSpinner/LoadingSpinner.css`:

```css
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

.loading-spinner__ring {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner__message {
  color: white;
  font-size: 16px;
}
```

Create `src/components/shared/LoadingSpinner/index.ts`:

```typescript
export { LoadingSpinner } from './LoadingSpinner';
```

Update `src/components/shared/index.ts`:

```typescript
export * from './Button';
export * from './ErrorBoundary';
export * from './LoadingSpinner';
```

### Step 5: Add Accessibility Improvements

Update `src/components/Game/Game.tsx`:

```typescript
import { type FC, useCallback } from 'react';
import { useGameContext } from '@/context';
import { useDiceBox, useTurnManager } from '@/hooks';
import { DiceBoard } from '@/components/DiceBoard';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { PlayerControls } from '@/components/PlayerControls';
import { GameStatus, WinnerAnnouncement } from '@/components/GameStatus';
import { ErrorBoundary, LoadingSpinner } from '@/components/shared';
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

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (!isHumanTurn) return;

      switch (event.key) {
        case 'r':
        case 'R':
        case ' ':
          if (canRoll && isReady) {
            event.preventDefault();
            triggerRoll();
          }
          break;
        case 'p':
        case 'P':
        case 'Enter':
          if (canPass) {
            event.preventDefault();
            triggerPass();
          }
          break;
      }
    },
    [isHumanTurn, canRoll, canPass, isReady, triggerRoll, triggerPass]
  );

  if (error) {
    return (
      <div className="game game--error" role="alert">
        <p>Failed to initialize dice: {error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const winner = isGameOver
    ? state.players.find(p => p.id === state.winner)
    : null;

  return (
    <div
      className="game"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Just Another Dice Game"
    >
      <header className="game__header">
        <h1 className="game__title">Just Another Dice Game</h1>
        <p className="game__subtitle">First to 50 wins!</p>
      </header>

      <main className="game__main">
        <ScoreDisplay />

        <GameStatus />

        {!isReady ? (
          <LoadingSpinner message="Preparing dice..." />
        ) : (
          <DiceBoard containerId={DICE_CONTAINER_ID} />
        )}

        <PlayerControls
          canRoll={canRoll && isReady}
          canPass={canPass}
          isRolling={isRolling}
          isHumanTurn={isHumanTurn}
          isAIThinking={isAIThinking}
          onRoll={handleRoll}
          onPass={handlePassClick}
        />

        {isHumanTurn && (
          <p className="game__hint" aria-live="polite">
            Press <kbd>R</kbd> or <kbd>Space</kbd> to roll, <kbd>P</kbd> or{' '}
            <kbd>Enter</kbd> to pass
          </p>
        )}
      </main>

      {winner && <WinnerAnnouncement winner={winner} onNewGame={() => handleNewGame()} />}
    </div>
  );
};
```

Update `src/components/Game/Game.css`:

```css
.game {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  outline: none;
}

.game:focus-visible {
  outline: 3px solid white;
  outline-offset: -3px;
}

.game--error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  gap: 16px;
}

.game__header {
  text-align: center;
  margin-bottom: 24px;
}

.game__title {
  color: white;
  font-size: 36px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.game__subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  margin: 8px 0 0;
}

.game__main {
  max-width: 800px;
  margin: 0 auto;
}

.game__hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-top: 16px;
}

.game__hint kbd {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: inherit;
}
```

### Step 6: Update App with Error Boundary

Update `src/App.tsx`:

```typescript
import { type FC } from 'react';
import { GameProvider } from '@/context';
import { Game } from '@/components/Game';
import { ErrorBoundary } from '@/components/shared';

const App: FC = () => {
  return (
    <ErrorBoundary>
      <GameProvider>
        <Game />
      </GameProvider>
    </ErrorBoundary>
  );
};

export default App;
```

### Step 7: Rules Help Modal (Optional Enhancement)

Create `src/components/GameStatus/RulesModal.tsx`:

```typescript
import { type FC } from 'react';
import { Button } from '@/components/shared';
import './RulesModal.css';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
      <div className="rules-modal__content">
        <h2 id="rules-title" className="rules-modal__title">
          How to Play
        </h2>

        <div className="rules-modal__body">
          <section>
            <h3>Goal</h3>
            <p>Be the first player to reach 50 points.</p>
          </section>

          <section>
            <h3>On Your Turn</h3>
            <p>Roll two dice. The total determines what happens:</p>
          </section>

          <section>
            <h3>Even Total (2, 4, 6, 8, 10, 12)</h3>
            <ul>
              <li>You gain the total as "at risk" points</li>
              <li>Your opponent gains the lower die value as "at risk" points</li>
              <li>Choose to roll again or pass</li>
            </ul>
          </section>

          <section>
            <h3>Odd Total (3, 5, 7, 9, 11)</h3>
            <ul>
              <li>You lose all your "at risk" points</li>
              <li>Your opponent banks their "at risk" points</li>
              <li>Turn ends</li>
            </ul>
          </section>

          <section>
            <h3>Passing</h3>
            <ul>
              <li>Your "at risk" points become permanent score</li>
              <li>Opponent loses their "at risk" points</li>
              <li>Turn ends</li>
            </ul>
          </section>
        </div>

        <Button onClick={onClose} variant="primary">
          Got it!
        </Button>
      </div>
    </div>
  );
};
```

Create `src/components/GameStatus/RulesModal.css`:

```css
.rules-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.rules-modal__content {
  background: white;
  padding: 32px;
  border-radius: 16px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.rules-modal__title {
  margin: 0 0 24px;
  color: #333;
}

.rules-modal__body {
  margin-bottom: 24px;
}

.rules-modal__body section {
  margin-bottom: 16px;
}

.rules-modal__body h3 {
  color: #4a90d9;
  font-size: 16px;
  margin: 0 0 8px;
}

.rules-modal__body p,
.rules-modal__body li {
  color: #666;
  line-height: 1.5;
}

.rules-modal__body ul {
  margin: 0;
  padding-left: 20px;
}

.rules-modal__body li {
  margin-bottom: 4px;
}
```

Update `src/components/GameStatus/index.ts`:

```typescript
export { GameStatus } from './GameStatus';
export { WinnerAnnouncement } from './WinnerAnnouncement';
export { RulesModal } from './RulesModal';
```

## Completion Checklist

- [ ] `useScoreAnimation.ts` - Smooth score value transitions
- [ ] `ErrorBoundary` component - Graceful error handling
- [ ] `LoadingSpinner` component - Loading state display
- [ ] Animated score changes in `PlayerScore`
- [ ] Keyboard shortcuts (R/Space for roll, P/Enter for pass)
- [ ] ARIA labels and roles for accessibility
- [ ] Keyboard hint text for controls
- [ ] `RulesModal` for game instructions (optional)
- [ ] Error boundary wrapping the app

## Verification

```bash
npm run dev
```

Test:
1. Score animations when values change
2. Keyboard controls work
3. Error boundary catches errors gracefully
4. Loading spinner appears while dice initialize
5. Screen reader announces game status changes

## Final Testing Checklist

- [ ] Complete game plays from start to finish
- [ ] Human player can roll and pass
- [ ] AI takes turns automatically
- [ ] Scores update correctly per rules
- [ ] Win condition triggers at 50 points
- [ ] "Play Again" resets the game
- [ ] No console errors during gameplay
- [ ] Works on different screen sizes

## Congratulations! 🎉

You have completed the implementation of Just Another Dice Game!

### Future Enhancements to Consider

1. **Multiplayer**: Replace AI with second human player
2. **Difficulty Levels**: Adjust AI risk tolerance
3. **Statistics**: Track win/loss record
4. **Sound Effects**: Roll sounds, win fanfare
5. **Themes**: Different dice styles and backgrounds
6. **Mobile Optimization**: Touch-friendly controls
7. **Undo**: Allow taking back a pass decision
