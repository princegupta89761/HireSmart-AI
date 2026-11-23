import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Check,
  FileSearch,
  Layers,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { HERO_IMAGE_URL, TALENT_LEAD_AVATAR } from '../data/demoData';
import { useATS } from '../context/ATSContext';

export function LandingPage() {
  const { loginWithGoogle, continueAsGuest, authError } = useATS();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    await loginWithGoogle();
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a href="#top" className="text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-display">
            HireSmart <span className="text-[#00D4FF]">AI</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#capabilities" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Capabilities
            </a>
            <a href="#preview" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Preview
            </a>
            <a href="#testimonials" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Customers
            </a>
            <a href="#pricing" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Pricing
            </a>
          </nav>

          <div className="shrink-0">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-[#00D4FF] text-slate-950 font-semibold text-sm hover:bg-[#33ddff] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="max-w-7xl mx-auto px-6 pt-14 pb-16">
        <div className="grid lg:grid-cols-12 gap-10 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-6 flex flex-col justify-center space-y-6"
          >
            <p className="text-sm font-medium text-[#00D4FF] tracking-wide">
              Find the right candidate in seconds, not weeks.
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold leading-[1.08] tracking-tight text-white">
              AI-Powered Hiring Made Smarter
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Streamline recruitment with AI resume parsing, candidate ranking, interview automation, and analytics.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00D4FF] text-slate-950 font-semibold text-sm hover:bg-[#33ddff] transition-colors whitespace-nowrap cursor-pointer"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={continueAsGuest}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1E293B] border border-slate-700 text-white font-semibold text-sm hover:border-[#00D4FF]/60 hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                Continue as Guest
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
              <span>PDF & DOCX Resume Parsing</span>
              <span aria-hidden="true">·</span>
              <span>Weighted AI Ranking</span>
              <span aria-hidden="true">·</span>
              <span>8-Stage Kanban Pipeline</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-800 bg-[#1E293B] min-h-[340px]"
          >
            <img
              src={HERO_IMAGE_URL}
              alt="HireSmart AI modern executive recruiting workspace"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover lg:h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/25 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 bg-[#1E293B]/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#00D4FF] font-medium">Top Ranked Candidate · Senior Full Stack Engineer</p>
                <p className="text-base font-semibold text-white mt-0.5">Rahul Sharma</p>
                <p className="text-xs text-slate-400 mt-0.5">React · NodeJS · MongoDB · AWS · 3 Years Experience</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold font-mono tabular-nums text-[#14F195]">92%</p>
                <p className="text-xs text-slate-400">Match Score</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-Width 4-Column Proof Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80">
          {[
            { metric: '84%', label: 'Faster Resume Screening', detail: 'Automated PDF & DOCX extraction' },
            { metric: '40/20/15', label: 'Transparent AI Scoring', detail: 'Skills, Experience, Projects, Edu, Certs' },
            { metric: '11 Modules', label: 'Unified Recruiting OS', detail: 'Jobs, Kanban, Interviews, Reports' },
            { metric: '12 Days', label: 'Average Time to Hire', detail: 'Down from 38 days manual review' },
          ].map((item) => (
            <div key={item.label} className="bg-[#1E293B]/70 border border-slate-800 rounded-xl p-5">
              <p className="text-2xl font-bold font-mono tabular-nums text-[#00D4FF]">{item.metric}</p>
              <p className="text-sm font-semibold text-white mt-1">{item.label}</p>
              <p className="text-xs text-slate-400 mt-1">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features & Benefits Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-800/70">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl font-bold text-white">Built for high-velocity talent teams</h2>
          <p className="text-slate-300 mt-2">
            Replace fragmented spreadsheets and manual resume triage with structured, explainable hiring workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: FileSearch,
              title: '01. Multimodal Resume Parsing',
              desc: 'Drop single or bulk PDF and DOCX resumes. Extract 18+ structured profile fields, projects, certifications, and resume quality scores.',
            },
            {
              icon: Sparkles,
              title: '02. Weighted AI Ranking',
              desc: 'Transparent scoring across Skills (40%), Experience (20%), Projects (15%), Education (15%), and Certifications (10%).',
            },
            {
              icon: Layers,
              title: '03. 8-Stage Kanban Pipeline',
              desc: 'Drag candidates seamlessly from Applied and Screening through Shortlisted, Interview, Selected, Offer Sent, and Hired.',
            },
            {
              icon: Bot,
              title: '04. Conversational Talent Assistant',
              desc: 'Query your talent pool in plain English to surface React engineers, AWS-certified applicants, or top-scoring candidates.',
            },
            {
              icon: ShieldCheck,
              title: '05. Duplicate Candidate Detector',
              desc: 'Automatically flag matching emails, phone numbers, identical resume signatures, and duplicate job applications.',
            },
            {
              icon: BarChart3,
              title: '06. Executive Hiring Analytics',
              desc: 'Track funnel conversions, skill demand, recruiter throughput, acceptance rates, and export PDF, Excel, or CSV reports.',
            },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-6 hover:border-[#00D4FF]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF] mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feat.title}</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Capabilities Asymmetric Bento Grid */}
      <section id="capabilities" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-800/70">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl font-bold text-white">End-to-end AI recruiting intelligence</h2>
          <p className="text-slate-300 mt-2">
            Every decision is backed by explainable scoring, skill gap diagnostics, and structured interview scorecards.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-[#1E293B]/85 border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#14F195]">Skill Gap & Readiness Engine</p>
              <h3 className="text-2xl font-bold text-white mt-2">Compare job requirements against candidate skills</h3>
              <p className="text-sm text-slate-300 mt-2 max-w-xl">
                Identify matched competencies, missing requirements, readiness percentages, and targeted upskilling courses in seconds.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Matched Skills</p>
                <p className="text-sm font-semibold text-[#14F195] mt-1">React · NodeJS · AWS · MongoDB</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Missing Skills</p>
                <p className="text-sm font-semibold text-amber-400 mt-1">Kubernetes · Terraform</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Readiness Score</p>
                <p className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">94 / 100</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1E293B]/85 border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#6C63FF]">Interview Automation</p>
              <h3 className="text-xl font-bold text-white mt-2">Role & Resume Question Generator</h3>
              <p className="text-sm text-slate-300 mt-2">
                Generate Easy, Medium, and Hard technical, system design, and behavioral prompts tailored to each applicant.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="text-white font-medium">Sample Output · Hard</p>
              <p className="text-slate-400">
                "Design a backpressure-aware NodeJS + MongoDB ingestion queue for 50k concurrent resume uploads on AWS."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Screenshots Preview */}
      <section id="preview" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-800/70">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Live workspace preview</h2>
            <p className="text-slate-300 mt-2">
              Real-time candidate ranking, match breakdowns, and pipeline readiness inside one dark-mode workspace.
            </p>
          </div>
          <button
            onClick={continueAsGuest}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Launch Interactive Demo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#1E293B]/90 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <h3 className="text-base font-semibold text-white">Senior Full Stack Engineer · Ranked Applicants</h3>
                <p className="text-xs text-slate-400">Engineering · Bengaluru / Hybrid · 5 Active Applicants</p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-300">Weights: 40% Skills · 20% Exp · 15% Proj · 15% Edu · 10% Certs</span>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2">
            {[
              {
                rank: '01',
                name: 'Rahul Sharma',
                skills: 'React · NodeJS · MongoDB · AWS',
                exp: '3 Years',
                score: 92,
                color: 'text-[#14F195]',
                stage: 'Interview',
              },
              {
                rank: '02',
                name: 'Priya Patel',
                skills: 'React · TypeScript · Tailwind',
                exp: '2 Years',
                score: 88,
                color: 'text-[#14F195]',
                stage: 'Offer Sent',
              },
              {
                rank: '03',
                name: 'Amit Singh',
                skills: 'NodeJS · Docker · AWS',
                exp: '4 Years',
                score: 85,
                color: 'text-[#14F195]',
                stage: 'Shortlisted',
              },
            ].map((row) => (
              <div key={row.rank} className="py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-slate-400 tabular-nums">{row.rank}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{row.name}</p>
                    <p className="text-xs text-slate-400">{row.skills} · {row.exp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-slate-300">{row.stage}</span>
                  <span className={`text-lg font-bold font-mono tabular-nums ${row.color}`}>{row.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-800/70">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 flex items-center gap-5 bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-6">
            <img
              src={TALENT_LEAD_AVATAR}
              alt="Anjali Deshmukh, VP of Talent Acquisition"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-700"
            />
            <div>
              <p className="text-sm text-slate-200 leading-relaxed">
                "We cut initial engineering resume triage from 14 hours a week to 25 minutes. Candidate ranking and interview scorecards gave our hiring managers immediate clarity."
              </p>
              <p className="text-sm font-semibold text-white mt-3">Anjali Deshmukh</p>
              <p className="text-xs text-slate-400">VP of Talent Acquisition · FinScale Cloud</p>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
            <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-6">
              <p className="text-sm text-slate-200 leading-relaxed">
                "The skill gap breakdown and automated interview questions helped us hire 18 full-stack engineers in Q3 with a 91% offer acceptance rate."
              </p>
              <p className="text-sm font-semibold text-white mt-4">Siddharth Nair</p>
              <p className="text-xs text-slate-400">Head of Engineering · NexaPay</p>
            </div>
            <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-6">
              <p className="text-sm text-slate-200 leading-relaxed">
                "Duplicate detection caught 11% redundant agency submissions in week one, and our recruiters use the AI assistant daily to shortlist."
              </p>
              <p className="text-sm font-semibold text-white mt-4">Elena Rostova</p>
              <p className="text-xs text-slate-400">Director of People Ops · OrbitWorks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing (Demo) Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-800/70">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl font-bold text-white">Transparent plans (Demo)</h2>
          <p className="text-slate-300 mt-2">
            Explore every AI workflow immediately in Guest mode or sign in with Google to save your workspace.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              tier: 'For early-stage teams',
              name: 'Starter',
              price: '$0',
              cadence: 'Demo / Sandbox',
              items: ['Up to 5 active job postings', 'AI Resume Parser (PDF & DOCX)', '8-stage Kanban pipeline', 'Guest workspace access'],
              highlighted: false,
            },
            {
              tier: 'For scaling operations',
              name: 'Growth AI',
              price: '$149',
              cadence: 'per month',
              items: [
                'Unlimited active jobs & candidates',
                'Weighted AI Matching & Skill Gap Engine',
                'AI Interview Question & Summary Generator',
                'PDF, Excel & CSV Executive Reports',
              ],
              highlighted: true,
            },
            {
              tier: 'For enterprise talent orgs',
              name: 'Enterprise',
              price: '$399',
              cadence: 'per month',
              items: [
                'Multi-team workspace isolation',
                'Custom AI scoring weights & rubrics',
                'Automated Email Workflow Templates',
                'Dedicated Gemini throughput & audit logs',
              ],
              highlighted: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border flex flex-col justify-between ${
                plan.highlighted
                  ? 'bg-[#1E293B] border-[#00D4FF]/60'
                  : 'bg-[#1E293B]/70 border-slate-800'
              }`}
            >
              <div>
                <p className="text-xs text-[#00D4FF] font-medium">{plan.tier}</p>
                <h3 className="text-xl font-bold text-white mt-1">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono tabular-nums text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400">{plan.cadence}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-300">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#14F195] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setLoginModalOpen(true)}
                className={`mt-8 w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  plan.highlighted
                    ? 'bg-[#00D4FF] text-slate-950 hover:bg-[#33ddff]'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white font-display">HireSmart AI</span>
            <span aria-hidden="true">·</span>
            <span>Find the right candidate in seconds, not weeks.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#capabilities" className="hover:text-white transition-colors">AI Engine</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <button onClick={continueAsGuest} className="text-[#00D4FF] hover:underline cursor-pointer">
              Continue as Guest
            </button>
          </div>
        </div>
      </footer>

      {/* Login Modal — ONLY Login with Google & Continue as Guest */}
      <AnimatePresence>
        {loginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLoginModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1E293B] border border-slate-700/80 rounded-2xl p-7 shadow-2xl space-y-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-display">Sign in to HireSmart AI</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Access your recruitment pipeline with Google or explore all modules as a Guest.
                  </p>
                </div>
                <button
                  onClick={() => setLoginModalOpen(false)}
                  aria-label="Close modal"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  {isLoggingIn ? 'Signing in...' : 'Login with Google'}
                </button>

                <button
                  onClick={() => {
                    setLoginModalOpen(false);
                    continueAsGuest();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-sm hover:border-[#00D4FF]/60 hover:bg-slate-700/80 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#00D4FF]" />
                  Continue as Guest
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
