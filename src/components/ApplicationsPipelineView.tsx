import React, { useMemo, useState } from 'react';
import { GripVertical, Loader2, Lock, Sparkles, X } from 'lucide-react';
import { useATS } from '../context/ATSContext';
import { getScoreColorClasses, suggestRejectionReason } from '../lib/matchingEngine';
import { PIPELINE_STAGES, type PipelineStage } from '../types';

interface ApplicationsPipelineViewProps {
  onInspectCandidate: (candidateId: string) => void;
}

const PRESET_REJECTION_REASONS = [
  'Missing Required Skills',
  'Insufficient Experience',
  'Low Match Score',
  'Position Closed',
];

export function ApplicationsPipelineView({ onInspectCandidate }: ApplicationsPipelineViewProps) {
  const { applications, candidates, jobs, updateApplicationStage, addNotification } = useATS();
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ appId: string; candidateName: string; jobTitle: string } | null>(null);
  const [rejectCategory, setRejectCategory] = useState('Missing Required Skills');
  const [rejectDetail, setRejectDetail] = useState('');
  const [rejectAiLoading, setRejectAiLoading] = useState(false);

  const filteredApps = useMemo(() => {
    if (selectedJobId === 'ALL') return applications;
    return applications.filter((a) => a.jobId === selectedJobId);
  }, [applications, selectedJobId]);

  const commitStageChange = async (appId: string, nextStage: PipelineStage, rejectionReason?: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;
    await updateApplicationStage(appId, nextStage, rejectionReason);

    const cand = candidates.find((c) => c.id === app.candidateId);
    if (nextStage === 'Shortlisted' || nextStage === 'Rejected' || nextStage === 'Hired') {
      await addNotification({
        type:
          nextStage === 'Shortlisted'
            ? 'Candidate Shortlisted'
            : nextStage === 'Rejected'
            ? 'Rejected Candidate'
            : 'Offer Accepted',
        title: `${cand?.fullName || 'Candidate'} moved to ${nextStage}`,
        message: rejectionReason ? `Reason: ${rejectionReason}` : `Pipeline stage updated to ${nextStage}.`,
        read: false,
      });
    }
  };

  const handleMoveStage = async (appId: string, nextStage: PipelineStage) => {
    const app = applications.find((a) => a.id === appId);
    if (!app || app.stage === nextStage) return;
    if (app.stage === 'Hired') return; // Terminal stage lock

    if (nextStage === 'Rejected') {
      const cand = candidates.find((c) => c.id === app.candidateId);
      const job = jobs.find((j) => j.id === app.jobId);
      if (cand) {
        const local = suggestRejectionReason(cand, job);
        setRejectCategory(local.category);
        setRejectDetail(local.reason);
      } else {
        setRejectCategory('Low Match Score');
        setRejectDetail('Profile ranked below shortlist threshold.');
      }
      setRejectTarget({
        appId,
        candidateName: cand?.fullName || app.candidateId,
        jobTitle: job?.title || 'Open Role',
      });
      return;
    }

    await commitStageChange(appId, nextStage);
  };

  const handleAiSuggestRejection = async () => {
    if (!rejectTarget) return;
    const app = applications.find((a) => a.id === rejectTarget.appId);
    const cand = candidates.find((c) => c.id === app?.candidateId);
    const job = jobs.find((j) => j.id === app?.jobId);
    if (!cand) return;

    setRejectAiLoading(true);
    try {
      const res = await fetch('/api/ai/rejection-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: cand, job }),
      });
      const data = await res.json();
      if (res.ok && data.reason) {
        setRejectCategory(data.category || 'Missing Required Skills');
        setRejectDetail(data.reason);
      }
    } finally {
      setRejectAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Application Pipeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Drag and drop candidates across all 8 hiring stages with AI-assisted rejection reasoning.
          </p>
        </div>

        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-sm"
        >
          <option value="ALL">All Jobs ({applications.length})</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
      </div>

      {/* Horizontal Scrollable 8-Stage Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageApps = filteredApps.filter((a) => a.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedAppId) {
                  handleMoveStage(draggedAppId, stage);
                  setDraggedAppId(null);
                }
              }}
              className="w-[270px] shrink-0 bg-slate-100/80 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3 min-h-[420px]"
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {stage}
                </h2>
                <span className="text-xs font-mono tabular-nums text-slate-400">{stageApps.length}</span>
              </div>

              <div className="space-y-2.5 flex-1">
                {stageApps.length === 0 ? (
                  <div className="h-24 rounded-xl border border-dashed border-slate-300 dark:border-slate-700/80 flex items-center justify-center text-xs text-slate-400">
                    Drop candidate here
                  </div>
                ) : (
                  stageApps.map((app) => {
                    const cand = candidates.find((c) => c.id === app.candidateId);
                    const job = jobs.find((j) => j.id === app.jobId);
                    const scoreStyle = getScoreColorClasses(app.matchScore);
                    const isLocked = app.stage === 'Hired';

                    return (
                      <div
                        key={app.id}
                        draggable={!isLocked}
                        onDragStart={() => setDraggedAppId(app.id)}
                        className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing hover:border-[#00D4FF]/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {isLocked ? (
                              <Lock className="w-3.5 h-3.5 text-[#14F195] shrink-0" />
                            ) : (
                              <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <button
                              onClick={() => cand && onInspectCandidate(cand.id)}
                              className="text-sm font-semibold text-slate-900 dark:text-white hover:text-[#00D4FF] truncate text-left cursor-pointer"
                            >
                              {cand?.fullName || app.candidateId}
                            </button>
                          </div>
                          <span className={`text-xs font-mono font-bold tabular-nums ${scoreStyle.text}`}>
                            {app.matchScore}%
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {job?.title || 'Open Role'}
                        </p>

                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {cand?.skills.slice(0, 4).join(' · ')}
                        </p>

                        {app.stage === 'Rejected' && app.rejectionReason && (
                          <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1 line-clamp-2">
                            {app.rejectionReason}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-slate-400">{app.appliedAt}</span>
                          <select
                            disabled={isLocked}
                            value={app.stage}
                            onChange={(e) => handleMoveStage(app.id, e.target.value as PipelineStage)}
                            aria-label="Move pipeline stage"
                            className="text-[11px] bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 disabled:opacity-60"
                          >
                            {PIPELINE_STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Rejection Reason Modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRejectTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Rejection Reason</h2>
                <p className="text-xs text-slate-400">
                  {rejectTarget.candidateName} · {rejectTarget.jobTitle}
                </p>
              </div>
              <button onClick={() => setRejectTarget(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_REJECTION_REASONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setRejectCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    rejectCategory === cat
                      ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
                      : 'bg-slate-100 dark:bg-[#0F172A] text-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400">Rejection Feedback Summary</label>
                <button
                  type="button"
                  onClick={handleAiSuggestRejection}
                  disabled={rejectAiLoading}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#00D4FF] hover:underline cursor-pointer"
                >
                  {rejectAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Suggest with AI
                </button>
              </div>
              <textarea
                rows={3}
                value={rejectDetail}
                onChange={(e) => setRejectDetail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await commitStageChange(rejectTarget.appId, 'Rejected', `${rejectCategory}: ${rejectDetail}`);
                  setRejectTarget(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
