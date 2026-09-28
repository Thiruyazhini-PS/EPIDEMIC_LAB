// src/utils/SeededRNG.ts
/**
 * Mulberry32 Seeded Pseudo-Random Number Generator.
 * Provides deterministic, reproducible random sequences for epidemic simulations.
 * This guarantees that baseline and counterfactual runs under the same seed
 * experience identical stochastic trial sequences unless modified by user intervention.
 *
 * Time Complexity: O(1) per generated number
 * Space Complexity: O(1)
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  /**
   * Resets the seed.
   */
  setSeed(seed: number): void {
    this.state = seed >>> 0;
  }

  /**
   * Get current internal state for snapshotting
   */
  getState(): number {
    return this.state;
  }

  /**
   * Restore state
   */
  setState(state: number): void {
    this.state = state >>> 0;
  }

  /**
   * Generates a floating point number in [0, 1).
   * Time: O(1)
   */
  next(): number {
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in range [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns true with probability p in [0, 1].
   */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /**
   * Clones this RNG with the exact same state.
   */
  clone(): SeededRNG {
    const copy = new SeededRNG(0);
    copy.setState(this.state);
    return copy;
  }
}
