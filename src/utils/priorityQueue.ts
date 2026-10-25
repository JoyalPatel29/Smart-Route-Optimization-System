/**
 * Custom Min-Heap Priority Queue implementation for DAA Project.
 * Built from scratch without third-party libraries.
 * Time Complexity:
 *   - push: O(log N)
 *   - pop: O(log N)
 *   - peek: O(1)
 * Space Complexity: O(N)
 */
export interface HeapItem<T> {
  element: T;
  priority: number;
}

export class MinPriorityQueue<T> {
  private heap: HeapItem<T>[] = [];

  constructor() {
    this.heap = [];
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public peek(): HeapItem<T> | undefined {
    return this.heap[0];
  }

  public push(element: T, priority: number): void {
    const item: HeapItem<T> = { element, priority };
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): HeapItem<T> | undefined {
    if (this.isEmpty()) return undefined;
    const min = this.heap[0];
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min;
  }

  private bubbleUp(index: number): void {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (element.priority >= parent.priority) break;
      this.heap[index] = parent;
      this.heap[parentIndex] = element;
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const element = this.heap[index];

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let swapIndex: number | null = null;

      if (leftChildIndex < length) {
        if (this.heap[leftChildIndex].priority < element.priority) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        if (
          (swapIndex === null && this.heap[rightChildIndex].priority < element.priority) ||
          (swapIndex !== null && this.heap[rightChildIndex].priority < this.heap[leftChildIndex].priority)
        ) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;

      this.heap[index] = this.heap[swapIndex];
      this.heap[swapIndex] = element;
      index = swapIndex;
    }
  }
}
