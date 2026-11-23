import React, { useMemo, useState } from 'react';
import {
  Copy,
  Edit3,
  Loader2,
  MapPin,
  PauseCircle,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useATS } from '../context/ATSContext';
import type { EmploymentType, Job, JobStatus } from '../types';

const EMPTY_JOB = {
  title: '',
  department: 'Engineering',
  employmentType: 'Full-Time' as EmploymentType,
  experienceRequired: 2,
  salaryRange: '$100,000 - $130,000',
  location: 'Remote',
  requiredSkillsText: 'React, TypeScript, Tailwind',
  preferredSkillsText: 'Next.js, GraphQL',
  educationRequirement: 'B.Tech / B.E. in Computer Science or equivalent',
  description: '',
  responsibilitiesText: '',
  benefitsText: 'Flexible remote work\nHealth insurance\nAnnual learning stipend',
  deadline: '2026-12-31',
  status: 'Published' as JobStatus,
};

export function JobsView() {
  const { jobs, applications, interviews, createJob, updateJob, deleteJob, duplicateJob, setJobStatus } = useATS();
  const [statusFilter, setStatusFilter] = useState<'ALL' | JobStatus>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_JOB);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredJobs = useMemo(() => {
    if (statusFilter === 'ALL') return jobs;
    return jobs.filter((j) => j.status === statusFilter);
  }, [jobs, statusFilter]);

  const openCreateModal = () => {
    setEditingJobId(null);
    setForm(EMPTY_JOB);
    setAiError(null);
    setModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title,
      department: job.department,
      employmentType: job.employmentType,
      experienceRequired: job.experienceRequired,
      salaryRange: job.salaryRange,
      location: job.location,
      requiredSkillsText: job.requiredSkills.join(', '),
      preferredSkillsText: job.preferredSkills.join(', '),
      educationRequirement: job.educationRequirement,
      description: job.description,
      responsibilitiesText: job.responsibilities.join('\n'),
      benefitsText: job.benefits.join('\n'),
      deadline: job.deadline,
      status: job.status,
    });
    setAiError(null);
    setModalOpen(true);
  };

  const handleGenerateAI = async () => {
    if (!form.title.trim()) {
      setAiError('Enter a Job Title first (e.g., Frontend Developer).');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          department: form.department,
          experienceRequired: form.experienceRequired,
          location: form.location,
          employmentType: form.employmentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed.');

      const combinedDesc = [
        data.overview || '',
        data.requirements?.length ? `\nRequirements:\n- ${data.requirements.join('\n- ')}` : '',
        data.qualifications ? `\nQualifications: ${data.qualifications}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      setForm((prev) => ({
        ...prev,
        description: combinedDesc,
        responsibilitiesText: (data.responsibilities || []).join('\n'),
        benefitsText: (data.benefits || []).join('\n'),
        requiredSkillsText: (data.requiredSkills || []).join(', '),
        preferredSkillsText: (data.preferredSkills || []).join(', '),
        educationRequirement: data.qualifications || prev.educationRequirement,
        salaryRange: data.salaryRange || prev.salaryRange,
      }));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate job description.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        department: form.department.trim() || 'Engineering',
        employmentType: form.employmentType,
        experienceRequired: Number(form.experienceRequired) || 0,
        salaryRange: form.salaryRange.trim(),
        location: form.location.trim(),
        requiredSkills: form.requiredSkillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        preferredSkills: form.preferredSkillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        educationRequirement: form.educationRequirement.trim(),
        description: form.description.trim() || `Role opening for ${form.title.trim()}.`,
        responsibilities: form.responsibilitiesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        benefits: form.benefitsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        deadline: form.deadline,
        status: form.status,
      };

      if (editingJobId) {
        await updateJob(editingJobId, payload);
      } else {
        await createJob(payload);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create requisitions, generate structured descriptions with AI, and manage hiring status.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00D4FF] text-slate-950 font-semibold text-sm hover:bg-[#33ddff] transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-[#1E293B] rounded-xl w-fit border border-slate-200 dark:border-slate-800">
        {(['ALL', 'Published', 'Paused', 'Draft', 'Closed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === status
                ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {status === 'ALL' ? `All (${jobs.length})` : status}
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B]/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900 dark:text-white">No jobs in this filter</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create a new requisition or switch status filter.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-[#00D4FF] text-slate-950 text-sm font-semibold cursor-pointer"
          >
            Create Job
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => {
            const jobApps = applications.filter((a) => a.jobId === job.id);
            const applicantCount = jobApps.length;
            const shortlistedCount = jobApps.filter((a) =>
              ['Shortlisted', 'Interview', 'Selected', 'Offer Sent', 'Hired'].includes(a.stage)
            ).length;
            const interviewCount = interviews.filter((iv) => iv.jobId === job.id).length;
            const offerCount = jobApps.filter((a) => a.stage === 'Offer Sent' || a.stage === 'Hired').length;
            const hiredCount = jobApps.filter((a) => a.stage === 'Hired').length;
            const successRate = applicantCount > 0 ? Math.round((hiredCount / applicantCount) * 100) : 0;

            const statusTone =
              job.status === 'Published'
                ? 'text-[#14F195]'
                : job.status === 'Paused'
                ? 'text-amber-400'
                : job.status === 'Closed'
                ? 'text-rose-400'
                : 'text-slate-400';

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{job.department}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.employmentType}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold ${statusTone}`}>{job.status}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{job.title}</h3>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#00D4FF] shrink-0">
                      {applicantCount} applicants
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                    <span className="font-mono tabular-nums">{job.experienceRequired}+ yrs exp</span>
                    <span className="font-mono tabular-nums">{job.salaryRange}</span>
                    <span>Deadline: {job.deadline}</span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{job.description}</p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Required Skills:</span>{' '}
                    {job.requiredSkills.join(' · ')}
                  </p>

                  {/* Job Performance Analytics */}
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {[
                      { label: 'Applied', value: applicantCount, color: 'text-slate-900 dark:text-white' },
                      { label: 'Shortlisted', value: shortlistedCount, color: 'text-[#6C63FF]' },
                      { label: 'Interviews', value: interviewCount, color: 'text-[#00D4FF]' },
                      { label: 'Offers', value: offerCount, color: 'text-amber-400' },
                      { label: 'Success', value: `${successRate}%`, color: 'text-[#14F195]' },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center"
                      >
                        <p className="text-[10px] text-slate-400">{stat.label}</p>
                        <p className={`text-xs font-bold font-mono tabular-nums mt-0.5 ${stat.color}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(job)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00D4FF] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => duplicateJob(job)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#00D4FF] cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>
                    {job.status !== 'Published' ? (
                      <button
                        onClick={() => setJobStatus(job.id, 'Published')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-[#14F195] cursor-pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => setJobStatus(job.id, 'Paused')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-amber-400 cursor-pointer"
                      >
                        <PauseCircle className="w-3.5 h-3.5" /> Pause
                      </button>
                    )}
                    {job.status !== 'Closed' && (
                      <button
                        onClick={() => setJobStatus(job.id, 'Closed')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Close
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => deleteJob(job.id)}
                    aria-label="Delete job"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Job Modal with AI Job Description Generator */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingJobId ? 'Edit Job Requisition' : 'Create Job & AI Description Generator'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter a role title (e.g. Frontend Developer) and click Generate with AI to populate all sections.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close job modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-5 max-h-[75vh] overflow-y-auto pr-1">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Job Title</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Frontend Developer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6C63FF] text-white font-semibold text-xs sm:text-sm hover:opacity-90 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiLoading ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">{aiError}</div>
              )}

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Department</label>
                  <input
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Employment Type</label>
                  <select
                    value={form.employmentType}
                    onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                  >
                    {['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Remote'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">
                    Experience Required (yrs)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={form.experienceRequired}
                    onChange={(e) => setForm({ ...form, experienceRequired: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Salary Range</label>
                  <input
                    value={form.salaryRange}
                    onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">
                    Required Skills (comma separated)
                  </label>
                  <input
                    value={form.requiredSkillsText}
                    onChange={(e) => setForm({ ...form, requiredSkillsText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">
                    Preferred Skills (comma separated)
                  </label>
                  <input
                    value={form.preferredSkillsText}
                    onChange={(e) => setForm({ ...form, preferredSkillsText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">
                  Education Requirement
                </label>
                <input
                  value={form.educationRequirement}
                  onChange={(e) => setForm({ ...form, educationRequirement: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">
                  Job Description (Overview & Requirements)
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">
                    Responsibilities (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={form.responsibilitiesText}
                    onChange={(e) => setForm({ ...form, responsibilitiesText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">
                    Benefits (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={form.benefitsText}
                    onChange={(e) => setForm({ ...form, benefitsText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-sm"
                >
                  {['Published', 'Draft', 'Paused', 'Closed'].map((s) => (
                    <option key={s} value={s}>
                      Status: {s}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-[#00D4FF] text-slate-950 font-semibold text-sm hover:bg-[#33ddff] disabled:opacity-60 cursor-pointer"
                  >
                    {saving ? 'Saving...' : editingJobId ? 'Save Changes' : 'Publish Job'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
