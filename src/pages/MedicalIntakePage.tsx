// src/pages/MedicalIntakePage.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Users,
  Activity,
  ArrowRight,
  HeartPulse,
  Compass,
  RotateCcw,
  Sparkles,
  Lock,
  Sliders,
  CheckCircle2,
  FileBadge,
} from 'lucide-react';
import type { SimulationEngine } from '../simulation/SimulationEngine';
import { NetworkGenerator } from '../graph/NetworkGenerator';
import { SeededRNG } from '../utils/SeededRNG';
import type { HealthState } from '../simulation/DiseaseModel';
import { AuthSession } from '../utils/authSession';

export interface MedicalIntakeConfig {
  subjectId: string;
  age: number;
  sex: 'Male' | 'Female' | 'Non-Binary' | 'Undisclosed';
  location: string;
  populationGroup: string;
  healthStatus: HealthState;
  conditions: string[];
  vaccination: 'Unvaccinated' | '1 Dose' | '2 Doses' | 'Boosted';
  previousInfection: 'Never' | '<3 Months Ago' | '>6 Months Ago';
  recoveryStatus: string;
  recentExposure: string;
  exposureDuration: number;
  contactFrequency: 'High' | 'Moderate' | 'Periodic' | 'Minimal';
  knownInfectedContact: boolean;
  travelHistory: string;
  populationSize: number;
  initialInfected: number;
  transmissionProbability: number;
  recoveryPeriod: number;
  contactDensity: number;
  anonymizedConsent: boolean;
}

interface MedicalIntakePageProps {
  engine: SimulationEngine;
  onInitializeLab: (config: MedicalIntakeConfig) => void;
  onCancelOrBack?: () => void;
}

