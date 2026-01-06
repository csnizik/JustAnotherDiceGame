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
