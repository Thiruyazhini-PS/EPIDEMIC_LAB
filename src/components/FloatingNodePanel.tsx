import React from 'react';
import { X, GitPullRequest, UserMinus, Compass, Thermometer, MapPin, FileText } from 'lucide-react';
import type { VisualNode } from '../graph/CanvasGraphRenderer';
import type { NodeHealthRecord } from '../simulation/DiseaseModel';
import type { PatientRecord } from '../dataStructures/PatientRegistry';

interface FloatingNodePanelProps {
  node: VisualNode;
  healthRecord?: NodeHealthRecord;
  patientRecord?: PatientRecord;
  neighbors: number[];
  secondaryInfectionCount: number;
  onClose: () => void;
  onIsolateNode: (nodeId: number) => void;
  onTracePathToSeed: (nodeId: number) => void;
  onBfsFromNode: (nodeId: number) => void;
  onViewPatientRecord?: (nodeId: number) => void;
}

export const FloatingNodePanel: React.FC<FloatingNodePanelProps> = ({
  node,
  healthRecord,
  patientRecord,
  neighbors,
  secondaryInfectionCount,
  onClose,
  onIsolateNode,
  onTracePathToSeed,
  onBfsFromNode,
  onViewPatientRecord,
}) => {
  const stateColor =
    node.state === 'I'
      ? 'text-[#9192E8] bg-[#9192E8]/10 border-[#9192E8]/30'
      : node.state === 'E'
      ? 'text-[#3B6A84] bg-[#AEE2FF]/30 border-[#AEE2FF]/50'
      : node.state === 'R'
      ? 'text-[#427A54] bg-[#D9F9DF] border-[#BDEEC8]'
      : 'text-[#444766] bg-[#9FA1FF]/20 border-[#9FA1FF]/30';

  const stateFullName =
    node.state === 'I'
      ? 'Infectious'
      : node.state === 'E'
      ? 'Exposed (Incubating)'
      : node.state === 'R'
      ? 'Recovered & Immune'
      : 'Susceptible';

  return (
    <div className="glass-panel rounded-2xl p-4 w-72 border border-[#9FA1FF]/35 shadow-xl select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[rgba(159,161,255,0.2)]">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9FA1FF] to-[#AEE2FF] p-0.5">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-xs text-[#444766]">
                {node.label}
              </div>
            </div>
            {/* Soft pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-[#9192E8] animate-ping-soft opacity-75" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#444766] tracking-wide">
              PERSON {node.label}
            </h4>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${stateColor}`}>
              {stateFullName}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 text-[#787B99] hover:text-[#444766] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="p-2 rounded-xl bg-white/70 border border-[#9FA1FF]/15">
          <span className="text-[10px] text-[#787B99] uppercase font-bold block">Active Degree</span>
          <span className="text-base font-extrabold text-[#444766] font-mono">
            {neighbors.length} contacts
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white/70 border border-[#9FA1FF]/15">
          <span className="text-[10px] text-[#787B99] uppercase font-bold block">Community</span>
          <span className="text-base font-extrabold text-[#444766] font-mono">
            Cluster #{node.community}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white/70 border border-[#9FA1FF]/15">
          <span className="text-[10px] text-[#787B99] uppercase font-bold block">Infected By</span>
          <span className="text-xs font-semibold text-[#444766] font-mono">
            {healthRecord?.infectedBy !== null && healthRecord?.infectedBy !== undefined
              ? `#${String(healthRecord.infectedBy).padStart(3, '0')}`
              : 'Primary Seed'}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white/70 border border-[#9FA1FF]/15">
          <span className="text-[10px] text-[#787B99] uppercase font-bold block">Spread Count</span>
          <span className="text-base font-extrabold text-[#9192E8] font-mono">
            {secondaryInfectionCount} cases
          </span>
        </div>
      </div>

      {/* Infection Day Note */}
      {healthRecord?.dayExposed !== null && healthRecord?.dayExposed !== undefined && (
        <div className="text-[11px] text-[#787B99] bg-[#AEE2FF]/20 px-2.5 py-1.5 rounded-lg border border-[#AEE2FF]/40 mb-3 flex items-center justify-between">
          <span>Day Exposed:</span>
          <span className="font-mono font-bold text-[#444766]">Day {healthRecord.dayExposed}</span>
        </div>
      )}

      {/* Thermal & Location Surveillance Card if available */}
      {patientRecord ? (
        <div className="p-2.5 rounded-xl bg-white/80 border border-[#9FA1FF]/25 space-y-1.5 mb-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1 font-bold text-[#444766]">
              <Thermometer className="w-3.5 h-3.5 text-[#9192E8]" />
              <span>Thermal Scan:</span>
            </span>
            <span className="font-mono font-extrabold text-[#444766]">
              {patientRecord.latestThermal.temperatureC.toFixed(1)}°C
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#787B99]">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-[#9192E8]" />
              <span className="truncate max-w-[120px]">{patientRecord.currentLocation.zoneId}</span>
            </span>
            <span>SpO₂: {patientRecord.vitals.spo2}%</span>
          </div>

          {onViewPatientRecord && (
            <button
              onClick={() => onViewPatientRecord(node.id)}
              className="w-full flex items-center justify-center space-x-1 py-1 rounded-lg bg-[#9FA1FF]/15 hover:bg-[#9FA1FF]/25 text-[10px] font-bold text-[#9192E8] transition-all"
            >
              <FileText className="w-3 h-3" />
              <span>Open Private Medical Record</span>
            </button>
          )}
        </div>
      ) : (
        <div className="p-2 rounded-xl bg-white/50 border border-[#9FA1FF]/15 mb-3 text-[10px] text-[#787B99] flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Thermometer className="w-3 h-3 text-[#787B99]" />
            <span>Thermal: Afebrile (36.6°C)</span>
          </span>
          <span className="font-mono">Zone A</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-1.5 pt-1">
        <button
          onClick={() => onTracePathToSeed(node.id)}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-[#9FA1FF]/15 hover:bg-[#9FA1FF]/25 border border-[#9FA1FF]/30 text-xs font-semibold text-[#444766] transition-all"
        >
          <GitPullRequest className="w-3.5 h-3.5 text-[#9192E8]" />
          <span>Trace Back to Seed</span>
        </button>

        <button
          onClick={() => onBfsFromNode(node.id)}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-white hover:bg-[#AEE2FF]/20 border border-[rgba(159,161,255,0.25)] text-xs font-medium text-[#444766] transition-all"
        >
          <Compass className="w-3.5 h-3.5 text-[#787B99]" />
          <span>Explore BFS from Here</span>
        </button>

        <button
          onClick={() => onIsolateNode(node.id)}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-[#9192E8]/10 hover:bg-[#9192E8]/20 border border-[#9192E8]/30 text-xs font-semibold text-[#9192E8] transition-all"
        >
          <UserMinus className="w-3.5 h-3.5" />
          <span>Isolate Patient (Cut All Edges)</span>
        </button>
      </div>
    </div>
  );
};
