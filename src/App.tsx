import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ATSProvider, useATS } from './context/ATSContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { AppShell } from './components/AppShell';
import { DashboardView } from './components/DashboardView';
import { JobsView } from './components/JobsView';
import { CandidatesView } from './components/CandidatesView';
import { ApplicationsPipelineView } from './components/ApplicationsPipelineView';
import { ResumeParserView } from './components/ResumeParserView';
import { AIRecommendationsView } from './components/AIRecommendationsView';
import { InterviewCenterView } from './components/InterviewCenterView';
import { AnalyticsView } from './components/AnalyticsView';
import { AssistantView } from './components/AssistantView';
import { ReportsView, SettingsView } from './components/ReportsAndSettingsView';
import { LeaderboardView, TalentPoolView } from './components/TalentPoolAndLeaderboardView';
import { GlobalCopilot } from './components/GlobalCopilot';
import type { NavModule } from './types';

function HireSmartWorkspace() {
  const { user, authReady, isDataLoading } = useATS();
  const [activeModule, setActiveModule] = useState<NavModule>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const handleInspectCandidate = (candId: string) => {
    setSelectedCandidateId(candId);
    setActiveModule('candidates');
  };

  const handleApplySmartSearch = (q: string) => {
    setCandidateSearchQuery(q);
    setActiveModule('candidates');
  };

  if (!authReady || isDataLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#00D4FF]" />
        <span className="text-sm font-medium text-slate-300">Loading HireSmart AI workspace...</span>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <AppShell
      activeModule={activeModule}
      onSelectModule={(m) => {
        setActiveModule(m);
        if (m !== 'candidates') setSelectedCandidateId(null);
      }}
      globalSearch={globalSearch}
      onGlobalSearchChange={setGlobalSearch}
      onInspectCandidate={handleInspectCandidate}
      onOpenSmartSearch={handleApplySmartSearch}
    >
      {activeModule === 'dashboard' && (
        <DashboardView onNavigate={setActiveModule} onInspectCandidate={handleInspectCandidate} />
      )}
      {activeModule === 'jobs' && <JobsView />}
      {activeModule === 'candidates' && (
        <CandidatesView
          selectedCandidateId={selectedCandidateId}
          onSelectCandidateId={setSelectedCandidateId}
          externalSearchQuery={candidateSearchQuery}
        />
      )}
      {activeModule === 'applications' && (
        <ApplicationsPipelineView onInspectCandidate={handleInspectCandidate} />
      )}
      {activeModule === 'resume-parser' && (
        <ResumeParserView onInspectCandidate={handleInspectCandidate} />
      )}
      {activeModule === 'ai-recommendations' && (
        <AIRecommendationsView onInspectCandidate={handleInspectCandidate} />
      )}
      {activeModule === 'interview-center' && <InterviewCenterView />}
      {activeModule === 'talent-pool' && (
        <TalentPoolView onInspectCandidate={handleInspectCandidate} />
      )}
      {activeModule === 'leaderboard' && (
        <LeaderboardView onInspectCandidate={handleInspectCandidate} />
      )}
      {activeModule === 'analytics' && <AnalyticsView />}
      {activeModule === 'assistant' && (
        <AssistantView onInspectCandidate={handleInspectCandidate} />
      )}
      {activeModule === 'reports' && <ReportsView />}
      {activeModule === 'settings' && <SettingsView />}

      <GlobalCopilot
        onNavigate={setActiveModule}
        onInspectCandidate={handleInspectCandidate}
        onApplySearch={handleApplySmartSearch}
      />
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ATSProvider>
        <HireSmartWorkspace />
      </ATSProvider>
    </ErrorBoundary>
  );
}
