// src/simulation/SimulationEngine.ts
/**
 * Simulation Engine for Epidemic Lab.
 * Manages the SEIR epidemic progression, MinHeap event queue, Day Snapshots,
 * Transmission Tree tracking, and live particle events.
 *
 * Layers: Separated cleanly from React UI.
 * Time Complexity:
 *  - step(): O(I * avgDegree + E_events * log H) where I = infectious count
 *  - snapshot(): O(V)
 *  - scrubToDay(): O(1) array lookup
 * Space Complexity: O(Days * V) for snapshot history.
 */

import { AdjacencyList } from '../dataStructures/AdjacencyList';
import type { NodeId } from '../dataStructures/AdjacencyList';
import { MinHeap } from '../dataStructures/MinHeap';
import { HashMap } from '../dataStructures/HashMap';
import { TransmissionTree } from '../dataStructures/TransmissionTree';
import { SeededRNG } from '../utils/SeededRNG';
import { DEFAULT_DISEASE_PARAMS } from './DiseaseModel';
import type {
  HealthState,
  DiseaseParameters,
  ScheduledEvent,
  TransmissionEvent,
  NodeHealthRecord,
} from './DiseaseModel';

export interface DaySnapshot {
  day: number;
  sCount: number;
  eCount: number;
  iCount: number;
  rCount: number;
  newInfectionsToday: number;
  nodeStates: Map<NodeId, HealthState>;
  events: TransmissionEvent[];
}

export class SimulationEngine {
  public graph: AdjacencyList;
  public nodeHealth: HashMap<NodeId, NodeHealthRecord>;
  public eventHeap: MinHeap<ScheduledEvent>;
  public transmissionTree: TransmissionTree;
  public rng: SeededRNG;
  public params: DiseaseParameters;

  public currentDay: number = 0;
  public isRunning: boolean = false;
  public isCompleted: boolean = false;
  public allNodeIds: NodeId[] = [];
  public snapshots: DaySnapshot[] = [];
  public recentTransmissions: TransmissionEvent[] = [];
  public initialSeedIds: NodeId[] = [];
  public seedNumber: number;

  private timerId: number | null = null;
  public onUpdate?: (engine: SimulationEngine) => void;

  constructor(seed: number = 42, params: DiseaseParameters = DEFAULT_DISEASE_PARAMS) {
    this.seedNumber = seed;
    this.params = { ...params };
    this.graph = new AdjacencyList();
    this.nodeHealth = new HashMap<NodeId, NodeHealthRecord>(128);
    this.eventHeap = new MinHeap<ScheduledEvent>();
    this.transmissionTree = new TransmissionTree();
    this.rng = new SeededRNG(seed);
  }

  /**
   * Initializes or resets the simulation with a graph and parameters.
   */
  initialize(
    nodeIds: NodeId[],
    graph: AdjacencyList,
    seedNodeIds?: NodeId[],
    customParams?: Partial<DiseaseParameters>
  ): void {
    this.pause();
    this.currentDay = 0;
    this.isCompleted = false;
    this.allNodeIds = [...nodeIds];
    this.graph = graph;
    this.nodeHealth.clear();
    this.eventHeap.clear();
    this.transmissionTree.clear();
    this.snapshots = [];
    this.recentTransmissions = [];

    if (customParams) {
      this.params = { ...this.params, ...customParams };
    }

    // Reset RNG with original seed
    this.rng.setSeed(this.seedNumber);

    // Initialize all nodes as Susceptible (S)
    for (const id of nodeIds) {
      this.nodeHealth.set(id, {
        id,
        state: 'S',
        dayExposed: null,
        dayInfectious: null,
        dayRecovered: null,
        infectedBy: null,
      });
    }

    // Pick seed infected nodes
    const seedCount = Math.max(1, Math.min(this.params.initialSeeds, nodeIds.length));
    const chosenSeeds: NodeId[] = seedNodeIds
      ? [...seedNodeIds]
      : this.pickInitialSeeds(seedCount);

    this.initialSeedIds = chosenSeeds;

    for (const seedId of chosenSeeds) {
      const record = this.nodeHealth.get(seedId);
      if (record) {
        record.state = 'I';
        record.dayExposed = 0;
        record.dayInfectious = 0;
        this.transmissionTree.addSeed(seedId, 0);

        // Schedule recovery event in MinHeap
        this.eventHeap.insert(this.params.infectiousPeriod, {
          type: 'RECOVER',
          nodeId: seedId,
          day: this.params.infectiousPeriod,
        });
      }
    }

    // Take Day 0 Snapshot
    this.recordSnapshot(0);
    this.notifyUpdate();
  }

  /**
   * Selects deterministic seed nodes from high-degree or central nodes.
   */
  private pickInitialSeeds(count: number): NodeId[] {
    const sortedByDegree = [...this.allNodeIds].sort(
      (a, b) => this.graph.neighbors(b).length - this.graph.neighbors(a).length
    );
    return sortedByDegree.slice(0, count);
  }

