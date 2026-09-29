// src/pages/MedicalPortalPage.tsx
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Thermometer,
  Activity,
  Heart,
  Wind,
  Users,
  Scissors,
  CheckCircle2,
  MapPin,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileText,
  Lock,
} from 'lucide-react';
import { ApiClient } from '../backend/apiClient';
import type { CompleteMedicalFile } from '../backend/types';
import type { SimulationEngine } from '../simulation/SimulationEngine';
import type { HealthState } from '../simulation/DiseaseModel';

interface MedicalPortalPageProps {
  engine: SimulationEngine;
  onNavigateToLab: (focusNodeId?: number) => void;
  onPatientStateUpdated?: (nodeId: number, newState: HealthState) => void;
}

export const MedicalPortalPage: React.FC<MedicalPortalPageProps> = ({
  engine,
  onNavigateToLab,
  onPatientStateUpdated,
}) => {
  const [file, setFile] = useState<CompleteMedicalFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Modal / drawer state
  const [showAddThermal, setShowAddThermal] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showSymptomCheck, setShowSymptomCheck] = useState(false);

  // New thermal input state
  const [inputTemp, setInputTemp] = useState(38.2);
  const [inputZone, setInputZone] = useState('Zone A - Bio-Lab');
  const [inputMethod, setInputMethod] = useState<'Infrared Kiosk' | 'Wearable Sensor' | 'Clinical Thermometer'>('Infrared Kiosk');

  // New contact input state
  const [contactNodeId, setContactNodeId] = useState(2);
  const [contactName, setContactName] = useState('Dr. Maya Lin');
  const [contactDuration, setContactDuration] = useState(30);
  const [contactProximity, setContactProximity] = useState(1.5);
  const [contactState, setContactState] = useState<'S' | 'E' | 'I' | 'R'>('E');

  // New symptom assessment input state
  const [assessTemp, setAssessTemp] = useState(38.4);
  const [assessSpo2, setAssessSpo2] = useState(94);
  const [assessHr, setAssessHr] = useState(98);
  const [assessCough, setAssessCough] = useState<'None' | 'Mild' | 'Persistent'>('Persistent');
  const [assessTasteSmell, setAssessTasteSmell] = useState(true);
  const [assessBreath, setAssessBreath] = useState(false);
  const [assessFatigue, setAssessFatigue] = useState<'None' | 'Moderate' | 'Severe'>('Moderate');

  // Load medical file from backend
  const loadData = async () => {
    setIsLoading(true);
    const res = await ApiClient.getMyMedicalFile();
    if (res.success && res.data) {
      setFile(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading || !file) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-3">
          <Activity className="w-8 h-8 text-[#9192E8] animate-spin" />
          <span className="text-xs font-bold text-[#444766]">Decrypting Health Record Vault...</span>
        </div>
      </div>
    );
  }

  // Push updated state to simulation engine
  const syncToSimulation = (updatedFile: CompleteMedicalFile) => {
    const nodeId = updatedFile.nodeId;
    const newState = updatedFile.activeDiagnosis.state;

    // Update node health record in engine
    const record = engine.nodeHealth.get(nodeId);
    if (record) {
      record.state = newState;
    }

    // Update active snapshot
    const curSnap = engine.snapshots[engine.currentDay];
    if (curSnap) {
      curSnap.nodeStates.set(nodeId, newState);
    }

    if (onPatientStateUpdated) {
      onPatientStateUpdated(nodeId, newState);
    }

    setSyncNotice(
      `Synchronized: Node #${nodeId} state updated to [${newState}] in Simulation Day ${engine.currentDay}!`
    );
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // Handle thermal submission
  const handleThermalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await ApiClient.submitVitalsAndThermal(
      inputTemp,
      file.symptomAssessments[0]?.spo2 || 98,
      file.symptomAssessments[0]?.heartRateBpm || 75,
      {
        cough: file.symptomAssessments[0]?.coughSeverity || 'None',
        lossOfTasteSmell: file.symptomAssessments[0]?.lossOfTasteSmell || false,
        shortnessOfBreath: file.symptomAssessments[0]?.shortnessOfBreath || false,
        fatigue: file.symptomAssessments[0]?.fatigueLevel || 'None',
      },
      inputZone,
      file.currentCoordinates
    );

    if (res.success && res.data) {
      setFile(res.data);
      syncToSimulation(res.data);
      setShowAddThermal(false);
    }
  };

  // Handle full symptom check submission
  const handleSymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await ApiClient.submitVitalsAndThermal(
      assessTemp,
      assessSpo2,
      assessHr,
      {
        cough: assessCough,
        lossOfTasteSmell: assessTasteSmell,
        shortnessOfBreath: assessBreath,
        fatigue: assessFatigue,
      },
      file.currentLocationZone,
      file.currentCoordinates
    );

    if (res.success && res.data) {
      setFile(res.data);
      syncToSimulation(res.data);
      setShowSymptomCheck(false);
    }
  };

  // Handle logging a new contact
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await ApiClient.recordContactInteraction(
      contactNodeId,
      contactName,
      file.currentLocationZone,
      contactDuration,
      contactProximity,
      contactState
    );

    if (res.success && res.data) {
      setFile(res.data);

      // Connect physical edge in simulation engine
      engine.graph.addEdge(file.nodeId, contactNodeId, Math.max(0.2, 1.0 - contactProximity * 0.2));

      setSyncNotice(
        `Added contact edge between Node #${file.nodeId} and Node #${contactNodeId} in simulation graph!`
      );
      setTimeout(() => setSyncNotice(null), 4000);
      setShowAddContact(false);
    }
  };

  // Handle edge surgery: isolate / quarantine node
  const handleToggleQuarantine = async () => {
    const willQuarantine = !file.activeDiagnosis.quarantineRequired;
    const res = await ApiClient.toggleQuarantine(willQuarantine);
    if (res.success && res.data) {
      setFile(res.data);

      if (willQuarantine) {
        // Isolate node in simulation graph (Network Surgery)
        engine.graph.isolateNode(file.nodeId);
        setSyncNotice(
          `MEDICAL SURGERY: Node #${file.nodeId} quarantined. All active transmission edges severed!`
        );
      } else {
        // Re-establish basic community edge
        engine.graph.addEdge(file.nodeId, (file.nodeId + 1) % 36);
        setSyncNotice(`Quarantine lifted. Node #${file.nodeId} reconnected to community.`);
      }
      setTimeout(() => setSyncNotice(null), 4500);
    }
  };

  const getStatusBadge = (state: HealthState) => {
    switch (state) {
      case 'S':
        return {
          bg: 'bg-[#AEE2FF]/30 border-[#AEE2FF] text-[#2C4F7C]',
          label: 'SUSCEPTIBLE (HEALTHY)',
        };
      case 'E':
        return {
          bg: 'bg-[#B5BAFF]/30 border-[#9FA1FF] text-[#444766]',
          label: 'EXPOSED (INCUBATING)',
        };
      case 'I':
        return {
          bg: 'bg-[#9192E8]/20 border-[#9192E8] text-[#553C9A]',
          label: 'INFECTIOUS (TRANSMITTING)',
        };
      case 'R':
        return {
          bg: 'bg-[#D9F9DF] border-[#BDEEC8] text-[#427A54]',
          label: 'RECOVERED (IMMUNIZED)',
        };
    }
  };

  const statusBadge = getStatusBadge(file.activeDiagnosis.state);

  return (
    <div className="flex-1 w-full bg-[#f7f8fe] p-4 md:p-8 overflow-y-auto space-y-6">
      {/* Synchronization Notification Toast */}
      {syncNotice && (
        <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-white/95 border border-[#9192E8] shadow-xl backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-[#9192E8]" />
            <span className="text-xs font-bold text-[#383A59]">{syncNotice}</span>
          </div>
        </div>
      )}

      {/* Top Patient Header & Simulation Link Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-[#9FA1FF]/35 shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#9FA1FF] via-[#B5BAFF] to-[#D9F9DF] p-[2px] shadow-sm shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-bold text-xl text-[#9192E8]">
                {file.userFullName[0]}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-[#383A59]">{file.userFullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#9192E8] text-white shadow-xs">
                  NODE #{String(file.nodeId).padStart(3, '0')}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg}`}
                >
                  {statusBadge.label}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-[#787B99] mt-1">
                <span>{file.email}</span>
                <span>•</span>
                <span>Age: {file.age}</span>
                <span>•</span>
                <span>Gender: {file.gender}</span>
                <span>•</span>
                <span>Blood Type: {file.bloodType}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#9192E8]" />
                  <span>{file.currentLocationZone}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateToLab(file.nodeId)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#f0f2fe] border border-[#9FA1FF]/40 text-xs font-bold text-[#444766] shadow-xs transition-all hover:scale-102 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#9192E8]" />
              <span>Locate Node in Lab Canvas</span>
            </button>

            <button
              onClick={handleToggleQuarantine}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-102 cursor-pointer ${
                file.activeDiagnosis.quarantineRequired
                  ? 'bg-amber-100 border border-amber-300 text-amber-800'
                  : 'bg-white hover:bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-red-500" />
              <span>
                {file.activeDiagnosis.quarantineRequired
                  ? 'Quarantine Active (Lift)'
                  : 'Quarantine / Sever Edges'}
              </span>
            </button>

            <button
              onClick={() => syncToSimulation(file)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-sm transition-all hover:scale-102 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync to Simulation</span>
            </button>
          </div>
        </div>

        {/* Clinical Protocol Banner */}
        <div className="p-3 rounded-xl bg-[#f0f3fe] border border-[#9FA1FF]/25 text-xs text-[#525575] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-[#9192E8] shrink-0" />
            <span className="font-medium">{file.activeDiagnosis.clinicalProtocol}</span>
          </div>
          <span className="text-[10px] font-mono text-[#787B99] shrink-0">
            Updated: {file.activeDiagnosis.lastUpdated}
          </span>
        </div>
      </div>

      {/* Main Grid: Vitals, Thermal History, Contacts, Comorbidities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Thermal History & Symptoms Assessment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: 14-Day Infrared Thermal Screening Logs */}
          <div className="glass-panel p-6 rounded-3xl border border-[#9FA1FF]/30 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#9FA1FF]/20 text-[#9192E8]">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#383A59]">
                    Infrared Thermal Surveillance Log
                  </h2>
                  <p className="text-[11px] text-[#787B99]">
                    14-day body temperature telemetry via contactless optical kiosks & wearables
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddThermal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Reading</span>
              </button>
            </div>

            {/* Thermal Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#9FA1FF]/20 bg-white/70">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f2f4fe] border-b border-[#9FA1FF]/20 text-[11px] font-bold text-[#676B8C] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Temperature</th>
                    <th className="py-2.5 px-4">Zone</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9FA1FF]/15">
                  {file.thermalHistory.map((th) => (
                    <tr key={th.id} className="hover:bg-white/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[#525575]">{th.timestamp}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                            th.temperatureC >= 38.0
                              ? 'bg-purple-100 text-purple-700 font-extrabold'
                              : th.temperatureC >= 37.4
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {th.temperatureC.toFixed(1)}°C
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#525575]">{th.locationZone}</td>
                      <td className="py-2.5 px-4 text-[#787B99] text-[11px]">{th.method}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            th.status === 'Fever'
                              ? 'bg-purple-200 text-purple-800'
                              : th.status === 'Elevated'
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-emerald-200 text-emerald-800'
                          }`}
                        >
                          {th.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Clinical Symptoms & Physiological Vitals */}
          <div className="glass-panel p-6 rounded-3xl border border-[#9FA1FF]/30 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#AEE2FF]/30 text-[#383A59]">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#383A59]">
                    Symptom History & SpO2 Biometrics
                  </h2>
                  <p className="text-[11px] text-[#787B99]">
                    Self-reported respiratory indicators and transmission probability index
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSymptomCheck(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Assessment</span>
              </button>
            </div>

            {/* Latest Assessment Highlights */}
            {file.symptomAssessments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-white/80 border border-[#9FA1FF]/25 shadow-xs text-center">
                  <div className="flex items-center justify-center space-x-1 text-[#787B99] text-[11px] font-semibold">
                    <Wind className="w-3.5 h-3.5 text-[#9192E8]" />
                    <span>SpO2 Saturation</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-[#383A59] mt-1">
                    {file.symptomAssessments[0].spo2}%
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/80 border border-[#9FA1FF]/25 shadow-xs text-center">
                  <div className="flex items-center justify-center space-x-1 text-[#787B99] text-[11px] font-semibold">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Heart Rate</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-[#383A59] mt-1">
                    {file.symptomAssessments[0].heartRateBpm} BPM
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/80 border border-[#9FA1FF]/25 shadow-xs text-center">
                  <div className="text-[#787B99] text-[11px] font-semibold">Cough Severity</div>
                  <div className="text-base font-bold text-[#383A59] mt-1">
                    {file.symptomAssessments[0].coughSeverity}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/80 border border-[#9FA1FF]/25 shadow-xs text-center">
                  <div className="text-[#787B99] text-[11px] font-semibold">Infection Risk</div>
                  <div className="text-xl font-extrabold font-mono text-[#9192E8] mt-1">
                    {file.symptomAssessments[0].calculatedRiskScore}%
                  </div>
                </div>
              </div>
            )}

            {/* Symptom Assessment History Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#9FA1FF]/20 bg-white/70">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f2f4fe] border-b border-[#9FA1FF]/20 text-[11px] font-bold text-[#676B8C] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">SpO2 / HR</th>
                    <th className="py-2.5 px-4">Anosmia</th>
                    <th className="py-2.5 px-4">Dyspnea</th>
                    <th className="py-2.5 px-4">Fatigue</th>
                    <th className="py-2.5 px-4">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9FA1FF]/15">
                  {file.symptomAssessments.map((sym) => (
                    <tr key={sym.id} className="hover:bg-white/80 transition-colors">
                      <td className="py-2 px-4 font-mono text-[#525575]">{sym.date}</td>
                      <td className="py-2 px-4 font-mono">
                        {sym.spo2}% / {sym.heartRateBpm} bpm
                      </td>
                      <td className="py-2 px-4">
                        {sym.lossOfTasteSmell ? (
                          <span className="text-purple-600 font-bold">Yes (Positive)</span>
                        ) : (
                          <span className="text-[#787B99]">None</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {sym.shortnessOfBreath ? (
                          <span className="text-purple-600 font-bold">Present</span>
                        ) : (
                          <span className="text-[#787B99]">None</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-[#525575]">{sym.fatigueLevel}</td>
                      <td className="py-2 px-4 font-mono font-bold text-[#9192E8]">
                        {sym.calculatedRiskScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Recent Close Contact Network & Exposure Interactions */}
          <div className="glass-panel p-6 rounded-3xl border border-[#9FA1FF]/30 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#D9F9DF] text-[#427A54]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#383A59]">
                    Contact Network & Proximity Interactions
                  </h2>
                  <p className="text-[11px] text-[#787B99]">
                    Physical edges connected to this node in the graph simulation
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddContact(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Contact</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#9FA1FF]/20 bg-white/70">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f2f4fe] border-b border-[#9FA1FF]/20 text-[11px] font-bold text-[#676B8C] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Graph Node</th>
                    <th className="py-2.5 px-4">Zone</th>
                    <th className="py-2.5 px-4">Duration / Proximity</th>
                    <th className="py-2.5 px-4">Their State</th>
                    <th className="py-2.5 px-4">Risk Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9FA1FF]/15">
                  {file.recentContacts.map((c, i) => (
                    <tr key={i} className="hover:bg-white/80 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-[#383A59]">{c.contactName}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#9192E8]">
                        #{String(c.contactNodeId).padStart(3, '0')}
                      </td>
                      <td className="py-2.5 px-4 text-[#525575]">{c.zone}</td>
                      <td className="py-2.5 px-4 font-mono text-[#525575]">
                        {c.durationMinutes}m ({c.proximityMeters}m dist)
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.contactHealthState === 'I'
                              ? 'bg-purple-100 text-purple-700'
                              : c.contactHealthState === 'E'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {c.contactHealthState}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-600">
                        {c.riskContributionScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Comorbidities, Vaccination Card, Audit Trail */}
        <div className="space-y-6">
          {/* Comorbidities Profile */}
          <div className="glass-panel p-6 rounded-3xl border border-[#9FA1FF]/30 shadow-md space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#9FA1FF]/20 text-[#9192E8]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#383A59]">Comorbidities & Risk Profile</h3>
                <p className="text-[11px] text-[#787B99]">Baseline epidemiological vulnerability</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Asthma / Pulmonary', active: file.comorbidities.asthma },
                { label: 'Type 1 or 2 Diabetes', active: file.comorbidities.diabetes },
                { label: 'Hypertension', active: file.comorbidities.hypertension },
                { label: 'Immunocompromised', active: file.comorbidities.immunocompromised },
                { label: 'Cardiovascular Condition', active: file.comorbidities.cardiovascularDisease },
                { label: 'Tobacco / Smoker', active: file.comorbidities.smoker },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-[#9FA1FF]/20 text-xs"
                >
                  <span className="text-[#444766] font-medium">{item.label}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      item.active
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.active ? 'POSITIVE' : 'NEGATIVE'}
                  </span>
                </div>
              ))}
            </div>

            {file.comorbidities.notes && (
              <div className="p-3 rounded-xl bg-[#f5f7fe] text-[11px] text-[#676B8C] border border-[#9FA1FF]/20 leading-relaxed">
                <span className="font-bold text-[#444766]">Physician Notes: </span>
                {file.comorbidities.notes}
              </div>
            )}
          </div>

          {/* Vaccination Card */}
          <div className="glass-panel p-6 rounded-3xl border border-[#9FA1FF]/30 shadow-md space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#D9F9DF] text-[#427A54]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#383A59]">Digital Vaccination Passport</h3>
                <p className="text-[11px] text-[#787B99]">Immunization certification</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 border border-[#9FA1FF]/25 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#787B99]">Vaccine Product</span>
                <span className="font-bold text-[#383A59]">{file.vaccination.vaccineBrand}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#787B99]">Doses Administered</span>
                <span className="font-bold font-mono text-[#383A59]">{file.vaccination.totalDoses} doses</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#787B99]">Last Dose Date</span>
                <span className="font-mono text-[#525575]">{file.vaccination.lastDoseDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#787B99]">Booster Status</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D9F9DF] text-[#427A54] font-bold text-[10px]">
                  {file.vaccination.boosterReceived ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Access Audit Log */}
          <div className="glass-panel p-6 rounded-3xl border border-[#9FA1FF]/30 shadow-md space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#9FA1FF]/20 text-[#9192E8]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#383A59]">Security & Kiosk Audit Log</h3>
                <p className="text-[11px] text-[#787B99]">Immutable event log for this identity</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {file.securityAuditLog.map((log, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white/70 border border-[#9FA1FF]/15 text-[11px] space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[#787B99] font-mono text-[10px]">
                    <span>{log.timestamp}</span>
                    <span>{log.ipAddress}</span>
                  </div>
                  <div className="font-semibold text-[#383A59]">{log.event}</div>
                  <div className="text-[10px] text-[#787B99]">{log.device}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Log New Thermal Scan */}
      {showAddThermal && (
        <div className="fixed inset-0 z-50 bg-[#444766]/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#9FA1FF]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-5 h-5 text-[#9192E8]" />
                <h3 className="font-bold text-sm text-[#383A59]">Log Infrared Thermal Reading</h3>
              </div>
              <button
                onClick={() => setShowAddThermal(false)}
                className="text-[#787B99] hover:text-[#444766] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleThermalSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#444766] mb-1">
                  Measured Temperature: {inputTemp.toFixed(1)}°C
                </label>
                <input
                  type="range"
                  min={35.5}
                  max={41.0}
                  step={0.1}
                  value={inputTemp}
                  onChange={(e) => setInputTemp(parseFloat(e.target.value))}
                  className="w-full accent-[#9192E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444766] mb-1">Location Zone</label>
                <select
                  value={inputZone}
                  onChange={(e) => setInputZone(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#9FA1FF]/30 text-xs text-[#444766]"
                >
                  <option value="Zone A - Bio-Lab">Zone A - Bio-Lab</option>
                  <option value="Zone A - Entrance">Zone A - Entrance Kiosk</option>
                  <option value="Zone A - Research Core">Zone A - Research Core</option>
                  <option value="Zone B - Cafeteria">Zone B - Cafeteria</option>
                  <option value="Zone C - Dormitory">Zone C - Dormitory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444766] mb-1">Screening Device</label>
                <select
                  value={inputMethod}
                  onChange={(e) =>
                    setInputMethod(
                      e.target.value as 'Infrared Kiosk' | 'Wearable Sensor' | 'Clinical Thermometer'
                    )
                  }
                  className="w-full p-2 rounded-xl border border-[#9FA1FF]/30 text-xs text-[#444766]"
                >
                  <option value="Infrared Kiosk">Infrared Kiosk</option>
                  <option value="Wearable Sensor">Wearable Sensor</option>
                  <option value="Clinical Thermometer">Clinical Thermometer</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold transition-all"
              >
                Record Telemetry & Re-evaluate Risk
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Symptoms Check */}
      {showSymptomCheck && (
        <div className="fixed inset-0 z-50 bg-[#444766]/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#9FA1FF]/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#9192E8]" />
                <h3 className="font-bold text-sm text-[#383A59]">
                  Daily Clinical Symptoms Assessment
                </h3>
              </div>
              <button
                onClick={() => setShowSymptomCheck(false)}
                className="text-[#787B99] hover:text-[#444766] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSymptomSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#444766] mb-1">
                    Temperature ({assessTemp.toFixed(1)}°C)
                  </label>
                  <input
                    type="range"
                    min={36.0}
                    max={41.0}
                    step={0.1}
                    value={assessTemp}
                    onChange={(e) => setAssessTemp(parseFloat(e.target.value))}
                    className="w-full accent-[#9192E8]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#444766] mb-1">
                    SpO2 Oxygen ({assessSpo2}%)
                  </label>
                  <input
                    type="range"
                    min={85}
                    max={100}
                    value={assessSpo2}
                    onChange={(e) => setAssessSpo2(parseInt(e.target.value))}
                    className="w-full accent-[#9192E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#444766] mb-1">
                  Heart Rate: {assessHr} BPM
                </label>
                <input
                  type="range"
                  min={50}
                  max={160}
                  value={assessHr}
                  onChange={(e) => setAssessHr(parseInt(e.target.value))}
                  className="w-full accent-[#9192E8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#444766] mb-1">Cough Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['None', 'Mild', 'Persistent'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAssessCough(c)}
                      className={`py-1.5 rounded-xl border text-xs font-semibold ${
                        assessCough === c
                          ? 'bg-[#9192E8] text-white border-[#9192E8]'
                          : 'bg-white border-[#9FA1FF]/30 text-[#444766]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={assessTasteSmell}
                    onChange={(e) => setAssessTasteSmell(e.target.checked)}
                    className="accent-[#9192E8] w-4 h-4 rounded"
                  />
                  <span className="font-semibold text-[#444766]">
                    Loss of Taste or Smell (Anosmia / Ageusia)
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={assessBreath}
                    onChange={(e) => setAssessBreath(e.target.checked)}
                    className="accent-[#9192E8] w-4 h-4 rounded"
                  />
                  <span className="font-semibold text-[#444766]">
                    Shortness of Breath / Dyspnea
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-[#444766] mb-1">Fatigue Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['None', 'Moderate', 'Severe'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setAssessFatigue(f)}
                      className={`py-1.5 rounded-xl border text-xs font-semibold ${
                        assessFatigue === f
                          ? 'bg-[#9192E8] text-white border-[#9192E8]'
                          : 'bg-white border-[#9FA1FF]/30 text-[#444766]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white font-bold transition-all shadow-md"
              >
                Submit Assessment & Update Simulation Health State
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Log Direct Close Contact */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-[#444766]/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#9FA1FF]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#9192E8]" />
                <h3 className="font-bold text-sm text-[#383A59]">Log Close Contact Interaction</h3>
              </div>
              <button
                onClick={() => setShowAddContact(false)}
                className="text-[#787B99] hover:text-[#444766] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#444766] mb-1">
                  Contact Target Node ID (0 - 35)
                </label>
                <input
                  type="number"
                  min={0}
                  max={35}
                  value={contactNodeId}
                  onChange={(e) => setContactNodeId(parseInt(e.target.value) || 0)}
                  className="w-full p-2 rounded-xl border border-[#9FA1FF]/30 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[#444766] mb-1">Contact Name / Alias</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#9FA1FF]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#444766] mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={contactDuration}
                    onChange={(e) => setContactDuration(parseInt(e.target.value) || 15)}
                    className="w-full p-2 rounded-xl border border-[#9FA1FF]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#444766] mb-1">
                    Proximity: {contactProximity}m
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={5.0}
                    step={0.5}
                    value={contactProximity}
                    onChange={(e) => setContactProximity(parseFloat(e.target.value))}
                    className="w-full accent-[#9192E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#444766] mb-1">
                  Contact Health Condition
                </label>
                <select
                  value={contactState}
                  onChange={(e) => setContactState(e.target.value as 'S' | 'E' | 'I' | 'R')}
                  className="w-full p-2 rounded-xl border border-[#9FA1FF]/30"
                >
                  <option value="S">Susceptible (Healthy)</option>
                  <option value="E">Exposed (Incubating)</option>
                  <option value="I">Infectious (Symptomatic)</option>
                  <option value="R">Recovered (Immune)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white font-bold transition-all shadow-md"
              >
                Save Contact & Inject Edge into Graph Simulation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
