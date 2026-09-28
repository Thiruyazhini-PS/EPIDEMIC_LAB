// src/dataStructures/TransmissionTree.ts
/**
 * Transmission Tree Data Structure.
 * Tracks the phylogenetic / epidemiological chain of infection:
 * - Who infected whom
 * - Day of transmission
 * - Secondary infections (reproduction count / branching)
 * - Path tracing back to initial seed(s)
 *
 * Time Complexity:
 *  - Record Infection: O(1)
 *  - Trace to Seed: O(depth) where depth <= N
 *  - Get Secondary Infections: O(1)
 *  - Reconstruct Tree Hierarchy: O(V)
 * Space Complexity: O(V) nodes
 */

export interface TransmissionNode {
  id: number;
  infectedBy: number | null; // null if initial seed
  dayInfected: number;
  secondaryInfections: number[]; // IDs of individuals this person infected
  generation: number;
}

export class TransmissionTree {
  private nodes: Map<number, TransmissionNode> = new Map();
  private seeds: number[] = [];

  /**
   * Register a seed (patient zero)
   */
  addSeed(id: number, day: number = 0): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        infectedBy: null,
        dayInfected: day,
        secondaryInfections: [],
        generation: 0,
      });
      this.seeds.push(id);
    }
  }

  /**
   * Record a transmission event from source to target
   * Time: O(1)
   */
  recordTransmission(source: number, target: number, day: number): void {
    const parentNode = this.nodes.get(source);
    const parentGeneration = parentNode ? parentNode.generation : 0;

    if (parentNode && !parentNode.secondaryInfections.includes(target)) {
      parentNode.secondaryInfections.push(target);
    }

    if (!this.nodes.has(target)) {
      this.nodes.set(target, {
        id: target,
        infectedBy: source,
        dayInfected: day,
        secondaryInfections: [],
        generation: parentGeneration + 1,
      });
    }
  }

  /**
   * Check if a node has an infection record
   */
  has(id: number): boolean {
    return this.nodes.has(id);
  }

  /**
   * Get transmission details for a node
   */
  getNode(id: number): TransmissionNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Trace the chain of transmission back to the patient zero seed.
   * Returns array of node IDs: [seed, ..., parent, node]
   * Time: O(depth)
   */
  traceToSeed(nodeId: number): number[] {
    const path: number[] = [];
    let currentId: number | null = nodeId;
    const visited = new Set<number>();

    while (currentId !== null && this.nodes.has(currentId)) {
      if (visited.has(currentId)) break; // cycle protection
      visited.add(currentId);
      path.unshift(currentId);
      const tNode: TransmissionNode = this.nodes.get(currentId)!;
      currentId = tNode.infectedBy;
    }

    return path;
  }

  /**
   * Get all registered root seed nodes
   */
  getSeeds(): number[] {
    return [...this.seeds];
  }

  /**
   * Export all nodes as a list for D3 stratify or tree layout
   */
  getAllNodes(): TransmissionNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Filter tree up to a given simulation day (for chronological replay)
   */
  filterByDay(maxDay: number): TransmissionNode[] {
    return Array.from(this.nodes.values()).filter(n => n.dayInfected <= maxDay);
  }

  /**
   * Reset tree
   */
  clear(): void {
    this.nodes.clear();
    this.seeds = [];
  }

  /**
   * Deep clone for counterfactual comparisons
   */
  clone(): TransmissionTree {
    const copy = new TransmissionTree();
    for (const [id, node] of this.nodes.entries()) {
      copy.nodes.set(id, {
        ...node,
        secondaryInfections: [...node.secondaryInfections],
      });
    }
    copy.seeds = [...this.seeds];
    return copy;
  }
}
