// src/backend/types.ts
/**
 * Backend Data Models & Schemas for Secure Health Vault.
 * Compliant with epidemiological surveillance standards.
 */

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string; // Simulated hashed credential
  fullName: string;
  role: 'RESEARCHER' | 'PATIENT' | 'CAMPUS_MEMBER';
  nodeId: number;       // Direct linkage to Graph Node in Simulation
  twoFactorEnabled: boolean;
  twoFactorPin: string; // 4-digit security PIN
  createdAt: string;
  lastLoginAt: string;
}

export interface ComorbidityProfile {
  asthma: boolean;
  diabetes: boolean;
  hypertension: boolean;
  immunocompromised: boolean;
  cardiovascularDisease: boolean;
  smoker: boolean;
  notes: string;
}

export interface VaccinationRecord {
  status: 'Fully Vaccinated' | 'Partially Vaccinated' | 'Unvaccinated';
  totalDoses: number;
  vaccineBrand: string;
  lastDoseDate: string;
  boosterReceived: boolean;
}

export interface ThermalLogEntry {
  id: string;
  timestamp: string;
  temperatureC: number;
  locationZone: string;
  method: 'Infrared Kiosk' | 'Wearable Sensor' | 'Clinical Thermometer';
  status: 'Normal' | 'Elevated' | 'Fever';
}

export interface SymptomAssessmentEntry {
  id: string;
  date: string;
  spo2: number;
  heartRateBpm: number;
  coughSeverity: 'None' | 'Mild' | 'Persistent';
  lossOfTasteSmell: boolean;
  shortnessOfBreath: boolean;
  fatigueLevel: 'None' | 'Moderate' | 'Severe';
  calculatedRiskScore: number;
  detectedState: 'S' | 'E' | 'I' | 'R';
}

export interface ContactInteractionLog {
  contactNodeId: number;
  contactName: string;
  zone: string;
  date: string;
  durationMinutes: number;
  proximityMeters: number;
  contactHealthState: 'S' | 'E' | 'I' | 'R';
  riskContributionScore: number;
}

export interface CompleteMedicalFile {
  userId: string;
  userFullName: string;
  email: string;
  nodeId: number;
  age: number;
  gender: string;
  bloodType: string;
  comorbidities: ComorbidityProfile;
  vaccination: VaccinationRecord;
  thermalHistory: ThermalLogEntry[];
  symptomAssessments: SymptomAssessmentEntry[];
  recentContacts: ContactInteractionLog[];
  currentLocationZone: string;
  currentCoordinates: { x: number; y: number };
  activeDiagnosis: {
    state: 'S' | 'E' | 'I' | 'R';
    infectionProbability: number;
    quarantineRequired: boolean;
    clinicalProtocol: string;
    lastUpdated: string;
  };
  securityAuditLog: {
    timestamp: string;
    event: string;
    ipAddress: string;
    device: string;
  }[];
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    nodeId: number;
  };
  expiresAt: string;
}
