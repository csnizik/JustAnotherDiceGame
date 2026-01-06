# Prompt 05: React Components

## Objective

Build the React UI components following the architecture defined in `ARCHITECTURE.md`.

## Instructions

### Step 1: Game Context

Create `src/context/GameContext.tsx`:

```typescript
import { createContext, useContext, useMemo, type FC, type ReactNode } from 'react';
import { type GameState, type DiceResult, type GameInitOptions } from '@/interfaces';
import { useGameState } from '@/hooks';

interface GameContextValue {
  state: GameState;
  handleRollComplete: (result: DiceResult) => void;
  handleRollAgain: () => void;
  handlePass: () => void;
  handleNewGame: (options?: Partial<GameInitOptions>) => void;
  canRoll: boolean;
  canPass: boolean;
  isGameOver: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
  initialOptions?: Partial<GameInitOptions>;
}

export const GameProvider: FC<GameProviderProps> = ({ children, initialOptions }) => {
  const gameState = useGameState(initialOptions);

  const value = useMemo(() => gameState, [gameState]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
```

Create `src/context/index.ts`:

```typescript
export * from './GameContext';
```

### Step 2: Shared Button Component

Create `src/components/shared/Button/Button.tsx`:

```typescript
import { type FC, type ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled,
  children,
  ...props
}) => {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    disabled ? 'button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
```

Create `src/components/shared/Button/Button.css`:

```css
.button {
  font-family: inherit;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:focus-visible {
  outline: 2px solid #4a90d9;
  outline-offset: 2px;
}

.button--primary {
  background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
  color: white;
}

.button--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #357abd 0%, #2868a6 100%);
  transform: translateY(-1px);
}

.button--secondary {
  background: #f0f0f0;
  color: #333;
}

.button--secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.button--small {
  padding: 8px 16px;
  font-size: 14px;
}

.button--medium {
  padding: 12px 24px;
  font-size: 16px;
}

.button--large {
  padding: 16px 32px;
  font-size: 18px;
}

.button--disabled,
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

Create `src/components/shared/Button/index.ts`:

```typescript
export { Button } from './Button';
```

Create `src/components/shared/index.ts`:

```typescript
export * from './Button';
```

### Step 3: Score Display Component

Create `src/components/ScoreDisplay/PlayerScore.tsx`:

```typescript
import { type FC } from 'react';
import { type Player } from '@/interfaces';
import './PlayerScore.css';

interface PlayerScoreProps {
  player: Player;
  isActive: boolean;
}

export const PlayerScore: FC<PlayerScoreProps> = ({ player, isActive }) => {
  const classes = ['player-score', isActive ? 'player-score--active' : ''].join(' ');

  return (
    <div className={classes}>
      <div className="player-score__header">
        <span className="player-score__name">{player.name}</span>
        {isActive && <span className="player-score__indicator">●</span>}
      </div>

      <div className="player-score__scores">
        <div className="player-score__official">
          <span className="player-score__label">Score</span>
          <span className="player-score__value">{player.officialScore}</span>
        </div>

        <div className="player-score__temp">
          <span className="player-score__label">At Risk</span>
          <span className="player-score__value player-score__value--temp">
            {player.tempScore > 0 ? `+${player.tempScore}` : '0'}
          </span>
        </div>
      </div>

      <div className="player-score__total">
        <span className="player-score__label">Potential</span>
        <span className="player-score__value">
          {player.officialScore + player.tempScore}
        </span>
      </div>
    </div>
  );
};
```

Create `src/components/ScoreDisplay/PlayerScore.css`:

```css
.player-score {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-width: 180px;
}

.player-score--active {
  box-shadow: 0 4px 16px rgba(74, 144, 217, 0.3);
  border: 2px solid #4a90d9;
}

