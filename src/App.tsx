// src/App.tsx
import { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import type { NavScreen } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { MedicalIntakePage } from './pages/MedicalIntakePage';
import type { MedicalIntakeConfig } from './pages/MedicalIntakePage';
import { LaboratoryPage } from './pages/LaboratoryPage';
import { CounterfactualPage } from './pages/CounterfactualPage';
import { ReplayPage } from './pages/ReplayPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DSALabPage } from './pages/DSALabPage';
import { SurveillancePage } from './pages/SurveillancePage';
import { MedicalPortalPage } from './pages/MedicalPortalPage';
import { SimulationEngine } from './simulation/SimulationEngine';
import { PatientRegistry } from './dataStructures/PatientRegistry';
import { NetworkGenerator } from './graph/NetworkGenerator';
import { AuthSession } from './utils/authSession';
import type { ResearchUser } from './utils/authSession';
import { ProfileModal } from './components/ProfileModal';
import { GuidedTourModal } from './components/GuidedTourModal';
import type { DemoStep } from './components/GuidedTourModal';
import {
  Activity,
  Clock,
  Radio,
  GitBranch,
  BarChart3,
  Users,
} from 'lucide-react';

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'step-network',
    stepNumber: 1,
    totalSteps: 7,
    title: 'Phase 1: Synthesizing Network Topology & Social Clusters',
    phaseLabel: 'NETWORK TOPOLOGY',
    screen: 'laboratory',
    badge: 'COMMUNITY CLUSTERS & BRIDGES',
    badgeColor: 'bg-purple-100 text-[#9192E8] border-[#9192E8]',
    description:
      'Epidemic Lab models social contact networks using clustered modular graphs with power-law distributions and high-risk inter-cluster bridge connections.',
    keyInsights: ['3 Community Clusters', 'Inter-Cluster Bridge Vectors', 'Adjacency List O(1) Lookups'],
    durationSeconds: 8,
    icon: <Activity className="w-5 h-5 text-[#9192E8]" />,
  },
  {
    id: 'step-simulation',
    stepNumber: 2,
    totalSteps: 7,
    title: 'Phase 2: Inoculating Patient Zero & SEIR Propagation',
    phaseLabel: 'DISEASE SPREAD',
    screen: 'laboratory',
    badge: 'EXPONENTIAL SPREAD SIMULATION',
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-300',
    description:
      'Introducing a single index infection triggers stochastic disease propagation. Watch nodes transition across Susceptible (S), Exposed (E), Infectious (I), and Recovered (R).',
    keyInsights: ['SEIR State Machine', 'Time-Step Stochastic Engine', 'Dynamic R₀ Transmissibility'],
    durationSeconds: 9,
    icon: <Activity className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'step-replay',
    stepNumber: 3,
    totalSteps: 7,
    title: 'Phase 3: Reconstructing Outbreak Lineage via Replay Trees',
    phaseLabel: 'PHYLOGENETIC REPLAY',
    screen: 'replay',
    badge: 'DIRECTED ACYCLIC GRAPH (DAG)',
    badgeColor: 'bg-sky-100 text-[#3B6A84] border-[#AEE2FF]',
    description:
      'Epidemiological contact tracing generates a chronological transmission tree from Generation 0 seeds down to leaf cases, exposing super-spreader events.',
    keyInsights: ['Root-to-Leaf Lineage', 'Chronological Scrubber', 'Ancestor Patient Zero Trace'],
    durationSeconds: 8,
    icon: <Clock className="w-5 h-5 text-[#3B6A84]" />,
  },
  {
    id: 'step-contact-trace',
    stepNumber: 4,
    totalSteps: 7,
    title: 'Phase 4: Contact Tracing Wavefront & Graph Traversal (BFS)',
    phaseLabel: 'ALGORITHMIC CONTACT TRACE',
    screen: 'contact_trace',
    badge: 'BREADTH-FIRST SEARCH (BFS)',
    badgeColor: 'bg-amber-100 text-[#B47B1E] border-amber-300',
    description:
      'BFS algorithm traverses concentric exposure spheres around index patients, identifying 1st, 2nd, and 3rd degree contacts for targeted quarantine.',
    keyInsights: ['1st Degree (Direct Exposure)', '2nd Degree (Secondary Risk)', 'O(V + E) Queue FIFO Traversal'],
    durationSeconds: 8,
    icon: <Radio className="w-5 h-5 text-[#B47B1E]" />,
  },
  {
    id: 'step-counterfactual',
    stepNumber: 5,
    totalSteps: 7,
    title: 'Phase 5: What-If Counterfactual Surgery & Intervention Proof',
    phaseLabel: 'CAUSAL COUNTERFACTUAL LAB',
    screen: 'counterfactual',
    badge: 'PARALLEL REALITY FORKING',
    badgeColor: 'bg-emerald-100 text-[#427A54] border-[#BDEEC8]',
    description:
      'Testing causal counterfactual interventions: severing the primary transmission bridge blocks cross-community spread, reducing peak infections by over 75%.',
    keyInsights: ['Graph Surgery (Bridge Severance)', 'Side-by-Side Dual Canvas', 'Empirical Causal Proof'],
    durationSeconds: 9,
    icon: <GitBranch className="w-5 h-5 text-[#427A54]" />,
  },
  {
    id: 'step-analytics',
    stepNumber: 6,
    totalSteps: 7,
    title: 'Phase 6: Stochastic Monte Carlo Forecasting & Peak Curves',
    phaseLabel: 'STATISTICAL ANALYTICS',
    screen: 'analytics',
    badge: '30-RUN ENSEMBLE SIMULATION',
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    description:
      'Running 30 Monte Carlo stochastic trajectories to evaluate variance envelopes, median peak infection days, and healthcare capacity surge thresholds.',
    keyInsights: ['SEIR Epidemic Area Curves', 'Peak Day Prediction', '95% Confidence Interval Envelopes'],
    durationSeconds: 8,
    icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
  },
  {
    id: 'step-surveillance',
    stepNumber: 7,
    totalSteps: 7,
    title: 'Phase 7: Clinical Surveillance Registry & Secure Health Vault',
    phaseLabel: 'PATIENT SURVEILLANCE',
    screen: 'surveillance',
    badge: 'TELEMETRY & HEALTH VAULT',
    badgeColor: 'bg-purple-100 text-[#9192E8] border-[#9192E8]',
    description:
      'Linking graph nodes to confidential clinical dossiers, contactless infrared thermal scans (38.3°C fevers), and digital vaccination passports.',
    keyInsights: ['Infrared Thermal Kiosk Logs', 'SpO₂ & Heart Rate Biometrics', 'Cryptographic Health Vault'],
    durationSeconds: 9,
    icon: <Users className="w-5 h-5 text-[#9192E8]" />,
  },
];

