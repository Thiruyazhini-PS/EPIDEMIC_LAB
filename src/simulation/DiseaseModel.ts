// src/simulation/DiseaseModel.ts
/**
 * SEIR Disease Model & Event Definitions.
 *
 * S = Susceptible (can be infected)
 * E = Exposed (infected but in incubation period, not yet transmitting)
 * I = Infectious (actively transmitting disease along contacts)
 * R = Recovered (immune / removed from transmission)
 *
 * Driven by the MinHeap priority event scheduler:
 * - When S is infected -> transitions to E at current day
 * - Schedules BECOME_INFECTIOUS event at (day + incubationPeriod)
 * - When BECOME_INFECTIOUS fires -> transitions to I, schedules RECOVER at (day + infectiousPeriod)
 * - Daily transmission trials run for all active infectious nodes across active edges.
 */

export type HealthState = 'S' | 'E' | 'I' | 'R';

export interface DiseaseParameters {
  populationSize: number;
  initialSeeds: number;
  transmissionProbability: number; // Beta (e.g. 0.25)
  incubationPeriod: number;        // Days in E state (e.g. 3)
  infectiousPeriod: number;        // Days in I state (e.g. 5)
  recoveryProbability: number;     // Probability to recover after infectious period
  contactDensity: number;          // Graph edge density parameter
  contactStrength: number;         // Multiplier on transmission probability (0.5 - 2.0)
  speed: number;                   // Step delay ms (100 - 1000)
}

export const DEFAULT_DISEASE_PARAMS: DiseaseParameters = {
  populationSize: 80,
  initialSeeds: 2,
  transmissionProbability: 0.32,
  incubationPeriod: 2,
  infectiousPeriod: 4,
  recoveryProbability: 1.0,
  contactDensity: 0.08,
  contactStrength: 1.0,
  speed: 400,
};

export type SimulationEventType = 'BECOME_INFECTIOUS' | 'RECOVER';

export interface ScheduledEvent {
  type: SimulationEventType;
  nodeId: number;
  day: number;
}

export interface TransmissionEvent {
  source: number;
  target: number;
  day: number;
  timestamp: number;
}

export interface NodeHealthRecord {
  id: number;
  state: HealthState;
  dayExposed: number | null;
  dayInfectious: number | null;
  dayRecovered: number | null;
  infectedBy: number | null;
}
