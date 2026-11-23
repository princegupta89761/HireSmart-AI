import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useATS } from '../context/ATSContext';
import { calculateCandidateMatch } from '../lib/matchingEngine';
import type { Candidate } from '../types';

interface UploadQueueItem {
  id: string;
  fileName: string;
  status: 'Queued' | 'Parsing' | 'Completed' | 'Error';
  error?: string;
  parsed?: Omit<Candidate, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
  savedCandidateId?: string;
}

const SAMPLE_RESUME = `ARJUN KAPOOR
Bengaluru, India · +91 98765 43210 · arjun.kapoor@clouddev.in
LinkedIn: linkedin.com/in/arjunkapoor-fs | GitHub: github.com/arjunkapoor | Portfolio: arjunkapoor.dev

EDUCATION
B.Tech in Computer Science & Engineering — NIT Trichy (2022) · CGPA: 8.8/10

EXPERIENCE
Software Engineer II — Flipkart (2023 – Present)
- Built high-throughput order tracking dashboards in React, TypeScript, and Tailwind CSS serving 800k+ daily users.
- Designed NodeJS and MongoDB microservices deployed on AWS ECS with Docker and Redis caching.
Software Engineer I — Chargebee (2022 – 2023)
- Implemented billing webhook retry queues in NodeJS and automated CI/CD pipelines.

SKILLS
React, TypeScript, NodeJS, MongoDB, AWS, Docker, GraphQL, Tailwind, Redis

PROJECTS
StreamLedger Real-Time Analytics: Distributed event pipeline in NodeJS, AWS SQS, and React visualizations.
DevPulse CI Monitor: GitHub Actions dashboard built with React and GraphQL.

CERTIFICATIONS
AWS Certified Developer – Associate · MongoDB Certified Developer

ACHIEVEMENTS
Finalist at Smart India Hackathon · Reduced frontend bundle size by 38%

LANGUAGES
English, Hindi`;

