// src/components/PatientIntakeModal.tsx
import React, { useState } from 'react';
import {
  Thermometer,
  Activity,
  MapPin,
  Heart,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import {
  PatientRegistry,
  type PatientRecord,
  type MedicalVitals,
  type DiagnosticAssessment,
} from '../dataStructures/PatientRegistry';

interface PatientIntakeModalProps {
  initialEmail?: string;
  initialName?: string;
  assignedNodeId?: number;
  onSavePatient: (patient: PatientRecord) => void;
  onClose: () => void;
}

export const PatientIntakeModal: React.FC<PatientIntakeModalProps> = ({
  initialEmail = 'researcher@epidemiclab.io',
  initialName = 'Dr. Alex Mercer',
  assignedNodeId = 8,
  onSavePatient,
  onClose,
}) => {
  // Step indicator (1: Identity & Location, 2: Thermal & Vitals, 3: Exposure, 4: Diagnostic Result)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [age, setAge] = useState(32);
  const [gender, setGender] = useState('Non-Binary');

  // Location tracking
  const [selectedZone, setSelectedZone] = useState('Zone A - Research Core');

  // Thermal reading
  const [temperatureC, setTemperatureC] = useState(38.2);
  const [scanMethod, setScanMethod] = useState<'Infrared Kiosk' | 'Wearable Sensor' | 'Clinical Thermometer'>('Infrared Kiosk');

  // Medical Vitals
  const [spo2, setSpo2] = useState(94);
  const [heartRate, setHeartRate] = useState(88);
  const [coughSeverity, setCoughSeverity] = useState<'None' | 'Mild' | 'Persistent'>('Persistent');
  const [lossOfTasteOrSmell, setLossOfTasteOrSmell] = useState(true);
  const [shortnessOfBreath, setShortnessOfBreath] = useState(false);
  const [fatigueLevel, setFatigueLevel] = useState<'None' | 'Moderate' | 'Severe'>('Moderate');

  // Contact exposure
  const [reportedExposure, setReportedExposure] = useState(true);
  const [daysSinceExposure, setDaysSinceExposure] = useState(3);
  const [contactNodeId, setContactNodeId] = useState(0);

  // Computed Diagnosis
  const [diagnosis, setDiagnosis] = useState<DiagnosticAssessment | null>(null);

  const zones = [
    { id: 'Zone A', name: 'Zone A - Research Core', coords: { x: 125, y: 150 } },
    { id: 'Zone B', name: 'Zone B - Transit Hub', coords: { x: 390, y: 230 } },
    { id: 'Zone C', name: 'Zone C - Student Quad', coords: { x: 520, y: 315 } },
    { id: 'Zone D', name: 'Zone D - Medical Pavilion', coords: { x: 260, y: 400 } },
  ];

  const handleComputeDiagnosis = () => {
    const vitals: MedicalVitals = {
      spo2,
      heartRate,
      coughSeverity,
      lossOfTasteOrSmell,
      shortnessOfBreath,
      fatigueLevel,
      vaccinatedDoses: 2,
    };

    const exposure = {
      reportedCloseContact: reportedExposure,
      knownInfectedContactId: contactNodeId,
      daysSinceExposure: reportedExposure ? daysSinceExposure : undefined,
    };

    const result = PatientRegistry.evaluateRisk(temperatureC, vitals, exposure);
    setDiagnosis(result);
    setStep(4);
  };

  const handleSaveAndSync = () => {
    if (!diagnosis) return;

    const chosenZone = zones.find(z => z.name === selectedZone) || zones[0];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord: PatientRecord = {
      id: assignedNodeId,
      fullName,
      email,
      age,
      gender,
      isPrivate: true,
      createdAt: `Day 01, ${timestamp}`,
      currentLocation: {
        zoneId: chosenZone.id,
        zoneName: chosenZone.name,
        coordinates: chosenZone.coords,
        timestamp,
      },
      locationHistory: [
        {
          zoneId: chosenZone.id,
          zoneName: chosenZone.name,
          coordinates: chosenZone.coords,
          timestamp,
        },
      ],
      latestThermal: {
        temperatureC,
        thermalStatus: temperatureC >= 38.0 ? 'Fever' : temperatureC >= 37.4 ? 'Elevated' : 'Normal',
        scanMethod,
        timestamp,
      },
      thermalHistory: [
        { temp: temperatureC - 0.3, time: '08:00 AM' },
        { temp: temperatureC, time: timestamp },
      ],
      vitals: {
        spo2,
        heartRate,
        coughSeverity,
        lossOfTasteOrSmell,
        shortnessOfBreath,
        fatigueLevel,
        vaccinatedDoses: 2,
      },
      exposure: {
        reportedCloseContact: reportedExposure,
        knownInfectedContactId: contactNodeId,
        daysSinceExposure,
      },
      diagnosis,
    };

    onSavePatient(newRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 border border-[#9FA1FF]/40 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(159,161,255,0.22)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#9FA1FF] to-[#D9F9DF] text-[#444766] shadow-xs">
              <Thermometer className="w-5 h-5 text-[#9192E8]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#383A59]">
                  Clinical Intake & Thermal Screening
                </h3>
                <span className="flex items-center space-x-1 text-[10px] font-bold text-[#427A54] bg-[#D9F9DF] px-2 py-0.5 rounded-full border border-[#BDEEC8]">
                  <Lock className="w-3 h-3" />
                  <span>Confidential Record</span>
                </span>
              </div>
              <p className="text-xs text-[#787B99]">
                Individual biometric, thermal scan, and location contact tracing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 text-[#787B99] hover:text-[#444766]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs indicator */}
        <div className="grid grid-cols-4 gap-2 mb-5 text-center text-xs font-semibold">
          {[
            { s: 1, label: '1. Identity & Location' },
            { s: 2, label: '2. Thermal & Vitals' },
            { s: 3, label: '3. Contact History' },
            { s: 4, label: '4. AI Diagnosis' },
          ].map(item => (
            <button
              key={item.s}
              onClick={() => (diagnosis || item.s < 4 ? setStep(item.s as any) : null)}
              className={`py-1.5 px-2 rounded-xl border transition-all ${
                step === item.s
                  ? 'bg-[#9192E8] text-white border-[#9192E8] shadow-xs'
                  : 'bg-white/80 text-[#787B99] border-[#9FA1FF]/25'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* STEP 1: IDENTITY & LOCATION TRACKING */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#444766] uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs text-[#444766]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444766] uppercase mb-1">
                  Email / Identifier
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs text-[#444766]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444766] uppercase mb-1">
                  Age & Gender
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs text-[#444766]"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs text-[#444766]"
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-Binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444766] uppercase mb-1">
                  Assigned Contact Graph Node
                </label>
                <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#9FA1FF]/15 border border-[#9FA1FF]/30 text-xs font-mono font-bold text-[#444766]">
                  <span>PERSON #{String(assignedNodeId).padStart(3, '0')}</span>
                </div>
              </div>
            </div>

            {/* Location Tracking / Zone Selection */}
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#444766] uppercase mb-2">
                <MapPin className="w-4 h-4 text-[#9192E8]" />
                <span>Current Location & Check-in Zone</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {zones.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setSelectedZone(z.name)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedZone === z.name
                        ? 'bg-[#AEE2FF]/40 border-[#9192E8] shadow-xs'
                        : 'bg-white/80 border-[#9FA1FF]/25 hover:border-[#9192E8]'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-[#787B99]">{z.id}</div>
                    <div className="text-xs font-semibold text-[#444766] truncate">{z.name.split(' - ')[1]}</div>
                    <div className="text-[9px] font-mono text-[#787B99] mt-1">({z.coords.x}, {z.coords.y})</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-sm transition-all"
              >
                Proceed to Thermal & Vitals →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: THERMAL BODY SCAN & MEDICAL VITALS */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Infrared Thermal Screening Card */}
            <div className="p-4 rounded-2xl bg-white/80 border border-[#9FA1FF]/30 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-5 h-5 text-[#9192E8]" />
                  <span className="text-xs font-bold text-[#444766] uppercase">
                    Thermal Reading
                  </span>
                  <select
                    value={scanMethod}
                    onChange={(e) => setScanMethod(e.target.value as any)}
                    className="px-2 py-0.5 rounded-lg bg-white border border-[#9FA1FF]/30 text-[10px] text-[#444766]"
                  >
                    <option>Infrared Kiosk</option>
                    <option>Wearable Sensor</option>
                    <option>Clinical Thermometer</option>
                  </select>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    temperatureC >= 38.0
                      ? 'bg-red-50 text-red-600 border-red-200 animate-pulse-subtle'
                      : temperatureC >= 37.4
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-[#D9F9DF] text-[#427A54] border-[#BDEEC8]'
                  }`}
                >
                  {temperatureC >= 38.0 ? 'FEVER DETECTED' : temperatureC >= 37.4 ? 'ELEVATED' : 'NORMAL'}
                </span>
              </div>

              <div className="flex items-baseline space-x-3 my-2">
                <span className="text-4xl font-extrabold text-[#444766] font-mono">
                  {temperatureC.toFixed(1)}°C
                </span>
                <span className="text-sm font-semibold text-[#787B99]">
                  ({((temperatureC * 9) / 5 + 32).toFixed(1)}°F)
                </span>
              </div>

              <input
                type="range"
                min={36.0}
                max={40.5}
                step={0.1}
                value={temperatureC}
                onChange={(e) => setTemperatureC(Number(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-[#D9F9DF] via-[#AEE2FF] to-[#9192E8] rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
              />

              <div className="flex justify-between text-[10px] text-[#787B99] mt-1 font-mono">
                <span>36.0°C (Afebrile)</span>
                <span>37.4°C (Threshold)</span>
                <span>38.5°C+ (High Pyrexia)</span>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* SpO2 */}
              <div className="p-3 rounded-xl bg-white border border-[#9FA1FF]/25">
                <div className="flex justify-between text-xs font-bold text-[#444766] mb-1">
                  <span className="flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-[#9192E8]" />
                    <span>Oxygen Saturation (SpO₂)</span>
                  </span>
                  <span className="font-mono text-[#9192E8] font-bold">{spo2}%</span>
                </div>
                <input
                  type="range"
                  min={85}
                  max={100}
                  value={spo2}
                  onChange={(e) => setSpo2(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
                />
              </div>

              {/* Heart rate */}
              <div className="p-3 rounded-xl bg-white border border-[#9FA1FF]/25">
                <div className="flex justify-between text-xs font-bold text-[#444766] mb-1">
                  <span className="flex items-center space-x-1">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <span>Pulse (BPM)</span>
                  </span>
                  <span className="font-mono text-[#9192E8] font-bold">{heartRate} bpm</span>
                </div>
                <input
                  type="range"
                  min={55}
                  max={140}
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
                />
              </div>
            </div>

            {/* Symptoms Checklist */}
            <div className="p-3 rounded-xl bg-white/70 border border-[#9FA1FF]/25 space-y-2">
              <span className="text-xs font-bold text-[#444766] uppercase block">
                Reported Respiratory & Systemic Symptoms
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-[#9FA1FF]/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lossOfTasteOrSmell}
                    onChange={(e) => setLossOfTasteOrSmell(e.target.checked)}
                    className="accent-[#9192E8]"
                  />
                  <span>Loss of Taste/Smell</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-[#9FA1FF]/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shortnessOfBreath}
                    onChange={(e) => setShortnessOfBreath(e.target.checked)}
                    className="accent-[#9192E8]"
                  />
                  <span>Shortness of Breath</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-[#9FA1FF]/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fatigueLevel !== 'None'}
                    onChange={(e) => setFatigueLevel(e.target.checked ? 'Moderate' : 'None')}
                    className="accent-[#9192E8]"
                  />
                  <span>Acute Fatigue</span>
                </label>
              </div>

              <div className="flex items-center space-x-2 pt-1 text-xs">
                <span className="text-[#787B99] font-semibold">Cough Severity:</span>
                <select
                  value={coughSeverity}
                  onChange={(e) => setCoughSeverity(e.target.value as any)}
                  className="px-2 py-1 rounded-lg bg-white border border-[#9FA1FF]/30 text-xs text-[#444766]"
                >
                  <option value="None">None / No Cough</option>
                  <option value="Mild">Mild Intermittent</option>
                  <option value="Persistent">Persistent Dry Cough</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs font-semibold text-[#444766]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-sm transition-all"
              >
                Proceed to Contact Exposure →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONTACT EXPOSURE HISTORY */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/80 border border-[#9FA1FF]/30 space-y-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h4 className="text-xs font-bold text-[#444766] uppercase">
                  Epidemiological Contact Proximity
                </h4>
              </div>

              <label className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-[#9FA1FF]/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportedExposure}
                  onChange={(e) => setReportedExposure(e.target.checked)}
                  className="w-4 h-4 accent-[#9192E8]"
                />
                <span className="text-xs font-semibold text-[#444766]">
                  I have had close proximity (within 2 meters) with a person displaying symptoms or confirmed positive.
                </span>
              </label>

              {reportedExposure && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#444766] mb-1">
                      Days Since Exposure
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={daysSinceExposure}
                      onChange={(e) => setDaysSinceExposure(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs text-[#444766]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#444766] mb-1">
                      Suspected Contact Node ID
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={contactNodeId}
                      onChange={(e) => setContactNodeId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs text-[#444766]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs font-semibold text-[#444766]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleComputeDiagnosis}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Evaluate Clinical & Infection Risk</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: DIAGNOSTIC ASSESSMENT & GRAPH SYNC */}
        {step === 4 && diagnosis && (
          <div className="space-y-4">
            {/* Diagnosis Summary Card */}
            <div
              className={`p-5 rounded-2xl border shadow-sm ${
                diagnosis.state === 'I'
                  ? 'bg-red-50/80 border-red-200'
                  : diagnosis.state === 'E'
                  ? 'bg-[#AEE2FF]/20 border-[#AEE2FF]'
                  : 'bg-[#D9F9DF]/80 border-[#BDEEC8]'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10">
                <div className="flex items-center space-x-2.5">
                  {diagnosis.state === 'I' ? (
                    <ShieldAlert className="w-6 h-6 text-[#9192E8]" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-[#427A54]" />
                  )}
                  <div>
                    <h4 className="text-sm font-extrabold text-[#383A59]">
                      {diagnosis.riskLevel}
                    </h4>
                    <span className="text-[11px] text-[#787B99]">
                      Assessed via Clinical Matrix at {diagnosis.assessedAt}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-[#444766]">
                    {diagnosis.riskScore}%
                  </div>
                  <div className="text-[10px] uppercase font-bold text-[#787B99]">
                    Infection Probability
                  </div>
                </div>
              </div>

              {/* State Mapping Badge */}
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs font-bold text-[#444766]">Assigned Network State:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    diagnosis.state === 'I'
                      ? 'bg-[#9192E8] text-white'
                      : diagnosis.state === 'E'
                      ? 'bg-[#AEE2FF] text-[#3B6A84]'
                      : 'bg-[#D9F9DF] text-[#427A54]'
                  }`}
                >
                  {diagnosis.state === 'I'
                    ? 'INFECTIOUS [I] • Active Pathogen Carrier'
                    : diagnosis.state === 'E'
                    ? 'EXPOSED [E] • Incubation Period'
                    : 'SUSCEPTIBLE [S] • Non-Infectious'}
                </span>
              </div>

              {/* Primary Indicators */}
              <div className="space-y-1 mb-3">
                <span className="text-[11px] font-bold text-[#787B99] uppercase block">
                  Diagnostic Evidentiary Indicators:
                </span>
                <ul className="text-xs space-y-1">
                  {diagnosis.primaryIndicators.map((ind, i) => (
                    <li key={i} className="flex items-center space-x-1.5 text-[#444766]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9192E8]" />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="p-3 rounded-xl bg-white/90 border border-black/5 text-xs text-[#444766]">
                <b>Clinical Protocol:</b> {diagnosis.recommendation}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs font-semibold text-[#444766]"
              >
                Modify Vitals
              </button>

              <button
                type="button"
                onClick={handleSaveAndSync}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Record & Sync to Network Graph</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
