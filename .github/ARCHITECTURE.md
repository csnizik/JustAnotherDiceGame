# Just Another Dice Game - Architecture

## Directory Structure

```
src/
├── index.tsx                    # Entry point
├── App.tsx                      # Root component, providers
│
├── interfaces/
│   ├── IPlayer.ts               # Player abstraction
│   ├── IGameState.ts            # Game state contract
│   ├── IDiceResult.ts           # Dice roll result shape
│   ├── ITurnActions.ts          # Available player actions
│   └── index.ts                 # Barrel export
│
├── types/
│   ├── game.types.ts            # Enums, literal types, unions
│   └── index.ts                 # Barrel export
│
├── constants/
│   ├── game.constants.ts        # WIN_SCORE, PLAYER_IDS, etc.
│   └── index.ts
│
├── engines/
│   ├── GameRulesEngine.ts       # Pure game logic (see GAME_RULES.md)
│   ├── ScoreCalculator.ts       # Score computation utilities
│   ├── TurnController.ts        # Turn state machine
│   └── index.ts
│
├── services/
│   ├── AIPlayerService.ts       # AI decision making
│   └── index.ts
│
├── hooks/
│   ├── useDiceBox.ts            # Dice-box lifecycle and API
│   ├── useGameState.ts          # Central state management
│   ├── useTurnManager.ts        # Turn flow orchestration
│   ├── useAIPlayer.ts           # AI turn automation
│   └── index.ts
│
├── components/
│   ├── Game/
│   │   ├── Game.tsx             # Main game container
│   │   └── index.ts
│   │
│   ├── DiceBoard/
│   │   ├── DiceBoard.tsx        # Dice-box canvas wrapper
│   │   ├── DiceBoard.css
│   │   └── index.ts
│   │
│   ├── ScoreDisplay/
│   │   ├── ScoreDisplay.tsx     # Both players' scores
│   │   ├── PlayerScore.tsx      # Single player score card
│   │   └── index.ts
│   │
│   ├── PlayerControls/
│   │   ├── PlayerControls.tsx   # Roll/Pass action buttons
│   │   └── index.ts
│   │
│   ├── GameStatus/
│   │   ├── GameStatus.tsx       # Turn indicator, messages
│   │   ├── WinnerAnnouncement.tsx
│   │   └── index.ts
│   │
│   └── shared/
│       ├── Button/
│       ├── Card/
│       └── index.ts
│
├── context/
│   ├── GameContext.tsx          # Game state context provider
│   └── index.ts
│
└── utils/
    ├── diceUtils.ts             # Dice calculation helpers
    └── index.ts
```

## State Architecture

### Primary Game State

```typescript
interface GameState {
  players: readonly [Player, Player];
  activePlayerIndex: PlayerIndex;
  phase: GamePhase;
  lastRoll: DiceResult | null;
  turnNumber: number;
  winner: PlayerId | null;
}

type PlayerIndex = 0 | 1;
type GamePhase = 'idle' | 'rolling' | 'deciding' | 'passing' | 'gameOver';
type PlayerId = 'player1' | 'player2';
```

### Player State

```typescript
interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly isHuman: boolean;
  officialScore: number;
  tempScore: number;
}
```

### Dice Result

```typescript
interface DiceResult {
  readonly die1: number;
  readonly die2: number;
  readonly total: number;
  readonly isEven: boolean;
  readonly lowerDie: number;
  readonly higherDie: number;
}
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        GameContext                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    useGameState                      │   │
│  │  - Holds GameState                                   │   │
│  │  - Exposes dispatch actions                          │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │                 useTurnManager                       │   │
│  │  - Orchestrates turn flow                            │   │
│  │  - Calls GameRulesEngine for logic                   │   │
│  │  - Triggers AI via useAIPlayer                       │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐
   │DiceBoard│      │ScoreDisp │      │PlayerCtrl│
   └─────────┘      └──────────┘      └──────────┘
```

## Component Responsibilities

| Component | Responsibility | Consumes | Produces |
|-----------|---------------|----------|----------|
| `Game` | Layout orchestration | GameContext | Renders children |
| `DiceBoard` | 3D dice rendering | useDiceBox | Roll results via callback |
| `ScoreDisplay` | Score visualization | GameState.players | — |
| `PlayerControls` | User action buttons | GameState.phase | Roll/Pass events |
| `GameStatus` | Status messaging | GameState | — |

## Engine Responsibilities

| Engine | Responsibility | Pure? |
|--------|---------------|-------|
| `GameRulesEngine` | Apply game rules to state | Yes |
| `ScoreCalculator` | Compute scores from rolls | Yes |
| `TurnController` | Manage phase transitions | Yes |
| `AIPlayerService` | Decide AI actions | Yes (deterministic given seed) |

## Hook Responsibilities

| Hook | Responsibility |
|------|---------------|
| `useDiceBox` | Initialize dice-box, expose roll function, handle results |
| `useGameState` | Manage GameState, provide dispatch actions |
| `useTurnManager` | Coordinate turn flow between hooks and engines |
| `useAIPlayer` | Auto-trigger AI decisions when it's AI's turn |