export function App() {
  // Check for restored research session from local storage
  const initialSession = useMemo(() => AuthSession.getSession(), []);

  // Initial Screen: Landing Page with interactive canvas and feature cards
  const [user, setUser] = useState<ResearchUser | null>(initialSession);
  const [currentScreen, setCurrentScreen] = useState<NavScreen>(() => {
    return initialSession ? 'intake' : 'landing';
  });

  const [focusNodeId, setFocusNodeId] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [simulationRunCount, setSimulationRunCount] = useState(1);

  // Global shared patient clinical registry
  const patientRegistry = useMemo(() => {
    return new PatientRegistry();
  }, []);

  // Global shared simulation engine
  const engine = useMemo(() => {
    return new SimulationEngine(42);
  }, []);

  const [, setTick] = useState(0);

  // Sync engine updates to trigger re-renders
  useEffect(() => {
    const handleUpdate = () => setTick((prev) => prev + 1);
    engine.onUpdate = handleUpdate;
    return () => {
      engine.onUpdate = undefined;
    };
  }, [engine]);

  // Guided Demo autonomous state machine
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState(true);
  const [demoProgress, setDemoProgress] = useState(0);
  const [isDemoCompleted, setIsDemoCompleted] = useState(false);

  const executeStepActions = (index: number) => {
    const step = DEMO_STEPS[index];
    if (!step) return;

    setCurrentScreen(step.screen);

    switch (index) {
      case 0: // Phase 1: Synthesizing Network Topology & Social Clusters
        engine.pause();
        engine.reset();
        setSimulationRunCount((c) => c + 1);
        break;
      case 1: // Phase 2: Inoculating Patient Zero & SEIR Propagation
        if (!engine.isRunning) {
          engine.run();
        }
        break;
      case 2: // Phase 3: Reconstructing Outbreak Lineage via Replay Trees
        engine.pause();
        break;
      case 3: // Phase 4: Contact Tracing Wavefront & Graph Traversal (BFS)
        engine.pause();
        setFocusNodeId(0);
        break;
      case 4: // Phase 5: What-If Counterfactual Surgery & Intervention Proof
        engine.pause();
        break;
      case 5: // Phase 6: Stochastic Monte Carlo Forecasting & Peak Curves
        engine.pause();
        break;
      case 6: // Phase 7: Clinical Surveillance Registry & Secure Health Vault
        engine.pause();
        break;
    }
  };

  // Demo auto-advance interval timer
  useEffect(() => {
    if (!isDemoActive || !isDemoPlaying || isDemoCompleted) return;

    const currentStep = DEMO_STEPS[demoStepIndex];
    if (!currentStep) return;

    const stepDurationMs = currentStep.durationSeconds * 1000;
    const intervalMs = 100;
    const increment = (intervalMs / stepDurationMs) * 100;

    const timer = setInterval(() => {
      setDemoProgress((prev) => {
        if (prev + increment >= 100) {
          if (demoStepIndex < DEMO_STEPS.length - 1) {
            const nextIdx = demoStepIndex + 1;
            setDemoStepIndex(nextIdx);
            executeStepActions(nextIdx);
            return 0;
          } else {
            setIsDemoCompleted(true);
            setIsDemoPlaying(false);
            return 100;
          }
        }
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isDemoActive, isDemoPlaying, isDemoCompleted, demoStepIndex]);

  const startGuidedDemo = () => {
    setIsDemoActive(true);
    setIsDemoCompleted(false);
    setIsDemoPlaying(true);
    setDemoStepIndex(0);
    setDemoProgress(0);
    executeStepActions(0);
  };

  const handleNextDemoStep = () => {
    if (demoStepIndex < DEMO_STEPS.length - 1) {
      const nextIdx = demoStepIndex + 1;
      setDemoStepIndex(nextIdx);
      setDemoProgress(0);
      executeStepActions(nextIdx);
    } else {
      setIsDemoCompleted(true);
      setIsDemoPlaying(false);
    }
  };

  const handlePrevDemoStep = () => {
    if (demoStepIndex > 0) {
      const prevIdx = demoStepIndex - 1;
      setDemoStepIndex(prevIdx);
      setDemoProgress(0);
      executeStepActions(prevIdx);
    }
  };

  const handleCloseDemo = () => {
    setIsDemoActive(false);
    setIsDemoCompleted(false);
    setIsDemoPlaying(false);
    setDemoProgress(0);
  };

  // Handle Login Completion -> Next step: Medical Data Intake
  const handleLoginSuccess = (loggedUser: ResearchUser) => {
    setUser(loggedUser);
    if (loggedUser.nodeId !== undefined) {
      setFocusNodeId(loggedUser.nodeId);
    }
    // Flow: LOGIN -> MEDICAL DATA INTAKE
    setCurrentScreen('intake');
  };

  // Handle Medical Intake Completion -> Initialize Lab Dashboard
  const handleInitializeLab = (config: MedicalIntakeConfig) => {
    // Generate synthesized network according to configured epidemic parameters
    const net = NetworkGenerator.generateClusteredNetwork(
      config.populationSize,
      3,
      config.contactDensity,
      engine.rng
    );

    engine.initialize(
      net.nodes.map((n) => n.id),
      net.graph,
      undefined,
      {
        populationSize: config.populationSize,
        transmissionProbability: config.transmissionProbability,
        contactDensity: config.contactDensity,
        initialSeeds: config.initialInfected,
        infectiousPeriod: config.recoveryPeriod,
      }
    );

    // Sync index subject health state to Node #0
    const nodeZero = engine.nodeHealth.get(0);
    if (nodeZero) {
      nodeZero.state = config.healthStatus;
    }
    const snap0 = engine.snapshots[0];
    if (snap0) {
      snap0.nodeStates.set(0, config.healthStatus);
    }

    setSimulationRunCount((c) => c + 1);
    setFocusNodeId(0);

    // Flow: MEDICAL DATA INTAKE -> EPIDEMIC LAB DASHBOARD
    setCurrentScreen('laboratory');
  };

  // Secure Logout
  const handleLogout = () => {
    AuthSession.clearSession();
    setUser(null);
    setShowProfileModal(false);
    setCurrentScreen('landing');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f7f8fe] font-sans text-[#444766]">
      {/* Top Persistent Navbar (Hidden on Login screen) */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        isRunning={engine.isRunning}
        onToggleRun={() => {
          if (engine.isRunning) engine.pause();
          else engine.run();
        }}
        onReset={() => {
          engine.reset();
          setSimulationRunCount((c) => c + 1);
        }}
        onStep={() => engine.step()}
        currentDay={engine.currentDay}
        user={user}
        onOpenLogin={() => setCurrentScreen('login')}
        onOpenProfile={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        onStartDemo={startGuidedDemo}
        isDemoActive={isDemoActive}
      />

      {/* Guided Tour Autonomous Walkthrough Modal */}
      {isDemoActive && DEMO_STEPS[demoStepIndex] && (
        <GuidedTourModal
          currentStep={DEMO_STEPS[demoStepIndex]}
          currentStepIndex={demoStepIndex}
          totalSteps={DEMO_STEPS.length}
          isPlaying={isDemoPlaying}
          progressPercent={demoProgress}
          onTogglePlay={() => setIsDemoPlaying((p) => !p)}
          onNext={handleNextDemoStep}
          onPrev={handlePrevDemoStep}
          onRestart={startGuidedDemo}
          onClose={handleCloseDemo}
          isCompleted={isDemoCompleted}
        />
      )}

      {/* Main Screens Router */}
      <div className="flex-1 w-full flex flex-col overflow-hidden">
        {/* SCREEN 0: LANDING PAGE (Hero, Interactive Canvas & Feature Cards) */}
        {currentScreen === 'landing' && (
          <LandingPage
            onEnterLab={() => setCurrentScreen('login')}
            onExploreDemo={startGuidedDemo}
          />
        )}

        {/* SCREEN 1: LOGIN (Accessible from Landing Page or Navbar) */}
        {currentScreen === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onStartDemo={startGuidedDemo}
            onBackToLanding={() => setCurrentScreen('landing')}
          />
        )}

        {/* SCREEN 2: MEDICAL DATA INTAKE (Workstation immediately following Login) */}
        {currentScreen === 'intake' && (
          <MedicalIntakePage
            engine={engine}
            onInitializeLab={handleInitializeLab}
          />
        )}

        {/* SCREEN 3: EPIDEMIC LAB DASHBOARD */}
        {currentScreen === 'laboratory' && (
          <LaboratoryPage
            engine={engine}
            isSurgeryMode={false}
            onToggleSurgeryMode={() => setCurrentScreen('surgery')}
            onNavigateToCounterfactual={() => setCurrentScreen('counterfactual')}
            onNavigateToReplay={() => setCurrentScreen('replay')}
            patientRegistry={patientRegistry}
            onNavigateToSurveillance={() => setCurrentScreen('surveillance')}
            user={user}
            onNavigateToMedical={() => setCurrentScreen('medical')}
            initialFocusNodeId={focusNodeId}
          />
        )}

        {/* SCREEN 4: CONTACT TRACE MODE */}
        {currentScreen === 'contact_trace' && (
          <LaboratoryPage
            engine={engine}
            isSurgeryMode={false}
            onToggleSurgeryMode={() => setCurrentScreen('surgery')}
            onNavigateToCounterfactual={() => setCurrentScreen('counterfactual')}
            onNavigateToReplay={() => setCurrentScreen('replay')}
            patientRegistry={patientRegistry}
            onNavigateToSurveillance={() => setCurrentScreen('surveillance')}
            user={user}
            onNavigateToMedical={() => setCurrentScreen('medical')}
            initialFocusNodeId={focusNodeId}
          />
        )}

        {/* SCREEN 5: NETWORK SURGERY MODE */}
        {currentScreen === 'surgery' && (
          <LaboratoryPage
            engine={engine}
            isSurgeryMode={true}
            onToggleSurgeryMode={() => setCurrentScreen('laboratory')}
            onNavigateToCounterfactual={() => setCurrentScreen('counterfactual')}
            onNavigateToReplay={() => setCurrentScreen('replay')}
            patientRegistry={patientRegistry}
            onNavigateToSurveillance={() => setCurrentScreen('surveillance')}
            user={user}
            onNavigateToMedical={() => setCurrentScreen('medical')}
            initialFocusNodeId={focusNodeId}
          />
        )}

        {/* SCREEN 6: WHAT-IF LAB / COUNTERFACTUAL SCENARIOS */}
        {(currentScreen === 'whatif' || currentScreen === 'counterfactual') && (
          <CounterfactualPage baselineEngine={engine} />
        )}

        {/* SCREEN 7: TRANSMISSION REPLAY TREE */}
        {currentScreen === 'replay' && <ReplayPage engine={engine} />}

        {/* SCREEN 8: ANALYTICS & MONTE CARLO */}
        {currentScreen === 'analytics' && <AnalyticsPage engine={engine} />}

        {/* SCREEN 9: DSA LAB */}
        {currentScreen === 'dsalab' && <DSALabPage engine={engine} />}

        {/* SCREEN 10: SURVEILLANCE & CLINICAL RECORDS */}
        {currentScreen === 'surveillance' && (
          <SurveillancePage
            registry={patientRegistry}
            onLocateNodeInGraph={() => {
              setCurrentScreen('laboratory');
            }}
            onPatientUpdated={(patient) => {
              const record = engine.nodeHealth.get(patient.id);
              if (record) {
                record.state = patient.diagnosis.state;
              }
              const snap = engine.snapshots[engine.currentDay];
              if (snap) {
                snap.nodeStates.set(patient.id, patient.diagnosis.state);
              }
              setTick((prev) => prev + 1);
            }}
          />
        )}

        {/* SCREEN 11: HEALTH VAULT */}
        {currentScreen === 'medical' && (
          <MedicalPortalPage
            engine={engine}
            onNavigateToLab={(nodeId) => {
              if (nodeId !== undefined) setFocusNodeId(nodeId);
              setCurrentScreen('laboratory');
            }}
            onPatientStateUpdated={(nodeId, newState) => {
              const record = engine.nodeHealth.get(nodeId);
              if (record) {
                record.state = newState;
              }
              const snap = engine.snapshots[engine.currentDay];
              if (snap) {
                snap.nodeStates.set(nodeId, newState);
              }
              setTick((prev) => prev + 1);
            }}
          />
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
          simulationCount={simulationRunCount}
        />
      )}
    </div>
  );
}

export default App;
