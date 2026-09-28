// src/backend/db.ts
/**
 * Persistent In-Memory & LocalStorage Database for Epidemic Lab.
 * Manages secure user accounts, complete medical files, thermal logs, and contact interaction traces.
 */

import type { UserAccount, CompleteMedicalFile } from './types';

const STORAGE_KEY_USERS = 'epidemic_lab_users_v1';
const STORAGE_KEY_FILES = 'epidemic_lab_medical_files_v1';

export class BackendDatabase {
  private users: Map<string, UserAccount> = new Map();
  private medicalFiles: Map<string, CompleteMedicalFile> = new Map();

  constructor() {
    this.loadFromStorageOrSeed();
  }

  private loadFromStorageOrSeed(): void {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    const rawFiles = localStorage.getItem(STORAGE_KEY_FILES);

    if (rawUsers && rawFiles) {
      try {
        const parsedUsers: UserAccount[] = JSON.parse(rawUsers);
        const parsedFiles: CompleteMedicalFile[] = JSON.parse(rawFiles);
        parsedUsers.forEach(u => this.users.set(u.email.toLowerCase(), u));
        parsedFiles.forEach(f => this.medicalFiles.set(f.userId, f));
        return;
      } catch (e) {
        console.warn('Failed to parse cached database, reseeding...', e);
      }
    }

    this.seedDefaultDatabase();
  }

