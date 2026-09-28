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
  Clock,
  Compass,
  Thermometer,
  FileText,
} from 'lucide-react';

export type NavScreen =
  | 'landing'
  | 'login'
  | 'laboratory'
  | 'surgery'
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
  user: {
    id?: string;
    name: string;
    role?: string;
    email?: string;
    nodeId?: number;
    isGuest: boolean;
  } | null;
  onOpenLogin: () => void;
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
  onStartDemo,
  isDemoActive = false,
}) => {
  if (currentScreen === 'landing' || currentScreen === 'login') {
    return null; // Landing & Login have their own custom scientific header
  }

  const navItems: { id: NavScreen; label: string; icon: React.ReactNode }[] = [
    { id: 'laboratory', label: 'Laboratory', icon: <Activity className="w-4 h-4" /> },
    { id: 'surgery', label: 'Network Surgery', icon: <Scissors className="w-4 h-4" /> },
    { id: 'counterfactual', label: 'Counterfactual Lab', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'replay', label: 'Replay Tree', icon: <Clock className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'surveillance', label: 'Surveillance & Records', icon: <Thermometer className="w-4 h-4" /> },
    { id: 'medical', label: 'My Health Vault', icon: <FileText className="w-4 h-4" /> },
    { id: 'dsalab', label: 'DSA Lab', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <header className="h-16 w-full glass-panel sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between border-b border-[rgba(159,161,255,0.22)] select-none">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center space-x-2.5 group cursor-pointer text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#9FA1FF] via-[#B5BAFF] to-[#D9F9DF] p-[1.5px] shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white/90 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-[#9192E8]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-wider text-[#444766] uppercase">
                EPIDEMIC LAB
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D9F9DF] text-[#427A54] font-semibold border border-[#BDEEC8]">
                DSA CAPSTONE
              </span>
            </div>
            <p className="text-[10.5px] text-[#787B99] font-medium leading-none mt-0.5">
              Network Surgery & Counterfactuals
            </p>
          </div>
        </button>

        {/* Demo Button */}
        <button
          onClick={onStartDemo}
          className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
            isDemoActive
              ? 'bg-[#9192E8] text-white border-[#9192E8] shadow-sm animate-pulse-subtle'
              : 'bg-white/80 text-[#787B99] border-[#9FA1FF]/30 hover:border-[#9192E8] hover:text-[#9192E8]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isDemoActive ? 'Demo Story Running' : 'Guided Demo'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="hidden md:flex items-center space-x-1 bg-white/60 p-1 rounded-xl border border-[rgba(159,161,255,0.2)] shadow-inner">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-[#9192E8] shadow-sm border border-[rgba(159,161,255,0.3)] font-semibold'
                  : 'text-[#676B8C] hover:text-[#444766] hover:bg-white/40'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Live Simulation Controls & Status */}
      <div className="flex items-center space-x-3">
        {/* Day Indicator Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white/80 border border-[#9FA1FF]/30 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#787B99] tracking-wider">DAY</span>
          <span className="text-base font-extrabold text-[#444766] font-mono leading-none">
            {String(currentDay).padStart(2, '0')}
          </span>
        </div>

        {/* Play/Pause/Step/Reset */}
        <div className="flex items-center space-x-1 bg-white/70 p-1 rounded-xl border border-[rgba(159,161,255,0.25)]">
          <button
            onClick={onToggleRun}
            className={`p-1.5 rounded-lg transition-all ${
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
            className="p-1.5 rounded-lg text-[#676B8C] hover:text-[#444766] hover:bg-white/60 disabled:opacity-40 transition-colors"
            title="Step 1 Day"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-[#676B8C] hover:text-[#9192E8] hover:bg-white/60 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Profile / Health Vault Button */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => {
              if (user && !user.isGuest) {
                onNavigate('medical');
              } else {
                onOpenLogin();
              }
            }}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-[#9FA1FF]/30 text-xs text-[#444766] font-medium transition-all shadow-xs group cursor-pointer"
            title={user && !user.isGuest ? 'View My Health Vault' : 'Secure Login'}
          >
            <div className="w-6 h-6 rounded-full bg-[#AEE2FF] text-[#444766] flex items-center justify-center font-bold text-[10px] group-hover:scale-105 transition-transform">
              {user ? user.name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="flex flex-col text-left">
              <span className="hidden sm:inline-block max-w-[95px] truncate font-bold text-[11px] leading-tight">
                {user ? user.name : 'Guest'}
              </span>
              {user?.nodeId !== undefined && (
                <span className="text-[9px] font-mono text-[#9192E8] font-semibold leading-none">
                  Node #{user.nodeId}
                </span>
              )}
            </div>
          </button>

          {user && !user.isGuest && (
            <button
              onClick={onOpenLogin}
              className="p-1.5 rounded-xl text-[#787B99] hover:text-[#9192E8] hover:bg-white/60 transition-colors text-[10px] font-semibold"
              title="Switch Account / Re-authenticate"
            >
              Switch
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
