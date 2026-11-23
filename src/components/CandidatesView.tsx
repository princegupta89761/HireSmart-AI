import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bookmark,
  Check,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Flag,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useATS } from '../context/ATSContext';
import {
  calculateCandidateMatch,
  detectDuplicates,
  detectResumeFraud,
  estimateSalaryLocally,
  generateLocalInsights,
  getScoreColorClasses,
  predictHiringSuccess,
  runLocalSmartSearch,
  suggestRejectionReason,
} from '../lib/matchingEngine';
import type {
  Candidate,
  CandidateInsightsResult,
  PredictiveSuccessReport,
  ResumeFraudReport,
  SalaryEstimate,
} from '../types';

interface CandidatesViewProps {
  selectedCandidateId: string | null;
  onSelectCandidateId: (id: string | null) => void;
  externalSearchQuery?: string;
}

type SortKey = 'score' | 'experience' | 'date' | 'education';
type FilterTab = 'all' | 'favorites' | 'priority' | 'watchlist' | 'rejected';
type DrawerTab = 'overview' | 'insights' | 'timeline' | 'salary';

const SMART_SEARCH_EXAMPLES = [
  'React developers with AWS',
  '3+ years experience',
  'Mumbai with NodeJS',
];

export function CandidatesView({
  selectedCandidateId,
  onSelectCandidateId,
  externalSearchQuery,
}: CandidatesViewProps) {
  const {
    candidates,
    jobs,
    applications,
    interviews,
    feedback,
    settings,
    deleteCandidate,
    toggleCandidateFlag,
  } = useATS();

  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState(externalSearchQuery || '');
  const [aiSearchIds, setAiSearchIds] = useState<string[] | null>(null);
  const [aiSearchSummary, setAiSearchSummary] = useState<string | null>(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // Profile Drawer state
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('overview');
  const [selectedJobForMatch, setSelectedJobForMatch] = useState<string>(jobs[0]?.id || '');

  // Live Gemini enrichment states per candidate
  const [aiInsights, setAiInsights] = useState<Record<string, CandidateInsightsResult>>({});
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [aiFraud, setAiFraud] = useState<Record<string, ResumeFraudReport>>({});
  const [fraudLoading, setFraudLoading] = useState(false);
  const [aiForecast, setAiForecast] = useState<Record<string, PredictiveSuccessReport>>({});
  const [forecastLoading, setForecastLoading] = useState(false);
  const [aiSalary, setAiSalary] = useState<Record<string, SalaryEstimate>>({});
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryInput, setSalaryInput] = useState({
    skills: '',
    experienceYears: 0,
    location: '',
    education: '',
  });
  const [aiRejectionPreview, setAiRejectionPreview] = useState<{ category: string; reason: string } | null>(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  // Email Automation modal state
  const [emailModalCand, setEmailModalCand] = useState<Candidate | null>(null);
  const [emailTemplate, setEmailTemplate] = useState('Shortlisted');
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSentToast, setEmailSentToast] = useState(false);

  useEffect(() => {
    if (externalSearchQuery !== undefined && externalSearchQuery !== '') {
      setSearchTerm(externalSearchQuery);
      setAiSearchIds(null);
      setAiSearchSummary(null);
    }
  }, [externalSearchQuery]);

  const inspectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) || null,
    [candidates, selectedCandidateId]
  );

  useEffect(() => {
    if (inspectedCandidate) {
      setSalaryInput({
        skills: inspectedCandidate.skills.join(', '),
        experienceYears: inspectedCandidate.experienceYears,
        location: inspectedCandidate.location || 'Bengaluru, India',
        education: `${inspectedCandidate.degree} (${inspectedCandidate.collegeName})`,
      });
      setAiRejectionPreview(null);
    }
  }, [inspectedCandidate]);

  const duplicates = useMemo(() => detectDuplicates(candidates, applications), [candidates, applications]);

  const favoriteQuickList = useMemo(
    () => candidates.filter((c) => c.isFavorite || c.isPriority || c.isWatchlist).slice(0, 6),
    [candidates]
  );

  const rejectedCandidateIds = useMemo(
    () => new Set(applications.filter((a) => a.stage === 'Rejected').map((a) => a.candidateId)),
    [applications]
  );

  const sortedCandidates = useMemo(() => {
    let base = candidates;

    if (filterTab === 'favorites') base = base.filter((c) => c.isFavorite);
    if (filterTab === 'priority') base = base.filter((c) => c.isPriority);
    if (filterTab === 'watchlist') base = base.filter((c) => c.isWatchlist);
    if (filterTab === 'rejected') base = base.filter((c) => rejectedCandidateIds.has(c.id));

    if (aiSearchIds) {
      const idSet = new Set(aiSearchIds);
      base = base.filter((c) => idSet.has(c.id));
    } else if (searchTerm.trim()) {
      base = runLocalSmartSearch(searchTerm, base);
    }

    return [...base].sort((a, b) => {
      if (sortBy === 'score') return b.matchScore - a.matchScore;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      if (sortBy === 'date') return b.createdAt.localeCompare(a.createdAt);
      return (a.degree || '').localeCompare(b.degree || '');
    });
  }, [candidates, filterTab, rejectedCandidateIds, aiSearchIds, searchTerm, sortBy]);

  const handleRunAiSmartSearch = async (queryOverride?: string) => {
    const q = (queryOverride ?? searchTerm).trim();
    if (!q) return;
    setSearchTerm(q);
    setAiSearchLoading(true);
    setAiSearchSummary(null);
    try {
      const res = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          candidates: candidates.map((c) => ({
            id: c.id,
            fullName: c.fullName,
            skills: c.skills,
            experienceYears: c.experienceYears,
            location: c.location,
            degree: c.degree,
            matchScore: c.matchScore,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.matchedIds)) {
        setAiSearchIds(data.matchedIds);
        setAiSearchSummary(data.interpretation || `Matched ${data.matchedIds.length} candidates`);
      }
    } finally {
      setAiSearchLoading(false);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const generateEmail = async (cand: Candidate, template: string) => {
    setEmailLoading(true);
    setEmailSentToast(false);
    const app = applications.find((a) => a.candidateId === cand.id);
    const job = jobs.find((j) => j.id === app?.jobId) || jobs[0];
    const iv = interviews.find((i) => i.candidateId === cand.id);
    try {
      const res = await fetch('/api/ai/email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: template,
          candidateName: cand.fullName,
          jobTitle: job?.title || 'Software Engineer',
          organizationName: settings.organizationName,
          interviewDate: iv?.date,
          interviewTime: iv?.time,
          meetingLink: iv?.meetingLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to draft email.');
      setEmailDraft(data);
    } catch {
      setEmailDraft({
        subject: `${template}: ${job?.title || 'Role'} at ${settings.organizationName}`,
        body: `Hi ${cand.fullName},\n\nThank you for your interest in the ${job?.title || 'Software Engineer'} role at ${settings.organizationName}.\n\nBest regards,\nRecruitment Team`,
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const openEmailAutomation = (cand: Candidate) => {
    setEmailModalCand(cand);
    setEmailTemplate('Shortlisted');
    setEmailDraft(null);
    generateEmail(cand, 'Shortlisted');
  };

  const handleRefreshInsights = async (cand: Candidate, job?: typeof jobs[number]) => {
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/ai/candidate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: cand, job }),
      });
      const data = await res.json();
      if (res.ok && data.readinessScore !== undefined) {
        setAiInsights((prev) => ({ ...prev, [cand.id]: data }));
      }
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleRunFraudAudit = async (cand: Candidate) => {
    setFraudLoading(true);
    try {
      const res = await fetch('/api/ai/resume-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: cand }),
      });
      const data = await res.json();
      if (res.ok && data.riskLevel) {
        setAiFraud((prev) => ({ ...prev, [cand.id]: data }));
      }
    } finally {
      setFraudLoading(false);
    }
  };

  const handleRunForecast = async (cand: Candidate, job?: typeof jobs[number]) => {
    setForecastLoading(true);
    try {
      const candFb = feedback.filter((f) => f.candidateId === cand.id);
      const res = await fetch('/api/ai/predictive-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: cand, job, feedback: candFb }),
      });
      const data = await res.json();
      if (res.ok && data.successProbability !== undefined) {
        setAiForecast((prev) => ({ ...prev, [cand.id]: data }));
      }
    } finally {
      setForecastLoading(false);
    }
  };

  const handleEstimateSalary = async (cand: Candidate) => {
    setSalaryLoading(true);
    try {
      const res = await fetch('/api/ai/salary-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: salaryInput.skills.split(',').map((s) => s.trim()).filter(Boolean),
          experienceYears: salaryInput.experienceYears,
          location: salaryInput.location,
          education: salaryInput.education,
        }),
      });
      const data = await res.json();
      if (res.ok && data.minSalary) {
        setAiSalary((prev) => ({ ...prev, [cand.id]: data }));
      }
    } finally {
      setSalaryLoading(false);
    }
  };

  const handlePreviewRejectionReason = async (cand: Candidate, job?: typeof jobs[number]) => {
    setRejectionLoading(true);
    try {
      const res = await fetch('/api/ai/rejection-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: cand, job }),
      });
      const data = await res.json();
      if (res.ok && data.reason) {
        setAiRejectionPreview(data);
      } else {
        setAiRejectionPreview(suggestRejectionReason(cand, job));
      }
    } catch {
      setAiRejectionPreview(suggestRejectionReason(cand, job));
    } finally {
      setRejectionLoading(false);
    }
  };

  const compareList = candidates.filter((c) => compareIds.includes(c.id));

  const inspectedJob = useMemo(() => {
    if (!inspectedCandidate) return jobs[0];
    if (selectedJobForMatch) {
      const found = jobs.find((j) => j.id === selectedJobForMatch);
      if (found) return found;
    }
    const app = applications.find((a) => a.candidateId === inspectedCandidate.id);
    return jobs.find((j) => j.id === app?.jobId) || jobs[0];
  }, [inspectedCandidate, jobs, selectedJobForMatch, applications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Candidates & Profiles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Natural-language smart search, 4-candidate comparison, fraud alerts, insights, and predictive analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white">{sortedCandidates.length}</strong> of{' '}
            {candidates.length}
          </span>
          {compareIds.length >= 2 && (
            <button
              onClick={() => setCompareOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C63FF] text-white text-xs sm:text-sm font-semibold hover:opacity-90 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              Compare ({compareIds.length}/4)
            </button>
          )}
        </div>
      </div>

      {/* Favorites Quick Access Panel */}
      {favoriteQuickList.length > 0 && (
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400" /> Favorites & Priority Quick Access
            </h2>
            <span className="text-xs text-slate-400">Click any candidate to inspect</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {favoriteQuickList.map((fc) => (
              <button
                key={fc.id}
                onClick={() => onSelectCandidateId(fc.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 text-xs cursor-pointer"
              >
                <span className="font-semibold text-slate-900 dark:text-white">{fc.fullName}</span>
                <span className="font-mono font-bold text-[#14F195] tabular-nums">{fc.matchScore}%</span>
                <span className="text-[10px] text-slate-400">
                  {fc.isPriority ? 'Priority' : fc.isWatchlist ? 'Watchlist' : 'Starred'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Candidate Detector Banner */}
      <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-5 h-5 shrink-0 ${duplicates.length > 0 ? 'text-amber-400' : 'text-[#14F195]'}`} />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Duplicate Candidate Detector:{' '}
              <span className="font-mono tabular-nums">{duplicates.length} flags</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {duplicates.length === 0
                ? 'Zero duplicate emails, phone numbers, resumes, or duplicate applications detected.'
                : duplicates.map((d) => `${d.reason}: ${d.candidateName} (${d.detail})`).join(' · ')}
            </p>
          </div>
        </div>
      </div>

      {/* Smart Search Engine + Quick Filter Tabs */}
      <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setAiSearchIds(null);
                setAiSearchSummary(null);
              }}
              placeholder='Natural Language Smart Search (e.g. "Find React developers with AWS" or "3+ years Mumbai")...'
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRunAiSmartSearch()}
            disabled={!searchTerm.trim() || aiSearchLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00D4FF] text-slate-950 text-xs font-semibold hover:bg-[#33ddff] disabled:opacity-50 cursor-pointer"
          >
            {aiSearchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Smart Search
          </button>
          {(searchTerm || aiSearchIds) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setAiSearchIds(null);
                setAiSearchSummary(null);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 mr-1">Try:</span>
            {SMART_SEARCH_EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setSearchTerm(ex);
                  setAiSearchIds(null);
                  setAiSearchSummary(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#00D4FF] cursor-pointer"
              >
                {ex}
              </button>
            ))}
          </div>
          {aiSearchSummary && <span className="text-[#14F195] font-medium">{aiSearchSummary}</span>}
        </div>
      </div>

      {/* Filter Tabs & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'all' as FilterTab, label: `All (${candidates.length})` },
            { id: 'favorites' as FilterTab, label: `Starred (${candidates.filter((c) => c.isFavorite).length})` },
            { id: 'priority' as FilterTab, label: `Priority (${candidates.filter((c) => c.isPriority).length})` },
            { id: 'watchlist' as FilterTab, label: `Watchlist (${candidates.filter((c) => c.isWatchlist).length})` },
            { id: 'rejected' as FilterTab, label: `Rejected (${rejectedCandidateIds.size})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800">
          {[
            { key: 'score' as SortKey, label: 'Highest Score' },
            { key: 'experience' as SortKey, label: 'Experience' },
            { key: 'date' as SortKey, label: 'Application Date' },
            { key: 'education' as SortKey, label: 'Education' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                sortBy === opt.key
                  ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Ranked Table */}
      <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 w-10">Cmp</th>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Skills</th>
                <th className="py-3.5 px-4 text-right">Experience</th>
                <th className="py-3.5 px-4 text-right">Match Score</th>
                <th className="py-3.5 px-4 text-right">Flags & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
              {sortedCandidates.map((cand, index) => {
                const scoreStyle = getScoreColorClasses(cand.matchScore);
                const isSelectedCompare = compareIds.includes(cand.id);
                const fraudCheck = detectResumeFraud(cand);
                return (
                  <tr
                    key={cand.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelectedCompare}
                        onChange={() => toggleCompare(cand.id)}
                        aria-label={`Select ${cand.fullName} for comparison`}
                        className="rounded border-slate-600 accent-[#00D4FF] cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-400">
                      #{String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectCandidateId(cand.id)}
                        className="flex items-center gap-3 text-left group cursor-pointer"
                      >
                        {cand.avatarUrl ? (
                          <img
                            src={cand.avatarUrl}
                            alt={cand.fullName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#00D4FF]/15 text-[#00D4FF] flex items-center justify-center text-xs font-bold shrink-0">
                            {cand.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-[#00D4FF] transition-colors">
                              {cand.fullName}
                            </p>
                            {fraudCheck.alerts.length > 0 && (
                              <span title="Resume fraud check alert" className="inline-flex shrink-0">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {cand.location || 'Remote'} · {cand.degree || cand.collegeName}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {cand.skills.slice(0, 5).join(' · ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-700 dark:text-slate-200">
                      {cand.experienceYears} yrs
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono tabular-nums font-bold ${scoreStyle.text}`}>{cand.matchScore}%</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => toggleCandidateFlag(cand.id, 'isFavorite')}
                          title="Star Candidate"
                          aria-label={`Star ${cand.fullName}`}
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            cand.isFavorite ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${cand.isFavorite ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => toggleCandidateFlag(cand.id, 'isPriority')}
                          title="Priority Candidate"
                          aria-label={`Mark ${cand.fullName} priority`}
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            cand.isPriority ? 'text-[#00D4FF]' : 'text-slate-400 hover:text-[#00D4FF]'
                          }`}
                        >
                          <Flag className={`w-4 h-4 ${cand.isPriority ? 'fill-[#00D4FF]/30' : ''}`} />
                        </button>
                        <button
                          onClick={() => toggleCandidateFlag(cand.id, 'isWatchlist')}
                          title="Watchlist"
                          aria-label={`Add ${cand.fullName} to watchlist`}
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            cand.isWatchlist ? 'text-[#6C63FF]' : 'text-slate-400 hover:text-[#6C63FF]'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectCandidateId(cand.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium hover:text-[#00D4FF] cursor-pointer ml-1"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => openEmailAutomation(cand)}
                          aria-label={`Email ${cand.fullName}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#00D4FF] cursor-pointer"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCandidate(cand.id)}
                          aria-label={`Delete ${cand.fullName}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Profile Drawer (Enterprise AI Suite) */}
      {inspectedCandidate && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end"
          onClick={() => onSelectCandidateId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto p-6 space-y-5"
          >
            {/* Header + Favorites Flags */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                {inspectedCandidate.avatarUrl ? (
                  <img
                    src={inspectedCandidate.avatarUrl}
                    alt={inspectedCandidate.fullName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#00D4FF]/15 text-[#00D4FF] flex items-center justify-center text-lg font-bold">
                    {inspectedCandidate.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{inspectedCandidate.fullName}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {inspectedCandidate.experienceYears} Years Experience · {inspectedCandidate.location} · Source:{' '}
                    {inspectedCandidate.source}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                      onClick={() => toggleCandidateFlag(inspectedCandidate.id, 'isFavorite')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        inspectedCandidate.isFavorite
                          ? 'bg-amber-400/15 border-amber-400/40 text-amber-400'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${inspectedCandidate.isFavorite ? 'fill-amber-400' : ''}`} /> Star
                    </button>
                    <button
                      onClick={() => toggleCandidateFlag(inspectedCandidate.id, 'isPriority')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        inspectedCandidate.isPriority
                          ? 'bg-[#00D4FF]/15 border-[#00D4FF]/40 text-[#00D4FF]'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" /> Priority
                    </button>
                    <button
                      onClick={() => toggleCandidateFlag(inspectedCandidate.id, 'isWatchlist')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        inspectedCandidate.isWatchlist
                          ? 'bg-[#6C63FF]/15 border-[#6C63FF]/40 text-[#6C63FF]'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Watchlist
                    </button>
                    <button
                      onClick={() => toggleCandidateFlag(inspectedCandidate.id, 'inTalentPool')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        inspectedCandidate.inTalentPool !== false
                          ? 'bg-[#14F195]/15 border-[#14F195]/40 text-[#14F195]'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" /> Talent Pool
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectCandidateId(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800">
              {[
                { id: 'overview' as DrawerTab, label: 'Profile Overview' },
                { id: 'insights' as DrawerTab, label: 'AI Insights & Match' },
                { id: 'timeline' as DrawerTab, label: 'Timeline & Fraud Audit' },
                { id: 'salary' as DrawerTab, label: 'Salary & Resume Tips' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDrawerTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    drawerTab === t.id
                      ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* DRAWER TAB 1: Overview */}
            {drawerTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Match Score</p>
                    <p
                      className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                        getScoreColorClasses(inspectedCandidate.matchScore).text
                      }`}
                    >
                      {inspectedCandidate.matchScore}%
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Resume Score</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[#00D4FF] mt-1">
                      {inspectedCandidate.resumeScore}/100
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <p className="text-xs text-slate-400">Outreach</p>
                    <button
                      onClick={() => openEmailAutomation(inspectedCandidate)}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D4FF] hover:underline cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" /> Draft AI Email
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#00D4FF]" /> {inspectedCandidate.email || 'Not provided'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#00D4FF]" /> {inspectedCandidate.phone || 'Not provided'}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#00D4FF]" /> {inspectedCandidate.location || 'Remote'}
                  </p>
                  <p className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-[#00D4FF]" /> {inspectedCandidate.degree} ({inspectedCandidate.collegeName})
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Skill Breakdown</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {inspectedCandidate.skills.join(' · ')}
                  </p>
                </div>

                {inspectedCandidate.experience.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Work History</h3>
                    <div className="space-y-3 border-l border-slate-700 pl-4 ml-1">
                      {inspectedCandidate.experience.map((exp, i) => (
                        <div key={i}>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {exp.role} · {exp.company}
                          </p>
                          <p className="text-xs font-mono text-slate-400">{exp.duration}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{exp.highlights}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Projects</h3>
                    <div className="space-y-2.5">
                      {inspectedCandidate.projects.map((p, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{p.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Certifications & Achievements</h3>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {inspectedCandidate.certifications.map((cert, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Award className="w-3.5 h-3.5 text-[#14F195] shrink-0 mt-0.5" />
                          <span>{cert}</span>
                        </li>
                      ))}
                      {inspectedCandidate.achievements.map((ach, i) => (
                        <li key={`a-${i}`} className="flex items-start gap-2">
                          <ExternalLink className="w-3.5 h-3.5 text-[#00D4FF] shrink-0 mt-0.5" />
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER TAB 2: AI Insights, Smart Match Explanation & Predictive Success */}
            {drawerTab === 'insights' &&
              (() => {
                const insights =
                  aiInsights[inspectedCandidate.id] || generateLocalInsights(inspectedCandidate, inspectedJob);
                const match = inspectedJob ? calculateCandidateMatch(inspectedCandidate, inspectedJob) : null;
                const forecast =
                  aiForecast[inspectedCandidate.id] ||
                  predictHiringSuccess(inspectedCandidate, inspectedJob, feedback);

                return (
                  <div className="space-y-5">
                    {/* AI Candidate Insights */}
                    <div className="bg-slate-50 dark:bg-[#1E293B] border border-[#00D4FF]/30 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[#00D4FF] flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" /> AI Candidate Insights
                          </p>
                          <p className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                            Readiness Score: <span className="text-[#14F195]">{insights.readinessScore}/100</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleRefreshInsights(inspectedCandidate, inspectedJob)}
                          disabled={insightsLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-xs font-semibold text-[#00D4FF] cursor-pointer"
                        >
                          {insightsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Refresh with Gemini
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                          <p className="font-semibold text-[#14F195] mb-1">Strengths</p>
                          <p className="text-slate-600 dark:text-slate-300">{insights.strengths.join(' · ')}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                          <p className="font-semibold text-amber-400 mb-1">Weaknesses / Gaps</p>
                          <p className="text-slate-600 dark:text-slate-300">
                            {insights.weaknesses.length ? insights.weaknesses.join(' · ') : 'None flagged'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <p>
                          <strong className="text-slate-900 dark:text-white">Technical Skill Summary:</strong>{' '}
                          {insights.technicalSkillSummary}
                        </p>
                        <p>
                          <strong className="text-slate-900 dark:text-white">Experience Summary:</strong>{' '}
                          {insights.experienceSummary}
                        </p>
                        <p>
                          <strong className="text-[#00D4FF]">Hiring Recommendation:</strong>{' '}
                          {insights.hiringRecommendation}
                        </p>
                      </div>
                    </div>

                    {/* Smart Job-to-Candidate Match Explanation */}
                    {match && (
                      <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              Smart Job-to-Candidate Match Explanation
                            </h3>
                            <p className="text-xs text-slate-400">Explainable score decomposition per requisition</p>
                          </div>
                          <select
                            value={inspectedJob?.id || ''}
                            onChange={(e) => setSelectedJobForMatch(e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            {jobs.map((j) => (
                              <option key={j.id} value={j.id}>
                                {j.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Overall Match Score</span>
                          <span className={`text-xl font-bold font-mono tabular-nums ${getScoreColorClasses(match.overallScore).text}`}>
                            {match.overallScore}%
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 text-xs">
                          {[
                            { label: 'Skill Match', val: match.skillsMatch },
                            { label: 'Experience Match', val: match.experienceMatch },
                            { label: 'Education Match', val: match.educationMatch },
                            { label: 'Project Match', val: match.projectsMatch },
                          ].map((dim) => (
                            <div key={dim.label} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-300">{dim.label}</span>
                                <span className="font-mono font-bold text-[#00D4FF]">{dim.val}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-[#00D4FF]" style={{ width: `${dim.val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-300">{match.recommendation}</p>
                      </div>
                    )}

                    {/* Predictive Hiring Success */}
                    <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#14F195]" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Predictive Hiring Success</h3>
                        </div>
                        <button
                          onClick={() => handleRunForecast(inspectedCandidate, inspectedJob)}
                          disabled={forecastLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C63FF]/15 border border-[#6C63FF]/40 text-xs font-semibold text-[#6C63FF] cursor-pointer"
                        >
                          {forecastLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Run AI Forecast
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                          <p className="text-xs text-slate-400">Success Prediction</p>
                          <p className="text-2xl font-bold font-mono tabular-nums text-[#14F195] mt-1">
                            {forecast.successProbability}%
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                          <p className="text-xs text-slate-400">Risk Prediction</p>
                          <p
                            className={`text-2xl font-bold mt-1 ${
                              forecast.riskLevel === 'Low'
                                ? 'text-[#14F195]'
                                : forecast.riskLevel === 'Medium'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {forecast.riskLevel} Risk
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong className="text-white">Recommendation:</strong> {forecast.recommendation}
                      </p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        {forecast.keyDrivers.map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}

            {/* DRAWER TAB 3: Candidate Activity Timeline, Resume Fraud Detection & AI Rejection Reason */}
            {drawerTab === 'timeline' &&
              (() => {
                const fraud = aiFraud[inspectedCandidate.id] || detectResumeFraud(inspectedCandidate);
                const candApps = applications.filter((a) => a.candidateId === inspectedCandidate.id);
                const rejectedApp = candApps.find((a) => a.stage === 'Rejected');

                return (
                  <div className="space-y-5">
                    {/* Resume Fraud Detection */}
                    <div
                      className={`border rounded-2xl p-5 space-y-3 ${
                        fraud.alerts.length > 0
                          ? 'bg-amber-500/5 border-amber-500/40'
                          : 'bg-slate-50 dark:bg-[#1E293B] border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ShieldAlert
                            className={`w-5 h-5 ${fraud.alerts.length > 0 ? 'text-amber-400' : 'text-[#14F195]'}`}
                          />
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              Resume Fraud Detection · {fraud.riskLevel} Risk
                            </h3>
                            <p className="text-xs text-slate-400">
                              Authenticity Confidence: <span className="font-mono font-bold">{fraud.confidenceScore}%</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRunFraudAudit(inspectedCandidate)}
                          disabled={fraudLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-[#00D4FF] cursor-pointer"
                        >
                          {fraudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Deep AI Audit
                        </button>
                      </div>

                      {fraud.alerts.length === 0 ? (
                        <p className="text-xs text-[#14F195]">
                          No anomalies found across skills-to-tenure ratio, employers, or overlapping dates.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {fraud.alerts.map((al, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-amber-500/30 text-xs"
                            >
                              <p className="font-semibold text-amber-400">
                                {al.type} ({al.severity} Severity)
                              </p>
                              <p className="text-slate-600 dark:text-slate-300 mt-0.5">{al.detail}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Candidate Activity Timeline */}
                    <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Candidate Activity Timeline
                      </h3>
                      <div className="space-y-3 border-l border-slate-700 pl-4 ml-1">
                        {(inspectedCandidate.activityTimeline && inspectedCandidate.activityTimeline.length > 0
                          ? inspectedCandidate.activityTimeline
                          : [
                              {
                                stage: 'Resume Uploaded',
                                date: inspectedCandidate.createdAt.slice(0, 10),
                                note: `Ingested via ${inspectedCandidate.source}`,
                              },
                              ...candApps.map((a) => ({
                                stage: a.stage,
                                date: a.appliedAt,
                                note: a.aiExplanation,
                              })),
                            ]
                        ).map((ev, i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#00D4FF]">{ev.stage}</span>
                              <span className="font-mono text-slate-400">{ev.date}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{ev.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rejection Reason History & AI Suggestion */}
                    <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Rejection Reason & History</h3>
                        <button
                          onClick={() => handlePreviewRejectionReason(inspectedCandidate, inspectedJob)}
                          disabled={rejectionLoading}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#00D4FF] hover:underline cursor-pointer"
                        >
                          {rejectionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Generate AI Reason
                        </button>
                      </div>

                      {rejectedApp?.rejectionReason && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                          <strong>Recorded Rejection:</strong> {rejectedApp.rejectionReason}
                        </div>
                      )}

                      {aiRejectionPreview && (
                        <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                          <p className="font-semibold text-rose-400">{aiRejectionPreview.category}</p>
                          <p className="text-slate-600 dark:text-slate-300">{aiRejectionPreview.reason}</p>
                        </div>
                      )}

                      {!rejectedApp?.rejectionReason && !aiRejectionPreview && (
                        <p className="text-xs text-slate-400">
                          No rejection history recorded. Click Generate AI Reason to preview objective feedback criteria.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* DRAWER TAB 4: AI Salary Estimator & Resume Optimization */}
            {drawerTab === 'salary' &&
              (() => {
                const salary = aiSalary[inspectedCandidate.id] || estimateSalaryLocally(inspectedCandidate);
                return (
                  <div className="space-y-5">
                    {/* AI Salary Estimator */}
                    <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#14F195]" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Salary Estimator</h3>
                        </div>
                        <button
                          onClick={() => handleEstimateSalary(inspectedCandidate)}
                          disabled={salaryLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00D4FF] text-slate-950 text-xs font-semibold cursor-pointer"
                        >
                          {salaryLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Estimate via Gemini
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1">Skills</label>
                          <input
                            value={salaryInput.skills}
                            onChange={(e) => setSalaryInput({ ...salaryInput, skills: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Experience (Years)</label>
                          <input
                            type="number"
                            value={salaryInput.experienceYears}
                            onChange={(e) =>
                              setSalaryInput({ ...salaryInput, experienceYears: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Location</label>
                          <input
                            value={salaryInput.location}
                            onChange={(e) => setSalaryInput({ ...salaryInput, location: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Education</label>
                          <input
                            value={salaryInput.education}
                            onChange={(e) => setSalaryInput({ ...salaryInput, education: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-[#14F195]/30 space-y-1">
                        <p className="text-xs text-slate-400">Recommended Compensation Range ({salary.currency})</p>
                        <p className="text-xl font-bold font-mono tabular-nums text-[#14F195]">
                          {salary.minSalary} – {salary.maxSalary}
                        </p>
                        <p className="text-xs text-slate-400">
                          Market Median: <span className="font-mono text-white">{salary.marketMedian}</span> · {salary.rationale}
                        </p>
                      </div>
                    </div>

                    {/* AI Resume Improvement Suggestions */}
                    <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        AI Resume Improvement Suggestions
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {(inspectedCandidate.optimizationSuggestions.length > 0
                          ? inspectedCandidate.optimizationSuggestions
                          : [
                              'Add measurable impact metrics (latency reduction, revenue/conversion lift) to recent roles.',
                              'Highlight cloud or system architecture certifications in the top summary.',
                              'Align project descriptions with high-signal ATS keywords.',
                            ]
                        ).map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Resume Viewer */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#00D4FF]" /> Raw Resume Text
                      </h3>
                      <pre className="text-xs font-mono whitespace-pre-wrap bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-700 dark:text-slate-300 max-h-52 overflow-y-auto">
                        {inspectedCandidate.resumeText}
                      </pre>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      )}

      {/* 4-Candidate Comparison Center Modal */}
      {compareOpen && compareList.length >= 2 && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setCompareOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-5 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Candidate Comparison Center ({compareList.length}/4)
                </h2>
                <p className="text-xs text-slate-400">
                  Side-by-side matrix across Skills, Experience, Education, Certifications, Projects, Match & Interview Scores
                </p>
              </div>
              <button onClick={() => setCompareOpen(false)} className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`grid gap-4 ${
                compareList.length >= 4
                  ? 'md:grid-cols-2 xl:grid-cols-4'
                  : compareList.length === 3
                  ? 'md:grid-cols-3'
                  : 'md:grid-cols-2'
              }`}
            >
              {compareList.map((c) => {
                const candFbs = feedback.filter((f) => f.candidateId === c.id);
                const interviewAvg = candFbs.length
                  ? Math.round(candFbs.reduce((acc, f) => acc + f.overallScore, 0) / candFbs.length)
                  : null;
                return (
                  <div
                    key={c.id}
                    className="bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2">{c.fullName}</h3>
                      <span className={`font-mono font-bold shrink-0 ${getScoreColorClasses(c.matchScore).text}`}>
                        {c.matchScore}%
                      </span>
                    </div>
                    <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                      <p>
                        <span className="text-slate-400">Interview Score:</span>{' '}
                        <span className="font-mono font-bold text-[#00D4FF]">
                          {interviewAvg !== null ? `${interviewAvg}/100` : 'Pending'}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Experience:</span> {c.experienceYears} years
                      </p>
                      <p>
                        <span className="text-slate-400">Education:</span> {c.degree} ({c.collegeName})
                      </p>
                      <p>
                        <span className="text-slate-400">Skills:</span> {c.skills.join(', ')}
                      </p>
                      <p>
                        <span className="text-slate-400">Projects ({c.projects.length}):</span>{' '}
                        {c.projects.map((p) => p.title).join(', ') || 'None'}
                      </p>
                      <p>
                        <span className="text-slate-400">Certifications:</span> {c.certifications.join(', ') || 'None'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Email Automation Modal */}
      {emailModalCand && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEmailModalCand(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Email Automation · {emailModalCand.fullName}
              </h2>
              <button onClick={() => setEmailModalCand(null)} className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                'Application Received',
                'Shortlisted',
                'Interview Invitation',
                'Offer Letter',
                'Rejection Email',
              ].map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => {
                    setEmailTemplate(tpl);
                    generateEmail(emailModalCand, tpl);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    emailTemplate === tpl
                      ? 'bg-[#00D4FF] text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tpl}
                </button>
              ))}
            </div>

            {emailLoading ? (
              <div className="py-10 flex items-center justify-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#00D4FF]" /> Generating personalized email...
              </div>
            ) : (
              emailDraft && (
                <div className="space-y-3">
                  <input
                    value={emailDraft.subject}
                    onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                  />
                  <textarea
                    rows={7}
                    value={emailDraft.body}
                    onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                  />
                  <div className="flex items-center justify-between">
                    {emailSentToast ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14F195]">
                        <Check className="w-4 h-4" /> Dispatched to {emailModalCand.email}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">To: {emailModalCand.email}</span>
                    )}
                    <button
                      onClick={() => setEmailSentToast(true)}
                      className="px-4 py-2 rounded-xl bg-[#00D4FF] text-slate-950 text-xs font-semibold cursor-pointer"
                    >
                      Send Email
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
