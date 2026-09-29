// src/pages/LoginPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  Sparkles,
  KeyRound,
  UserCheck,
  User,
  Users,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { AuthSession } from '../utils/authSession';
import type { ResearchUser } from '../utils/authSession';

interface LoginPageProps {
  onLoginSuccess: (user: ResearchUser) => void;
  onBackToLanding?: () => void;
  onStartDemo?: () => void;
}

type LoginTab = '2fa' | 'demo' | 'new_patient';

interface GraphNodeSim {
  id: number;
  label: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  cluster: number;
  state: 'S' | 'E' | 'I' | 'R';
  radius: number;
  isUserNode?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToLanding, onStartDemo }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active level / person type tab
  const [activeTab, setActiveTab] = useState<LoginTab>('2fa');

  // 2FA Form State
  const [email, setEmail] = useState('user@epidemiclab.io');
  const [password, setPassword] = useState('epidemic2026');
  const [pinCode, setPinCode] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  // New Patient Form State
  const [newPatientName, setNewPatientName] = useState('Alex Mercer, M.D.');
  const [newPatientEmail, setNewPatientEmail] = useState('user@epidemiclab.io');
  const [newPatientZone, setNewPatientZone] = useState('Zone D - Medical Pavilion');
  const [newPatientState, setNewPatientState] = useState<'S' | 'E' | 'I' | 'R'>('I');
  const [newPatientRole, setNewPatientRole] = useState('Case Subject / Physician');

  // Real-time Authentication & Verification State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'forgot'>('none');

  // Demo accounts tailored for different types of people
  const demoAccounts = [
    {
      id: 'alex-mercer',
      name: 'Alex Mercer, M.D.',
      role: 'Case Subject / Physician',
      email: 'user@epidemiclab.io',
      nodeId: 88,
      statusBadge: 'INFECTIOUS (TRANSMITTING)',
      badgeColor: 'bg-purple-100 text-[#9192E8] border-[#9192E8]',
      description: 'Quarantined in Zone D Medical Pavilion. Confirmed symptomatic (38.3°C).',
      pass: 'epidemic2026',
      pin: '1234',
    },
    {
      id: 'elena-rostova',
      name: 'Dr. Elena Rostova',
      role: 'Lead Epidemiologist',
      email: 'elena.rostova@lab.gov',
      nodeId: 0,
      statusBadge: 'HIGH CLEARANCE · SYMPTOMATIC',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-300',
      description: 'Principal investigator & seed infection node #000 at Bio-Lab Core.',
      pass: 'epidemic2026',
      pin: '8821',
    },
    {
      id: 'amina-sayed',
      name: 'Amina Al-Sayed',
      role: 'Public Health Officer',
      email: 'amina.s@transit.net',
      nodeId: 2,
      statusBadge: 'FIELD SURVEILLANCE · CLEAR',
      badgeColor: 'bg-emerald-100 text-[#427A54] border-[#BDEEC8]',
      description: 'Oversees contactless infrared thermal kiosk screening at Zone B Transit Hub.',
      pass: 'epidemic2026',
      pin: '4092',
    },
  ];

  // Interactive Live Transmission Network Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth * 0.55);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth * 0.55;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Build 3 community clusters of nodes matching Image 4
    const nodes: GraphNodeSim[] = [];
    const clusterCenters = [
      { x: width * 0.32, y: height * 0.35, count: 8 }, // Cluster 1 (Left-top)
      { x: width * 0.68, y: height * 0.38, count: 9 }, // Cluster 2 (Right-top)
      { x: width * 0.48, y: height * 0.72, count: 9 }, // Cluster 3 (Bottom-center with YOU node)
    ];

    const stateList: ('S' | 'E' | 'I' | 'R')[] = ['S', 'S', 'S', 'E', 'S', 'S', 'R'];
    let nodeIndex = 0;

    clusterCenters.forEach((c, cIdx) => {
      for (let i = 0; i < c.count; i++) {
        const angle = (i / c.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const dist = 35 + Math.random() * 55;
        const bx = c.x + Math.cos(angle) * dist;
        const by = c.y + Math.sin(angle) * dist;

        const isUser = cIdx === 2 && i === 0; // Designated "YOU (MY NODE)"
        let nodeState: 'S' | 'E' | 'I' | 'R' = stateList[i % stateList.length];
        if (cIdx === 0 && i === 1) nodeState = 'I';
        if (cIdx === 0 && i === 3) nodeState = 'R';
        if (cIdx === 1 && i === 2) nodeState = 'E';
        if (isUser) nodeState = 'S';

        nodes.push({
          id: isUser ? 88 : nodeIndex,
          label: isUser ? '#088' : nodeIndex === 4 ? '#004' : nodeIndex === 7 ? '#007' : `#${String(nodeIndex).padStart(3, '0')}`,
          x: bx,
          y: by,
          baseX: bx,
          baseY: by,
          cluster: cIdx,
          state: nodeState,
          radius: isUser ? 10 : 8,
          isUserNode: isUser,
        });
        nodeIndex++;
      }
    });

    // Edges within clusters + inter-cluster bridges
    const edges: [number, number, boolean][] = [];
    // Intra-cluster
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].cluster === nodes[j].cluster) {
          const dx = nodes[i].baseX - nodes[j].baseX;
          const dy = nodes[i].baseY - nodes[j].baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            edges.push([i, j, false]);
          }
        }
      }
    }
    // Inter-cluster bridges (matching Image 4 dashed lines)
    edges.push([3, 11, true]); // Cluster 0 to Cluster 1
    edges.push([13, 20, true]); // Cluster 1 to Cluster 2
    edges.push([5, 18, true]); // Cluster 0 to Cluster 2

    const stateColors = {
      S: { fill: '#B5BAFF', stroke: '#9FA1FF', text: '#383A59' }, // Lavender
      E: { fill: '#CBEBFF', stroke: '#AEE2FF', text: '#1E4968' }, // Sky Blue
      I: { fill: '#B5B6F5', stroke: '#9192E8', text: '#2B2D52' }, // Deep Lavender
      R: { fill: '#D9F9DF', stroke: '#A7EDB5', text: '#265435' }, // Mint
    };

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 0.03;

      // Soft ambient background mesh
      ctx.save();
      const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 50, width * 0.5, height * 0.5, width * 0.6);
      grad.addColorStop(0, 'rgba(174, 226, 255, 0.08)');
      grad.addColorStop(1, 'rgba(247, 248, 254, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Update gentle drift
      for (const n of nodes) {
        n.x = n.baseX + Math.sin(tick + n.id) * 3;
        n.y = n.baseY + Math.cos(tick * 0.8 + n.id) * 3;
      }

      // Draw edges
      for (const [i, j, isBridge] of edges) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        if (!n1 || !n2) continue;

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        if (isBridge) {
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(159, 161, 255, 0.5)';
          ctx.lineWidth = 1.4;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(159, 161, 255, 0.32)';
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw nodes
      for (const n of nodes) {
        const col = stateColors[n.state];

        // Pulsating halo for "YOU (MY NODE)"
        if (n.isUserNode) {
          const pulse = (Math.sin(tick * 2) + 1) / 2;
          const outerRadius = n.radius + 6 + pulse * 6;

          // Outer glowing ripple
          ctx.beginPath();
          ctx.arc(n.x, n.y, outerRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(145, 146, 232, ${0.4 - pulse * 0.25})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Inner dashed focus ring
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 4, 0, Math.PI * 2);
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = '#9192E8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Main node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = col.fill;
        ctx.fill();
        ctx.strokeStyle = col.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        // SEIR State character inside node
        ctx.fillStyle = col.text;
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.state, n.x, n.y + 0.5);

        // Numeric label next to key nodes (e.g. #004, #007)
        if (n.label === '#004' || n.label === '#007') {
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#676B8C';
          ctx.textAlign = 'left';
          ctx.fillText(n.label, n.x + n.radius + 3, n.y + 3);
        }

        // Draw floating "YOU (MY NODE)" tooltip above user node
        if (n.isUserNode) {
          const tooltipText = 'YOU (MY NODE)';
          ctx.font = 'bold 10px monospace';
          const textMetrics = ctx.measureText(tooltipText);
          const tWidth = textMetrics.width + 16;
          const tHeight = 20;
          const tX = n.x - tWidth / 2;
          const tY = n.y - n.radius - 24;

          // Rounded tag bubble
          ctx.fillStyle = '#9192E8';
          ctx.beginPath();
          ctx.roundRect(tX, tY, tWidth, tHeight, 6);
          ctx.fill();

          // Small downward pointer triangle
          ctx.beginPath();
          ctx.moveTo(n.x - 4, tY + tHeight);
          ctx.lineTo(n.x + 4, tY + tHeight);
          ctx.lineTo(n.x, tY + tHeight + 4);
          ctx.closePath();
          ctx.fillStyle = '#9192E8';
          ctx.fill();

          // Tag text
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tooltipText, n.x, tY + tHeight / 2);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Real-Time Authentication Executor
  const executeAuthentication = (
    userProfile: {
      name: string;
      email: string;
      role: string;
      nodeId: number;
      isGuest?: boolean;
    }
  ) => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    setAuthStep('Validating 256-Bit SHA Key...');

    setTimeout(() => {
      setAuthStep('Verifying 2FA Security Token & Pin...');
    }, 400);

    setTimeout(() => {
      setAuthStep(`Binding Identity to Network Node #${String(userProfile.nodeId).padStart(3, '0')}...`);
    }, 800);

    setTimeout(() => {
      setAuthStep('Cryptographic Session Approved!');
      setIsAuthenticating(false);
      setIsSuccess(true);

      const researchUser: ResearchUser = AuthSession.createMockUser({
        name: userProfile.name,
        role: userProfile.role,
        email: userProfile.email,
        researchId: `LAB-${String(userProfile.nodeId).padStart(3, '0')}`,
        isGuest: !!userProfile.isGuest,
      });

      if (rememberDevice) {
        AuthSession.saveSession(researchUser);
      }

      setTimeout(() => {
        // Transition directly to Medical Data Intake workstation
        onLoginSuccess(researchUser);
      }, 700);
    }, 1300);
  };

  // Handle 2FA Login Form Submit
  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both institutional email and passkey.');
      return;
    }
    if (pinCode.length < 4) {
      setErrorMessage('Please enter a 4-digit 2FA security PIN.');
      return;
    }

    // Match demo or default to Alex Mercer, M.D.
    const matched = demoAccounts.find((d) => d.email.toLowerCase() === email.toLowerCase());
    const targetUser = matched
      ? {
          name: matched.name,
          email: matched.email,
          role: matched.role,
          nodeId: matched.nodeId,
        }
      : {
          name: 'Alex Mercer, M.D.',
          email: email,
          role: 'Case Subject / Physician',
          nodeId: 88,
        };

    executeAuthentication(targetUser);
  };

  // Handle 1-Click Demo Account Login
  const handleSelectDemoAccount = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setPinCode(acc.pin);
    executeAuthentication({
      name: acc.name,
      email: acc.email,
      role: acc.role,
      nodeId: acc.nodeId,
    });
  };

  // Handle New Patient Registration Submit
  const handleNewPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientEmail.trim()) {
      setErrorMessage('Please enter full patient name and email.');
      return;
    }

    const allocatedNodeId = Math.floor(10 + Math.random() * 85);
    executeAuthentication({
      name: newPatientName,
      email: newPatientEmail,
      role: newPatientRole,
      nodeId: allocatedNodeId,
    });
  };

  // Handle Guest Observer Click
  const handleGuestLogin = () => {
    executeAuthentication({
      name: 'Guest Observer',
      email: 'guest@epidemiclab.io',
      role: 'Visiting Research Fellow',
      nodeId: 99,
      isGuest: true,
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#f7f8fe] text-[#444766] select-none font-sans overflow-hidden">
      {/* Top Header Navigation matching Image 4 */}
      <header className="relative z-20 w-full px-5 py-3.5 flex items-center justify-between border-b border-[rgba(159,161,255,0.22)] bg-white/70 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          {onBackToLanding ? (
            <button
              onClick={onBackToLanding}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#9FA1FF]/30 text-xs font-mono font-bold text-[#444766] shadow-xs cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#9192E8]" />
              <span>EPIDEMIC LAB</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[#9FA1FF]/30 text-xs font-mono font-bold text-[#444766] shadow-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-[#9192E8]" />
              <span>EPIDEMIC LAB</span>
            </div>
          )}

          {/* Cryptographic Vault Pill Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#D9F9DF] border border-[#BDEEC8] text-[#427A54] text-[11px] font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#427A54]" />
            <span>256-Bit Cryptographic Vault</span>
          </div>
        </div>

        {/* Security Meta Indicators & Quick Demo Launcher */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          {onStartDemo && (
            <button
              onClick={onStartDemo}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#9192E8] border border-[#9FA1FF]/40 font-bold shadow-xs cursor-pointer transition-all hover:scale-105"
              title="Launch Autonomous Walkthrough Demo"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Guided Demo</span>
            </button>
          )}
          <div className="hidden sm:flex items-center space-x-3 text-[#787B99]">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4EBA88] animate-pulse" />
              <span>Active Outbreak Network</span>
            </span>
            <span>&bull;</span>
            <span className="font-semibold text-[#676B8C]">SHA-256 Verified Session</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Left Canvas / Right Vault Card */}
      <main className="relative z-10 flex-1 w-full flex flex-col lg:flex-row items-stretch overflow-hidden">
        {/* LEFT: Live Interactive Transmission Network Canvas */}
        <div className="relative flex-1 min-h-[380px] lg:min-h-full flex flex-col justify-between p-6 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-default"
          />

          {/* Top-left Canvas Guide Hint */}
          <div className="relative z-10 hidden sm:flex items-center space-x-2 text-[11px] font-mono text-[#787B99]">
            <span className="px-2 py-0.5 rounded-md bg-white/80 border border-[#9FA1FF]/25 font-bold text-[#9192E8]">
              CLUSTERS: 3
            </span>
            <span>Hover or observe live SEIR epidemic community interaction</span>
          </div>

          {/* Bottom-left Floating Integration Card matching Image 4 */}
          <div className="relative z-10 mt-auto max-w-md p-4 rounded-2xl glass-panel border border-[#9FA1FF]/35 shadow-lg backdrop-blur-md text-xs font-mono space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#9192E8]" />
                <span className="font-bold text-[#444766] uppercase tracking-wide">
                  Live Transmission Network Integration
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 border border-[#9192E8] text-[#9192E8] font-bold text-[10px]">
                ACTIVE GRAPH
              </span>
            </div>
            <p className="text-[11px] text-[#676B8C] leading-relaxed">
              Every authenticated person is assigned a physical node in the outbreak network. Logging in synchronizes your temperature logs, clinical symptoms, and contact history into the real-time epidemic simulation.
            </p>
          </div>
        </div>

        {/* RIGHT: Elevated Glassmorphic Secure Vault Login Card */}
        <div className="w-full lg:w-[480px] xl:w-[520px] p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-white/40 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-[rgba(159,161,255,0.25)]">
          <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 sm:p-7 shadow-2xl border border-[rgba(159,161,255,0.35)] space-y-5">
            {/* Real-time Authentication Overlay Animation */}
            {(isAuthenticating || isSuccess) && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 z-30 animate-in fade-in zoom-in-95 duration-200 text-center space-y-3 font-mono">
                {isSuccess ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-[#D9F9DF] border border-[#BDEEC8] flex items-center justify-center shadow-md animate-bounce">
                      <CheckCircle2 className="w-7 h-7 text-[#427A54]" />
                    </div>
                    <h3 className="text-base font-extrabold text-[#444766]">
                      ACCESS GRANTED & NODE LINKED
                    </h3>
                    <p className="text-xs text-[#787B99]">
                      Synchronizing clinical telemetry with Medical Intake Workstation...
                    </p>
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#9192E8] pt-2">
                      <Activity className="w-4 h-4 animate-spin" />
                      <span>Proceeding to Medical Data Entry...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-purple-50 border border-[#9192E8] flex items-center justify-center shadow-md">
                      <Activity className="w-7 h-7 text-[#9192E8] animate-spin" />
                    </div>
                    <h3 className="text-sm font-extrabold text-[#444766] uppercase tracking-wider">
                      REAL-TIME AUTHENTICATION
                    </h3>
                    <p className="text-xs text-[#9192E8] font-bold">
                      {authStep || 'Processing cryptographic token...'}
                    </p>
                    <div className="w-48 h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2">
                      <div className="h-full bg-gradient-to-r from-[#9FA1FF] to-[#9192E8] animate-pulse w-full" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Header: Shield Icon + Vault Title */}
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-[#9FA1FF]/40 flex items-center justify-center text-[#9192E8] shadow-xs shrink-0">
                <ShieldAlert className="w-6 h-6 text-[#9192E8]" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#444766] font-mono">
                  Secure Epidemiological Vault
                </h2>
                <p className="text-[11px] text-[#787B99] font-mono leading-tight mt-0.5">
                  Patient Medical Records & Outbreak Surveillance Access
                </p>
              </div>
            </div>

            {/* Three Level / Person Type Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-[#9FA1FF]/25 font-mono text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('2fa');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center space-x-1 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === '2fa'
                    ? 'bg-white text-[#9192E8] shadow-sm border border-[#9FA1FF]/30'
                    : 'text-[#676B8C] hover:text-[#444766]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>2FA Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('demo');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center space-x-1 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'demo'
                    ? 'bg-white text-[#9192E8] shadow-sm border border-[#9FA1FF]/30'
                    : 'text-[#676B8C] hover:text-[#444766]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Demo (3)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('new_patient');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center space-x-1 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'new_patient'
                    ? 'bg-white text-[#9192E8] shadow-sm border border-[#9FA1FF]/30'
                    : 'text-[#676B8C] hover:text-[#444766]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Patient</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700 font-mono">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* LEVEL 1: 2FA Login Form */}
            {activeTab === '2fa' && (
              <form onSubmit={handle2FASubmit} className="space-y-3.5 font-mono text-xs">
                {/* Institutional Email Address */}
                <div>
                  <label className="block text-[10.5px] font-bold text-[#787B99] uppercase tracking-wider mb-1">
                    INSTITUTIONAL EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787B99]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@epidemiclab.io"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#9FA1FF]/30 text-[#444766] placeholder-[#787B99]/60 focus:outline-none focus:border-[#9192E8] shadow-xs text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Password / Master Passkey */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10.5px] font-bold text-[#787B99] uppercase tracking-wider">
                      PASSWORD / MASTER PASSKEY
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveModal('forgot')}
                      className="text-[10.5px] text-[#9192E8] hover:underline cursor-pointer"
                    >
                      Forgot key?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787B99]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-[#9FA1FF]/30 text-[#444766] focus:outline-none focus:border-[#9192E8] shadow-xs text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#787B99] hover:text-[#444766] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 2-Factor Security PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10.5px] font-bold text-[#787B99] uppercase tracking-wider flex items-center space-x-1">
                      <KeyRound className="w-3 h-3 text-[#9192E8]" />
                      <span>2-FACTOR SECURITY PIN</span>
                    </label>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-purple-50 text-[#9192E8] font-bold border border-[#9FA1FF]/30">
                      4 DIGITS
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1 2 3 4"
                    className="w-full py-2.5 text-center tracking-[0.5em] font-mono font-black text-base rounded-xl bg-white border border-[#9FA1FF]/30 text-[#444766] focus:outline-none focus:border-[#9192E8] shadow-xs"
                  />
                  <p className="text-[10px] text-[#787B99] mt-1 leading-tight">
                    Enter your physical authenticator PIN or clinical surveillance verification code.
                  </p>
                </div>

                {/* Remember device checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-[11px] text-[#676B8C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="rounded border-[#9FA1FF]/40 text-[#9192E8] focus:ring-[#9192E8] cursor-pointer"
                    />
                    <span>Remember secure device token</span>
                  </label>
                  <span className="text-[10px] text-[#787B99]">TLS 1.3 / SHA-256</span>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#9FA1FF] to-[#9192E8] hover:from-[#9192E8] hover:to-[#8384e5] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 hover:scale-[1.01]"
                >
                  <span>AUTHENTICATE & ACCESS HEALTH VAULT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Divider */}
                <div className="relative my-2 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[rgba(159,161,255,0.2)]" />
                  </div>
                  <span className="relative px-3 bg-white/80 text-[10px] uppercase font-bold text-[#787B99]">
                    ALTERNATIVE
                  </span>
                </div>

                {/* Guest Observer Option */}
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 rounded-2xl bg-white/80 hover:bg-white text-[#444766] border border-[#9FA1FF]/30 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <User className="w-3.5 h-3.5 text-[#787B99]" />
                  <span>Continue as Guest Observer (Read-Only)</span>
                </button>

                {/* Guided Demo Option */}
                {onStartDemo && (
                  <button
                    type="button"
                    onClick={onStartDemo}
                    className="w-full py-2.5 rounded-2xl bg-purple-50/80 hover:bg-purple-100 text-[#9192E8] border border-[#9FA1FF]/30 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#9192E8] animate-pulse" />
                    <span>Launch Autonomous Guided Demo Tour</span>
                  </button>
                )}
              </form>
            )}

            {/* LEVEL 2: Demo Accounts (3 Different Types of People) */}
            {activeTab === 'demo' && (
              <div className="space-y-2.5 font-mono text-xs">
                <p className="text-[10.5px] text-[#787B99] leading-tight mb-2">
                  Select a role-based identity to preview how different clinical profiles synchronize with the outbreak graph:
                </p>

                {demoAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => handleSelectDemoAccount(acc)}
                    className="p-3.5 rounded-2xl bg-white/85 hover:bg-white border border-[#9FA1FF]/30 hover:border-[#9192E8] transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs text-[#444766] group-hover:text-[#9192E8] transition-colors">
                          {acc.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-[#9192E8] font-bold border border-[#9FA1FF]/25">
                          NODE #{String(acc.nodeId).padStart(3, '0')}
                        </span>
                      </div>
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold border ${acc.badgeColor}`}>
                        {acc.statusBadge}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#676B8C] font-semibold">
                      {acc.role} &bull; <span className="text-[#787B99]">{acc.email}</span>
                    </div>

                    <p className="text-[10.5px] text-[#787B99] mt-1 line-clamp-1">
                      {acc.description}
                    </p>

                    <div className="mt-2 pt-2 border-t border-[rgba(159,161,255,0.18)] flex items-center justify-between text-[10.5px] text-[#9192E8] font-bold">
                      <span>Simulate real-time login</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LEVEL 3: New Patient Intake Registration */}
            {activeTab === 'new_patient' && (
              <form onSubmit={handleNewPatientSubmit} className="space-y-3 font-mono text-xs">
                <p className="text-[10.5px] text-[#787B99] leading-tight mb-2">
                  Enroll a new individual into the epidemiological registry and allocate a real-time graph node:
                </p>

                {/* Patient Name */}
                <div>
                  <label className="block text-[10.5px] font-bold text-[#787B99] uppercase mb-1">
                    FULL IDENTITY NAME
                  </label>
                  <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="e.g. Alex Mercer, M.D."
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-[#444766] focus:outline-none focus:border-[#9192E8] text-xs font-mono"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10.5px] font-bold text-[#787B99] uppercase mb-1">
                    INSTITUTIONAL EMAIL
                  </label>
                  <input
                    type="email"
                    value={newPatientEmail}
                    onChange={(e) => setNewPatientEmail(e.target.value)}
                    placeholder="user@epidemiclab.io"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-[#444766] focus:outline-none focus:border-[#9192E8] text-xs font-mono"
                  />
                </div>

                {/* Campus Zone */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-[#787B99] uppercase mb-1">
                      ASSIGNED ZONE
                    </label>
                    <select
                      value={newPatientZone}
                      onChange={(e) => setNewPatientZone(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-[#444766] text-xs font-mono focus:outline-none focus:border-[#9192E8]"
                    >
                      <option>Zone A - Research Core</option>
                      <option>Zone B - Transit Hub</option>
                      <option>Zone C - Student Quad</option>
                      <option>Zone D - Medical Pavilion</option>
                    </select>
                  </div>

                  {/* Initial Health State */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-[#787B99] uppercase mb-1">
                      HEALTH STATUS
                    </label>
                    <select
                      value={newPatientState}
                      onChange={(e) => setNewPatientState(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-[#444766] text-xs font-mono focus:outline-none focus:border-[#9192E8]"
                    >
                      <option value="S">Susceptible [S]</option>
                      <option value="E">Exposed [E]</option>
                      <option value="I">Infectious [I]</option>
                      <option value="R">Recovered [R]</option>
                    </select>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[10.5px] font-bold text-[#787B99] uppercase mb-1">
                    EPIDEMIOLOGICAL ROLE
                  </label>
                  <select
                    value={newPatientRole}
                    onChange={(e) => setNewPatientRole(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#9FA1FF]/30 text-[#444766] text-xs font-mono focus:outline-none focus:border-[#9192E8]"
                  >
                    <option>Case Subject / Physician</option>
                    <option>Clinical Epidemiologist</option>
                    <option>Transit Hub Officer</option>
                    <option>Campus Student</option>
                  </select>
                </div>

                {/* Submit New Patient */}
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 mt-2 rounded-2xl bg-gradient-to-r from-[#9FA1FF] to-[#9192E8] hover:from-[#9192E8] hover:to-[#8384e5] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>REGISTER & ALLOCATE GRAPH NODE</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {activeModal === 'forgot' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#444766]/20 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[#9FA1FF]/30 p-6 shadow-2xl space-y-4 font-mono text-xs text-[#444766]">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(159,161,255,0.2)]">
              <h3 className="text-sm font-bold uppercase">Reset Master Passkey</h3>
              <button
                onClick={() => setActiveModal('none')}
                className="text-[#787B99] hover:text-[#444766] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#787B99] leading-relaxed">
              In this development sandbox, test credentials are standardized:
            </p>
            <div className="p-3 rounded-xl bg-purple-50/70 border border-[#9FA1FF]/30 space-y-1">
              <div>Default Passkey: <span className="font-bold text-[#9192E8]">epidemic2026</span></div>
              <div>2FA Security PIN: <span className="font-bold text-[#9192E8]">1234</span></div>
            </div>
            <button
              onClick={() => {
                setPassword('epidemic2026');
                setPinCode('1234');
                setActiveModal('none');
              }}
              className="w-full py-2.5 rounded-xl bg-[#9192E8] text-white font-bold hover:bg-[#8384e5] cursor-pointer"
            >
              Autofill Test Passkey & PIN
            </button>
          </div>
        </div>
      )}

      {/* Technical Footer */}
      <footer className="relative z-20 w-full px-6 py-2.5 border-t border-[rgba(159,161,255,0.22)] text-[10px] font-mono text-[#787B99] flex flex-col sm:flex-row items-center justify-between gap-1 bg-white/70 backdrop-blur-xs">
        <div>EPIDEMIC LAB &bull; SECURE MULTI-ROLE EPIDEMIOLOGICAL GATEWAY</div>
        <div>CLIENT-SIDE CRYPTOGRAPHIC ENGINE &bull; 0 EXTERNAL PII TRANSMISSION</div>
      </footer>
    </div>
  );
};
