// src/dataStructures/MinHeap.ts
/**
 * Binary Min-Heap Priority Queue implementation.
 * Used by the Epidemic Disease Engine to schedule temporal events:
 * - When an Exposed (E) person transitions to Infectious (I)
 * - When an Infectious (I) person transitions to Recovered (R)
 *
 * Events are ordered by `key` (simulation time / day).
 *
 * Time Complexity:
 *  - Insert / Push: O(log N)
 *  - ExtractMin / Pop: O(log N)
 *  - Peek: O(1)
 *  - Size / IsEmpty: O(1)
 * Space Complexity: O(N) where N is the number of scheduled events.
 */

export interface HeapItem<T> {
  key: number; // e.g. day or time stamp
  value: T;
}

export class MinHeap<T> {
  private heap: HeapItem<T>[] = [];

  constructor(items?: HeapItem<T>[]) {
    if (items && items.length > 0) {
      this.heap = [...items];
      this.buildHeap();
    }
  }

  /**
   * Parent index in zero-indexed binary heap
   */
  private parentIndex(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  /**
   * Left child index
   */
  private leftIndex(i: number): number {
    return 2 * i + 1;
  }

  /**
   * Right child index
   */
  private rightIndex(i: number): number {
    return 2 * i + 2;
  }

  /**
   * Swaps elements at index i and j
   */
  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  /**
   * Bubbles an item up to maintain min-heap property.
   * Time: O(log N)
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const pIdx = this.parentIndex(index);
      if (this.heap[index].key < this.heap[pIdx].key) {
        this.swap(index, pIdx);
        index = pIdx;
      } else {
        break;
      }
    }
  }

  /**
   * Bubbles an item down to maintain min-heap property.
   * Time: O(log N)
   */
  private bubbleDown(index: number): void {
    const len = this.heap.length;
    while (true) {
      const left = this.leftIndex(index);
      const right = this.rightIndex(index);
      let smallest = index;

      if (left < len && this.heap[left].key < this.heap[smallest].key) {
        smallest = left;
      }
      if (right < len && this.heap[right].key < this.heap[smallest].key) {
        smallest = right;
      }

      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  /**
   * Convert arbitrary array into a valid min-heap in O(N) time.
   */
  private buildHeap(): void {
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.bubbleDown(i);
    }
  }

  /**
   * Insert a new key-value pair into the priority queue.
   * Time: O(log N)
   */
  insert(key: number, value: T): void {
    this.heap.push({ key, value });
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Peek at the item with minimum key without removing it.
   * Time: O(1)
   */
  peek(): HeapItem<T> | undefined {
    return this.heap.length > 0 ? this.heap[0] : undefined;
  }

  /**
   * Remove and return the item with minimum key.
   * Time: O(log N)
   */
  extractMin(): HeapItem<T> | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  /**
   * Number of items currently in the heap.
   * Time: O(1)
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Whether the heap is empty.
   * Time: O(1)
   */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Returns a copy of the internal heap array for live visual inspection in DSA Lab.
   * Time: O(N)
   */
  toArray(): HeapItem<T>[] {
    return [...this.heap];
  }

  /**
   * Clears all items in the heap.
   */
  clear(): void {
    this.heap = [];
  }
}
