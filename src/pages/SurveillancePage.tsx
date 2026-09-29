// src/pages/SurveillancePage.tsx
import React, { useState } from 'react';
import {
  Thermometer,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  PatientRegistry,
  type PatientRecord,
} from '../dataStructures/PatientRegistry';
import { PatientIntakeModal } from '../components/PatientIntakeModal';

interface SurveillancePageProps {
  registry: PatientRegistry;
  onLocateNodeInGraph?: (nodeId: number) => void;
  onPatientUpdated?: (patient: PatientRecord) => void;
}

export const SurveillancePage: React.FC<SurveillancePageProps> = ({
  registry,
  onLocateNodeInGraph,
  onPatientUpdated,
}) => {
  const [records, setRecords] = useState<PatientRecord[]>(() => registry.getAllRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'ALL' | 'FEVER' | 'HIGH_RISK' | 'ISOLATED'>('ALL');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [revealPrivateInfo, setRevealPrivateInfo] = useState(true);

  // Filtered dataset
  const filteredRecords = records.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.currentLocation.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `#${p.id}`.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterState === 'FEVER') return p.latestThermal.thermalStatus === 'Fever';
    if (filterState === 'HIGH_RISK') return p.diagnosis.riskScore >= 60;
    if (filterState === 'ISOLATED') return p.diagnosis.state === 'I';

    return true;
  });

  const feverCount = records.filter(p => p.latestThermal.thermalStatus === 'Fever').length;
  const highRiskCount = records.filter(p => p.diagnosis.state === 'I' || p.diagnosis.riskScore >= 65).length;
  const normalCount = records.filter(p => p.latestThermal.thermalStatus === 'Normal').length;

  const handleSaveNewPatient = (newPatient: PatientRecord) => {
    registry.registerPatient(newPatient);
    setRecords(registry.getAllRecords());
    setSelectedPatient(newPatient);
    setShowIntakeModal(false);
    if (onPatientUpdated) {
      onPatientUpdated(newPatient);
    }
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] flex flex-col justify-between overflow-y-auto bg-[#f7f8fe] select-none p-4 md:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[rgba(159,161,255,0.22)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#9192E8] text-white">
              <Thermometer className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#383A59] tracking-tight">
              Individual Patient Records, Thermal Screening & Location Registry
            </h2>
            <span className="text-[10px] font-bold text-[#427A54] bg-[#D9F9DF] px-2 py-0.5 rounded-full border border-[#BDEEC8]">
              {records.length} Profiles Monitored
            </span>
          </div>
          <p className="text-xs text-[#787B99] mt-0.5">
            Confidential medical dataset linking clinical vitals, infrared scans, and check-in zones to graph nodes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Privacy Toggle */}
          <button
            onClick={() => setRevealPrivateInfo(!revealPrivateInfo)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-[#9FA1FF]/30 text-xs font-semibold text-[#444766] hover:bg-white transition-all shadow-xs"
          >
            {revealPrivateInfo ? <Eye className="w-3.5 h-3.5 text-[#9192E8]" /> : <EyeOff className="w-3.5 h-3.5 text-[#787B99]" />}
            <span>{revealPrivateInfo ? 'Mask Private Data' : 'Reveal Data'}</span>
          </button>

          {/* New Patient Intake CTA */}
          <button
            onClick={() => setShowIntakeModal(true)}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Clinical Intake</span>
          </button>
        </div>
      </div>

      {/* Surveillance KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
        <div className="glass-panel rounded-2xl p-3 border border-[#9FA1FF]/25 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#787B99]">Total Records</span>
            <Lock className="w-3.5 h-3.5 text-[#9192E8]" />
          </div>
          <div className="text-2xl font-black text-[#444766] font-mono mt-1">
            {records.length}
          </div>
          <span className="text-[10px] text-[#787B99]">Mapped to Simulation Graph</span>
        </div>

        <div className="glass-panel rounded-2xl p-3 border border-red-200 bg-red-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-red-700">Fever Alerts</span>
            <Thermometer className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono mt-1">
            {feverCount}
          </div>
          <span className="text-[10px] text-red-700">Temp ≥ 38.0°C Detected</span>
        </div>

        <div className="glass-panel rounded-2xl p-3 border border-[#9192E8]/35 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#9192E8]">High-Risk Cases</span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#9192E8]" />
          </div>
          <div className="text-2xl font-black text-[#9192E8] font-mono mt-1">
            {highRiskCount}
          </div>
          <span className="text-[10px] text-[#787B99]">Quarantine Protocol Triggered</span>
        </div>

        <div className="glass-panel rounded-2xl p-3 border border-[#D9F9DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#427A54]">Afebrile / Low Risk</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#427A54]" />
          </div>
          <div className="text-2xl font-black text-[#427A54] font-mono mt-1">
            {normalCount}
          </div>
          <span className="text-[10px] text-[#427A54]">Clear for Workplace Access</span>
        </div>
      </div>

      {/* Main Content Area: Search, Filters & Dataset Table */}
      <div className="flex-1 glass-panel rounded-3xl p-4 md:p-6 border border-[rgba(159,161,255,0.3)] shadow-sm flex flex-col justify-between overflow-hidden">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[rgba(159,161,255,0.15)]">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#787B99]" />
            <input
              type="text"
              placeholder="Search by name, zone, or Node ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/90 border border-[#9FA1FF]/30 text-xs text-[#444766] focus:outline-none focus:border-[#9192E8]"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center space-x-1.5 bg-white/70 p-1 rounded-xl border border-[#9FA1FF]/25 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'All Patients' },
              { id: 'FEVER', label: 'Fever Detected' },
              { id: 'HIGH_RISK', label: 'Infection Risk' },
              { id: 'ISOLATED', label: 'Infectious [I]' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterState(f.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterState === f.id
                    ? 'bg-[#9192E8] text-white shadow-xs'
                    : 'text-[#676B8C] hover:text-[#444766]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dataset Table */}
        <div className="flex-1 overflow-x-auto my-3">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[rgba(159,161,255,0.2)] text-[10px] uppercase font-bold text-[#787B99]">
                <th className="py-2.5 px-3">Node / ID</th>
                <th className="py-2.5 px-3">Patient Identity</th>
                <th className="py-2.5 px-3">Check-in Zone & Location</th>
                <th className="py-2.5 px-3">Thermal Infrared Reading</th>
                <th className="py-2.5 px-3">Vitals (SpO₂ / HR)</th>
                <th className="py-2.5 px-3">Infection Diagnosis</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(159,161,255,0.15)]">
              {filteredRecords.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className="hover:bg-white/60 transition-colors cursor-pointer group"
                >
                  {/* Node ID */}
                  <td className="py-3 px-3 font-mono font-bold text-[#444766]">
                    <span className="px-2 py-0.5 rounded-md bg-[#9FA1FF]/20 border border-[#9FA1FF]/30">
                      #{String(patient.id).padStart(3, '0')}
                    </span>
                  </td>

                  {/* Name & Private info */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#383A59]">
                      {revealPrivateInfo ? patient.fullName : `${patient.fullName[0]}*** *****`}
                    </div>
                    <div className="text-[10px] text-[#787B99] font-mono">
                      {revealPrivateInfo ? patient.email : '***@***.***'} • {patient.age}y {patient.gender}
                    </div>
                  </td>

                  {/* Location Zone */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1 text-[#444766] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#9192E8]" />
                      <span>{patient.currentLocation.zoneName}</span>
                    </div>
                    <span className="text-[10px] text-[#787B99] font-mono">
                      Coords ({patient.currentLocation.coordinates.x}, {patient.currentLocation.coordinates.y}) • {patient.currentLocation.timestamp}
                    </span>
                  </td>

                  {/* Thermal Scan */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5 font-mono font-bold">
                      <span className="text-sm text-[#444766]">
                        {patient.latestThermal.temperatureC.toFixed(1)}°C
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
                          patient.latestThermal.thermalStatus === 'Fever'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : patient.latestThermal.thermalStatus === 'Elevated'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-[#D9F9DF] text-[#427A54] border-[#BDEEC8]'
                        }`}
                      >
                        {patient.latestThermal.thermalStatus}
                      </span>
                    </div>
                    <span className="text-[9px] text-[#787B99] block mt-0.5">
                      {patient.latestThermal.scanMethod}
                    </span>
                  </td>

                  {/* Vitals */}
                  <td className="py-3 px-3 font-mono text-[11px] text-[#444766]">
                    <div>SpO₂: <b>{patient.vitals.spo2}%</b></div>
                    <div className="text-[#787B99]">Pulse: <b>{patient.vitals.heartRate} bpm</b></div>
                  </td>

                  {/* Diagnosis */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          patient.diagnosis.state === 'I'
                            ? 'bg-[#9192E8] text-white'
                            : patient.diagnosis.state === 'E'
                            ? 'bg-[#AEE2FF] text-[#3B6A84]'
                            : 'bg-[#D9F9DF] text-[#427A54]'
                        }`}
                      >
                        {patient.diagnosis.state === 'I'
                          ? 'Infectious [I]'
                          : patient.diagnosis.state === 'E'
                          ? 'Exposed [E]'
                          : 'Susceptible [S]'}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-[#444766]">
                        {patient.diagnosis.riskScore}%
                      </span>
                    </div>
                    <span className="text-[10px] text-[#787B99] truncate block max-w-[160px]">
                      {patient.diagnosis.primaryIndicators[0]}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatient(patient);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#9FA1FF]/30 text-[11px] font-semibold text-[#444766] hover:border-[#9192E8] transition-all shadow-xs"
                    >
                      View Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[rgba(159,161,255,0.2)] flex items-center justify-between text-[11px] text-[#787B99]">
          <span>
            <b>Private Record System:</b> Each individual maintains encrypted clinical histories, thermal fluctuations, and location logs.
          </span>
          <span className="font-semibold text-[#427A54]">
            Data Protection Compliant • Real-time Triage Active
          </span>
        </div>
      </div>

      {/* INDIVIDUAL PATIENT RECORD INSPECTION MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#444766]/20 backdrop-blur-sm animate-in fade-in select-none">
          <div className="w-full max-w-xl glass-panel rounded-3xl p-6 border border-[#9FA1FF]/40 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(159,161,255,0.22)]">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#9FA1FF]/20 flex items-center justify-center font-bold text-sm text-[#444766]">
                  #{String(selectedPatient.id).padStart(3, '0')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#383A59]">
                    {selectedPatient.fullName}
                  </h3>
                  <span className="text-xs text-[#787B99] font-mono">
                    {selectedPatient.email} • {selectedPatient.gender}, {selectedPatient.age} yrs
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-[#787B99]"
              >
                ✕
              </button>
            </div>

            {/* Diagnostic Header Card */}
            <div
              className={`p-4 rounded-2xl border mb-4 ${
                selectedPatient.diagnosis.state === 'I'
                  ? 'bg-red-50 border-red-200'
                  : selectedPatient.diagnosis.state === 'E'
                  ? 'bg-[#AEE2FF]/20 border-[#AEE2FF]'
                  : 'bg-[#D9F9DF]/80 border-[#BDEEC8]'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[#383A59]">
                  {selectedPatient.diagnosis.riskLevel}
                </span>
                <span className="text-xl font-extrabold font-mono text-[#444766]">
                  {selectedPatient.diagnosis.riskScore}% Risk
                </span>
              </div>
              <p className="text-xs text-[#444766] mt-1">
                {selectedPatient.diagnosis.recommendation}
              </p>
            </div>

            {/* Grid of Medical & Thermal Details */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              {/* Thermal Scan Card */}
              <div className="p-3 rounded-xl bg-white border border-[#9FA1FF]/25">
                <span className="text-[10px] font-bold text-[#787B99] uppercase block mb-1">
                  Thermal Status
                </span>
                <div className="text-lg font-extrabold text-[#444766] font-mono">
                  {selectedPatient.latestThermal.temperatureC.toFixed(1)}°C
                </div>
                <div className="text-[10px] text-[#787B99] mt-0.5">
                  Method: {selectedPatient.latestThermal.scanMethod} at {selectedPatient.latestThermal.timestamp}
                </div>
              </div>

              {/* Location Card */}
              <div className="p-3 rounded-xl bg-white border border-[#9FA1FF]/25">
                <span className="text-[10px] font-bold text-[#787B99] uppercase block mb-1">
                  Current Check-in Zone
                </span>
                <div className="text-xs font-bold text-[#444766] truncate">
                  {selectedPatient.currentLocation.zoneName}
                </div>
                <div className="text-[10px] text-[#787B99] font-mono mt-0.5">
                  Coords: ({selectedPatient.currentLocation.coordinates.x}, {selectedPatient.currentLocation.coordinates.y})
                </div>
              </div>

              {/* Vitals Card */}
              <div className="p-3 rounded-xl bg-white border border-[#9FA1FF]/25">
                <span className="text-[10px] font-bold text-[#787B99] uppercase block mb-1">
                  Oxygen & Pulse
                </span>
                <div className="font-mono text-[#444766]">
                  SpO₂: <b>{selectedPatient.vitals.spo2}%</b> • HR: <b>{selectedPatient.vitals.heartRate} bpm</b>
                </div>
              </div>

              {/* Symptoms Card */}
              <div className="p-3 rounded-xl bg-white border border-[#9FA1FF]/25">
                <span className="text-[10px] font-bold text-[#787B99] uppercase block mb-1">
                  Cough & Senses
                </span>
                <div className="text-[#444766]">
                  Cough: <b>{selectedPatient.vitals.coughSeverity}</b>
                  {selectedPatient.vitals.lossOfTasteOrSmell && <span className="block text-red-600 font-semibold">• Anosmia reported</span>}
                </div>
              </div>
            </div>

            {/* Travel & Check-in History */}
            <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/25 mb-4">
              <span className="text-[10px] font-bold text-[#787B99] uppercase block mb-2">
                Location Tracking History
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                {selectedPatient.locationHistory.map((loc, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] text-[#444766]">
                    <span>{loc.zoneName}</span>
                    <span className="text-[#787B99]">{loc.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              {onLocateNodeInGraph && (
                <button
                  onClick={() => {
                    onLocateNodeInGraph(selectedPatient.id);
                    setSelectedPatient(null);
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-sm transition-all"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Locate on Contact Network</span>
                </button>
              )}

              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs font-semibold text-[#444766]"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CLINICAL INTAKE MODAL */}
      {showIntakeModal && (
        <PatientIntakeModal
          assignedNodeId={records.length}
          onSavePatient={handleSaveNewPatient}
          onClose={() => setShowIntakeModal(false)}
        />
      )}
    </div>
  );
};
