import { type DieFace } from '@/types';
import { DIE_MIN, DIE_MAX } from '@/constants';

/**
 * Type guard to validate a number is a valid die face.
 */
export function isDieFace(value: unknown): value is DieFace {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= DIE_MIN &&
    value <= DIE_MAX
  );
}

/**
 * Type guard to check if a value is a non-null object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
