import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Loader2, MessageSquarePlus, Plus, Sparkles, Video } from 'lucide-react';
import { useATS } from '../context/ATSContext';
import type { GeneratedQuestion, InterviewMode, InterviewStatus } from '../types';

export function InterviewCenterView() {
  const { interviews, candidates, jobs, feedback, scheduleInterview, updateInterview, submitFeedback, addNotification } =
    useATS();
  const [activeTab, setActiveTab] = useState<'schedule' | 'questions' | 'feedback'>('schedule');

  // Schedule form
  const [candidateId, setCandidateId] = useState(candidates[0]?.id || '');
  const [jobId, setJobId] = useState(jobs[0]?.id || '');
  const [date, setDate] = useState('2026-11-26');
  const [time, setTime] = useState('10:30 AM');
  const [interviewer, setInterviewer] = useState('Vikram Desai (VP Engineering)');
  const [mode, setMode] = useState<InterviewMode>('Online');
  const [meetingLink, setMeetingLink] = useState('https://meet.hiresmart.ai/technical-round');
  const [scheduling, setScheduling] = useState(false);

  // Question Generator state
  const [qCandidateId, setQCandidateId] = useState(candidates[0]?.id || '');
  const [qJobId, setQJobId] = useState(jobs[0]?.id || '');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [qSkills, setQSkills] = useState('React, NodeJS, System Design');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState<string | null>(null);

  // Feedback state
  const [fbInterviewId, setFbInterviewId] = useState(interviews[0]?.id || '');
  const [ratings, setRatings] = useState({
    communication: 8,
    technicalSkills: 9,
    problemSolving: 8,
    leadership: 8,
    teamwork: 9,
    cultureFit: 9,
  });
  const [fbNotes, setFbNotes] = useState('');
  const [fbAiSummary, setFbAiSummary] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const [fbSaved, setFbSaved] = useState(false);

  const overallScore = Math.round(
    ((ratings.communication +
      ratings.technicalSkills +
      ratings.problemSolving +
      ratings.leadership +
      ratings.teamwork +
      ratings.cultureFit) /
      60) *
      100
  );

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !jobId) return;
    setScheduling(true);
    try {
      await scheduleInterview({
        candidateId,
        jobId,
        date,
        time,
        interviewer,
        mode,
        status: 'Scheduled',
        meetingLink,
      });
      const cand = candidates.find((c) => c.id === candidateId);
      await addNotification({
        type: 'Interview Reminder',
        title: `Interview Scheduled: ${cand?.fullName || 'Candidate'}`,
        message: `${date} at ${time} (${mode}) with ${interviewer}.`,
        read: false,
      });
    } finally {
      setScheduling(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setQLoading(true);
    setQError(null);
    const cand = candidates.find((c) => c.id === qCandidateId);
    const job = jobs.find((j) => j.id === qJobId);
    try {
      const res = await fetch('/api/ai/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: cand,
          job,
          difficulty: qDifficulty,
          focusSkills: qSkills.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions.');
      setQuestions(data.questions || []);
    } catch (err) {
      setQError(err instanceof Error ? err.message : 'Unable to generate questions.');
    } finally {
      setQLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    const iv = interviews.find((i) => i.id === fbInterviewId) || interviews[0];
    const cand = candidates.find((c) => c.id === iv?.candidateId);
    const job = jobs.find((j) => j.id === iv?.jobId);
    setFbLoading(true);
    try {
      const res = await fetch('/api/ai/interview-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: cand?.fullName || 'Candidate',
          jobTitle: job?.title || 'Engineer',
          ratings,
          notes: fbNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to summarize.');
      setFbAiSummary(`${data.verdict ? `${data.verdict}: ` : ''}${data.summary}`);
    } catch {
      setFbAiSummary(
        `Overall score ${overallScore}/100. Strong technical alignment (${ratings.technicalSkills}/10) and problem solving (${ratings.problemSolving}/10).`
      );
    } finally {
      setFbLoading(false);
    }
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const iv = interviews.find((i) => i.id === fbInterviewId) || interviews[0];
    if (!iv) return;
    await submitFeedback({
      interviewId: iv.id,
      candidateId: iv.candidateId,
      ...ratings,
      overallScore,
      notes: fbNotes || 'Completed technical & cultural evaluation.',
      aiSummary: fbAiSummary || `Scorecard submitted with ${overallScore}/100 overall rating.`,
    });
    if (iv.status === 'Scheduled') {
      await updateInterview(iv.id, { status: 'Completed' });
    }
    setFbSaved(true);
    setTimeout(() => setFbSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Interview Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule interviews, generate tailored AI interview questions, and record structured feedback scorecards.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'schedule' as const, label: 'Interviews' },
            { id: 'questions' as const, label: 'AI Question Generator' },
            { id: 'feedback' as const, label: 'Feedback Scorecards' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Schedule & List */}
      {activeTab === 'schedule' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSchedule}
            className="lg:col-span-5 bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 h-fit"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#00D4FF]" /> Schedule Interview
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Candidate</label>
              <select
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Time</label>
                <input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as InterviewMode)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Interviewer</label>
                <input
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Meeting Link / Location</label>
              <input
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={scheduling}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00D4FF] text-slate-950 font-semibold text-sm hover:bg-[#33ddff] cursor-pointer"
            >
              {scheduling ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {interviews.map((iv) => {
              const cand = candidates.find((c) => c.id === iv.candidateId);
              const job = jobs.find((j) => j.id === iv.jobId);
              const statusTone =
                iv.status === 'Completed'
                  ? 'text-[#14F195]'
                  : iv.status === 'Cancelled'
                  ? 'text-rose-400'
                  : iv.status === 'Rescheduled'
                  ? 'text-amber-400'
                  : 'text-[#00D4FF]';

              return (
                <div
                  key={iv.id}
                  className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-semibold ${statusTone}`}>{iv.status}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{iv.mode}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {cand?.fullName || iv.candidateId} — {job?.title || iv.jobId}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {iv.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {iv.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" /> {iv.interviewer}
                      </span>
                    </div>
                  </div>

                  <select
                    disabled={iv.status === 'Cancelled'}
                    value={iv.status}
                    onChange={(e) => updateInterview(iv.id, { status: e.target.value as InterviewStatus })}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    {['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AI Interview Question Generator */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 grid sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Candidate</label>
              <select
                value={qCandidateId}
                onChange={(e) => setQCandidateId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Job Role</label>
              <select
                value={qJobId}
                onChange={(e) => setQJobId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Difficulty</label>
              <select
                value={qDifficulty}
                onChange={(e) => setQDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <button
              onClick={handleGenerateQuestions}
              disabled={qLoading}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {qLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Questions
            </button>
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-400 mb-1">Focus Skill Set (comma separated)</label>
              <input
                value={qSkills}
                onChange={(e) => setQSkills(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          {qError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">{qError}</div>
          )}

          {questions.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {questions.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#00D4FF]">{item.category}</span>
                    <span className="font-mono text-slate-400">{item.difficulty}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.question}</p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">Expected Key Points</p>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {item.expectedKeyPoints.map((kp, i) => (
                        <li key={i}>• {kp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Interview Feedback System */}
      {activeTab === 'feedback' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveFeedback}
            className="lg:col-span-6 bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-[#00D4FF]" /> Submit Interview Scorecard
              </h2>
              <span className="font-mono text-lg font-bold text-[#14F195] tabular-nums">{overallScore}/100</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Select Interview</label>
              <select
                value={fbInterviewId}
                onChange={(e) => setFbInterviewId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              >
                {interviews.map((iv) => {
                  const cand = candidates.find((c) => c.id === iv.candidateId);
                  return (
                    <option key={iv.id} value={iv.id}>
                      {cand?.fullName || iv.candidateId} · {iv.date} ({iv.status})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-3">
              {[
                { key: 'technicalSkills' as const, label: 'Technical Skills' },
                { key: 'communication' as const, label: 'Communication' },
                { key: 'problemSolving' as const, label: 'Problem Solving' },
                { key: 'leadership' as const, label: 'Leadership' },
                { key: 'teamwork' as const, label: 'Teamwork' },
                { key: 'cultureFit' as const, label: 'Culture Fit' },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">{field.label}</span>
                    <span className="font-mono font-bold text-[#00D4FF]">{ratings[field.key]}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={ratings[field.key]}
                    onChange={(e) => setRatings({ ...ratings, [field.key]: Number(e.target.value) })}
                    className="w-full accent-[#00D4FF]"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Interviewer Notes</label>
              <textarea
                rows={3}
                value={fbNotes}
                onChange={(e) => setFbNotes(e.target.value)}
                placeholder="Observations on architecture, coding clarity, communication..."
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400">AI Interview Summary</label>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={fbLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D4FF] hover:underline cursor-pointer"
                >
                  {fbLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate AI Summary
                </button>
              </div>
              <textarea
                rows={3}
                value={fbAiSummary}
                onChange={(e) => setFbAiSummary(e.target.value)}
                placeholder="Click Generate AI Summary to synthesize ratings & notes..."
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              {fbSaved ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14F195]">
                  <CheckCircle2 className="w-4 h-4" /> Scorecard Saved
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#00D4FF] text-slate-950 font-semibold text-sm hover:bg-[#33ddff] cursor-pointer"
              >
                Save Feedback
              </button>
            </div>
          </form>

          <div className="lg:col-span-6 space-y-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recorded Scorecards</h2>
            {feedback.map((fb) => {
              const cand = candidates.find((c) => c.id === fb.candidateId);
              return (
                <div
                  key={fb.id}
                  className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">{cand?.fullName || fb.candidateId}</h3>
                    <span className="font-mono font-bold text-[#14F195] tabular-nums">{fb.overallScore}/100</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Tech {fb.technicalSkills} · Comm {fb.communication} · Problem {fb.problemSolving} · Lead {fb.leadership} · Team {fb.teamwork ?? fb.cultureFit} · Culture {fb.cultureFit}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{fb.aiSummary}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
