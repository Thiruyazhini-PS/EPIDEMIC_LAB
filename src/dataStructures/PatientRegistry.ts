// src/dataStructures/PatientRegistry.ts
/**
 * Patient Health Records, Thermal Screening & Location Tracking Registry.
 *
 * Stores comprehensive confidential clinical records for individuals in the network:
 * - Thermal infrared scans & fever detection (body temperature in °C)
 * - Medical vitals (SpO2, heart rate, symptoms)
 * - Geo-location check-in zones & timestamped proximity logs
 * - Automated epidemiological risk classifier that maps clinical data to SEIR state
 *
 * Time Complexity:
 *  - Lookup by ID / Email: O(1)
 *  - Risk Assessment: O(1)
 *  - Search / Filter: O(N)
 * Space Complexity: O(N)
 */

import type { HealthState } from '../simulation/DiseaseModel';

export interface LocationRecord {
  zoneId: string;
  zoneName: string;
  coordinates: { x: number; y: number }; // spatial coordinate in facility / city
  timestamp: string;
}

export interface ThermalScan {
  temperatureC: number;
  thermalStatus: 'Normal' | 'Elevated' | 'Fever';
  scanMethod: 'Infrared Kiosk' | 'Wearable Sensor' | 'Clinical Thermometer';
  timestamp: string;
}

export interface MedicalVitals {
  spo2: number;             // Oxygen saturation percentage (e.g. 97%)
  heartRate: number;        // BPM (e.g. 78)
  coughSeverity: 'None' | 'Mild' | 'Persistent';
  lossOfTasteOrSmell: boolean;
  shortnessOfBreath: boolean;
  fatigueLevel: 'None' | 'Moderate' | 'Severe';
  vaccinatedDoses: number;
}

export interface DiagnosticAssessment {
  state: HealthState;       // Mapped SEIR state (S, E, I, R)
  riskScore: number;        // 0 to 100 percentage
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Infection Probability' | 'Confirmed Active';
  primaryIndicators: string[];
  recommendation: string;
  assessedAt: string;
}

export interface PatientRecord {
  id: number;               // Corresponds to NodeId in the contact graph
  fullName: string;
  email: string;
  age: number;
  gender: string;
  isPrivate: boolean;       // Patient privacy consent flag
  createdAt: string;
  
  // Location & Check-in
  currentLocation: LocationRecord;
  locationHistory: LocationRecord[];

  // Thermal & Biometric Screening
  latestThermal: ThermalScan;
  thermalHistory: { temp: number; time: string }[];

  // Medical Vitals & Symptoms
  vitals: MedicalVitals;

  // Direct Contact Exposure History
  exposure: {
    reportedCloseContact: boolean;
    knownInfectedContactId?: number;
    daysSinceExposure?: number;
  };

  // AI / Epidemiological Classification
  diagnosis: DiagnosticAssessment;
}

export class PatientRegistry {
  private records: Map<number, PatientRecord> = new Map();
  private emailIndex: Map<string, number> = new Map();

  constructor() {
    this.seedInitialDataset();
  }

