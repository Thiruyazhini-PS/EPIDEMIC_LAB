import { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import type { NavScreen } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { LaboratoryPage } from './pages/LaboratoryPage';
import { CounterfactualPage } from './pages/CounterfactualPage';
import { ReplayPage } from './pages/ReplayPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DSALabPage } from './pages/DSALabPage';
import { SurveillancePage } from './pages/SurveillancePage';
import { MedicalPortalPage } from './pages/MedicalPortalPage';
import { SimulationEngine } from './simulation/SimulationEngine';
import { PatientRegistry } from './dataStructures/PatientRegistry';
import { Sparkles, X } from 'lucide-react';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('landing');
  const [user, setUser] = useState<{
    id?: string;
    name: string;
    role?: string;
    email?: string;
    nodeId?: number;
    isGuest: boolean;
  } | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<number | null>(null);

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
    const handleUpdate = () => setTick(prev => prev + 1);
    engine.onUpdate = handleUpdate;
    return () => {
      engine.onUpdate = undefined;
    };
  }, [engine]);

  // Demo auto-play story state
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const startGuidedDemo = () => {
    setIsDemoActive(true);
    setCurrentScreen('laboratory');
    engine.reset();
    setDemoMessage('Phase 1: Generated realistic community network with inter-cluster bridges.');

    setTimeout(() => {
      setDemoMessage('Phase 2: Single seed infection introduced. Simulating disease transmission...');
      engine.run();
    }, 2500);

    setTimeout(() => {
      engine.pause();
      setDemoMessage('Phase 3: Outbreak detected. Transitioning to Phylogenetic Replay Tree.');
      setCurrentScreen('replay');
    }, 7000);

    setTimeout(() => {
      setDemoMessage('Phase 4: Forking parallel reality in Counterfactual Lab with bridge severed.');
      setCurrentScreen('counterfactual');
    }, 11500);

    setTimeout(() => {
      setDemoMessage('Phase 5: Causal evidence verified. Outbreak contained and transmission path blocked!');
    }, 16000);

    setTimeout(() => {
      setIsDemoActive(false);
      setDemoMessage(null);
    }, 22000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f7f8fe] font-sans text-[#444766]">
      {/* Top Persistent Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        isRunning={engine.isRunning}
        onToggleRun={() => {
          if (engine.isRunning) engine.pause();
          else engine.run();
        }}
        onReset={() => engine.reset()}
        onStep={() => engine.step()}
        currentDay={engine.currentDay}
        user={user}
        onOpenLogin={() => setCurrentScreen('login')}
        onStartDemo={startGuidedDemo}
        isDemoActive={isDemoActive}
      />

      {/* Guided Demo Story Banner Overlay */}
      {demoMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-2.5 px-4 py-2 rounded-2xl bg-white/95 border border-[#9192E8] shadow-xl backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#9192E8] animate-spin" />
            <span className="text-xs font-bold text-[#444766]">{demoMessage}</span>
            <button
              onClick={() => {
                setIsDemoActive(false);
                setDemoMessage(null);
              }}
              className="p-1 rounded-lg hover:bg-black/5 text-[#787B99]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Screens Router */}
      <div className="flex-1 w-full flex flex-col overflow-hidden">
        {currentScreen === 'landing' && (
          <LandingPage
            onEnterLab={() => setCurrentScreen('laboratory')}
            onExploreDemo={startGuidedDemo}
          />
        )}

        {currentScreen === 'login' && (
          <LoginPage
            onLoginSuccess={(loggedUser) => {
              setUser(loggedUser);
              if (loggedUser.nodeId !== undefined) {
                setFocusNodeId(loggedUser.nodeId);
              }
              setCurrentScreen('medical');
            }}
            onBackToLanding={() => setCurrentScreen('landing')}
          />
        )}

        {currentScreen === 'laboratory' && (
          <LaboratoryPage
            engine={engine}
            isSurgeryMode={false}
            onToggleSurgeryMode={() => setCurrentScreen('surgery')}
            onNavigateToCounterfactual={() => setCurrentScreen('counterfactual')}
            patientRegistry={patientRegistry}
            onNavigateToSurveillance={() => setCurrentScreen('surveillance')}
            user={user}
            onNavigateToMedical={() => setCurrentScreen('medical')}
            initialFocusNodeId={focusNodeId}
          />
        )}

        {currentScreen === 'surgery' && (
          <LaboratoryPage
            engine={engine}
            isSurgeryMode={true}
            onToggleSurgeryMode={() => setCurrentScreen('laboratory')}
            onNavigateToCounterfactual={() => setCurrentScreen('counterfactual')}
            patientRegistry={patientRegistry}
            onNavigateToSurveillance={() => setCurrentScreen('surveillance')}
            user={user}
            onNavigateToMedical={() => setCurrentScreen('medical')}
            initialFocusNodeId={focusNodeId}
          />
        )}

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
              setTick(prev => prev + 1);
            }}
          />
        )}

        {currentScreen === 'counterfactual' && (
          <CounterfactualPage baselineEngine={engine} />
        )}

        {currentScreen === 'replay' && (
          <ReplayPage engine={engine} />
        )}

        {currentScreen === 'analytics' && (
          <AnalyticsPage engine={engine} />
        )}

        {currentScreen === 'surveillance' && (
          <SurveillancePage
            registry={patientRegistry}
            onLocateNodeInGraph={() => {
              setCurrentScreen('laboratory');
            }}
            onPatientUpdated={(patient) => {
              // Sync to simulation graph node
              const record = engine.nodeHealth.get(patient.id);
              if (record) {
                record.state = patient.diagnosis.state;
              }
              const snap = engine.snapshots[engine.currentDay];
              if (snap) {
                snap.nodeStates.set(patient.id, patient.diagnosis.state);
              }
              setTick(prev => prev + 1);
            }}
          />
        )}

        {currentScreen === 'dsalab' && (
          <DSALabPage engine={engine} />
        )}
      </div>
    </div>
  );
}

export default App;
