// src/pages/LoginPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Lock,
  Mail,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  FileBadge,
  UserPlus,
  ShieldCheck,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { CanvasGraphRenderer } from '../graph/CanvasGraphRenderer';
import { NetworkGenerator } from '../graph/NetworkGenerator';
import { SeededRNG } from '../utils/SeededRNG';
import type { HealthState } from '../simulation/DiseaseModel';
import { ApiClient } from '../backend/apiClient';

interface LoginPageProps {
  onLoginSuccess: (user: {
    id: string;
    name: string;
    role: string;
    email: string;
    nodeId: number;
    isGuest: boolean;
  }) => void;
  onBackToLanding: () => void;
  onNavigateToPortal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mode: 'login' | 'register' | 'presets'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'presets'>('login');

  // Login form state
  const [email, setEmail] = useState('user@epidemiclab.io');
  const [password, setPassword] = useState('password123');
  const [pin, setPin] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNodeId, setRegNodeId] = useState(15);

  // Status feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const presets = ApiClient.getPresetAccounts();

  // Background network visualization
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const renderer = new CanvasGraphRenderer(canvas);
    const rng = new SeededRNG(777);
    const { nodes, edges } = NetworkGenerator.generateClusteredNetwork(36, 3, 0.1, rng);

    const states = new Map<number, HealthState>();
    for (const n of nodes) {
      if (n.id === 0) states.set(n.id, 'I');
      else if (n.id === 1 || n.id === 2) states.set(n.id, 'E');
      else if (n.id === 12) states.set(n.id, 'R');
      else states.set(n.id, 'S');
    }

    renderer.setData(
      nodes,
      edges.map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight ?? 1.0,
        isBridge: !!e.isBridge,
      })),
      states
    );

    // Set highlighted preset node if email matches
    const currentPreset = presets.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (currentPreset) {
      renderer.options.userNodeId = currentPreset.nodeId;
    }

    renderer.start();

    const interval = setInterval(() => {
      if (edges.length > 0) {
        const edge = edges[Math.floor(Math.random() * edges.length)];
        renderer.spawnTransmissionParticle(edge.source, edge.target);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      renderer.stop();
    };
  }, [email, presets]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await ApiClient.login(email, password, pin);
      if (res.success && res.data) {
        setSuccessMessage(`Authenticated successfully as ${res.data.user.fullName}`);
        setTimeout(() => {
          onLoginSuccess({
            id: res.data!.user.id,
            name: res.data!.user.fullName,
            role: res.data!.user.role,
            email: res.data!.user.email,
            nodeId: res.data!.user.nodeId,
            isGuest: false,
          });
        }, 400);
      } else {
        setErrorMessage(res.error || 'Authentication rejected. Verify credentials.');
      }
    } catch {
      setErrorMessage('Network connection error contacting security vault.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await ApiClient.register(regFullName, regEmail, regPassword, regNodeId);
      if (res.success && res.data) {
        setSuccessMessage(`Account created! Assigned Graph Node #${regNodeId}. Logging in...`);
        setTimeout(() => {
          onLoginSuccess({
            id: res.data!.user.id,
            name: res.data!.user.fullName,
            role: res.data!.user.role,
            email: res.data!.user.email,
            nodeId: res.data!.user.nodeId,
            isGuest: false,
          });
        }, 500);
      } else {
        setErrorMessage(res.error || 'Failed to create medical account.');
      }
    } catch {
      setErrorMessage('Error establishing secure account profile.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick preset selector
  const handleSelectPreset = (p: typeof presets[0]) => {
    setEmail(p.email);
    setPassword(
      p.email === 'elena.rostova@lab.gov'
        ? 'lab2026'
        : p.email === 'marcus.v@biotech.org'
        ? 'biotech2026'
        : 'password123'
    );
    setPin(p.pin);
    setActiveTab('login');
  };

  // Continue as guest
  const handleGuest = () => {
    onLoginSuccess({
      id: 'guest_001',
      name: 'Guest Epidemiologist',
      role: 'OBSERVER',
      email: 'guest@epidemiclab.io',
      nodeId: 35,
      isGuest: true,
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f7f8fe]">
      {/* Left Column: Interactive Simulation & Visual Node Projection */}
      <div className="relative w-full md:w-5/12 lg:w-1/2 h-64 md:h-screen bg-gradient-to-br from-[#f2f4ff] via-[#eef2fe] to-[#e6ecfd] flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-[rgba(159,161,255,0.25)] overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Ambient Top Navigation */}
        <div className="absolute top-6 left-6 z-10 flex items-center space-x-2">
          <button
            onClick={onBackToLanding}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/90 border border-[#9FA1FF]/30 text-xs font-semibold text-[#444766] hover:bg-white shadow-xs transition-all hover:scale-102"
          >
            ← EPIDEMIC LAB
          </button>
          <div className="px-2.5 py-1 rounded-xl bg-[#D9F9DF]/80 border border-[#BDEEC8] text-[10px] font-bold text-[#427A54] flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-[#427A54]" />
            <span>256-Bit Cryptographic Vault</span>
          </div>
        </div>

        {/* Live Node Identification Overlay */}
        <div className="absolute bottom-8 left-8 right-8 z-10 max-w-md pointer-events-none">
          <div className="glass-panel p-4 rounded-2xl border border-[#9FA1FF]/30 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#9192E8]" />
                <span className="text-xs font-bold text-[#383A59]">
                  Live Transmission Network Integration
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#9FA1FF]/20 text-[#6C6EA6] font-semibold">
                ACTIVE GRAPH
              </span>
            </div>
            <p className="text-[11px] text-[#676B8C] leading-relaxed">
              Every authenticated person is assigned a physical node in the outbreak network. Logging
              in synchronizes your temperature logs, clinical symptoms, and contact history into the
              real-time epidemic simulation.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Detailed Secure Authentication Portal */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 md:p-10 relative overflow-y-auto">
        <div className="w-full max-w-lg glass-panel rounded-3xl p-7 md:p-9 border border-[#9FA1FF]/35 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#9FA1FF] via-[#B5BAFF] to-[#D9F9DF] p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-[#9192E8]" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#383A59] tracking-tight">
                  Secure Epidemiological Vault
                </h2>
                <p className="text-xs text-[#787B99] font-medium">
                  Patient Medical Records & Outbreak Surveillance Access
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center bg-white/70 p-1 rounded-xl border border-[#9FA1FF]/25 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-[#9192E8] shadow-sm border border-[#9FA1FF]/30'
                  : 'text-[#787B99] hover:text-[#444766]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>2FA Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('presets');
                setErrorMessage(null);
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'presets'
                  ? 'bg-white text-[#9192E8] shadow-sm border border-[#9FA1FF]/30'
                  : 'text-[#787B99] hover:text-[#444766]'
              }`}
            >
              <FileBadge className="w-3.5 h-3.5" />
              <span>Demo Accounts ({presets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-[#9192E8] shadow-sm border border-[#9FA1FF]/30'
                  : 'text-[#787B99] hover:text-[#444766]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Patient</span>
            </button>
          </div>

          {/* Notification Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* TAB 1: 2FA Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#444766] uppercase tracking-wider mb-1.5">
                  Institutional Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-[#787B99]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@epidemiclab.io"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/95 border border-[#9FA1FF]/35 text-xs text-[#444766] placeholder:text-[#A0A3BD] focus:outline-none focus:border-[#9192E8] focus:ring-1 focus:ring-[#9192E8] shadow-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-[#444766] uppercase tracking-wider">
                    Password / Master Passkey
                  </label>
                  <span className="text-[10px] text-[#9192E8] font-semibold hover:underline cursor-pointer">
                    Forgot key?
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-[#787B99]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/95 border border-[#9FA1FF]/35 text-xs text-[#444766] placeholder:text-[#A0A3BD] focus:outline-none focus:border-[#9192E8] focus:ring-1 focus:ring-[#9192E8] shadow-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#787B99] hover:text-[#444766]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2FA PIN Input */}
              <div className="p-3.5 rounded-2xl bg-white/60 border border-[#9FA1FF]/25 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#9192E8]" />
                    <label className="text-[11px] font-bold text-[#444766] uppercase tracking-wider">
                      2-Factor Security PIN
                    </label>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D9F9DF] text-[#427A54] font-bold">
                    4 DIGITS
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full text-center tracking-[0.5em] text-base font-mono font-bold py-2 rounded-xl bg-white border border-[#9FA1FF]/40 text-[#383A59] focus:outline-none focus:border-[#9192E8] shadow-xs"
                  />
                </div>
                <p className="text-[10.5px] text-[#787B99] leading-tight">
                  Enter your physical authenticator PIN or clinical surveillance verification code.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-[#676B8C]">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-[#9192E8] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="font-medium text-[11px]">Remember secure device token</span>
                </label>
                <span className="text-[10.5px] font-mono text-[#787B99]">TLS 1.3 / SHA-256</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Verifying Cryptographic Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>AUTHENTICATE & ACCESS HEALTH VAULT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Quick Demo Accounts */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-[#676B8C]">
                Select any pre-seeded epidemic subject to immediately explore their verified medical
                records, symptoms, 14-day thermal log, and direct graph contact links:
              </p>

              <div className="space-y-2.5">
                {presets.map((p) => (
                  <div
                    key={p.email}
                    onClick={() => handleSelectPreset(p)}
                    className="p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-[#9FA1FF]/30 hover:border-[#9192E8] shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-[#383A59] group-hover:text-[#9192E8] transition-colors">
                            {p.label}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#AEE2FF]/50 text-[#383A59] font-mono font-bold">
                            NODE #{p.nodeId}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#787B99] leading-snug">{p.description}</p>
                        <div className="flex items-center space-x-3 text-[10px] font-mono text-[#9192E8] pt-1">
                          <span>Email: {p.email}</span>
                          <span>•</span>
                          <span>2FA PIN: {p.pin}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9FA1FF] group-hover:text-[#9192E8] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPreset(presets[0]);
                    setTimeout(() => {
                      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                      if (btn) btn.click();
                    }, 100);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#9FA1FF]/20 to-[#D9F9DF] hover:from-[#9FA1FF]/30 hover:to-[#BDEEC8] text-[#383A59] text-xs font-bold border border-[#9FA1FF]/30 transition-all flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#9192E8]" />
                  <span>1-Click Login as Dr. Elena (Patient Zero Node #0)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: New Patient Registration */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#444766] uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full px-3 py-2 rounded-xl bg-white/95 border border-[#9FA1FF]/35 text-xs text-[#444766] focus:outline-none focus:border-[#9192E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444766] uppercase tracking-wider mb-1">
                  Medical Portal Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="jordan.h@campus.edu"
                  className="w-full px-3 py-2 rounded-xl bg-white/95 border border-[#9FA1FF]/35 text-xs text-[#444766] focus:outline-none focus:border-[#9192E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444766] uppercase tracking-wider mb-1">
                  Security Passphrase
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-white/95 border border-[#9FA1FF]/35 text-xs text-[#444766] focus:outline-none focus:border-[#9192E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444766] uppercase tracking-wider mb-1">
                  Assign Graph Node ID (0 - 35)
                </label>
                <input
                  type="number"
                  min={0}
                  max={35}
                  value={regNodeId}
                  onChange={(e) => setRegNodeId(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white/95 border border-[#9FA1FF]/35 text-xs text-[#444766] font-mono focus:outline-none focus:border-[#9192E8]"
                />
                <p className="text-[10px] text-[#787B99] mt-0.5">
                  Binds your medical profile, thermal logs, and contacts directly to this simulation node.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>CREATE PROFILE & LINK TO SIMULATION GRAPH</span>
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="pt-2 flex items-center">
            <div className="flex-1 h-[1px] bg-[#9FA1FF]/20" />
            <span className="px-3 text-[10.5px] text-[#787B99] font-medium uppercase tracking-wider">
              ALTERNATIVE
            </span>
            <div className="flex-1 h-[1px] bg-[#9FA1FF]/20" />
          </div>

          {/* Guest Observer Action */}
          <button
            type="button"
            onClick={handleGuest}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white/80 hover:bg-white text-[#444766] border border-[#9FA1FF]/30 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-[#9192E8]" />
            <span>Continue as Guest Observer (Read-Only)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
