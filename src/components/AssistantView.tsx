import React, { useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { useATS } from '../context/ATSContext';
import { getScoreColorClasses } from '../lib/matchingEngine';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  matchedCandidateIds?: string[];
  followUps?: string[];
}

const PRESET_QUERIES = [
  'Show top React candidates.',
  'Show applicants with AWS certification.',
  'Who has highest score?',
  'Show rejected candidates.',
  'Find candidates with NodeJS and Docker.',
];

export function AssistantView({ onInspectCandidate }: { onInspectCandidate: (id: string) => void }) {
  const { jobs, candidates, applications, interviews } = useATS();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask me anything about your candidate pool, certifications, pipeline stages, or match rankings.',
      matchedCandidateIds: ['cand_rahul', 'cand_priya', 'cand_amit'].filter((id) =>
        candidates.some((c) => c.id === id)
      ),
      followUps: ['Show top React candidates.', 'Who has highest score?'],
    },
  ]);

  const sendQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const compactContext = {
        jobs: jobs.map((j) => ({ id: j.id, title: j.title, department: j.department, requiredSkills: j.requiredSkills, status: j.status })),
        candidates: candidates.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          skills: c.skills,
          experienceYears: c.experienceYears,
          certifications: c.certifications,
          matchScore: c.matchScore,
          degree: c.degree,
        })),
        applications: applications.map((a) => ({
          id: a.id,
          jobId: a.jobId,
          candidateId: a.candidateId,
          stage: a.stage,
          matchScore: a.matchScore,
        })),
        interviews: interviews.map((i) => ({ id: i.id, candidateId: i.candidateId, date: i.date, status: i.status })),
      };

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, context: compactContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assistant request failed.');

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.answer,
          matchedCandidateIds: data.matchedCandidateIds || [],
          followUps: data.suggestedFollowUps || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: err instanceof Error ? err.message : 'Unable to reach AI Recruitment Assistant.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Recruitment Assistant</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Query your live ATS database in natural language using Gemini semantic search.
        </p>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {PRESET_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => sendQuery(q)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#00D4FF] transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Stream */}
      <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 min-h-[420px] max-h-[540px] overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-4 space-y-3 ${
                msg.role === 'user'
                  ? 'bg-[#00D4FF] text-slate-950 font-medium text-sm'
                  : 'bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#00D4FF]">
                  <Bot className="w-4 h-4" /> HireSmart Assistant
                </div>
              )}
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {msg.matchedCandidateIds && msg.matchedCandidateIds.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2 pt-1">
                  {msg.matchedCandidateIds.map((cid) => {
                    const cand = candidates.find((c) => c.id === cid);
                    if (!cand) return null;
                    return (
                      <button
                        key={cid}
                        onClick={() => onInspectCandidate(cand.id)}
                        className="p-3 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 hover:border-[#00D4FF] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{cand.fullName}</span>
                          <span className={`text-xs font-mono font-bold ${getScoreColorClasses(cand.matchScore).text}`}>
                            {cand.matchScore}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {cand.skills.slice(0, 4).join(' · ')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {msg.followUps && msg.followUps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.followUps.map((f) => (
                    <button
                      key={f}
                      onClick={() => sendQuery(f)}
                      className="text-[11px] text-[#00D4FF] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-[#00D4FF]" /> Querying candidate records...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuery(input);
        }}
        className="flex items-center gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about skills, scores, certifications, or rejected applicants..."
          className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-[#00D4FF]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00D4FF] text-slate-950 font-semibold text-sm hover:bg-[#33ddff] disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}