  /**
   * Diagnostic Rule Classifier:
   * Evaluates thermal reading, clinical symptoms, and contact proximity
   * to determine infection risk score (0-100%) and SEIR classification.
   */
  public static evaluateRisk(
    tempC: number,
    vitals: MedicalVitals,
    exposure: { reportedCloseContact: boolean; daysSinceExposure?: number }
  ): DiagnosticAssessment {
    let score = 0;
    const indicators: string[] = [];

    // 1. Thermal evaluation
    if (tempC >= 38.3) {
      score += 40;
      indicators.push(`High fever detected (${tempC.toFixed(1)}°C)`);
    } else if (tempC >= 37.5) {
      score += 22;
      indicators.push(`Elevated body temperature (${tempC.toFixed(1)}°C)`);
    }

    // 2. Specific Pathognomonic Symptoms
    if (vitals.lossOfTasteOrSmell) {
      score += 28;
      indicators.push('Loss of taste/smell (Anosmia)');
    }
    if (vitals.shortnessOfBreath) {
      score += 24;
      indicators.push('Dyspnea / Shortness of breath');
    }
    if (vitals.spo2 < 93) {
      score += 25;
      indicators.push(`Hypoxemia alert (SpO₂: ${vitals.spo2}%)`);
    } else if (vitals.spo2 < 96) {
      score += 12;
      indicators.push(`Mild SpO₂ reduction (${vitals.spo2}%)`);
    }

    if (vitals.coughSeverity === 'Persistent') {
      score += 15;
      indicators.push('Persistent dry cough');
    } else if (vitals.coughSeverity === 'Mild') {
      score += 8;
    }

    if (vitals.fatigueLevel === 'Severe') {
      score += 10;
      indicators.push('Severe acute fatigue');
    }

    // 3. Known Contact Exposure
    if (exposure.reportedCloseContact) {
      const days = exposure.daysSinceExposure ?? 3;
      score += 25;
      indicators.push(`Direct contact with positive individual (${days}d ago)`);
    }

    // Clamp score
    const finalScore = Math.min(100, Math.max(5, score));

    // Map to SEIR state
    let state: HealthState = 'S';
    let riskLevel: DiagnosticAssessment['riskLevel'] = 'Low Risk';
    let recommendation = 'Standard health precautions. Routine periodic screening recommended.';

    if (finalScore >= 65) {
      state = 'I';
      riskLevel = 'High Infection Probability';
      recommendation = 'IMMEDIATE ISOLATION: High probability of active viral transmission. PCR swab test and quarantine required.';
    } else if (finalScore >= 35 || exposure.reportedCloseContact) {
      state = 'E';
      riskLevel = 'Moderate Risk';
      recommendation = 'INCUBATION MONITORING: Probable exposure detected. Avoid high-density contact zones for 5 days.';
    } else {
      state = 'S';
      riskLevel = 'Low Risk';
    }

    return {
      state,
      riskScore: finalScore,
      riskLevel,
      primaryIndicators: indicators.length > 0 ? indicators : ['No critical symptoms detected'],
      recommendation,
      assessedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  /**
   * Register or update a patient's medical and thermal record.
   */
  public registerPatient(patient: PatientRecord): void {
    this.records.set(patient.id, patient);
    this.emailIndex.set(patient.email.toLowerCase(), patient.id);
  }

  /**
   * Retrieve by graph Node ID.
   */
  public getById(id: number): PatientRecord | undefined {
    return this.records.get(id);
  }

  /**
   * Retrieve by email.
   */
  public getByEmail(email: string): PatientRecord | undefined {
    const id = this.emailIndex.get(email.toLowerCase());
    return id !== undefined ? this.records.get(id) : undefined;
  }

  /**
   * Get all registered records.
   */
  public getAllRecords(): PatientRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Add a new thermal reading log.
   */
  public recordThermalScan(id: number, tempC: number, method: ThermalScan['scanMethod'] = 'Infrared Kiosk'): PatientRecord | undefined {
    const patient = this.records.get(id);
    if (!patient) return undefined;

    const thermalStatus: ThermalScan['thermalStatus'] =
      tempC >= 38.0 ? 'Fever' : tempC >= 37.4 ? 'Elevated' : 'Normal';

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    patient.latestThermal = {
      temperatureC: tempC,
      thermalStatus,
      scanMethod: method,
      timestamp,
    };

    patient.thermalHistory.push({ temp: tempC, time: timestamp });
    if (patient.thermalHistory.length > 10) patient.thermalHistory.shift();

    // Re-evaluate risk
    patient.diagnosis = PatientRegistry.evaluateRisk(tempC, patient.vitals, patient.exposure);

    return patient;
  }

  /**
   * Pre-populates realistic clinical records for the first batch of graph nodes.
   */
  private seedInitialDataset(): void {
    const initialProfiles = [
      {
        id: 0,
        fullName: 'Dr. Elena Rostova',
        email: 'elena.rostova@lab.gov',
        age: 38,
        gender: 'Female',
        zone: 'Zone A - Research Core',
        coords: { x: 120, y: 140 },
        temp: 38.8,
        spo2: 92,
        hr: 104,
        cough: 'Persistent' as const,
        anosmia: true,
        dyspnea: true,
        fatigue: 'Severe' as const,
        exposure: true,
        contactNode: 0,
      },
      {
        id: 1,
        fullName: 'Marcus Vance',
        email: 'marcus.v@biotech.org',
        age: 45,
        gender: 'Male',
        zone: 'Zone A - Research Core',
        coords: { x: 135, y: 155 },
        temp: 37.7,
        spo2: 95,
        hr: 82,
        cough: 'Mild' as const,
        anosmia: false,
        dyspnea: false,
        fatigue: 'Moderate' as const,
        exposure: true,
        contactNode: 0,
      },
      {
        id: 2,
        fullName: 'Amina Al-Sayed',
        email: 'amina.s@transit.net',
        age: 29,
        gender: 'Female',
        zone: 'Zone B - Transit Hub',
        coords: { x: 380, y: 220 },
        temp: 36.6,
        spo2: 99,
        hr: 70,
        cough: 'None' as const,
        anosmia: false,
        dyspnea: false,
        fatigue: 'None' as const,
        exposure: false,
      },
      {
        id: 3,
        fullName: 'Julian Hayes',
        email: 'julian.h@campus.edu',
        age: 22,
        gender: 'Male',
        zone: 'Zone C - Student Quad',
        coords: { x: 510, y: 310 },
        temp: 36.8,
        spo2: 98,
        hr: 74,
        cough: 'None' as const,
        anosmia: false,
        dyspnea: false,
        fatigue: 'None' as const,
        exposure: false,
      },
      {
        id: 4,
        fullName: 'Siddharth Patel',
        email: 'siddharth.p@med.org',
        age: 52,
        gender: 'Male',
        zone: 'Zone B - Transit Hub',
        coords: { x: 395, y: 240 },
        temp: 38.4,
        spo2: 94,
        hr: 98,
        cough: 'Persistent' as const,
        anosmia: true,
        dyspnea: false,
        fatigue: 'Moderate' as const,
        exposure: true,
        contactNode: 1,
      },
      {
        id: 5,
        fullName: 'Claire Beaufort',
        email: 'claire.b@hospital.fr',
        age: 34,
        gender: 'Female',
        zone: 'Zone A - Research Core',
        coords: { x: 110, y: 160 },
        temp: 36.5,
        spo2: 99,
        hr: 68,
        cough: 'None' as const,
        anosmia: false,
        dyspnea: false,
        fatigue: 'None' as const,
        exposure: false,
      },
      {
        id: 6,
        fullName: 'Li Wei',
        email: 'li.wei@logistics.cn',
        age: 41,
        gender: 'Male',
        zone: 'Zone B - Transit Hub',
        coords: { x: 420, y: 215 },
        temp: 37.3,
        spo2: 97,
        hr: 78,
        cough: 'Mild' as const,
        anosmia: false,
        dyspnea: false,
        fatigue: 'None' as const,
        exposure: false,
      },
      {
        id: 7,
        fullName: 'Zara O’Connor',
        email: 'zara.oc@pharma.ie',
        age: 27,
        gender: 'Female',
        zone: 'Zone C - Student Quad',
        coords: { x: 530, y: 325 },
        temp: 36.7,
        spo2: 99,
        hr: 72,
        cough: 'None' as const,
        anosmia: false,
        dyspnea: false,
        fatigue: 'None' as const,
        exposure: false,
      },
    ];

    for (const p of initialProfiles) {
      const vitals: MedicalVitals = {
        spo2: p.spo2,
        heartRate: p.hr,
        coughSeverity: p.cough,
        lossOfTasteOrSmell: p.anosmia,
        shortnessOfBreath: p.dyspnea,
        fatigueLevel: p.fatigue,
        vaccinatedDoses: 2,
      };

      const exposure = {
        reportedCloseContact: p.exposure,
        knownInfectedContactId: p.contactNode,
        daysSinceExposure: p.exposure ? 3 : undefined,
      };

      const diagnosis = PatientRegistry.evaluateRisk(p.temp, vitals, exposure);
      const thermalStatus: ThermalScan['thermalStatus'] =
        p.temp >= 38.0 ? 'Fever' : p.temp >= 37.4 ? 'Elevated' : 'Normal';

      const patient: PatientRecord = {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        age: p.age,
        gender: p.gender,
        isPrivate: true,
        createdAt: 'Day 00, 08:30 AM',
        currentLocation: {
          zoneId: p.zone.split(' - ')[0],
          zoneName: p.zone,
          coordinates: p.coords,
          timestamp: '10:45 AM',
        },
        locationHistory: [
          { zoneId: p.zone.split(' - ')[0], zoneName: p.zone, coordinates: p.coords, timestamp: '08:30 AM' },
          { zoneId: p.zone.split(' - ')[0], zoneName: p.zone, coordinates: p.coords, timestamp: '10:45 AM' },
        ],
        latestThermal: {
          temperatureC: p.temp,
          thermalStatus,
          scanMethod: 'Infrared Kiosk',
          timestamp: '10:45 AM',
        },
        thermalHistory: [
          { temp: p.temp - 0.2, time: '08:30 AM' },
          { temp: p.temp, time: '10:45 AM' },
        ],
        vitals,
        exposure,
        diagnosis,
      };

      this.registerPatient(patient);
    }
  }
}
