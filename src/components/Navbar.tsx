// src/components/Navbar.tsx
import React from 'react';
import {
  Activity,
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BarChart3,
  Layers,
  ShieldAlert,
  User,
  Scissors,
  Radio,
  Compass,
  LogOut,
  Sliders,
  Users,
  HeartPulse,
  Clock,
} from 'lucide-react';
import type { ResearchUser } from '../utils/authSession';

export type NavScreen =
  | 'landing'
  | 'login'
  | 'intake'
  | 'laboratory'
  | 'contact_trace'
  | 'surgery'
  | 'whatif'
  | 'counterfactual'
  | 'replay'
  | 'analytics'
  | 'surveillance'
  | 'medical'
  | 'dsalab';

interface NavbarProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onStep: () => void;
  currentDay: number;
  user: ResearchUser | null;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onStartDemo: () => void;
  isDemoActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  isRunning,
  onToggleRun,
  onReset,
  onStep,
  currentDay,
  user,
  onOpenLogin,
  onOpenProfile,
  onLogout,
  onStartDemo,
  isDemoActive = false,
}) => {
  if (currentScreen === 'landing' || currentScreen === 'login') {
    return null; // Landing & Login have their own custom scientific dark cinematic header
  }

  const navItems: { id: NavScreen; label: string; icon: React.ReactNode }[] = [
    { id: 'laboratory', label: 'LAB', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'replay', label: 'REPLAY TREE', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'surveillance', label: 'SURVEILLANCE', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'medical', label: 'HEALTH VAULT', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'contact_trace', label: 'CONTACT TRACE', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'surgery', label: 'NETWORK SURGERY', icon: <Scissors className="w-3.5 h-3.5" /> },
    { id: 'whatif', label: 'WHAT-IF LAB', icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'ANALYTICS', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'dsalab', label: 'DSA X-RAY', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'intake', label: 'DATA INTAKE', icon: <Sliders className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-16 w-full glass-panel sticky top-0 z-50 px-3 md:px-5 flex items-center justify-between border-b border-[rgba(159,161,255,0.22)] select-none">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onNavigate('laboratory')}
          className="flex items-center space-x-2.5 group cursor-pointer text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#9FA1FF] via-[#B5BAFF] to-[#D9F9DF] p-[1.5px] shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white/90 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-[#9192E8]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-wider text-[#444766] uppercase font-mono">
                EPIDEMIC LAB
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#D9F9DF] text-[#427A54] font-bold border border-[#BDEEC8] font-mono">
                SECURE
              </span>
            </div>
            <p className="text-[10px] text-[#787B99] font-mono leading-none mt-0.5">
              Epidemic Dynamics & DSA Lab
            </p>
          </div>
        </button>

        {/* Guided Demo Button - Visible on all screens */}
        <button
          onClick={onStartDemo}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer shadow-xs hover:scale-105 ${
            isDemoActive
              ? 'bg-[#9192E8] text-white border-[#9192E8] shadow-md animate-pulse-subtle'
              : 'bg-purple-50 hover:bg-purple-100 text-[#9192E8] border-[#9FA1FF]/40'
          }`}
          title="Start Autonomous Guided Tour of all 7 Outbreak Modules"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isDemoActive ? 'Demo Tour Active' : 'Guided Demo'}</span>
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 bg-white/60 p-1 rounded-xl border border-[rgba(159,161,255,0.2)] shadow-inner overflow-x-auto max-w-[calc(100vw-540px)]">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center space-x-1 px-2 xl:px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#9192E8] shadow-sm border border-[rgba(159,161,255,0.3)]'
                  : 'text-[#676B8C] hover:text-[#444766] hover:bg-white/40'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Simulation Controls & Profile on Right */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Day Indicator Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/80 border border-[#9FA1FF]/30 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#787B99] tracking-wider font-mono">
            DAY
          </span>
          <span className="text-base font-extrabold text-[#444766] font-mono leading-none">
            {String(currentDay).padStart(2, '0')}
          </span>
        </div>

        {/* Play/Pause/Step/Reset */}
        <div className="flex items-center space-x-1 bg-white/70 p-1 rounded-xl border border-[rgba(159,161,255,0.25)]">
          <button
            onClick={onToggleRun}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isRunning
                ? 'bg-[#9192E8] text-white shadow-xs'
                : 'bg-white text-[#444766] hover:bg-[#AEE2FF]/30'
            }`}
            title={isRunning ? 'Pause (Space)' : 'Run Simulation'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={onStep}
            disabled={isRunning}
            className="p-1.5 rounded-lg text-[#676B8C] hover:text-[#444766] hover:bg-white/60 disabled:opacity-40 transition-colors cursor-pointer"
            title="Step 1 Day"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-[#676B8C] hover:text-[#9192E8] hover:bg-white/60 transition-colors cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Button */}
        <div className="flex items-center space-x-1">
          <button
            onClick={user ? onOpenProfile : onOpenLogin}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-[#9FA1FF]/30 text-xs text-[#444766] font-medium transition-all shadow-xs group cursor-pointer"
            title={user ? 'View Research Profile' : 'Secure Login'}
          >
            <div className="w-6 h-6 rounded-full bg-[#AEE2FF] text-[#444766] flex items-center justify-center font-bold text-[10px] group-hover:scale-105 transition-transform font-mono">
              {user ? user.name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="flex flex-col text-left">
              <span className="hidden sm:inline-block max-w-[85px] truncate font-bold text-[11px] leading-tight font-mono">
                {user ? user.name.split(' ')[0] : 'Guest'}
              </span>
              <span className="text-[9px] font-mono text-[#9192E8] font-semibold leading-none">
                {user ? user.researchId : 'Unauthenticated'}
              </span>
            </div>
          </button>

          {user && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-xl text-[#787B99] hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
              title="Secure Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
