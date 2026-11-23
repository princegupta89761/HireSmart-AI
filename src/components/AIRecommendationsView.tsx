import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';
import { useATS } from '../context/ATSContext';
import { calculateCandidateMatch, getScoreColorClasses } from '../lib/matchingEngine';
import type { MatchBreakdown } from '../types';

export function AIRecommendationsView({ onInspectCandidate }: { onInspectCandidate: (id: string) => void }) {
  const { jobs, candidates } = useATS();
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || '');
  const [deepMatchMap, setDeepMatchMap] = useState<Record<string, MatchBreakdown>>({});
  const [deepLoadingId, setDeepLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const ranked = useMemo(() => {
    if (!activeJob) return [];
    return candidates
      .map((cand) => {
        const key = `${activeJob.id}::${cand.id}`;
        const breakdown = deepMatchMap[key] || calculateCandidateMatch(cand, activeJob);
        return { cand, breakdown };
      })
      .sort((a, b) => b.breakdown.overallScore - a.breakdown.overallScore);
  }, [activeJob, candidates, deepMatchMap]);

  const focusedEntry = ranked.find((r) => r.cand.id === selectedCandidateId) || ranked[0] || null;

  const runDeepGeminiMatch = async (candId: string) => {
    const cand = candidates.find((c) => c.id === candId);
    if (!cand || !activeJob) return;
    setDeepLoadingId(candId);
    setError(null);
    try {
      const res = await fetch('/api/ai/match-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: cand, job: activeJob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gemini match request failed.');
      setDeepMatchMap((prev) => ({ ...prev, [`${activeJob.id}::${candId}`]: data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run deep AI evaluation.');
    } finally {
      setDeepLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            AI Matching Engine & Skill Gap Analysis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Weighted scoring: Skills (40%) · Experience (20%) · Projects (15%) · Education (15%) · Certifications (10%)
          </p>
        </div>

        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-sm"
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              Job: {j.title}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">{error}</div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Ranked Leaderboard */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Ranked Applicants</h2>
          <div className="space-y-2.5">
            {ranked.map(({ cand, breakdown }, idx) => {
              const scoreStyle = getScoreColorClasses(breakdown.overallScore);
              const isSelected = focusedEntry?.cand.id === cand.id;
              return (
                <div
                  key={cand.id}
                  onClick={() => setSelectedCandidateId(cand.id)}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0F172A]/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-slate-400 tabular-nums">#{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{cand.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {cand.experienceYears} yrs · {cand.skills.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-lg font-bold font-mono tabular-nums ${scoreStyle.text}`}>
                        {breakdown.overallScore}%
                      </span>
                      <p className="text-[11px] text-slate-400">{scoreStyle.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Breakdown & Skill Gap */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          {focusedEntry ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <button
                    onClick={() => onInspectCandidate(focusedEntry.cand.id)}
                    className="text-xl font-bold text-slate-900 dark:text-white hover:text-[#00D4FF] cursor-pointer"
                  >
                    {focusedEntry.cand.fullName}
                  </button>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluated for {activeJob?.title} · Readiness Score:{' '}
                    <span className="font-mono font-bold text-[#00D4FF]">{focusedEntry.breakdown.readinessScore}%</span>
                  </p>
                </div>

                <button
                  onClick={() => runDeepGeminiMatch(focusedEntry.cand.id)}
                  disabled={deepLoadingId === focusedEntry.cand.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C63FF] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer"
                >
                  {deepLoadingId === focusedEntry.cand.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Run Deep Gemini Match
                </button>
              </div>

              {/* AI Explanation */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-[#00D4FF]/30">
                <p className="text-xs font-semibold text-[#00D4FF] mb-1">AI Candidate Recommendation</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {focusedEntry.breakdown.recommendation}
                </p>
              </div>

              {/* Weighted Sub-Scores */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Weighted Match Breakdown</h3>
                {[
                  { label: 'Skills Match (40%)', val: focusedEntry.breakdown.skillsMatch },
                  { label: 'Experience Match (20%)', val: focusedEntry.breakdown.experienceMatch },
                  { label: 'Projects Match (15%)', val: focusedEntry.breakdown.projectsMatch },
                  { label: 'Education Match (15%)', val: focusedEntry.breakdown.educationMatch },
                  { label: 'Certification Match (10%)', val: focusedEntry.breakdown.certificationMatch },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{metric.label}</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {metric.val}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getScoreColorClasses(metric.val).bar}`}
                        style={{ width: `${metric.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Skill Gap Analysis */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-semibold text-[#14F195] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Matched Skills ({focusedEntry.breakdown.matchedSkills.length})
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-200">
                    {focusedEntry.breakdown.matchedSkills.join(' · ') || 'None'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Missing Skills ({focusedEntry.breakdown.missingSkills.length})
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-200">
                    {focusedEntry.breakdown.missingSkills.join(' · ') || 'No skill gaps detected'}
                  </p>
                </div>
              </div>

              {/* Recommended Courses */}
              {focusedEntry.breakdown.recommendedCourses.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#00D4FF]" /> Recommended Upskilling Courses
                  </h4>
                  <div className="space-y-2">
                    {focusedEntry.breakdown.recommendedCourses.map((c) => (
                      <div
                        key={c.skill}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{c.course}</p>
                          <p className="text-slate-400">
                            Covers {c.skill} · {c.provider}
                          </p>
                        </div>
                        <span className="font-mono text-[#00D4FF] shrink-0">{c.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">Select a job and candidate to inspect AI recommendations.</p>
          )}
        </div>
      </div>
    </div>
  );
}
