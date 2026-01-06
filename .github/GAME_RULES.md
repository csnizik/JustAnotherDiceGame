# Just Another Dice Game - Game Rules

> **IMPORTANT**: This document is the single source of truth for game logic.
> All implementations must conform exactly to these specifications.

## Overview

Just Another Dice Game is a push-your-luck dice game for 2 players where rolling even totals builds temporary scores for both players, but only strategic passing or opponent misfortune locks in points.

## Components

- 2 standard six-sided dice (d6)
- Score tracking for each player (official + temporary)

## Setup

1. Two players: Player 1 (Human) and Player 2 (AI in MVP)
2. All scores start at 0
3. Player 1 goes first

## Turn Structure

### Phase 1: Roll

The active player rolls both dice.

### Phase 2: Evaluate Roll

Calculate the total of both dice.

#### If Total is ODD (1, 3, 5, 7, 9, 11):

```
ACTIVE PLAYER:
  - tempScore → 0 (forfeited)
  - officialScore → unchanged

OPPONENT:
  - tempScore → added to officialScore (banked)
  - tempScore → 0 (reset after banking)

TURN: Ends, switch to opponent
```

#### If Total is EVEN (2, 4, 6, 8, 10, 12):

```
ACTIVE PLAYER:
  - tempScore += total (both dice combined)

OPPONENT:
  - tempScore += lowerDie (the smaller of the two dice)
  - If dice are equal, lowerDie = that value

TURN: Active player chooses action
```

### Phase 3: Decision (Even Rolls Only)

Active player must choose one:

#### Option A: Roll Again

- Return to Phase 1
- Risk: Rolling odd loses all tempScore
- Reward: Continue building tempScore

#### Option B: Pass

```
ACTIVE PLAYER:
  - tempScore → added to officialScore (banked)
  - tempScore → 0 (reset after banking)

OPPONENT:
  - tempScore → 0 (wiped, NOT banked)

TURN: Ends, switch to opponent
```

## Winning

The game ends immediately when any player's **official score** reaches or exceeds **50 points**.

- Check win condition after EVERY score change
- The player who reaches 50+ first wins
- Temporary scores do not count toward victory

## Edge Cases

### Tie on Win Threshold

If a rule application would cause both players to reach 50+ simultaneously:

- **Priority**: Active player's score is calculated first
- If active player hits 50+, they win before opponent's score updates

### Double Roll (Both Dice Same Value)

- `lowerDie` equals the face value (e.g., double 3s → lowerDie = 3)
- Total is still evaluated for odd/even

### First Turn Odd Roll

- Active player scores nothing (had 0 temp anyway)
- Opponent banks 0 (had 0 temp anyway)
- Turn passes normally

## Scoring Reference Table

| Roll | Total | Even/Odd | Active Gets | Opponent Gets |
|------|-------|----------|-------------|---------------|
| 1+1  | 2     | Even     | +2 temp     | +1 temp       |
| 1+2  | 3     | Odd      | Lose temp   | Bank temp     |
| 1+3  | 4     | Even     | +4 temp     | +1 temp       |
| 1+4  | 5     | Odd      | Lose temp   | Bank temp     |
| 1+5  | 6     | Even     | +6 temp     | +1 temp       |
| 1+6  | 7     | Odd      | Lose temp   | Bank temp     |
| 2+2  | 4     | Even     | +4 temp     | +2 temp       |
| 2+3  | 5     | Odd      | Lose temp   | Bank temp     |
| 2+4  | 6     | Even     | +6 temp     | +2 temp       |
| 2+5  | 7     | Odd      | Lose temp   | Bank temp     |
| 2+6  | 8     | Even     | +8 temp     | +2 temp       |
| 3+3  | 6     | Even     | +6 temp     | +3 temp       |
| 3+4  | 7     | Odd      | Lose temp   | Bank temp     |
| 3+5  | 8     | Even     | +8 temp     | +3 temp       |
| 3+6  | 9     | Odd      | Lose temp   | Bank temp     |
| 4+4  | 8     | Even     | +8 temp     | +4 temp       |
| 4+5  | 9     | Odd      | Lose temp   | Bank temp     |
| 4+6  | 10    | Even     | +10 temp    | +4 temp       |
| 5+5  | 10    | Even     | +10 temp    | +5 temp       |
| 5+6  | 11    | Odd      | Lose temp   | Bank temp     |
| 6+6  | 12    | Even     | +12 temp    | +6 temp       |

## Probability Reference

| Outcome | Combinations | Probability |
|---------|--------------|-------------|
| Odd Total | 18/36 | 50% |
| Even Total | 18/36 | 50% |

## State Transition Diagram

```
                    ┌──────────────┐
                    │    IDLE      │
                    │  (Game Start)│
                    └──────┬───────┘
                           │ Start Game
                           ▼
              ┌────────────────────────┐
              │        ROLLING         │◄─────────────┐
              │   (Awaiting dice)      │              │
              └────────────┬───────────┘              │
                           │ Dice Settled             │
                           ▼                          │
              ┌────────────────────────┐              │
              │       EVALUATING       │              │
              │   (Apply roll result)  │              │
              └─────┬─────────────┬────┘              │
                    │             │                   │
              Odd Roll        Even Roll               │
                    │             │                   │
                    ▼             ▼                   │
           ┌──────────────┐ ┌──────────────┐         │
           │   TURN_END   │ │   DECIDING   │         │
           │ (Switch turn)│ │ (Roll/Pass?) │         │
           └──────┬───────┘ └───┬──────┬───┘         │
                  │             │      │             │
                  │        Roll Again  Pass          │
                  │             │      │             │
                  │             │      ▼             │
                  │             │ ┌──────────────┐   │
                  │             │ │   PASSING    │   │
                  │             │ │(Bank scores) │   │
                  │             │ └──────┬───────┘   │
                  │             │        │           │
                  │             └────────┼───────────┘
                  │                      │
                  └──────────┬───────────┘
                             │
                             ▼
                    [Check Win Condition]
                             │
                    ┌────────┴────────┐
                    │                 │
                No Winner         Winner!
                    │                 │
                    ▼                 ▼
              Back to ROLLING   ┌──────────────┐
              (opponent's turn) │  GAME_OVER   │
                                └──────────────┘
```

## Implementation Checklist

- [ ] `calculateDiceResult(die1, die2)` → `DiceResult`
- [ ] `applyOddRoll(state)` → `GameState`
- [ ] `applyEvenRoll(state, diceResult)` → `GameState`
- [ ] `applyPass(state)` → `GameState`
- [ ] `checkWinCondition(state)` → `PlayerId | null`
- [ ] `switchActivePlayer(state)` → `GameState`
