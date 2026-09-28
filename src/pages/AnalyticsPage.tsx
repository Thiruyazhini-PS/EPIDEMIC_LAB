// src/pages/AnalyticsPage.tsx
import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { AnalyticsEngine } from '../analytics/AnalyticsEngine';
import type { MonteCarloResult } from '../analytics/AnalyticsEngine';

interface AnalyticsPageProps {
  engine: SimulationEngine;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ engine }) => {
  const [activeTab, setActiveTab] = useState<'seir' | 'montecarlo'>('seir');
  const [mcRunsCount, setMcRunsCount] = useState<number>(30);
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);
  const [isComputingMc, setIsComputingMc] = useState<boolean>(false);

  // Epidemiological Summary
  const summary = useMemo(() => {
    return AnalyticsEngine.computeSummary(engine.snapshots, engine.allNodeIds.length);
  }, [engine.snapshots, engine.allNodeIds.length]);

  // SEIR Chart Data
  const seirData = useMemo(() => {
    return engine.snapshots.map((snap) => ({
      day: `Day ${snap.day}`,
      S: snap.sCount,
      E: snap.eCount,
      I: snap.iCount,
      R: snap.rCount,
      newCases: snap.newInfectionsToday,
    }));
  }, [engine.snapshots]);

  // Run Monte Carlo
  const handleRunMonteCarlo = (runs: number) => {
    setMcRunsCount(runs);
    setIsComputingMc(true);
    setTimeout(() => {
      const res = AnalyticsEngine.runMonteCarlo(engine, runs, 40);
      setMcResult(res);
      setIsComputingMc(false);
    }, 100);
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] flex flex-col justify-between overflow-y-auto bg-[#f7f8fe] select-none p-4 md:p-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[rgba(159,161,255,0.22)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#9192E8] text-white">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#383A59] tracking-tight">
              Epidemic Analytics & Monte Carlo Ensembles
            </h2>
          </div>
          <p className="text-xs text-[#787B99] mt-0.5">
            SEIR epidemiological curves and stochastic uncertainty envelopes.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-white/70 p-1 rounded-2xl border border-[rgba(159,161,255,0.25)] shadow-xs">
          <button
            onClick={() => setActiveTab('seir')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'seir'
                ? 'bg-[#9192E8] text-white shadow-xs'
                : 'text-[#676B8C] hover:text-[#444766]'
            }`}
          >
            Live SEIR Curves
          </button>
          <button
            onClick={() => {
              setActiveTab('montecarlo');
              if (!mcResult) handleRunMonteCarlo(30);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'montecarlo'
                ? 'bg-[#9192E8] text-white shadow-xs'
                : 'text-[#676B8C] hover:text-[#444766]'
            }`}
          >
            Monte Carlo Uncertainty
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 my-3">
        <div className="glass-panel rounded-2xl p-3 border border-[#9FA1FF]/25 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#787B99]">Peak Day</div>
          <div className="text-xl font-extrabold text-[#444766] font-mono mt-0.5">
            Day {summary.peakDay}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-3 border border-[#9192E8]/35 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#787B99]">Peak Infectious</div>
          <div className="text-xl font-extrabold text-[#9192E8] font-mono mt-0.5">
            {summary.peakInfectious} Cases
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-3 border border-[#9FA1FF]/25 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#787B99]">Duration</div>
          <div className="text-xl font-extrabold text-[#444766] font-mono mt-0.5">
            {summary.outbreakDuration} Days
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-3 border border-[#D9F9DF] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#427A54]">Attack Rate</div>
          <div className="text-xl font-extrabold text-[#427A54] font-mono mt-0.5">
            {summary.finalAttackRate}%
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-3 border border-[#9FA1FF]/25 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#787B99]">Total Infected</div>
          <div className="text-xl font-extrabold text-[#444766] font-mono mt-0.5">
            {summary.totalInfected}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-3 border border-[#AEE2FF] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#3B6A84]">Est. R₀</div>
          <div className="text-xl font-extrabold text-[#3B6A84] font-mono mt-0.5">
            {summary.r0Estimate}
          </div>
        </div>
      </div>

      {/* Main Visual Display */}
      <div className="flex-1 glass-panel rounded-3xl p-4 md:p-6 border border-[rgba(159,161,255,0.3)] shadow-sm min-h-[380px] flex flex-col justify-between">
        {activeTab === 'seir' ? (
          /* Large SEIR Curves */
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#444766] uppercase tracking-wider">
                SEIR State Progression (Days 0 → {engine.snapshots.length - 1})
              </span>
              <div className="flex items-center space-x-3 text-[11px] font-semibold">
                <span className="flex items-center space-x-1 text-[#9FA1FF]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9FA1FF]" />
                  <span>S (Susceptible)</span>
                </span>
                <span className="flex items-center space-x-1 text-[#3B6A84]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#AEE2FF]" />
                  <span>E (Exposed)</span>
                </span>
                <span className="flex items-center space-x-1 text-[#9192E8]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9192E8]" />
                  <span>I (Infectious)</span>
                </span>
                <span className="flex items-center space-x-1 text-[#427A54]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D9F9DF]" />
                  <span>R (Recovered)</span>
                </span>
              </div>
            </div>

            <div className="w-full h-[320px] md:h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seirData}>
                  <defs>
                    <linearGradient id="gradI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9192E8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9192E8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#AEE2FF" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#AEE2FF" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D9F9DF" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#D9F9DF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#787B99" fontSize={11} />
                  <YAxis stroke="#787B99" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(159, 161, 255, 0.3)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="S"
                    stroke="#9FA1FF"
                    strokeWidth={2}
                    fill="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="E"
                    stroke="#AEE2FF"
                    strokeWidth={2}
                    fill="url(#gradE)"
                  />
                  <Area
                    type="monotone"
                    dataKey="I"
                    stroke="#9192E8"
                    strokeWidth={2.5}
                    fill="url(#gradI)"
                  />
                  <Area
                    type="monotone"
                    dataKey="R"
                    stroke="#8FD9A8"
                    strokeWidth={2}
                    fill="url(#gradR)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* Monte Carlo Ensemble Display */
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-2">
              <div>
                <span className="text-xs font-bold text-[#444766] uppercase tracking-wider block">
                  Monte Carlo Uncertainty Envelope ({mcRunsCount} Stochastic Trials)
                </span>
                <span className="text-[11px] text-[#787B99]">
                  Shaded IQR ribbon (25th–75th percentile) with Median & sample trajectory lines
                </span>
              </div>

              {/* Run count buttons */}
              <div className="flex items-center space-x-1.5 bg-white/80 p-1 rounded-xl border border-[#9FA1FF]/25">
                {[10, 30, 50, 100].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleRunMonteCarlo(count)}
                    disabled={isComputingMc}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      mcRunsCount === count
                        ? 'bg-[#9192E8] text-white shadow-xs'
                        : 'text-[#444766] hover:bg-white'
                    }`}
                  >
                    {count} Runs
                  </button>
                ))}
              </div>
            </div>

            {isComputingMc ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#9192E8] animate-spin mb-2" />
                <span className="text-xs text-[#787B99]">Computing {mcRunsCount} stochastic runs...</span>
              </div>
            ) : mcResult ? (
              <div className="w-full h-[320px] md:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mcResult.days}>
                    <defs>
                      <linearGradient id="iqrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9192E8" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#B5BAFF" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      stroke="#787B99"
                      fontSize={11}
                      tickFormatter={(d) => `Day ${d}`}
                    />
                    <YAxis stroke="#787B99" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid rgba(159, 161, 255, 0.3)',
                      }}
                    />
                    {/* IQR Ribbon */}
                    <Area
                      type="monotone"
                      dataKey="q75"
                      stroke="#B5BAFF"
                      strokeWidth={1}
                      fill="url(#iqrGrad)"
                      name="75th Percentile"
                    />
                    <Area
                      type="monotone"
                      dataKey="q25"
                      stroke="#B5BAFF"
                      strokeWidth={1}
                      fill="#FFFFFF"
                      name="25th Percentile"
                    />
                    {/* Median Line */}
                    <Line
                      type="monotone"
                      dataKey="median"
                      stroke="#9192E8"
                      strokeWidth={3}
                      dot={false}
                      name="Median Infectious"
                    />
                    {/* Max Line */}
                    <Line
                      type="monotone"
                      dataKey="max"
                      stroke="#9FA1FF"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      name="Max Outbreak"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