  public saveToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY_USERS,
        JSON.stringify(Array.from(this.users.values()))
      );
      localStorage.setItem(
        STORAGE_KEY_FILES,
        JSON.stringify(Array.from(this.medicalFiles.values()))
      );
    } catch (e) {
      console.warn('Storage quota or security restriction:', e);
    }
  }

  public findUserByEmail(email: string): UserAccount | undefined {
    return this.users.get(email.toLowerCase());
  }

  public findUserById(id: string): UserAccount | undefined {
    for (const u of this.users.values()) {
      if (u.id === id) return u;
    }
    return undefined;
  }

  public getMedicalFileByUserId(userId: string): CompleteMedicalFile | undefined {
    return this.medicalFiles.get(userId);
  }

  public getMedicalFileByNodeId(nodeId: number): CompleteMedicalFile | undefined {
    for (const f of this.medicalFiles.values()) {
      if (f.nodeId === nodeId) return f;
    }
    return undefined;
  }

  public getAllMedicalFiles(): CompleteMedicalFile[] {
    return Array.from(this.medicalFiles.values());
  }

  public saveMedicalFile(file: CompleteMedicalFile): void {
    this.medicalFiles.set(file.userId, file);
    this.saveToStorage();
  }

  public registerUser(
    account: UserAccount,
    initialMedicalFile: CompleteMedicalFile
  ): { user: UserAccount; file: CompleteMedicalFile } {
    this.users.set(account.email.toLowerCase(), account);
    this.medicalFiles.set(account.id, initialMedicalFile);
    this.saveToStorage();
    return { user: account, file: initialMedicalFile };
  }

  private seedDefaultDatabase(): void {
    // 1. Dr. Elena Rostova (Infected Patient Zero)
    const elenaUser: UserAccount = {
      id: 'usr_001',
      email: 'elena.rostova@lab.gov',
      passwordHash: 'lab2026',
      fullName: 'Dr. Elena Rostova',
      role: 'RESEARCHER',
      nodeId: 0,
      twoFactorEnabled: true,
      twoFactorPin: '1337',
      createdAt: '2026-09-15T08:00:00Z',
      lastLoginAt: '2026-09-28T20:15:00Z',
    };

    const elenaFile: CompleteMedicalFile = {
      userId: elenaUser.id,
      userFullName: elenaUser.fullName,
      email: elenaUser.email,
      nodeId: 0,
      age: 38,
      gender: 'Female',
      bloodType: 'O+',
      comorbidities: {
        asthma: true,
        diabetes: false,
        hypertension: false,
        immunocompromised: false,
        cardiovascularDisease: false,
        smoker: false,
        notes: 'Mild adult-onset asthma managed with bronchodilator.',
      },
      vaccination: {
        status: 'Fully Vaccinated',
        totalDoses: 3,
        vaccineBrand: 'mRNA Spike-Vax',
        lastDoseDate: '2026-02-14',
        boosterReceived: true,
      },
      thermalHistory: [
        { id: 'th_01', timestamp: 'Day 01, 08:30 AM', temperatureC: 37.1, locationZone: 'Zone A - Entrance', method: 'Infrared Kiosk', status: 'Normal' },
        { id: 'th_02', timestamp: 'Day 02, 09:15 AM', temperatureC: 37.8, locationZone: 'Zone A - Bio-Lab', method: 'Wearable Sensor', status: 'Elevated' },
        { id: 'th_03', timestamp: 'Day 03, 11:00 AM', temperatureC: 38.8, locationZone: 'Zone A - Research Core', method: 'Infrared Kiosk', status: 'Fever' },
      ],
      symptomAssessments: [
        {
          id: 'sym_01',
          date: 'Day 03, 11:30 AM',
          spo2: 92,
          heartRateBpm: 104,
          coughSeverity: 'Persistent',
          lossOfTasteSmell: true,
          shortnessOfBreath: true,
          fatigueLevel: 'Severe',
          calculatedRiskScore: 92,
          detectedState: 'I',
        },
      ],
      recentContacts: [
        { contactNodeId: 1, contactName: 'Marcus Vance', zone: 'Zone A - Research Core', date: 'Day 02, 14:00', durationMinutes: 45, proximityMeters: 1.2, contactHealthState: 'E', riskContributionScore: 85 },
        { contactNodeId: 4, contactName: 'Siddharth Patel', zone: 'Zone A - Cafeteria', date: 'Day 02, 12:30', durationMinutes: 30, proximityMeters: 1.5, contactHealthState: 'E', riskContributionScore: 78 },
        { contactNodeId: 5, contactName: 'Claire Beaufort', zone: 'Zone A - Meeting Rm', date: 'Day 01, 16:00', durationMinutes: 15, proximityMeters: 2.5, contactHealthState: 'S', riskContributionScore: 25 },
      ],
      currentLocationZone: 'Zone A - Research Core',
      currentCoordinates: { x: 120, y: 140 },
      activeDiagnosis: {
        state: 'I',
        infectionProbability: 92,
        quarantineRequired: true,
        clinicalProtocol: 'ISOLATION MANDATE: Confirmed symptomatic fever with anosmia and dyspnea. Cut active contact edges immediately.',
        lastUpdated: 'Day 03, 11:35 AM',
      },
      securityAuditLog: [
        { timestamp: 'Day 03, 11:35 AM', event: 'Thermal Fever Alert Triggered (38.8°C)', ipAddress: '10.0.4.12', device: 'Bio-Safety Kiosk A-1' },
        { timestamp: 'Day 03, 08:00 AM', event: 'Secure 2FA Login Approved', ipAddress: '10.0.4.12', device: 'Terminal Station 04' },
      ],
    };

    // 2. Marcus Vance (Exposed Contact)
    const marcusUser: UserAccount = {
      id: 'usr_002',
      email: 'marcus.v@biotech.org',
      passwordHash: 'biotech2026',
      fullName: 'Marcus Vance',
      role: 'PATIENT',
      nodeId: 1,
      twoFactorEnabled: false,
      twoFactorPin: '0000',
      createdAt: '2026-09-18T10:00:00Z',
      lastLoginAt: '2026-09-28T21:00:00Z',
    };

    const marcusFile: CompleteMedicalFile = {
      userId: marcusUser.id,
      userFullName: marcusUser.fullName,
      email: marcusUser.email,
      nodeId: 1,
      age: 45,
      gender: 'Male',
      bloodType: 'A+',
      comorbidities: {
        asthma: false,
        diabetes: true,
        hypertension: false,
        immunocompromised: false,
        cardiovascularDisease: false,
        smoker: false,
        notes: 'Type II Diabetes controlled with metformin.',
      },
      vaccination: {
        status: 'Fully Vaccinated',
        totalDoses: 2,
        vaccineBrand: 'Vector-Shield',
        lastDoseDate: '2025-11-20',
        boosterReceived: false,
      },
      thermalHistory: [
        { id: 'th_04', timestamp: 'Day 02, 14:00 PM', temperatureC: 36.9, locationZone: 'Zone A', method: 'Infrared Kiosk', status: 'Normal' },
        { id: 'th_05', timestamp: 'Day 03, 10:15 AM', temperatureC: 37.7, locationZone: 'Zone A', method: 'Clinical Thermometer', status: 'Elevated' },
      ],
      symptomAssessments: [
        {
          id: 'sym_02',
          date: 'Day 03, 10:30 AM',
          spo2: 95,
          heartRateBpm: 84,
          coughSeverity: 'Mild',
          lossOfTasteSmell: false,
          shortnessOfBreath: false,
          fatigueLevel: 'Moderate',
          calculatedRiskScore: 58,
          detectedState: 'E',
        },
      ],
      recentContacts: [
        { contactNodeId: 0, contactName: 'Dr. Elena Rostova', zone: 'Zone A - Research Core', date: 'Day 02, 14:00', durationMinutes: 45, proximityMeters: 1.2, contactHealthState: 'I', riskContributionScore: 90 },
      ],
      currentLocationZone: 'Zone A - Research Core',
      currentCoordinates: { x: 135, y: 155 },
      activeDiagnosis: {
        state: 'E',
        infectionProbability: 58,
        quarantineRequired: false,
        clinicalProtocol: 'INCUBATION PROTOCOL: Elevated temp with direct contact history to Node #000. Monitored for symptom onset.',
        lastUpdated: 'Day 03, 10:35 AM',
      },
      securityAuditLog: [
        { timestamp: 'Day 03, 10:15 AM', event: 'Temperature Logged: 37.7°C (Elevated)', ipAddress: '192.168.1.104', device: 'Handheld Sensor #2' },
      ],
    };

    // 3. General Default Researcher (For User Login)
    const defaultUser: UserAccount = {
      id: 'usr_003',
      email: 'user@epidemiclab.io',
      passwordHash: 'password123',
      fullName: 'Alex Mercer, M.D.',
      role: 'RESEARCHER',
      nodeId: 8,
      twoFactorEnabled: true,
      twoFactorPin: '1234',
      createdAt: '2026-09-20T09:00:00Z',
      lastLoginAt: '2026-09-28T22:30:00Z',
    };

    const defaultFile: CompleteMedicalFile = {
      userId: defaultUser.id,
      userFullName: defaultUser.fullName,
      email: defaultUser.email,
      nodeId: 8,
      age: 33,
      gender: 'Non-Binary',
      bloodType: 'B+',
      comorbidities: {
        asthma: false,
        diabetes: false,
        hypertension: false,
        immunocompromised: false,
        cardiovascularDisease: false,
        smoker: false,
        notes: 'No chronic cardiovascular or pulmonary pathologies.',
      },
      vaccination: {
        status: 'Fully Vaccinated',
        totalDoses: 3,
        vaccineBrand: 'mRNA Spike-Vax',
        lastDoseDate: '2026-01-10',
        boosterReceived: true,
      },
      thermalHistory: [
        { id: 'th_06', timestamp: 'Day 01, 08:00 AM', temperatureC: 36.6, locationZone: 'Zone B - Transit Hub', method: 'Infrared Kiosk', status: 'Normal' },
        { id: 'th_07', timestamp: 'Day 02, 08:30 AM', temperatureC: 36.7, locationZone: 'Zone A - Research Core', method: 'Infrared Kiosk', status: 'Normal' },
        { id: 'th_08', timestamp: 'Day 03, 08:15 AM', temperatureC: 38.3, locationZone: 'Zone D - Medical Pavilion', method: 'Wearable Sensor', status: 'Fever' },
      ],
      symptomAssessments: [
        {
          id: 'sym_03',
          date: 'Day 03, 08:45 AM',
          spo2: 94,
          heartRateBpm: 92,
          coughSeverity: 'Persistent',
          lossOfTasteSmell: true,
          shortnessOfBreath: false,
          fatigueLevel: 'Moderate',
          calculatedRiskScore: 78,
          detectedState: 'I',
        },
      ],
      recentContacts: [
        { contactNodeId: 0, contactName: 'Dr. Elena Rostova', zone: 'Zone A - Bio-Lab', date: 'Day 02, 11:00', durationMinutes: 60, proximityMeters: 1.0, contactHealthState: 'I', riskContributionScore: 92 },
        { contactNodeId: 2, contactName: 'Amina Al-Sayed', zone: 'Zone B - Transit Hub', date: 'Day 02, 08:15', durationMinutes: 15, proximityMeters: 2.0, contactHealthState: 'S', riskContributionScore: 12 },
        { contactNodeId: 3, contactName: 'Julian Hayes', zone: 'Zone C - Student Quad', date: 'Day 01, 15:30', durationMinutes: 20, proximityMeters: 3.0, contactHealthState: 'S', riskContributionScore: 8 },
      ],
      currentLocationZone: 'Zone D - Medical Pavilion',
      currentCoordinates: { x: 260, y: 400 },
      activeDiagnosis: {
        state: 'I',
        infectionProbability: 78,
        quarantineRequired: true,
        clinicalProtocol: 'CONFIRMED SYMPTOMATIC: High fever (38.3°C) and anosmia detected. Direct exposure to seed node #000.',
        lastUpdated: 'Day 03, 08:50 AM',
      },
      securityAuditLog: [
        { timestamp: 'Day 03, 08:15 AM', event: 'Thermal Reading 38.3°C Flagged by Infrared Checkpoint', ipAddress: '172.16.0.45', device: 'Entrance Gate 4 Sensor' },
        { timestamp: 'Day 03, 08:00 AM', event: 'Authenticated with 2FA Passcode', ipAddress: '172.16.0.45', device: 'MacBook Pro / Chrome' },
      ],
    };

    this.registerUser(elenaUser, elenaFile);
    this.registerUser(marcusUser, marcusFile);
    this.registerUser(defaultUser, defaultFile);
  }
}

// Global database instance
export const db = new BackendDatabase();
