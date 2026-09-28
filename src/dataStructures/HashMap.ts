// src/dataStructures/HashMap.ts
/**
 * Separate-Chaining Hash Map implementation.
 * Used for fast node state tracking, epidemiological attribute lookups, and DSA visual inspection.
 *
 * Exposes internal bucket structures so the DSA Lab can render the actual
 * hash buckets, collisions, and key-value distributions.
 *
 * Time Complexity:
 *  - Average Case: O(1) for get, set, delete, has
 *  - Worst Case (high collisions): O(K) where K is bucket chain length
 *  - Rehash / Resize: O(N) amortized
 * Space Complexity: O(M + N) where M is bucket count and N is total entries.
 */

export interface HashEntry<K, V> {
  key: K;
  value: V;
}

export class HashMap<K, V> {
  private buckets: HashEntry<K, V>[][];
  private capacity: number;
  private count: number = 0;
  private readonly loadFactorThreshold: number = 0.75;

  constructor(initialCapacity: number = 16) {
    this.capacity = initialCapacity;
    this.buckets = Array.from({ length: initialCapacity }, () => []);
  }

  /**
   * Polynomial rolling hash for string/number keys.
   * Time: O(len(key))
   */
  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    const prime = 31;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(hash, prime) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % this.capacity;
  }

  /**
   * Resize buckets array when load factor exceeds threshold.
   * Time: O(N)
   */
  private resize(): void {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.count = 0;

    for (const bucket of oldBuckets) {
      for (const entry of bucket) {
        this.set(entry.key, entry.value);
      }
    }
  }

  /**
   * Store or update a key-value pair.
   * Time: O(1) average
   */
  set(key: K, value: V): void {
    if (this.count / this.capacity >= this.loadFactorThreshold) {
      this.resize();
    }

    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket[i].value = value;
        return;
      }
    }

    bucket.push({ key, value });
    this.count++;
  }

  /**
   * Retrieve value by key.
   * Time: O(1) average
   */
  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    for (const entry of bucket) {
      if (entry.key === key) {
        return entry.value;
      }
    }
    return undefined;
  }

  /**
   * Check if key exists.
   * Time: O(1) average
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete entry by key.
   * Time: O(1) average
   */
  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const itemIndex = bucket.findIndex(entry => entry.key === key);

    if (itemIndex !== -1) {
      bucket.splice(itemIndex, 1);
      this.count--;
      return true;
    }
    return false;
  }

  /**
   * Returns total number of key-value pairs.
   */
  size(): number {
    return this.count;
  }

  /**
   * Clears all entries.
   */
  clear(): void {
    this.count = 0;
    this.buckets = Array.from({ length: this.capacity }, () => []);
  }

  /**
   * Returns array of all entries [K, V].
   */
  entries(): [K, V][] {
    const result: [K, V][] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        result.push([entry.key, entry.value]);
      }
    }
    return result;
  }

  /**
   * Expose raw bucket structure for the DSA Lab visualization.
   */
  getBucketsSnapshot(): { index: number; chain: HashEntry<K, V>[] }[] {
    return this.buckets.map((chain, index) => ({
      index,
      chain: [...chain]
    }));
  }

  /**
   * Current load factor (count / capacity)
   */
  getLoadFactor(): number {
    return this.count / this.capacity;
  }
}
