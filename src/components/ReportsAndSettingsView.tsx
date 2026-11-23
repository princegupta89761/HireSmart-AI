import React, { useState } from 'react';
import { Check, Database, Download, FileSpreadsheet, FileText, Loader2, Moon, RotateCcw, Sun } from 'lucide-react';
import { useATS } from '../context/ATSContext';
import { exportReportAsPDF, exportRowsAsCSV, exportRowsAsExcel } from '../lib/matchingEngine';
import type { ReportRecord } from '../types';

export function ReportsView() {
  const { candidates, jobs, applications, interviews, feedback, reports, logReport } = useATS();

  const buildRows = (type: ReportRecord['reportType']): Record<string, string | number>[] => {
    if (type === 'Candidate Report') {
      return candidates.map((c) => ({
        Name: c.fullName,
        Email: c.email,
        ExperienceYears: c.experienceYears,
        Skills: c.skills.join(', '),
        MatchScore: `${c.matchScore}%`,
        ResumeScore: c.resumeScore,
      }));
    }
    if (type === 'Hiring Report') {
      return applications.map((a) => {
        const cand = candidates.find((c) => c.id === a.candidateId);
        const job = jobs.find((j) => j.id === a.jobId);
        return {
          Candidate: cand?.fullName || a.candidateId,
          Job: job?.title || a.jobId,
          Stage: a.stage,
          MatchScore: `${a.matchScore}%`,
          AppliedDate: a.appliedAt,
        };
      });
    }
    if (type === 'Interview Report') {
      return interviews.map((iv) => {
        const cand = candidates.find((c) => c.id === iv.candidateId);
        const fb = feedback.find((f) => f.interviewId === iv.id);
        return {
          Candidate: cand?.fullName || iv.candidateId,
          Date: iv.date,
          Time: iv.time,
          Mode: iv.mode,
          Status: iv.status,
          Interviewer: iv.interviewer,
          Score: fb ? `${fb.overallScore}/100` : 'Pending',
        };
      });
    }
    return jobs.map((j) => ({
      JobTitle: j.title,
      Department: j.department,
      Status: j.status,
      Applicants: applications.filter((a) => a.jobId === j.id).length,
      Location: j.location,
      SalaryRange: j.salaryRange,
    }));
  };

  const handleExport = async (type: ReportRecord['reportType'], format: 'PDF' | 'Excel' | 'CSV') => {
    const rows = buildRows(type);
    const filename = `hiresmart_${type.toLowerCase().replace(/\s+/g, '_')}`;
    if (format === 'CSV') exportRowsAsCSV(filename, rows);
    if (format === 'Excel') exportRowsAsExcel(filename, type, rows);
    if (format === 'PDF') exportReportAsPDF(type, `${rows.length} records exported`, rows);

    await logReport({
      reportType: type,
      title: `${type} (${format})`,
      format,
    });
  };

  const reportCards: { type: ReportRecord['reportType']; desc: string }[] = [
    { type: 'Candidate Report', desc: 'Complete talent directory, parsed skills, experience, and match scores.' },
    { type: 'Hiring Report', desc: 'Pipeline stage distribution, job-to-candidate assignments, and conversion states.' },
    { type: 'Interview Report', desc: 'Scheduled & completed interviews alongside interviewer scorecard totals.' },
    { type: 'Analytics Report', desc: 'Department requisition volume, active statuses, and applicant density.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Exports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate and download real PDF, Excel (.xlsx), and CSV recruitment reports.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {reportCards.map((card) => (
          <div
            key={card.type}
            className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{card.type}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.desc}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExport(card.type, 'PDF')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00D4FF] text-slate-950 text-xs font-semibold hover:bg-[#33ddff] cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button
                onClick={() => handleExport(card.type, 'Excel')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14F195]/15 border border-[#14F195]/40 text-[#14F195] text-xs font-semibold hover:bg-[#14F195]/25 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
              </button>
              <button
                onClick={() => handleExport(card.type, 'CSV')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:text-[#00D4FF] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Export History */}
      <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Export History</h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
          {reports.map((r) => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{r.title}</p>
                <p className="text-slate-400">{r.reportType}</p>
              </div>
              <div className="text-right font-mono text-slate-400">
                <span className="text-[#00D4FF] font-semibold mr-3">{r.format}</span>
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsView() {
  const { user, settings, updateSettings, resetGuestDemoData, seedTechNovaFirestore } = useATS();
  const [orgName, setOrgName] = useState(settings.organizationName);
  const [threshold, setThreshold] = useState(settings.autoScreenThreshold);
  const [emailNotifs, setEmailNotifs] = useState(settings.emailNotifications);
  const [saved, setSaved] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      organizationName: orgName.trim() || 'TechNova Solutions',
      autoScreenThreshold: threshold,
      emailNotifications: emailNotifs,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure organization profile, AI scoring preferences, notifications, email templates, and display theme.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile & Organization */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile & Organization</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Account</label>
              <input
                disabled
                value={`${user?.displayName || 'Guest'} (${user?.email || 'guest@hiresmart.ai'})`}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Organization Name</label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Recruitment & AI Configuration */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Recruitment Preferences & AI Configuration
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Auto-Shortlist Match Score Threshold</span>
              <span className="font-mono font-bold text-[#00D4FF]">{threshold}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-[#00D4FF]"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-xs">
            {[
              { label: 'Skills', w: '40%' },
              { label: 'Experience', w: '20%' },
              { label: 'Projects', w: '15%' },
              { label: 'Education', w: '15%' },
              { label: 'Certifications', w: '10%' },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center"
              >
                <p className="text-slate-400">{item.label}</p>
                <p className="font-mono font-bold text-[#14F195] mt-1">{item.w}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notification & Theme Settings */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Notification & Theme Preferences
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="accent-[#00D4FF] w-4 h-4"
              />
              <span>Enable email notifications for applications, interviews, and job expiry</span>
            </label>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  settings.theme === 'dark' ? 'bg-[#1E293B] text-white' : 'text-slate-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  settings.theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            Active Email Templates: Application Received · Shortlisted · Interview Invitation · Offer Letter · Rejection Email
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {user?.isGuest ? (
            <button
              type="button"
              onClick={resetGuestDemoData}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset TechNova Demo (100 Candidates)
            </button>
          ) : (
            <button
              type="button"
              disabled={seedingDemo}
              onClick={async () => {
                setSeedingDemo(true);
                try {
                  await seedTechNovaFirestore();
                } finally {
                  setSeedingDemo(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/10 text-xs font-semibold text-[#00D4FF] hover:bg-[#00D4FF]/20 disabled:opacity-60 cursor-pointer"
            >
              {seedingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              {seedingDemo ? 'Loading TechNova Demo...' : 'Load TechNova Solutions Demo (15 Jobs · 100 Candidates)'}
            </button>
          )}

          <div className="flex items-center gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#14F195]">
                <Check className="w-4 h-4" /> Settings Saved
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00D4FF] text-slate-950 font-semibold text-sm hover:bg-[#33ddff] cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
