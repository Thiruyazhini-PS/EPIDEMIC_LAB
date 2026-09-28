// src/backend/apiClient.ts
/**
 * Asynchronous Backend API Client for Epidemic Lab.
 * Simulates RESTful network requests, authentication tokens, headers, and status responses.
 * Backed by the persistent BackendDatabase.
 */

import { db } from './db';
import type {
  UserAccount,
  CompleteMedicalFile,
  AuthSession,
  ThermalLogEntry,
  SymptomAssessmentEntry,
  ContactInteractionLog,
} from './types';

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
}

export class ApiClient {
  private static token: string | null = null;
  private static currentUser: AuthSession['user'] | null = null;

  /**
   * Mock network latency helper (50-200ms)
   */
  private static async delay(ms: number = 80): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * POST /api/auth/login
   */
  public static async login(
    email: string,
    password: string,
    twoFactorPin?: string
  ): Promise<ApiResponse<AuthSession>> {
    await this.delay(120);

    const user = db.findUserByEmail(email);
    if (!user) {
      return { success: false, status: 404, error: 'User account not found with this email.' };
    }

    if (user.passwordHash !== password) {
      return { success: false, status: 401, error: 'Invalid password credential.' };
    }

    if (user.twoFactorEnabled && twoFactorPin && user.twoFactorPin !== twoFactorPin) {
      return { success: false, status: 403, error: 'Incorrect 2FA Security PIN.' };
    }

    const token = `jwt_token_${user.id}_${Date.now()}`;
    const session: AuthSession = {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        nodeId: user.nodeId,
      },
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    this.token = token;
    this.currentUser = session.user;

    // Log security audit
    const file = db.getMedicalFileByUserId(user.id);
    if (file) {
      file.securityAuditLog.unshift({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: 'Authorized Session Established via REST API',
        ipAddress: '127.0.0.1 (Localhost)',
        device: 'Secure Web Client',
      });
      db.saveMedicalFile(file);
    }

    return { success: true, status: 200, data: session };
  }

