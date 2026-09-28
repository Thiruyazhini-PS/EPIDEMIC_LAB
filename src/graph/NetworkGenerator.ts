// src/graph/NetworkGenerator.ts
/**
 * Realistic Clustered Network Generator for Epidemic Lab.
 * Creates community-structured graphs with natural hubs and inter-community bridges.
 *
 * Algorithm:
 * - Divides N nodes into K spatial communities (e.g. households, work campuses, schools)
 * - Dense intra-community connections (Poisson/Erdos-Renyi with high density)
 * - Sparse inter-community bridge edges connecting specific boundary nodes
 * - Allows deterministic generation using SeededRNG
 *
 * Time Complexity: O(V + E)
 * Space Complexity: O(V + E)
 */

import { AdjacencyList } from '../dataStructures/AdjacencyList';
import type { NodeId } from '../dataStructures/AdjacencyList';
import { SeededRNG } from '../utils/SeededRNG';

export interface GraphNodeData {
  id: NodeId;
  label: string;
  community: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GeneratedNetwork {
  nodes: GraphNodeData[];
  graph: AdjacencyList;
  edges: { source: NodeId; target: NodeId; isBridge?: boolean; weight?: number }[];
  communities: number[][];
}

export class NetworkGenerator {
  /**
   * Generates a community-structured contact network with distinct inter-cluster bridges.
   */
  static generateClusteredNetwork(
    nodeCount: number = 75,
    communityCount: number = 3,
    densityParam: number = 0.08,
    rng: SeededRNG = new SeededRNG(42)
  ): GeneratedNetwork {
    const graph = new AdjacencyList();
    const nodes: GraphNodeData[] = [];
    const communities: number[][] = Array.from({ length: communityCount }, () => []);

    // 1. Assign nodes to communities
    for (let i = 0; i < nodeCount; i++) {
      const comm = i % communityCount;
      communities[comm].push(i);
      nodes.push({
        id: i,
        label: `#${String(i).padStart(3, '0')}`,
        community: comm,
      });
      graph.addNode(i);
    }

    const edgeSet = new Set<string>();
    const edgeList: { source: NodeId; target: NodeId; isBridge?: boolean; weight?: number }[] = [];

    const addEdgeSafely = (u: NodeId, v: NodeId, isBridge: boolean = false, weight: number = 1.0) => {
      if (u === v) return;
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        graph.addEdge(u, v, weight);
        edgeList.push({ source: u, target: v, isBridge, weight });
      }
    };

    // 2. Intra-community connections: dense clusters
    const intraProb = Math.min(0.85, Math.max(0.18, densityParam * 3.5));
    for (let c = 0; c < communityCount; c++) {
      const members = communities[c];
      const mLen = members.length;

      // Ensure basic connectivity (cycle or spanning backbone)
      for (let i = 0; i < mLen; i++) {
        addEdgeSafely(members[i], members[(i + 1) % mLen], false, 0.9 + rng.next() * 0.2);
      }

      // Add random internal contacts
      for (let i = 0; i < mLen; i++) {
        for (let j = i + 1; j < mLen; j++) {
          if (rng.chance(intraProb)) {
            addEdgeSafely(members[i], members[j], false, 0.8 + rng.next() * 0.4);
          }
        }
      }
    }

    // 3. Deliberate inter-community bridges
    // Between community 0 and 1, 1 and 2, etc.
    for (let c = 0; c < communityCount - 1; c++) {
      const commA = communities[c];
      const commB = communities[c + 1];

      // Pick 1-2 bridge nodes
      const bridgeA = commA[rng.nextInt(0, commA.length - 1)];
      const bridgeB = commB[rng.nextInt(0, commB.length - 1)];

      addEdgeSafely(bridgeA, bridgeB, true, 1.2);

      // Chance of a secondary bridge
      if (rng.chance(0.35)) {
        const altA = commA[rng.nextInt(0, commA.length - 1)];
        const altB = commB[rng.nextInt(0, commB.length - 1)];
        if (altA !== bridgeA || altB !== bridgeB) {
          addEdgeSafely(altA, altB, true, 1.0);
        }
      }
    }

    return {
      nodes,
      graph,
      edges: edgeList,
      communities,
    };
  }
}
