import React, { useState } from 'react';
import { Bot, Loader2, Mic, MicOff, Send, Sparkles, X } from 'lucide-react';
import { useATS } from '../context/ATSContext';
import type { NavModule } from '../types';

interface GlobalCopilotProps {
  onNavigate: (m: NavModule) => void;
  onInspectCandidate: (id: string) => void;
  onApplySearch: (q: string) => void;
}

const VOICE_DEMO_COMMANDS = [
  'Show React candidates',
  'Schedule interview with Rahul Sharma',
  'Open shortlisted applicants',
  'Create a new job posting',
];

export function GlobalCopilot({ onNavigate, onInspectCandidate, onApplySearch }: GlobalCopilotProps) {
  const { jobs, candidates, applications } = useATS();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'copilot'; text: string }[]>([
    {
      role: 'copilot',
      text: 'HireSmart Copilot ready. Use voice or text to analyze candidates, recommend shortlists, draft emails, or jump to any view.',
    },
  ]);

  const executeCommand = async (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed || loading) return;

    setHistory((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const shortlistedCount = applications.filter((a) => a.stage === 'Shortlisted').length;
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: trimmed,
          context: {
            jobs: jobs.map((j) => ({ id: j.id, title: j.title, status: j.status })),
            candidates: candidates.slice(0, 25).map((c) => ({
              id: c.id,
              fullName: c.fullName,
              skills: c.skills,
              matchScore: c.matchScore,
              experienceYears: c.experienceYears,
            })),
            shortlistedCount,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Copilot failed.');

      setHistory((prev) => [...prev, { role: 'copilot', text: data.reply }]);

      // Execute inferred UI navigation/filter action
      if (data.actionType === 'open_candidate' && data.candidateId) {
        onInspectCandidate(data.candidateId);
      } else if (data.actionType === 'filter_candidates' && data.filterSkillOrQuery) {
        onApplySearch(data.filterSkillOrQuery);
        onNavigate('candidates');
      } else if (data.actionType === 'open_create_job') {
        onNavigate('jobs');
      } else if (data.actionType === 'schedule_interview') {
        onNavigate('interview-center');
      } else if (data.targetModule) {
        onNavigate(data.targetModule as NavModule);
      }
    } catch (err) {
      // Graceful fallback command router if offline/error
      const lower = trimmed.toLowerCase();
      if (lower.includes('shortlist')) {
        onNavigate('applications');
        setHistory((prev) => [...prev, { role: 'copilot', text: 'Opened Application Pipeline to inspect shortlisted applicants.' }]);
      } else if (lower.includes('job')) {
        onNavigate('jobs');
        setHistory((prev) => [...prev, { role: 'copilot', text: 'Opened Job Management to create or edit job postings.' }]);
      } else if (lower.includes('schedule') || lower.includes('interview')) {
        onNavigate('interview-center');
        setHistory((prev) => [...prev, { role: 'copilot', text: 'Opened Interview Center to schedule the interview.' }]);
      } else if (lower.includes('react')) {
        onApplySearch('React');
        onNavigate('candidates');
        setHistory((prev) => [...prev, { role: 'copilot', text: 'Filtered Candidates for React skills.' }]);
      } else {
        setHistory((prev) => [
          ...prev,
          { role: 'copilot', text: err instanceof Error ? err.message : 'Unable to execute command.' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHistory((prev) => [
        ...prev,
        {
          role: 'copilot',
          text: 'Browser microphone speech recognition is unavailable here—click any voice preset chip below to test hands-free commands.',
        },
      ]);
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition() as {
      lang: string;
      interimResults: boolean;
      onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
    };
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        executeCommand(transcript);
      }
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle Recruitment Copilot"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#6C63FF] text-white font-semibold text-xs sm:text-sm shadow-2xl hover:opacity-95 transition-opacity cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-[#00D4FF]" />
        <span>Recruitment Copilot</span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[360px] sm:w-[400px] max-w-[92vw] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#00D4FF]" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Copilot & Voice Assistant</h3>
                <p className="text-[11px] text-slate-400">Accessible across all modules</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
            {VOICE_DEMO_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => executeCommand(cmd)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:border-[#00D4FF] cursor-pointer"
              >
                {cmd}
              </button>
            ))}
          </div>

          <div className="flex-1 max-h-72 overflow-y-auto p-4 space-y-3 text-xs">
            {history.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#00D4FF] text-slate-950 font-medium'
                      : 'bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00D4FF]" /> Copilot thinking...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeCommand(input);
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleVoice}
              title="Voice command"
              className={`p-2 rounded-xl border cursor-pointer ${
                listening
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-slate-100 dark:bg-[#0F172A] border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#00D4FF]'
              }`}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot or speak a command..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-[#00D4FF]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-[#00D4FF] text-slate-950 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
