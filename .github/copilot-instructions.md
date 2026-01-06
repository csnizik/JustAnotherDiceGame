# Just Another Dice Game - Copilot Instructions

## Project Identity
- **Name**: Just Another Dice Game (JADG)
- **Type**: 2-player dice game (MVP: Human vs AI)
- **Stack**: TypeScript React + @3d-dice/dice-box

## Core Principles

### SOLID Compliance (Non-Negotiable)

**Single Responsibility**
- Each module/component does ONE thing
- If you're tempted to add "and" to describe what something does, split it

**Open/Closed**
- Extend behavior through composition and strategy patterns
- Never modify existing working code to add features

**Liskov Substitution**
- `AIPlayer` and `HumanPlayer` must be interchangeable via `IPlayer` interface
- Any function accepting `IPlayer` works identically with either implementation

**Interface Segregation**
- Prefer many small interfaces over few large ones
- Components request only the interfaces they need

**Dependency Inversion**
- Components depend on abstractions (interfaces), never concrete implementations
- Use dependency injection; avoid direct instantiation of services

### DRY Compliance (Non-Negotiable)

- **Single Source of Truth**: Game rules live in `GameRulesEngine`, nowhere else
- **Reusable Hooks**: Extract repeated stateful logic into custom hooks
- **Utility Functions**: Pure functions in `/utils` for any repeated calculations
- **Shared Types**: All types in `/types` or `/interfaces`, never inline

## File References

When implementing features, always consult:
- `ARCHITECTURE.md` - Component structure and state shape
- `GAME_RULES.md` - Authoritative game logic specification
- `STYLE_GUIDE.md` - Code conventions and patterns

## Implementation Sequence

Follow the numbered prompts in `/prompts` directory in order:
1. Project setup and dependencies
2. Interfaces and types
3. Game engine (pure logic)
4. Dice-box integration
5. React components
6. AI player
7. Polish and animations

## Code Generation Rules

### Always
- Use TypeScript strict mode
- Export interfaces from dedicated files
- Write pure functions where possible
- Include JSDoc comments on public APIs
- Handle loading and error states

### Never
- Use `any` type (use `unknown` if truly necessary)
- Mutate state directly
- Put business logic in components
- Skip error boundaries
- Hardcode magic numbers (use named constants)

## Testing Expectations
- Game engine: Unit tests for all state transitions
- Components: React Testing Library for user interactions
- Utilities: Pure function unit tests

## Key Dependencies
```json
{
  "@3d-dice/dice-box": "^1.x",
  "react": "^18.x",
  "typescript": "^5.x"
}
```
