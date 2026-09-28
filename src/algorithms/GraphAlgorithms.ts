// src/algorithms/GraphAlgorithms.ts
/**
 * Graph Algorithms Suite for Epidemic Lab.
 * Implements:
 * 1. Tarjan's Bridge-Finding Algorithm (low-link values & discovery times)
 * 2. BFS Traversal with step-by-step visit order (using Queue)
 * 3. DFS Traversal with step-by-step visit order
 * 4. Shortest Path (BFS/Dijkstra) between two nodes
 * 5. Connected Components labeling
 * 6. Hub Detection (Degree Centrality & Ranking)
 * 7. Density & Graph Metric calculations
 *
 * Complexity documented for each algorithm.
 */

import { AdjacencyList } from '../dataStructures/AdjacencyList';
import type { NodeId } from '../dataStructures/AdjacencyList';
import { Queue } from '../dataStructures/Queue';

export interface BridgeEdge {
  u: NodeId;
  v: NodeId;
}

export interface HubResult {
  nodeId: NodeId;
  degree: number;
}

export interface ComponentResult {
  componentId: number;
  nodes: NodeId[];
}

export interface TraversalStep {
  nodeId: NodeId;
  order: number;
  parentId?: NodeId;
}

export class GraphAlgorithms {
  /**
   * Tarjan's Low-Link Bridge Finding Algorithm.
   * Finds all critical edges whose removal increases connected components.
   * In epidemics, bridges represent super-highways between communities.
   *
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  static findBridges(graph: AdjacencyList, allNodeIds: NodeId[]): BridgeEdge[] {
    const bridges: BridgeEdge[] = [];
    const disc = new Map<NodeId, number>();
    const low = new Map<NodeId, number>();
    const parent = new Map<NodeId, NodeId | null>();
    let timer = 0;

    const dfs = (u: NodeId) => {
      disc.set(u, ++timer);
      low.set(u, timer);

      const neighbors = graph.neighbors(u);
      for (const v of neighbors) {
        if (!disc.has(v)) {
          parent.set(v, u);
          dfs(v);

          // Check if subtree rooted at v has a connection back to one of u's ancestors
          const lowV = low.get(v)!;
          const lowU = low.get(u)!;
          low.set(u, Math.min(lowU, lowV));

          // If lowest vertex reachable from v is below u in DFS tree, then u-v is a bridge
          if (lowV > disc.get(u)!) {
            bridges.push({ u, v });
          }
        } else if (v !== parent.get(u)) {
          // Update low value of u for back edge
          const lowU = low.get(u)!;
          low.set(u, Math.min(lowU, disc.get(v)!));
        }
      }
    };

    for (const node of allNodeIds) {
      if (!disc.has(node)) {
        dfs(node);
      }
    }

    return bridges;
  }

  /**
   * Breadth-First Search (BFS) Traversal using Queue.
   * Records ordered steps so the UI can animate the traversal sequentially.
   *
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  static bfs(graph: AdjacencyList, startNode: NodeId): TraversalStep[] {
    const steps: TraversalStep[] = [];
    const visited = new Set<NodeId>();
    const queue = new Queue<{ node: NodeId; parent?: NodeId }>();

    visited.add(startNode);
    queue.enqueue({ node: startNode });
    let order = 0;

    while (!queue.isEmpty()) {
      const current = queue.dequeue()!;
      steps.push({
        nodeId: current.node,
        order: order++,
        parentId: current.parent,
      });

      for (const neighbor of graph.neighbors(current.node)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.enqueue({ node: neighbor, parent: current.node });
        }
      }
    }

    return steps;
  }

  /**
   * Depth-First Search (DFS) Traversal.
   * Records ordered sequence of visited nodes.
   *
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  static dfs(graph: AdjacencyList, startNode: NodeId): TraversalStep[] {
    const steps: TraversalStep[] = [];
    const visited = new Set<NodeId>();
    let order = 0;

    const traverse = (node: NodeId, parent?: NodeId) => {
      visited.add(node);
      steps.push({
        nodeId: node,
        order: order++,
        parentId: parent,
      });

      for (const neighbor of graph.neighbors(node)) {
        if (!visited.has(neighbor)) {
          traverse(neighbor, node);
        }
      }
    };

    traverse(startNode);
    return steps;
  }

  /**
   * Shortest Path between startNode and targetNode using unweighted BFS.
   * Returns array of node IDs on the path: [startNode, ..., targetNode].
   *
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  static shortestPath(graph: AdjacencyList, startNode: NodeId, targetNode: NodeId): NodeId[] {
    if (startNode === targetNode) return [startNode];

    const visited = new Set<NodeId>();
    const parentMap = new Map<NodeId, NodeId>();
    const queue = new Queue<NodeId>();

    visited.add(startNode);
    queue.enqueue(startNode);

    let found = false;
    while (!queue.isEmpty()) {
      const current = queue.dequeue()!;
      if (current === targetNode) {
        found = true;
        break;
      }

      for (const neighbor of graph.neighbors(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parentMap.set(neighbor, current);
          queue.enqueue(neighbor);
        }
      }
    }

    if (!found) return [];

    // Reconstruct path
    const path: NodeId[] = [];
    let curr: NodeId | undefined = targetNode;
    while (curr !== undefined) {
      path.unshift(curr);
      curr = parentMap.get(curr);
    }
    return path;
  }

  /**
   * Connected Components labeling.
   * Segregates the network into isolated clusters.
   *
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  static findConnectedComponents(graph: AdjacencyList, allNodeIds: NodeId[]): ComponentResult[] {
    const visited = new Set<NodeId>();
    const components: ComponentResult[] = [];
    let componentId = 0;

    for (const node of allNodeIds) {
      if (!visited.has(node)) {
        const componentNodes: NodeId[] = [];
        const queue = new Queue<NodeId>();

        visited.add(node);
        queue.enqueue(node);

        while (!queue.isEmpty()) {
          const current = queue.dequeue()!;
          componentNodes.push(current);

          for (const neighbor of graph.neighbors(current)) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.enqueue(neighbor);
            }
          }
        }

        components.push({
          componentId: componentId++,
          nodes: componentNodes,
        });
      }
    }

    return components;
  }

  /**
   * Hub Detection: finds top N nodes sorted by active degree.
   * In epidemics, hubs act as superspreaders.
   *
   * Time Complexity: O(V log V)
   * Space Complexity: O(V)
   */
  static findHubs(graph: AdjacencyList, allNodeIds: NodeId[], topN: number = 8): HubResult[] {
    const results: HubResult[] = allNodeIds.map(nodeId => ({
      nodeId,
      degree: graph.neighbors(nodeId).length,
    }));

    results.sort((a, b) => b.degree - a.degree);
    return results.slice(0, topN);
  }

  /**
   * Compute comprehensive graph statistics:
   * - Total Nodes, Total Active Edges, Density, Average Degree
   *
   * Time Complexity: O(V + E)
   * Space Complexity: O(1)
   */
  static computeMetrics(graph: AdjacencyList, allNodeIds: NodeId[]) {
    const v = allNodeIds.length;
    if (v === 0) return { nodes: 0, edges: 0, density: 0, avgDegree: 0 };

    let totalDegree = 0;
    for (const node of allNodeIds) {
      totalDegree += graph.neighbors(node).length;
    }
    const e = Math.floor(totalDegree / 2);
    const maxEdges = (v * (v - 1)) / 2;
    const density = maxEdges > 0 ? e / maxEdges : 0;
    const avgDegree = totalDegree / v;

    return {
      nodes: v,
      edges: e,
      density,
      avgDegree,
    };
  }
}