  /**
   * Advances simulation by exactly ONE Day.
   * Processes MinHeap events and evaluates transmissions.
   */
  step(): boolean {
    if (this.isCompleted) return false;

    this.currentDay++;
    this.recentTransmissions = [];
    let newInfectionsCount = 0;

    // 1. Process scheduled MinHeap events whose time is <= currentDay
    while (!this.eventHeap.isEmpty() && this.eventHeap.peek()!.key <= this.currentDay) {
      const eventItem = this.eventHeap.extractMin()!;
      const event = eventItem.value;
      const record = this.nodeHealth.get(event.nodeId);

      if (!record) continue;

      if (event.type === 'BECOME_INFECTIOUS' && record.state === 'E') {
        record.state = 'I';
        record.dayInfectious = this.currentDay;

        // Schedule recovery
        const recoveryDay = this.currentDay + this.params.infectiousPeriod;
        this.eventHeap.insert(recoveryDay, {
          type: 'RECOVER',
          nodeId: event.nodeId,
          day: recoveryDay,
        });
      } else if (event.type === 'RECOVER' && record.state === 'I') {
        if (this.rng.chance(this.params.recoveryProbability)) {
          record.state = 'R';
          record.dayRecovered = this.currentDay;
        }
      }
    }

    // 2. Transmissions: all currently Infectious (I) nodes attempt to infect Susceptible (S) neighbors
    const newlyExposedNodes: { id: NodeId; source: NodeId }[] = [];

    for (const nodeId of this.allNodeIds) {
      const record = this.nodeHealth.get(nodeId);
      if (!record || record.state !== 'I') continue;

      // Check active neighbors
      const neighbors = this.graph.neighbors(nodeId);
      for (const targetId of neighbors) {
        const targetRecord = this.nodeHealth.get(targetId);
        if (targetRecord && targetRecord.state === 'S') {
          // Transmission probability modified by contactStrength
          const effectiveProb = Math.min(
            1.0,
            this.params.transmissionProbability * this.params.contactStrength
          );

          if (this.rng.chance(effectiveProb)) {
            newlyExposedNodes.push({ id: targetId, source: nodeId });
          }
        }
      }
    }

    // Apply exposures
    for (const { id, source } of newlyExposedNodes) {
      const targetRecord = this.nodeHealth.get(id);
      if (targetRecord && targetRecord.state === 'S') {
        targetRecord.state = 'E';
        targetRecord.dayExposed = this.currentDay;
        targetRecord.infectedBy = source;
        newInfectionsCount++;

        this.transmissionTree.recordTransmission(source, id, this.currentDay);

        // Schedule transition to infectious in MinHeap
        const infectiousDay = this.currentDay + this.params.incubationPeriod;
        this.eventHeap.insert(infectiousDay, {
          type: 'BECOME_INFECTIOUS',
          nodeId: id,
          day: infectiousDay,
        });

        // Record transmission event for live particle visualization
        const tEvent: TransmissionEvent = {
          source,
          target: id,
          day: this.currentDay,
          timestamp: Date.now(),
        };
        this.recentTransmissions.push(tEvent);
      }
    }

    // 3. Record Day Snapshot
    this.recordSnapshot(newInfectionsCount);

    // 4. Check completion: if no Exposed (E) and no Infectious (I) nodes remain
    let activeInfectious = 0;
    let activeExposed = 0;
    for (const id of this.allNodeIds) {
      const state = this.nodeHealth.get(id)?.state;
      if (state === 'I') activeInfectious++;
      if (state === 'E') activeExposed++;
    }

    if (activeInfectious === 0 && activeExposed === 0) {
      this.isCompleted = true;
      this.pause();
    }

    this.notifyUpdate();
    return true;
  }

  /**
   * Captures the full state of the network for the current day.
   */
  private recordSnapshot(newInfectionsToday: number): void {
    let sCount = 0;
    let eCount = 0;
    let iCount = 0;
    let rCount = 0;
    const stateMap = new Map<NodeId, HealthState>();

    for (const id of this.allNodeIds) {
      const state = this.nodeHealth.get(id)?.state || 'S';
      stateMap.set(id, state);
      if (state === 'S') sCount++;
      else if (state === 'E') eCount++;
      else if (state === 'I') iCount++;
      else if (state === 'R') rCount++;
    }

    this.snapshots.push({
      day: this.currentDay,
      sCount,
      eCount,
      iCount,
      rCount,
      newInfectionsToday,
      nodeStates: stateMap,
      events: [...this.recentTransmissions],
    });
  }

  /**
   * Start auto-stepping the simulation.
   */
  run(): void {
    if (this.isRunning || this.isCompleted) return;
    this.isRunning = true;
    this.notifyUpdate();

    const loop = () => {
      if (!this.isRunning) return;
      const canContinue = this.step();
      if (canContinue && !this.isCompleted) {
        this.timerId = window.setTimeout(loop, Math.max(80, this.params.speed));
      } else {
        this.isRunning = false;
        this.notifyUpdate();
      }
    };

    this.timerId = window.setTimeout(loop, Math.max(80, this.params.speed));
  }

  /**
   * Pause the auto-stepping simulation.
   */
  pause(): void {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notifyUpdate();
  }

  /**
   * Resets simulation back to Day 0.
   */
  reset(): void {
    this.pause();
    this.initialize(this.allNodeIds, this.graph, this.initialSeedIds, this.params);
  }

  /**
   * Scrub to an arbitrary historical day snapshot.
   */
  getSnapshotAt(day: number): DaySnapshot | undefined {
    return this.snapshots[day];
  }

  /**
   * Clone this engine for counterfactual comparison experiments.
   */
  cloneForCounterfactual(): SimulationEngine {
    const copy = new SimulationEngine(this.seedNumber, { ...this.params });
    copy.initialize(this.allNodeIds, this.graph, this.initialSeedIds, this.params);
    return copy;
  }

  private notifyUpdate(): void {
    if (this.onUpdate) {
      this.onUpdate(this);
    }
  }
}
