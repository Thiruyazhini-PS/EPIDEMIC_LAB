// src/analytics/AnalyticsEngine.ts
/**
 * Analytics and Monte Carlo Engine for Epidemic Lab.
 * Calculates epidemiological metrics and performs multi-run Monte Carlo simulations
 * to generate statistical uncertainty envelopes (min, max, median, mean, 25th-75th percentiles).
 *
 * Time Complexity:
 *  - computeMetrics: O(Days)
 *  - runMonteCarlo(N): O(N * (V + E) * Days)
 * Space Complexity: O(N * Days)
 */

import { SimulationEngine } from '../simulation/SimulationEngine';
import type { DaySnapshot } from '../simulation/SimulationEngine';
import type { DiseaseParameters } from '../simulation/DiseaseModel';
import { AdjacencyList } from '../dataStructures/AdjacencyList';

export interface EpidemicSummary {
  peakDay: number;
  peakInfectious: number;
  outbreakDuration: number;
  finalAttackRate: number; // Percentage
  totalInfected: number;
  r0Estimate: number;
}

export interface MonteCarloDayPoint {
  day: number;
  min: number;
  max: number;
  median: number;
  mean: number;
  q25: number;
  q75: number;
}

export interface MonteCarloResult {
  runCount: number;
  days: MonteCarloDayPoint[];
  individualRuns: number[][]; // sample of individual run trajectories
}

export class AnalyticsEngine {
  /**
   * Computes key epidemiological metrics from snapshots history.
   */
  static computeSummary(snapshots: DaySnapshot[], population: number): EpidemicSummary {
    if (snapshots.length === 0) {
      return {
        peakDay: 0,
        peakInfectious: 0,
        outbreakDuration: 0,
        finalAttackRate: 0,
        totalInfected: 0,
        r0Estimate: 0,
      };
    }

    let peakDay = 0;
    let peakInfectious = 0;
    let duration = 0;

    for (const snap of snapshots) {
      if (snap.iCount > peakInfectious) {
        peakInfectious = snap.iCount;
        peakDay = snap.day;
      }
      if (snap.iCount > 0 || snap.eCount > 0) {
        duration = snap.day;
      }
    }

    const lastSnap = snapshots[snapshots.length - 1];
    const totalInfected = (lastSnap.eCount + lastSnap.iCount + lastSnap.rCount);
    const finalAttackRate = population > 0 ? (totalInfected / population) * 100 : 0;

    // Empirical R0 estimate: early ratio of secondary cases per primary case
    let r0Estimate = 1.0;
    if (snapshots.length >= 3 && snapshots[0].iCount > 0) {
      const earlyNew = (snapshots[1]?.newInfectionsToday || 0) + (snapshots[2]?.newInfectionsToday || 0);
      r0Estimate = earlyNew / Math.max(1, snapshots[0].iCount);
    }

    return {
      peakDay,
      peakInfectious,
      outbreakDuration: duration,
      finalAttackRate: Math.round(finalAttackRate * 10) / 10,
      totalInfected,
      r0Estimate: Math.round(r0Estimate * 100) / 100,
    };
  }

  /**
   * Runs Monte Carlo multi-run simulation across N independent runs.
   * Calculates median, min, max, mean, and interquartile range (IQR) envelope.
   */
  static runMonteCarlo(
    baseEngine: SimulationEngine,
    runCount: number = 30,
    maxDays: number = 40
  ): MonteCarloResult {
    const runsData: number[][] = [];
    const baseParams: DiseaseParameters = { ...baseEngine.params };
    const baseNodes = [...baseEngine.allNodeIds];
    const baseSeeds = [...baseEngine.initialSeedIds];

    for (let r = 0; r < runCount; r++) {
      // Clone graph
      const graphClone = new AdjacencyList();
      for (const u of baseNodes) {
        graphClone.addNode(u);
      }
      for (const u of baseNodes) {
        for (const v of baseEngine.graph.neighbors(u)) {
          if (u < v) {
            graphClone.addEdge(u, v);
          }
        }
      }

      // Initialize run with perturbed seed
      const runSeed = (baseEngine.seedNumber + r * 7919) >>> 0;
      const sim = new SimulationEngine(runSeed, baseParams);
      sim.initialize(baseNodes, graphClone, baseSeeds, baseParams);

      const infectiousTrajectory: number[] = [sim.snapshots[0]?.iCount || 1];

      for (let day = 1; day <= maxDays; day++) {
        if (!sim.isCompleted) {
          sim.step();
        }
        const snap = sim.snapshots[day];
        infectiousTrajectory.push(snap ? snap.iCount : 0);
        if (sim.isCompleted && infectiousTrajectory.length > maxDays) break;
      }

      // Pad remaining days if completed early
      while (infectiousTrajectory.length <= maxDays) {
        infectiousTrajectory.push(0);
      }

      runsData.push(infectiousTrajectory);
    }

    // Aggregate statistics across runs day by day
    const aggregatedDays: MonteCarloDayPoint[] = [];

    for (let d = 0; d <= maxDays; d++) {
      const values = runsData.map(run => run[d] ?? 0).sort((a, b) => a - b);
      const min = values[0];
      const max = values[values.length - 1];
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const median = values[Math.floor(values.length / 2)];
      const q25 = values[Math.floor(values.length * 0.25)];
      const q75 = values[Math.floor(values.length * 0.75)];

      aggregatedDays.push({
        day: d,
        min,
        max,
        median: Math.round(median * 10) / 10,
        mean: Math.round(mean * 10) / 10,
        q25: Math.round(q25 * 10) / 10,
        q75: Math.round(q75 * 10) / 10,
      });
    }

    return {
      runCount,
      days: aggregatedDays,
      individualRuns: runsData.slice(0, 10), // keep up to 10 faint sample lines
    };
  }
}