export function ResumeParserView({ onInspectCandidate }: { onInspectCandidate: (id: string) => void }) {
  const { jobs, candidates, createCandidate, createApplication, addNotification } = useATS();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [targetJobId, setTargetJobId] = useState<string>(jobs[0]?.id || '');
  const [rawPaste, setRawPaste] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const selectedItem = queue.find((q) => q.id === selectedItemId) || queue[0] || null;
  const targetJob = jobs.find((j) => j.id === targetJobId) || jobs[0];

  const parseViaServer = async (payload: {
    fileName: string;
    mimeType?: string;
    fileBase64?: string;
    rawText?: string;
  }) => {
    const queueId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newItem: UploadQueueItem = { id: queueId, fileName: payload.fileName, status: 'Parsing' };
    setQueue((prev) => [newItem, ...prev]);
    setSelectedItemId(queueId);

    try {
      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resume parsing failed.');

      const candidateDraft: Omit<Candidate, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
        fullName: data.fullName || 'Parsed Candidate',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        portfolio: data.portfolio || '',
        collegeName: data.collegeName || '',
        degree: data.degree || '',
        skills: Array.isArray(data.skills) ? data.skills : [],
        experienceYears: Number(data.experienceYears) || 0,
        previousCompanies: Array.isArray(data.previousCompanies) ? data.previousCompanies : [],
        certifications: Array.isArray(data.certifications) ? data.certifications : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        experience: Array.isArray(data.experience) ? data.experience : [],
        education: Array.isArray(data.education) ? data.education : [],
        optimizationSuggestions: Array.isArray(data.optimizationSuggestions) ? data.optimizationSuggestions : [],
        resumeScore: Number(data.resumeScore) || 75,
        matchScore: 80,
        source: 'AI Resume Parser',
        resumeText: data.resumeText || payload.rawText || '',
      };

      if (targetJob) {
        const match = calculateCandidateMatch(
          { ...candidateDraft, id: 'temp', ownerId: 'temp', createdAt: '', updatedAt: '' },
          targetJob
        );
        candidateDraft.matchScore = match.overallScore;
      }

      setQueue((prev) =>
        prev.map((q) => (q.id === queueId ? { ...q, status: 'Completed', parsed: candidateDraft } : q))
      );
    } catch (err) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === queueId
            ? { ...q, status: 'Error', error: err instanceof Error ? err.message : 'Parse error' }
            : q
        )
      );
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        parseViaServer({
          fileName: file.name,
          mimeType: file.type,
          fileBase64: result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCandidate = async (item: UploadQueueItem) => {
    if (!item.parsed || item.savedCandidateId) return;
    const dupEmail = candidates.find(
      (c) => item.parsed?.email && c.email.toLowerCase() === item.parsed.email.toLowerCase()
    );

    const created = await createCandidate(item.parsed);
    let score = item.parsed.matchScore;
    let explanation = `AI parsed ${created.fullName} with ${created.experienceYears} years experience.`;

    if (targetJob) {
      const match = calculateCandidateMatch(created, targetJob);
      score = match.overallScore;
      explanation = match.recommendation;
      await createApplication({
        jobId: targetJob.id,
        candidateId: created.id,
        stage: score >= 80 ? 'Shortlisted' : 'Applied',
        matchScore: score,
        appliedAt: new Date().toISOString().slice(0, 10),
        aiExplanation: explanation,
      });
    }

    await addNotification({
      type: 'New Application',
      title: `${created.fullName} parsed & added (${score}% match)`,
      message: dupEmail
        ? `Duplicate email detected with existing candidate ${dupEmail.fullName}.`
        : `Extracted ${created.skills.length} skills from ${item.fileName}.`,
      read: false,
    });

    setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, savedCandidateId: created.id } : q)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Resume Upload & Parser</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Single or bulk upload PDF and DOCX resumes. Automatically extract 18 structured profile fields and score fit.
          </p>
        </div>

        <select
          value={targetJobId}
          onChange={(e) => setTargetJobId(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-sm"
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              Match Target: {j.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Upload Zone + Paste + Queue */}
        <div className="lg:col-span-5 space-y-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B]/70 hover:border-[#00D4FF]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-2xl bg-[#00D4FF]/15 text-[#00D4FF] flex items-center justify-center mx-auto mb-3">
              <FileUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Drag & drop resumes here, or click to browse
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports PDF, DOCX, TXT · Single or Bulk Upload
            </p>
          </div>

          {/* Paste / Sample Quick Parse */}
          <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Or Paste Resume Text</h2>
              <button
                type="button"
                onClick={() => setRawPaste(SAMPLE_RESUME)}
                className="text-xs text-[#00D4FF] hover:underline cursor-pointer"
              >
                Load Sample Resume
              </button>
            </div>
            <textarea
              rows={5}
              value={rawPaste}
              onChange={(e) => setRawPaste(e.target.value)}
              placeholder="Paste candidate resume content..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-mono"
            />
            <button
              type="button"
              disabled={!rawPaste.trim()}
              onClick={() => parseViaServer({ fileName: 'Pasted_Resume.txt', rawText: rawPaste })}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#00D4FF] text-slate-950 text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Parse with Gemini AI
            </button>
          </div>

          {/* Upload Status Tracking Queue */}
          <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Upload Status Tracking</h2>
            {queue.length === 0 ? (
              <p className="text-xs text-slate-400">No files queued yet.</p>
            ) : (
              <div className="space-y-2">
                {queue.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      selectedItem?.id === item.id
                        ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#00D4FF] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.fileName}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.status === 'Parsing' && 'Extracting structured entities...'}
                          {item.status === 'Completed' &&
                            `${item.parsed?.fullName || 'Parsed'} · ${item.parsed?.skills.length || 0} skills`}
                          {item.status === 'Error' && item.error}
                        </p>
                      </div>
                    </div>
                    {item.status === 'Parsing' && <Loader2 className="w-4 h-4 animate-spin text-[#00D4FF] shrink-0" />}
                    {item.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-[#14F195] shrink-0" />}
                    {item.status === 'Error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Structured Parsed Profile */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          {!selectedItem?.parsed ? (
            <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#00D4FF]" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Structured Candidate Extraction Preview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Upload a PDF/DOCX resume or load the sample resume to inspect extracted contact links, education, projects, certifications, skills, and AI optimization tips.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedItem.parsed.fullName}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedItem.parsed.email} · {selectedItem.parsed.phone} · {selectedItem.parsed.location}
                  </p>
                  <p className="text-xs text-[#00D4FF] mt-1">
                    {[selectedItem.parsed.linkedin, selectedItem.parsed.github, selectedItem.parsed.portfolio]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Resume Score</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-[#14F195]">
                      {selectedItem.parsed.resumeScore}/100
                    </p>
                  </div>
                  {selectedItem.savedCandidateId ? (
                    <button
                      onClick={() => onInspectCandidate(selectedItem.savedCandidateId!)}
                      className="px-4 py-2 rounded-xl bg-[#14F195]/15 border border-[#14F195]/40 text-[#14F195] text-xs font-semibold cursor-pointer"
                    >
                      View Saved Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveCandidate(selectedItem)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00D4FF] text-slate-950 text-xs font-semibold hover:bg-[#33ddff] cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Save & Match to Job
                    </button>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-slate-400 mb-1">Education</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {selectedItem.parsed.degree || 'Not specified'}
                  </p>
                  <p className="text-slate-400">{selectedItem.parsed.collegeName}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-400 mb-1">Experience & Previous Companies</p>
                  <p className="text-slate-900 dark:text-white font-medium font-mono">
                    {selectedItem.parsed.experienceYears} years
                  </p>
                  <p className="text-slate-400">
                    {selectedItem.parsed.previousCompanies.join(', ') || 'None listed'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">Extracted Skills</p>
                <p className="text-sm text-slate-900 dark:text-white">{selectedItem.parsed.skills.join(' · ')}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-slate-400 mb-1.5">Projects</p>
                  <div className="space-y-2">
                    {selectedItem.parsed.projects.map((p, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                        <p className="font-semibold text-slate-900 dark:text-white">{p.title}</p>
                        <p className="text-slate-400 mt-0.5">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-slate-400 mb-1">Certifications</p>
                    <p className="text-slate-700 dark:text-slate-200">
                      {selectedItem.parsed.certifications.join(', ') || 'None detected'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 mb-1">Achievements</p>
                    <p className="text-slate-700 dark:text-slate-200">
                      {selectedItem.parsed.achievements.join(' · ') || 'None detected'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 mb-1">Languages</p>
                    <p className="text-slate-700 dark:text-slate-200">
                      {selectedItem.parsed.languages.join(', ') || 'English'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedItem.parsed.optimizationSuggestions.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-[#00D4FF] mb-1.5">AI Resume Optimization Suggestions</p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {selectedItem.parsed.optimizationSuggestions.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