.player-score__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.player-score__name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.player-score__indicator {
  color: #4a90d9;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.player-score__scores {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.player-score__official,
.player-score__temp,
.player-score__total {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-score__label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.player-score__value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.player-score__value--temp {
  color: #e67e22;
}

.player-score__total {
  padding-top: 12px;
  border-top: 1px solid #eee;
}
```

Create `src/components/ScoreDisplay/ScoreDisplay.tsx`:

```typescript
import { type FC } from 'react';
import { useGameContext } from '@/context';
import { PlayerScore } from './PlayerScore';
import './ScoreDisplay.css';

export const ScoreDisplay: FC = () => {
  const { state } = useGameContext();
  const { players, activePlayerIndex } = state;

  return (
    <div className="score-display">
      <PlayerScore player={players[0]} isActive={activePlayerIndex === 0} />
      <div className="score-display__vs">VS</div>
      <PlayerScore player={players[1]} isActive={activePlayerIndex === 1} />
    </div>
  );
};
```

Create `src/components/ScoreDisplay/ScoreDisplay.css`:

```css
.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px;
}

.score-display__vs {
  font-size: 24px;
  font-weight: 700;
  color: #999;
}
```

Create `src/components/ScoreDisplay/index.ts`:

```typescript
export { ScoreDisplay } from './ScoreDisplay';
export { PlayerScore } from './PlayerScore';
```

### Step 4: Dice Board Component

Create `src/components/DiceBoard/DiceBoard.tsx`:

```typescript
import { type FC, useEffect, useRef } from 'react';
import './DiceBoard.css';

interface DiceBoardProps {
  containerId: string;
}

/**
 * Container for the 3D dice rendering.
 * dice-box will mount its canvas inside this element.
 */
export const DiceBoard: FC<DiceBoardProps> = ({ containerId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure container has dimensions for dice-box
    if (containerRef.current) {
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '300px';
    }
  }, []);

  return (
    <div className="dice-board">
      <div ref={containerRef} id={containerId} className="dice-board__canvas" />
    </div>
  );
};
```

Create `src/components/DiceBoard/DiceBoard.css`:

```css
.dice-board {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: linear-gradient(135deg, #2c5530 0%, #1a3a1d 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
}

.dice-board__canvas {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
}
```

Create `src/components/DiceBoard/index.ts`:

```typescript
export { DiceBoard } from './DiceBoard';
```

### Step 5: Player Controls Component

Create `src/components/PlayerControls/PlayerControls.tsx`:

```typescript
import { type FC } from 'react';
import { Button } from '@/components/shared';
import './PlayerControls.css';

interface PlayerControlsProps {
  canRoll: boolean;
  canPass: boolean;
  isRolling: boolean;
  isHumanTurn: boolean;
  onRoll: () => void;
  onPass: () => void;
}

export const PlayerControls: FC<PlayerControlsProps> = ({
  canRoll,
  canPass,
  isRolling,
  isHumanTurn,
  onRoll,
  onPass,
}) => {
  const showControls = isHumanTurn;

  if (!showControls) {
    return (
      <div className="player-controls player-controls--waiting">
        <span className="player-controls__message">Computer is thinking...</span>
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

Create `src/components/PlayerControls/PlayerControls.css`:

```css
.player-controls {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 20px;
}

.player-controls--waiting {
  min-height: 80px;
  align-items: center;
}

.player-controls__message {
  font-size: 18px;
  color: #666;
  font-style: italic;
}
```

Create `src/components/PlayerControls/index.ts`:

```typescript
export { PlayerControls } from './PlayerControls';
```

### Step 6: Game Status Component

Create `src/components/GameStatus/GameStatus.tsx`:

```typescript
import { type FC } from 'react';
import { useGameContext } from '@/context';
import { getPhaseDescription } from '@/engines';
import './GameStatus.css';

export const GameStatus: FC = () => {
  const { state } = useGameContext();
  const description = getPhaseDescription(state);

  return (
    <div className="game-status">
      <p className="game-status__message">{description}</p>

      {state.lastRoll && state.phase !== 'gameOver' && (
        <div className="game-status__roll">
          <span className="game-status__dice">
            {state.lastRoll.die1} + {state.lastRoll.die2} = {state.lastRoll.total}
          </span>
          <span
            className={`game-status__result ${
              state.lastRoll.isEven ? 'game-status__result--even' : 'game-status__result--odd'
            }`}
          >
            {state.lastRoll.isEven ? 'EVEN!' : 'ODD'}
          </span>
        </div>
      )}
    </div>
  );
};
```

Create `src/components/GameStatus/WinnerAnnouncement.tsx`:

```typescript
import { type FC } from 'react';
import { Button } from '@/components/shared';
import { type Player } from '@/interfaces';
import './WinnerAnnouncement.css';

interface WinnerAnnouncementProps {
  winner: Player;
  onNewGame: () => void;
}

export const WinnerAnnouncement: FC<WinnerAnnouncementProps> = ({ winner, onNewGame }) => {
  return (
    <div className="winner-announcement">
      <div className="winner-announcement__content">
        <h2 className="winner-announcement__title">🎉 Game Over! 🎉</h2>
        <p className="winner-announcement__winner">{winner.name} wins!</p>
        <p className="winner-announcement__score">Final Score: {winner.officialScore}</p>
        <Button onClick={onNewGame} size="large" variant="primary">
          Play Again
        </Button>
      </div>
    </div>
  );
};
```

Create `src/components/GameStatus/GameStatus.css`:

```css
.game-status {
  text-align: center;
  padding: 16px;
}

.game-status__message {
  font-size: 20px;
  color: #333;
  margin: 0 0 12px;
}

.game-status__roll {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.game-status__dice {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.game-status__result {
  font-size: 18px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 4px;
}

.game-status__result--even {
  background: #27ae60;
  color: white;
}

.game-status__result--odd {
  background: #e74c3c;
  color: white;
}
```

Create `src/components/GameStatus/WinnerAnnouncement.css`:

```css
.winner-announcement {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.winner-announcement__content {
  background: white;
  padding: 48px;
  border-radius: 16px;
  text-align: center;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.winner-announcement__title {
  font-size: 32px;
  margin: 0 0 16px;
}

.winner-announcement__winner {
  font-size: 28px;
  font-weight: 700;
  color: #4a90d9;
  margin: 0 0 8px;
}

.winner-announcement__score {
  font-size: 20px;
  color: #666;
  margin: 0 0 24px;
}
```

Create `src/components/GameStatus/index.ts`:

```typescript
export { GameStatus } from './GameStatus';
export { WinnerAnnouncement } from './WinnerAnnouncement';
```

### Step 7: Main Game Component

Create `src/components/Game/Game.tsx`:

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

  const { isHumanTurn, triggerRoll, triggerPass } = useTurnManager({
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
        onRoll={handleRoll}
        onPass={handlePassClick}
      />

      {winner && <WinnerAnnouncement winner={winner} onNewGame={() => handleNewGame()} />}
    </div>
  );
};
```

Create `src/components/Game/Game.css`:

```css
.game {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
}

.game--error {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
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
```

Create `src/components/Game/index.ts`:

```typescript
export { Game } from './Game';
```

### Step 8: Update App Entry Point

Update `src/App.tsx`:

```typescript
import { type FC } from 'react';
import { GameProvider } from '@/context';
import { Game } from '@/components/Game';

const App: FC = () => {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
};

export default App;
```

## Completion Checklist

- [ ] Context: `GameContext.tsx`
- [ ] Shared: `Button` component with styles
- [ ] ScoreDisplay: `PlayerScore`, `ScoreDisplay` with styles
- [ ] DiceBoard: Container for dice-box canvas
- [ ] PlayerControls: Roll/Pass buttons
- [ ] GameStatus: Status messages, roll results
- [ ] WinnerAnnouncement: Game over modal
- [ ] Game: Main orchestrating component
- [ ] App.tsx updated with GameProvider
- [ ] All components compile without errors

## Verification

```bash
npm run dev
```

The game should:
1. Display both player scores
2. Show dice rolling area (may be empty until dice-box initializes)
3. Show Roll Dice button
4. Respond to clicks

## Next Step

Proceed to `06-ai-player.md` to implement proper AI decision-making.
