/**
 * Score Value Object
 *
 * Represents a fighter's calculated score.
 * Always rounds to 2 decimal places for consistency.
 */

export class Score {
  private readonly _value: number;

  constructor(value: number) {
    // Round to 2 decimal places
    this._value = Math.round(value * 100) / 100;
  }

  get value(): number {
    return this._value;
  }

  /**
   * Add two scores together
   */
  add(other: Score): Score {
    return new Score(this._value + other.value);
  }

  /**
   * Check if score is positive
   */
  isPositive(): boolean {
    return this._value > 0;
  }

  /**
   * Check if score is negative
   */
  isNegative(): boolean {
    return this._value < 0;
  }

  /**
   * Check if score is zero
   */
  isZero(): boolean {
    return this._value === 0;
  }

  /**
   * Convert to string for display
   */
  toString(): string {
    return this._value.toFixed(2);
  }

  /**
   * Create a zero score
   */
  static zero(): Score {
    return new Score(0);
  }

  /**
   * Compare two scores for equality (within 0.01 tolerance)
   */
  equals(other: Score): boolean {
    return Math.abs(this._value - other.value) < 0.01;
  }
}
