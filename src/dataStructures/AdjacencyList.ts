// src/dataStructures/AdjacencyList.ts
/**
 * Adjacency List representation for an undirected contact network.
 * Supports:
 * - addNode, addEdge, removeEdge, disableEdge, restoreEdge, rewireEdge, isolateNode.
 *
 * Time Complexity:
 *  - addNode: O(1)
 *  - addEdge: O(1)
 *  - removeEdge: O(degree(u) + degree(v))
 *  - disableEdge / restoreEdge: O(degree(u) + degree(v))
 *  - rewireEdge: O(degree)
 *  - isolateNode: O(total edges connected to node)
 *  - neighbors: O(degree(u))
 * Space Complexity: O(V + E)
 */

export type NodeId = number;

export interface Edge {
  target: NodeId;
  active: boolean;
  weight?: number;
}

export class AdjacencyList {
  private adjacency: Map<NodeId, Edge[]> = new Map();

  addNode(id: NodeId): void {
    if (!this.adjacency.has(id)) {
      this.adjacency.set(id, []);
    }
  }

  addEdge(a: NodeId, b: NodeId, weight: number = 1.0): void {
    this.addNode(a);
    this.addNode(b);
    const listA = this.adjacency.get(a)!;
    const listB = this.adjacency.get(b)!;

    if (!listA.some(e => e.target === b)) {
      listA.push({ target: b, active: true, weight });
    }
    if (!listB.some(e => e.target === a)) {
      listB.push({ target: a, active: true, weight });
    }
  }

  removeEdge(a: NodeId, b: NodeId): void {
    const listA = this.adjacency.get(a);
    const listB = this.adjacency.get(b);
    if (listA) {
      const idx = listA.findIndex(e => e.target === b);
      if (idx !== -1) listA.splice(idx, 1);
    }
    if (listB) {
      const idx = listB.findIndex(e => e.target === a);
      if (idx !== -1) listB.splice(idx, 1);
    }
  }

  disableEdge(a: NodeId, b: NodeId): void {
    const listA = this.adjacency.get(a);
    const listB = this.adjacency.get(b);
    if (listA) {
      const e = listA.find(item => item.target === b);
      if (e) e.active = false;
    }
    if (listB) {
      const e = listB.find(item => item.target === a);
      if (e) e.active = false;
    }
  }

  restoreEdge(a: NodeId, b: NodeId): void {
    const listA = this.adjacency.get(a);
    const listB = this.adjacency.get(b);
    if (listA) {
      const e = listA.find(item => item.target === b);
      if (e) e.active = true;
    }
    if (listB) {
      const e = listB.find(item => item.target === a);
      if (e) e.active = true;
    }
  }

  rewireEdge(source: NodeId, oldTarget: NodeId, newTarget: NodeId, weight: number = 1.0): void {
    this.removeEdge(source, oldTarget);
    this.addEdge(source, newTarget, weight);
  }

  isolateNode(id: NodeId): void {
    const edges = this.adjacency.get(id);
    if (!edges) return;

    for (const edge of edges) {
      const partner = this.adjacency.get(edge.target);
      if (partner) {
        const idx = partner.findIndex(e => e.target === id);
        if (idx !== -1) partner.splice(idx, 1);
      }
    }
    this.adjacency.set(id, []);
  }

  neighbors(id: NodeId): NodeId[] {
    const list = this.adjacency.get(id) ?? [];
    return list.filter(e => e.active).map(e => e.target);
  }

  getAllEdges(): { source: NodeId; target: NodeId; active: boolean; weight: number }[] {
    const result: { source: NodeId; target: NodeId; active: boolean; weight: number }[] = [];
    const seen = new Set<string>();

    for (const [u, edges] of this.adjacency.entries()) {
      for (const e of edges) {
        const key = u < e.target ? `${u}-${e.target}` : `${e.target}-${u}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            source: u,
            target: e.target,
            active: e.active,
            weight: e.weight ?? 1.0,
          });
        }
      }
    }

    return result;
  }

  hasEdge(a: NodeId, b: NodeId): boolean {
    const list = this.adjacency.get(a);
    return !!list && list.some(e => e.target === b && e.active);
  }

  clone(): AdjacencyList {
    const copy = new AdjacencyList();
    for (const [node, edges] of this.adjacency.entries()) {
      copy.addNode(node);
      for (const e of edges) {
        if (node < e.target) {
          copy.addEdge(node, e.target, e.weight);
          if (!e.active) {
            copy.disableEdge(node, e.target);
          }
        }
      }
    }
    return copy;
  }
}