export const MedicalIntakePage: React.FC<MedicalIntakePageProps> = ({
  engine,
  onInitializeLab,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeUser = useMemo(() => AuthSession.getSession(), []);

  // Form State initialized with realistic scientific research values or active user session
  const [subjectId, setSubjectId] = useState(
    activeUser?.researchId || 'SUBJECT-088'
  );
  const [age, setAge] = useState(33);
  const [sex, setSex] = useState<'Male' | 'Female' | 'Non-Binary' | 'Undisclosed'>('Non-Binary');
  const [location, setLocation] = useState(
    activeUser?.name?.includes('Elena')
      ? 'Zone A - Research Core'
      : activeUser?.name?.includes('Amina')
      ? 'Zone B - Transit Hub'
      : 'Zone D - Medical Pavilion'
  );
  const [populationGroup, setPopulationGroup] = useState('Quarantined Clinical Staff');

  // Health Profile
  const [healthStatus, setHealthStatus] = useState<HealthState>(
    activeUser?.name?.includes('Amina') ? 'S' : 'I'
  );
  const [conditions, setConditions] = useState<string[]>(['None']);
  const [vaccination, setVaccination] = useState<'Unvaccinated' | '1 Dose' | '2 Doses' | 'Boosted'>('2 Doses');
  const [previousInfection, setPreviousInfection] = useState<'Never' | '<3 Months Ago' | '>6 Months Ago'>('Never');
  const [recoveryStatus, setRecoveryStatus] = useState('Active Susceptible');

  // Exposure Profile
  const [recentExposure, setRecentExposure] = useState('Cluster Gathering');
  const [exposureDuration, setExposureDuration] = useState(4);
  const [contactFrequency, setContactFrequency] = useState<'High' | 'Moderate' | 'Periodic' | 'Minimal'>('Moderate');
  const [knownInfectedContact, setKnownInfectedContact] = useState(true);
  const [travelHistory, setTravelHistory] = useState('Regional Transit Hub');

  // Epidemic Parameters initialized from engine
  const [populationSize, setPopulationSize] = useState(engine.params.populationSize || 50);
  const [initialInfected, setInitialInfected] = useState(engine.params.initialSeeds || 2);
  const [transmissionProbability, setTransmissionProbability] = useState(engine.params.transmissionProbability || 0.28);
  const [recoveryPeriod, setRecoveryPeriod] = useState(engine.params.infectiousPeriod || 8);
  const [contactDensity, setContactDensity] = useState(engine.params.contactDensity || 0.14);

  // Privacy Consent
  const [anonymizedConsent, setAnonymizedConsent] = useState(true);

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Transition sequence animation state
  const [transitionStep, setTransitionStep] = useState<'idle' | 'validating' | 'populating' | 'generating' | 'ready'>('idle');

  // Generate randomized anonymized Subject ID
  const handleRegenerateSubjectId = () => {
    const num = Math.floor(1 + Math.random() * 999);
    setSubjectId(`SUBJECT-${String(num).padStart(3, '0')}`);
  };

  // Toggle condition
  const toggleCondition = (cond: string) => {
    if (cond === 'None') {
      setConditions(['None']);
      return;
    }
    const filtered = conditions.filter((c) => c !== 'None');
    if (filtered.includes(cond)) {
      const remaining = filtered.filter((c) => c !== cond);
      setConditions(remaining.length === 0 ? ['None'] : remaining);
    } else {
      setConditions([...filtered, cond]);
    }
  };

  // Computed Risk Profile Assessment
  const riskAssessment = useMemo(() => {
    let score = 0;
    if (age > 65) score += 2;
    else if (age > 50) score += 1;

    if (!conditions.includes('None')) score += conditions.length * 1.5;
    if (vaccination === 'Unvaccinated') score += 2;
    else if (vaccination === '1 Dose') score += 1;

    if (knownInfectedContact) score += 2.5;
    if (exposureDuration > 6) score += 1.5;
    if (contactFrequency === 'High') score += 2;

    if (transmissionProbability > 0.4) score += 2;

    if (score < 3) return { level: 'LOW', color: '#427A54', bg: 'bg-[#D9F9DF]', border: 'border-[#BDEEC8]' };
    if (score < 6) return { level: 'MODERATE', color: '#B47B1E', bg: 'bg-amber-50', border: 'border-amber-200' };
    if (score < 9) return { level: 'HIGH', color: '#D9534F', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { level: 'CRITICAL', color: '#9192E8', bg: 'bg-purple-50', border: 'border-[#9192E8]/40' };
  }, [age, conditions, vaccination, knownInfectedContact, exposureDuration, contactFrequency, transmissionProbability]);

  // Estimated R0
  const estimatedR0 = useMemo(() => {
    const avgDegree = Math.max(2, Math.round(populationSize * contactDensity));
    const r0 = transmissionProbability * avgDegree * (recoveryPeriod / 4);
    return r0.toFixed(2);
  }, [populationSize, contactDensity, transmissionProbability, recoveryPeriod]);

  // Live Canvas Population Network Preview (Light Theme)
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    const rng = new SeededRNG(99);
    const { nodes, edges } = NetworkGenerator.generateClusteredNetwork(
      populationSize,
      3,
      contactDensity,
      rng
    );

    const pos = nodes.map((n, idx) => {
      const angle = (idx / nodes.length) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.35 + (rng.next() - 0.5) * 35;
      return {
        id: n.id,
        x: w / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius,
        isInfected: n.id < initialInfected,
        isSubject: n.id === 0,
        pulse: rng.next() * Math.PI,
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // Draw Edges
      ctx.lineWidth = 1.2;
      for (const e of edges) {
        const p1 = pos[e.source];
        const p2 = pos[e.target];
        if (!p1 || !p2) continue;

        const isTransmissionBridge = p1.isInfected || p2.isInfected;
        ctx.strokeStyle = isTransmissionBridge
          ? 'rgba(145, 146, 232, 0.45)'
          : 'rgba(181, 186, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw Nodes
      for (const p of pos) {
        p.pulse += 0.04;
        const r = p.isSubject ? 8 : p.isInfected ? 6.5 : 5;

        // Node Glow for infected & subject
        if (p.isInfected || p.isSubject) {
          ctx.save();
          ctx.fillStyle = p.isSubject ? '#9192E8' : '#F25F5C';
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 2.5 + Math.sin(p.pulse) * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = p.isSubject
          ? '#9192E8'
          : p.isInfected
          ? '#9192E8'
          : '#AEE2FF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = p.isSubject ? 2 : 1.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Label for subject
        if (p.isSubject) {
          ctx.fillStyle = '#444766';
          ctx.font = 'bold 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('INDEX', p.x, p.y - 12);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [populationSize, initialInfected, contactDensity]);

  // Validation Routine
  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!subjectId.trim()) errs.subjectId = 'Subject ID cannot be blank.';
    if (age < 1 || age > 110) errs.age = 'Age must be between 1 and 110.';
    if (populationSize < 20 || populationSize > 150) {
      errs.populationSize = 'Population must be between 20 and 150.';
    }
    if (initialInfected < 1 || initialInfected > populationSize) {
      errs.initialInfected = 'Initial infected must be at least 1 and ≤ population.';
    }
    if (transmissionProbability <= 0 || transmissionProbability > 1) {
      errs.transmissionProbability = 'Transmission probability must be between 1% and 100%.';
    }
    if (recoveryPeriod < 1 || recoveryPeriod > 30) {
      errs.recoveryPeriod = 'Recovery period must be between 1 and 30 days.';
    }
    if (!anonymizedConsent) {
      errs.anonymizedConsent = 'Consent for simulated/anonymized research data is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceed = () => {
    if (!validate()) return;

    setTransitionStep('validating');

    setTimeout(() => {
      setTransitionStep('populating');
    }, 350);

    setTimeout(() => {
      setTransitionStep('generating');
    }, 700);

    setTimeout(() => {
      setTransitionStep('ready');
    }, 1050);

    setTimeout(() => {
      onInitializeLab({
        subjectId,
        age,
        sex,
        location,
        populationGroup,
        healthStatus,
        conditions,
        vaccination,
        previousInfection,
        recoveryStatus,
        recentExposure,
        exposureDuration,
        contactFrequency,
        knownInfectedContact,
        travelHistory,
        populationSize,
        initialInfected,
        transmissionProbability,
        recoveryPeriod,
        contactDensity,
        anonymizedConsent,
      });
    }, 1400);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full flex flex-col bg-[#f7f8fe] text-[#444766] overflow-y-auto select-none font-sans">
      {/* Top Protocol Header Bar */}
      <div className="sticky top-0 z-30 w-full px-4 sm:px-8 py-3.5 glass-panel backdrop-blur-md border-b border-[rgba(159,161,255,0.22)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#9FA1FF] via-[#B5BAFF] to-[#D9F9DF] p-[1.5px] shadow-sm flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-[#9192E8]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xs tracking-wider uppercase text-[#444766] font-mono">
                EPIDEMIC LAB &bull; MEDICAL DATA INTAKE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D9F9DF] text-[#427A54] font-bold border border-[#BDEEC8] font-mono">
                WORKSTATION READY
              </span>
            </div>
            <p className="text-[10.5px] text-[#787B99] font-mono leading-none mt-0.5">
              Population Synthesis & Clinical Cohort Parameterization
            </p>
          </div>
        </div>

        {/* Privacy Indicator Header Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/80 border border-[#9FA1FF]/30 text-xs font-mono shadow-xs">
          <Lock className="w-3.5 h-3.5 text-[#427A54]" />
          <span className="text-[#444766] font-bold">PRIVATE RESEARCH SESSION</span>
          <span className="text-[#787B99]">&bull; Anonymized Mode</span>
        </div>
      </div>

      {/* Main Two-Column Workstation Layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Medical & Epidemic Data Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Privacy Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#9FA1FF]/30 shadow-xs flex items-start space-x-3 text-xs">
            <ShieldAlert className="w-4 h-4 text-[#9192E8] shrink-0 mt-0.5" />
            <div className="font-mono text-[#676B8C] leading-relaxed">
              <span className="font-bold text-[#444766]">SYNTHETIC RESEARCH NOTICE:</span> Use simulated or
              anonymized cohort information. No real personally identifiable information (PII) is recorded.
            </div>
          </div>

          {/* SECTION A — SUBJECT INFORMATION */}
          <div className="p-5 rounded-2xl glass-panel border border-[rgba(159,161,255,0.25)] space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(159,161,255,0.2)]">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-4 h-4 text-[#9192E8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#444766] font-mono">
                  SECTION A &bull; SUBJECT INFORMATION
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#787B99]">INDEX CASE IDENTIFIER</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject ID */}
              <div>
                <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1">
                  SUBJECT ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/90 border border-[#9FA1FF]/30 text-[#444766] font-mono text-xs focus:border-[#9192E8] focus:outline-none shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateSubjectId}
                    className="p-2 rounded-xl bg-white/90 hover:bg-white border border-[#9FA1FF]/30 text-[#9192E8] hover:text-[#7E80E8] cursor-pointer shadow-xs"
                    title="Generate Random Subject ID"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                {errors.subjectId && (
                  <span className="text-[10px] text-red-500 font-mono mt-1 block">{errors.subjectId}</span>
                )}
              </div>

              {/* Age */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono font-bold text-[#444766]">AGE</label>
                  <span className="text-xs font-mono font-bold text-[#9192E8]">{age} Years</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={85}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#787B99] mt-1">
                  <span>18 Young</span>
                  <span>50 Middle</span>
                  <span>85 Elderly</span>
                </div>
              </div>
            </div>

            {/* Biological Profile / Sex */}
            <div>
              <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1.5">
                SEX / BIOLOGICAL PROFILE
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Female', 'Male', 'Non-Binary', 'Undisclosed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono transition-all border cursor-pointer ${
                      sex === s
                        ? 'bg-[#9192E8] text-white border-[#9192E8] font-bold shadow-xs'
                        : 'bg-white/80 text-[#676B8C] border-[#9FA1FF]/25 hover:border-[#9192E8]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Location & Population Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1">
                  LOCATION / REGION
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 border border-[#9FA1FF]/30 text-[#444766] font-mono text-xs focus:border-[#9192E8] focus:outline-none shadow-xs"
                >
                  <option>Urban Cluster Alpha</option>
                  <option>Suburban Zone Beta</option>
                  <option>High-Density Ward Gamma</option>
                  <option>Metro Transit Delta</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1">
                  POPULATION GROUP
                </label>
                <select
                  value={populationGroup}
                  onChange={(e) => setPopulationGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 border border-[#9FA1FF]/30 text-[#444766] font-mono text-xs focus:border-[#9192E8] focus:outline-none shadow-xs"
                >
                  <option>General Community</option>
                  <option>Healthcare Personnel</option>
                  <option>High-Exposure Essential</option>
                  <option>Vulnerable Senior Cohort</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION B — HEALTH PROFILE */}
          <div className="p-5 rounded-2xl glass-panel border border-[rgba(159,161,255,0.25)] space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(159,161,255,0.2)]">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#427A54]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#444766] font-mono">
                  SECTION B &bull; HEALTH PROFILE
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#787B99]">IMMUNOLOGICAL STATUS</span>
            </div>

            {/* Current Health Status */}
            <div>
              <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1.5">
                CURRENT HEALTH STATUS
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { state: 'S' as HealthState, label: 'Healthy / Naive' },
                  { state: 'E' as HealthState, label: 'Exposed (Incubating)' },
                  { state: 'I' as HealthState, label: 'Infectious Active' },
                  { state: 'R' as HealthState, label: 'Recovered / Immune' },
                ].map((item) => (
                  <button
                    key={item.state}
                    type="button"
                    onClick={() => {
                      setHealthStatus(item.state);
                      setRecoveryStatus(
                        item.state === 'R'
                          ? 'Robust Immunity'
                          : item.state === 'I'
                          ? 'Active Infection'
                          : 'Asymptomatic'
                      );
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-mono transition-all border text-center cursor-pointer ${
                      healthStatus === item.state
                        ? 'bg-[#9192E8] text-white border-[#9192E8] font-bold shadow-xs'
                        : 'bg-white/80 text-[#676B8C] border-[#9FA1FF]/25 hover:border-[#9192E8]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-existing Conditions */}
            <div>
              <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1.5">
                PRE-EXISTING CONDITIONS (SELECT ALL THAT APPLY)
              </label>
              <div className="flex flex-wrap gap-2">
                {['None', 'Respiratory / Asthma', 'Cardiovascular', 'Immunocompromised', 'Diabetes Mellitus'].map(
                  (cond) => {
                    const isSelected = conditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => toggleCondition(cond)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D9F9DF] text-[#427A54] border-[#BDEEC8] font-bold shadow-xs'
                            : 'bg-white/80 text-[#676B8C] border-[#9FA1FF]/25 hover:border-[#9192E8]'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{cond}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Vaccination Status */}
            <div>
              <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1.5">
                VACCINATION STATUS
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Unvaccinated', '1 Dose', '2 Doses', 'Boosted'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVaccination(v)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                      vaccination === v
                        ? 'bg-[#D9F9DF] text-[#427A54] border-[#BDEEC8] font-bold shadow-xs'
                        : 'bg-white/80 text-[#676B8C] border-[#9FA1FF]/25 hover:border-[#9192E8]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Previous Infection */}
            <div>
              <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1.5">
                PREVIOUS INFECTION HISTORY
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Never', '<3 Months Ago', '>6 Months Ago'] as const).map((pi) => (
                  <button
                    key={pi}
                    type="button"
                    onClick={() => setPreviousInfection(pi)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                      previousInfection === pi
                        ? 'bg-[#9192E8] text-white border-[#9192E8] font-bold shadow-xs'
                        : 'bg-white/80 text-[#676B8C] border-[#9FA1FF]/25 hover:border-[#9192E8]'
                    }`}
                  >
                    {pi}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION C — EXPOSURE PROFILE */}
          <div className="p-5 rounded-2xl glass-panel border border-[rgba(159,161,255,0.25)] space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(159,161,255,0.2)]">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#B47B1E]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#444766] font-mono">
                  SECTION C &bull; EXPOSURE PROFILE
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#787B99]">TRANSMISSION VECTOR</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recent Exposure Context */}
              <div>
                <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1">
                  RECENT EXPOSURE CONTEXT
                </label>
                <select
                  value={recentExposure}
                  onChange={(e) => setRecentExposure(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 border border-[#9FA1FF]/30 text-[#444766] font-mono text-xs focus:border-[#9192E8] focus:outline-none shadow-xs"
                >
                  <option>Cluster Gathering</option>
                  <option>Direct Index Case Contact</option>
                  <option>Household Co-living</option>
                  <option>Low / Community Contact</option>
                </select>
              </div>

              {/* Travel / Exposure History */}
              <div>
                <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1">
                  TRAVEL / EXPOSURE HISTORY
                </label>
                <select
                  value={travelHistory}
                  onChange={(e) => setTravelHistory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 border border-[#9FA1FF]/30 text-[#444766] font-mono text-xs focus:border-[#9192E8] focus:outline-none shadow-xs"
                >
                  <option>Regional Transit Hub</option>
                  <option>Local Community Only</option>
                  <option>Domestic High-Density Flight</option>
                  <option>International Epicenter</option>
                </select>
              </div>

              {/* Exposure Duration */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono font-bold text-[#444766]">
                    EXPOSURE DURATION
                  </label>
                  <span className="text-xs font-mono font-bold text-[#9192E8]">
                    {exposureDuration} Hours/Day
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={16}
                  value={exposureDuration}
                  onChange={(e) => setExposureDuration(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#787B99] mt-1">
                  <span>1h Brief</span>
                  <span>8h Working Day</span>
                  <span>16h High</span>
                </div>
              </div>

              {/* Contact Frequency */}
              <div>
                <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1.5">
                  CONTACT FREQUENCY
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['High', 'Moderate', 'Periodic', 'Minimal'] as const).map((cf) => (
                    <button
                      key={cf}
                      type="button"
                      onClick={() => setContactFrequency(cf)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                        contactFrequency === cf
                          ? 'bg-[#9192E8] text-white border-[#9192E8] font-bold shadow-xs'
                          : 'bg-white/80 text-[#676B8C] border-[#9FA1FF]/25 hover:border-[#9192E8]'
                      }`}
                    >
                      {cf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Known Contact Toggle */}
            <div className="pt-1">
              <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1.5">
                KNOWN INFECTED CONTACT?
              </label>
              <button
                type="button"
                onClick={() => setKnownInfectedContact(!knownInfectedContact)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-between cursor-pointer ${
                  knownInfectedContact
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-white/80 text-[#676B8C] border-[#9FA1FF]/25'
                }`}
              >
                <span>{knownInfectedContact ? 'YES &bull; Confirmed Contact' : 'NO &bull; Unconfirmed'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-gray-200">TOGGLE</span>
              </button>
            </div>
          </div>

          {/* SECTION D — EPIDEMIC PARAMETERS */}
          <div className="p-5 rounded-2xl glass-panel border border-[rgba(159,161,255,0.25)] space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(159,161,255,0.2)]">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#9192E8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#444766] font-mono">
                  SECTION D &bull; EPIDEMIC PARAMETERS
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#787B99]">SIMULATION ENGINE CONFIG</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Population Size */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono font-bold text-[#444766]">
                    POPULATION (NODES)
                  </label>
                  <span className="text-xs font-mono font-bold text-[#9192E8]">{populationSize}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={120}
                  step={5}
                  value={populationSize}
                  onChange={(e) => setPopulationSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#787B99] mt-1">
                  <span>20 Mini</span>
                  <span>50 Standard</span>
                  <span>120 Cohort</span>
                </div>
              </div>

              {/* Initial Infected Seeds */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono font-bold text-[#444766]">
                    INITIAL INFECTED (SEEDS)
                  </label>
                  <span className="text-xs font-mono font-bold text-[#9192E8]">{initialInfected}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={initialInfected}
                  onChange={(e) => setInitialInfected(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#787B99] mt-1">
                  <span>1 Seed</span>
                  <span>4 Seeds</span>
                  <span>8 Seeds</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Transmission Probability */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono font-bold text-[#444766]">
                    TRANSMISSION (β)
                  </label>
                  <span className="text-xs font-mono font-bold text-[#9192E8]">
                    {Math.round(transmissionProbability * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.8}
                  step={0.05}
                  value={transmissionProbability}
                  onChange={(e) => setTransmissionProbability(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
                />
              </div>

              {/* Recovery Period */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono font-bold text-[#444766]">
                    RECOVERY (DAYS)
                  </label>
                  <span className="text-xs font-mono font-bold text-[#427A54]">
                    {recoveryPeriod}d
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={21}
                  value={recoveryPeriod}
                  onChange={(e) => setRecoveryPeriod(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#D9F9DF] rounded-lg appearance-none cursor-pointer accent-[#427A54]"
                />
              </div>

              {/* Contact Density */}
              <div>
                <label className="text-[11px] font-mono font-bold text-[#444766] block mb-1.5">
                  CONTACT DENSITY
                </label>
                <div className="flex space-x-1">
                  {[
                    { label: 'Sparse', val: 0.08 },
                    { label: 'Medium', val: 0.14 },
                    { label: 'Dense', val: 0.24 },
                  ].map((d) => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setContactDensity(d.val)}
                      className={`flex-1 py-1 rounded-xl text-[10px] font-mono border transition-all cursor-pointer ${
                        contactDensity === d.val
                          ? 'bg-[#9192E8] text-white border-[#9192E8] font-bold shadow-xs'
                          : 'bg-white/80 text-[#676B8C] border-[#9FA1FF]/25 hover:border-[#9192E8]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Consent Checkbox */}
          <div className="p-4 rounded-2xl glass-panel border border-[rgba(159,161,255,0.25)] space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymizedConsent}
                onChange={(e) => setAnonymizedConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#9FA1FF]/40 text-[#9192E8] focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-mono text-[#444766] leading-relaxed">
                I am entering anonymized/simulated research data for computational epidemiology experiments. No confidential protected health information is present.
              </span>
            </label>
            {errors.anonymizedConsent && (
              <span className="text-[10px] text-red-500 font-mono block pl-7">
                {errors.anonymizedConsent}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Live Population Preview & Launch Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Population Preview Card */}
          <div className="sticky top-20 rounded-2xl glass-panel border border-[rgba(159,161,255,0.35)] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(159,161,255,0.2)]">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#9192E8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#444766] font-mono">
                  LIVE POPULATION PREVIEW
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-[#9192E8] border border-[#9FA1FF]/30 font-mono font-bold">
                REAL-TIME DYNAMICS
              </span>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="relative w-full h-64 rounded-xl bg-white/70 border border-[#9FA1FF]/25 overflow-hidden flex items-center justify-center shadow-inner">
              <canvas ref={previewCanvasRef} className="w-full h-full" />
              <div className="absolute top-2 left-2 text-[9px] font-mono text-[#787B99]">
                TOPOLOGY GENERATOR &bull; CLUSTERED GRAPH
              </div>
              <div className="absolute bottom-2 right-2 text-[9px] font-mono text-[#787B99]">
                ACTIVE EDGES: ~{Math.round((populationSize * (populationSize - 1) * contactDensity) / 2)}
              </div>
            </div>

            {/* Dynamic Metric Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/20 shadow-xs">
                <span className="text-[10px] text-[#787B99] block font-bold">POPULATION</span>
                <span className="text-base font-extrabold text-[#444766]">{populationSize} Nodes</span>
              </div>
              <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/20 shadow-xs">
                <span className="text-[10px] text-[#787B99] block font-bold">INITIAL INFECTED</span>
                <span className="text-base font-extrabold text-[#9192E8]">{initialInfected} Seeds</span>
              </div>
              <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/20 shadow-xs">
                <span className="text-[10px] text-[#787B99] block font-bold">CONTACT DENSITY</span>
                <span className="text-base font-extrabold text-[#444766]">
                  {contactDensity === 0.08 ? 'Sparse' : contactDensity === 0.14 ? 'Medium' : 'Dense'}
                </span>
              </div>
              <div className={`p-3 rounded-xl border shadow-xs ${riskAssessment.bg} ${riskAssessment.border}`}>
                <span className="text-[10px] text-[#787B99] block font-bold">RISK PROFILE</span>
                <span className="text-base font-extrabold" style={{ color: riskAssessment.color }}>
                  {riskAssessment.level}
                </span>
              </div>
            </div>

            {/* Epidemiological Estimates */}
            <div className="p-3.5 rounded-xl bg-white/80 border border-[#9FA1FF]/25 font-mono text-xs space-y-2 shadow-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#676B8C]">Estimated Basic Reproduction Number (R₀):</span>
                <span className="font-bold text-[#B47B1E] text-sm">~{estimatedR0}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#676B8C]">Transmission Probability (β):</span>
                <span className="font-bold text-[#444766]">{Math.round(transmissionProbability * 100)}%</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#676B8C]">Clinical Cohort Index:</span>
                <span className="font-bold text-[#9192E8]">{subjectId}</span>
              </div>
            </div>

            {/* Primary Action Button: [ INITIALIZE EPIDEMIC LAB → ] */}
            <button
              type="button"
              onClick={handleProceed}
              disabled={transitionStep !== 'idle'}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#9FA1FF] via-[#9192E8] to-[#8384e5] hover:opacity-95 text-white font-bold text-xs tracking-wider uppercase font-mono shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>INITIALIZE EPIDEMIC LAB</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Transition Sequence Overlay (Light Glass) */}
      {transitionStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#444766]/20 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#9FA1FF]/40 p-7 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#9192E8]/20 border border-[#9192E8] flex items-center justify-center mx-auto shadow-md">
              <Activity className="w-8 h-8 text-[#9192E8] animate-spin" />
            </div>

            <div>
              <h3 className="text-base font-black uppercase text-[#444766] font-mono tracking-wider">
                INITIALIZING EPIDEMIC LAB
              </h3>
              <p className="text-xs text-[#787B99] font-mono mt-1">
                Constructing network topology and initializing SEIR disease models...
              </p>
            </div>

            {/* Progress Checklist */}
            <div className="space-y-2 text-left font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-emerald-50 text-[#427A54] border-[#BDEEC8]">
                <span>1. DATA VALIDATION</span>
                <CheckCircle2 className="w-4 h-4 text-[#427A54]" />
              </div>

              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  transitionStep === 'populating' ||
                  transitionStep === 'generating' ||
                  transitionStep === 'ready'
                    ? 'bg-emerald-50 text-[#427A54] border-[#BDEEC8]'
                    : 'bg-gray-50 text-gray-400 border-gray-100'
                }`}
              >
                <span>2. POPULATION INITIALIZATION</span>
                {transitionStep === 'populating' ? (
                  <Activity className="w-4 h-4 text-[#9192E8] animate-spin" />
                ) : transitionStep === 'generating' || transitionStep === 'ready' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#427A54]" />
                ) : (
                  <span className="text-[10px] text-gray-400">PENDING</span>
                )}
              </div>

              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  transitionStep === 'generating' || transitionStep === 'ready'
                    ? 'bg-emerald-50 text-[#427A54] border-[#BDEEC8]'
                    : 'bg-gray-50 text-gray-400 border-gray-100'
                }`}
              >
                <span>3. NETWORK GENERATION</span>
                {transitionStep === 'generating' ? (
                  <Activity className="w-4 h-4 text-[#9192E8] animate-spin" />
                ) : transitionStep === 'ready' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#427A54]" />
                ) : (
                  <span className="text-[10px] text-gray-400">PENDING</span>
                )}
              </div>

              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  transitionStep === 'ready'
                    ? 'bg-[#D9F9DF] text-[#427A54] border-[#BDEEC8] font-bold'
                    : 'bg-gray-50 text-gray-400 border-gray-100'
                }`}
              >
                <span>4. LAB WORKSTATION READY</span>
                {transitionStep === 'ready' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#427A54]" />
                ) : (
                  <span className="text-[10px] text-gray-400">PENDING</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
