// src/dataStructures/Queue.ts
/**
 * Simple FIFO queue implementation used for BFS/DFS visualizations.
 * Supports enqueue, dequeue, peek, size, isEmpty.
 *
 * Time complexity: O(1) for all operations (using array with head index).
 * Space complexity: O(n) where n is number of enqueued items.
 */
export class Queue<T> {
  private items: T[] = [];
  private head: number = 0;

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.items[this.head];
    this.head++;
    // Trim occasionally to avoid memory leak
    if (this.head > 1000) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return item;
  }

  peek(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.head];
  }

  size(): number {
    return this.items.length - this.head;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }
}