  /**
   * POST /api/auth/register
   */
  public static async register(
    fullName: string,
    email: string,
    password: string,
    assignedNodeId: number = 10
  ): Promise<ApiResponse<AuthSession>> {
    await this.delay(150);

    if (db.findUserByEmail(email)) {
      return { success: false, status: 409, error: 'Account already exists with this email address.' };
    }

    const userId = `usr_${Date.now().toString().slice(-4)}`;
    const newAccount: UserAccount = {
      id: userId,
      email,
      passwordHash: password,
      fullName,
      role: 'PATIENT',
      nodeId: assignedNodeId,
      twoFactorEnabled: false,
      twoFactorPin: '1234',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const initialFile: CompleteMedicalFile = {
      userId,
      userFullName: fullName,
      email,
      nodeId: assignedNodeId,
      age: 28,
      gender: 'Other',
      bloodType: 'O+',
      comorbidities: {
        asthma: false,
        diabetes: false,
        hypertension: false,
        immunocompromised: false,
        cardiovascularDisease: false,
        smoker: false,
        notes: 'Initial clinical registration baseline.',
      },
      vaccination: {
        status: 'Fully Vaccinated',
        totalDoses: 2,
        vaccineBrand: 'mRNA Spike-Vax',
        lastDoseDate: '2026-03-01',
        boosterReceived: true,
      },
      thermalHistory: [
        {
          id: `th_${Date.now()}`,
          timestamp: 'Just now',
          temperatureC: 36.8,
          locationZone: 'Zone A - Entrance',
          method: 'Infrared Kiosk',
          status: 'Normal',
        },
      ],
      symptomAssessments: [],
      recentContacts: [],
      currentLocationZone: 'Zone A - Entrance',
      currentCoordinates: { x: 120, y: 140 },
      activeDiagnosis: {
        state: 'S',
        infectionProbability: 10,
        quarantineRequired: false,
        clinicalProtocol: 'ROUTINE CLEARANCE: Normal afebrile baseline.',
        lastUpdated: 'Today',
      },
      securityAuditLog: [
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: 'Initial Patient Registration & Confidential Vault Created',
          ipAddress: '127.0.0.1',
          device: 'Browser Client',
        },
      ],
    };

    const registered = db.registerUser(newAccount, initialFile);
    const session: AuthSession = {
      token: `jwt_token_${registered.user.id}_${Date.now()}`,
      user: {
        id: registered.user.id,
        email: registered.user.email,
        fullName: registered.user.fullName,
        role: registered.user.role,
        nodeId: registered.user.nodeId,
      },
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    this.token = session.token;
    this.currentUser = session.user;

    return { success: true, status: 201, data: session };
  }

  /**
   * GET /api/patient/me
   */
  public static async getMyMedicalFile(): Promise<ApiResponse<CompleteMedicalFile>> {
    await this.delay(80);
    if (!this.currentUser) {
      // Return default user if unauthenticated
      const defaultUser = db.findUserByEmail('user@epidemiclab.io') || db.findUserByEmail('elena.rostova@lab.gov');
      if (defaultUser) {
        const file = db.getMedicalFileByUserId(defaultUser.id);
        if (file) return { success: true, status: 200, data: file };
      }
      return { success: false, status: 401, error: 'Unauthorized: Session missing or expired.' };
    }

    const file = db.getMedicalFileByUserId(this.currentUser.id);
    if (!file) {
      return { success: false, status: 404, error: 'Medical file not found.' };
    }

    return { success: true, status: 200, data: file };
  }

  /**
   * POST /api/patient/submit-vitals
   */
  public static async submitVitalsAndThermal(
    temperatureC: number,
    spo2: number,
    heartRate: number,
    symptoms: {
      cough: 'None' | 'Mild' | 'Persistent';
      lossOfTasteSmell: boolean;
      shortnessOfBreath: boolean;
      fatigue: 'None' | 'Moderate' | 'Severe';
    },
    locationZone: string,
    coords: { x: number; y: number }
  ): Promise<ApiResponse<CompleteMedicalFile>> {
    await this.delay(100);

    const fileRes = await this.getMyMedicalFile();
    if (!fileRes.success || !fileRes.data) {
      return { success: false, status: 401, error: 'Failed to access medical record.' };
    }

    const file = fileRes.data;

    // Calculate score
    let score = 0;
    if (temperatureC >= 38.3) score += 40;
    else if (temperatureC >= 37.5) score += 22;

    if (symptoms.lossOfTasteSmell) score += 28;
    if (symptoms.shortnessOfBreath) score += 25;
    if (spo2 < 93) score += 25;
    else if (spo2 < 96) score += 12;

    if (symptoms.cough === 'Persistent') score += 15;
    else if (symptoms.cough === 'Mild') score += 8;

    if (symptoms.fatigue === 'Severe') score += 10;

    const infectionProb = Math.min(100, Math.max(5, score));
    const detectedState = infectionProb >= 65 ? 'I' : infectionProb >= 35 ? 'E' : 'S';

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append thermal log
    const thermalStatus = temperatureC >= 38.0 ? 'Fever' : temperatureC >= 37.4 ? 'Elevated' : 'Normal';
    const newThermal: ThermalLogEntry = {
      id: `th_${Date.now()}`,
      timestamp,
      temperatureC,
      locationZone,
      method: 'Infrared Kiosk',
      status: thermalStatus,
    };
    file.thermalHistory.push(newThermal);

    // Append symptom assessment
    const newAssessment: SymptomAssessmentEntry = {
      id: `sym_${Date.now()}`,
      date: timestamp,
      spo2,
      heartRateBpm: heartRate,
      coughSeverity: symptoms.cough,
      lossOfTasteSmell: symptoms.lossOfTasteSmell,
      shortnessOfBreath: symptoms.shortnessOfBreath,
      fatigueLevel: symptoms.fatigue,
      calculatedRiskScore: infectionProb,
      detectedState,
    };
    file.symptomAssessments.unshift(newAssessment);

    // Update location
    file.currentLocationZone = locationZone;
    file.currentCoordinates = coords;

    // Update diagnosis
    file.activeDiagnosis = {
      state: detectedState,
      infectionProbability: infectionProb,
      quarantineRequired: detectedState === 'I',
      clinicalProtocol:
        detectedState === 'I'
          ? `ACTIVE TRANSMISSION HAZARD: Pyrexia (${temperatureC.toFixed(1)}°C) and respiratory symptoms. Immediate quarantine in effect.`
          : detectedState === 'E'
          ? `INCUBATION MONITOR: Elevated metrics (${temperatureC.toFixed(1)}°C). Limit physical interactions in Zone ${locationZone.split(' - ')[0]}.`
          : 'NORMAL STATUS: Afebrile baseline maintained. No active transmission risks.',
      lastUpdated: timestamp,
    };

    file.securityAuditLog.unshift({
      timestamp,
      event: `Vitals Assessment Submitted (Infection Risk: ${infectionProb}%, Temp: ${temperatureC.toFixed(1)}°C)`,
      ipAddress: '127.0.0.1',
      device: 'Clinical Portal',
    });

    db.saveMedicalFile(file);
    return { success: true, status: 200, data: file };
  }

  /**
   * POST /api/patient/add-contact
   */
  public static async recordContactInteraction(
    contactNodeId: number,
    contactName: string,
    zone: string,
    durationMinutes: number = 30,
    proximityMeters: number = 1.5,
    contactHealthState: 'S' | 'E' | 'I' | 'R' = 'S'
  ): Promise<ApiResponse<CompleteMedicalFile>> {
    await this.delay(80);
    const fileRes = await this.getMyMedicalFile();
    if (!fileRes.success || !fileRes.data) {
      return { success: false, status: 401, error: 'File access failure.' };
    }

    const file = fileRes.data;
    const risk = contactHealthState === 'I' ? 90 : contactHealthState === 'E' ? 60 : 10;
    const newContact: ContactInteractionLog = {
      contactNodeId,
      contactName,
      zone,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes,
      proximityMeters,
      contactHealthState,
      riskContributionScore: risk,
    };

    file.recentContacts.unshift(newContact);
    db.saveMedicalFile(file);

    return { success: true, status: 200, data: file };
  }

  /**
   * Helper: Get preset demo accounts for quick one-click login
   */
  public static getPresetAccounts(): {
    email: string;
    pin: string;
    label: string;
    role: string;
    nodeId: number;
    description: string;
  }[] {
    return [
      {
        email: 'elena.rostova@lab.gov',
        pin: '1337',
        label: 'Dr. Elena Rostova',
        role: 'Lead Epidemiologist',
        nodeId: 0,
        description: 'Patient Zero (Infected, Fever 38.8°C, Anosmia, Direct Outbreak Seed)',
      },
      {
        email: 'marcus.v@biotech.org',
        pin: '0000',
        label: 'Marcus Vance',
        role: 'Research Associate',
        nodeId: 1,
        description: 'Exposed Contact (Temp 37.7°C, 45m Contact with Node #0)',
      },
      {
        email: 'user@epidemiclab.io',
        pin: '1234',
        label: 'Alex Mercer, M.D.',
        role: 'Surveillance Officer',
        nodeId: 8,
        description: 'Susceptible Healthcare Monitor (Afebrile 36.6°C, Fully Boosted)',
      },
    ];
  }

  /**
   * POST /api/patient/quarantine-toggle
   */
  public static async toggleQuarantine(quarantine: boolean): Promise<ApiResponse<CompleteMedicalFile>> {
    await this.delay(60);
    const fileRes = await this.getMyMedicalFile();
    if (!fileRes.success || !fileRes.data) {
      return { success: false, status: 401, error: 'Unauthorized.' };
    }
    const file = fileRes.data;
    file.activeDiagnosis.quarantineRequired = quarantine;
    file.securityAuditLog.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      event: quarantine
        ? 'Medical Quarantine Activated - Active Contact Edges Severed'
        : 'Medical Quarantine Lifted - Normal Campus Movement Restored',
      ipAddress: '127.0.0.1',
      device: 'Epidemic Lab Security Vault',
    });
    db.saveMedicalFile(file);
    return { success: true, status: 200, data: file };
  }

  public static getCurrentUser(): AuthSession['user'] | null {
    return this.currentUser;
  }

  public static getToken(): string | null {
    return this.token;
  }

  public static logout(): void {
    this.token = null;
    this.currentUser = null;
  }
}
