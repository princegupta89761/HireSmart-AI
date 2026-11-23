import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import type { Application, Candidate, Job, MatchBreakdown } from '../types';

const COURSE_CATALOG: Record<string, { course: string; provider: string; duration: string }> = {
  react: { course: 'Advanced React Patterns & Concurrent UI', provider: 'Frontend Masters', duration: '12 hrs' },
  typescript: { course: 'TypeScript Type-Level Engineering', provider: 'Total TypeScript', duration: '10 hrs' },
  nodejs: { course: 'Node.js Distributed Services & Streams', provider: 'Coursera', duration: '14 hrs' },
  aws: { course: 'AWS Certified Developer Associate Lab', provider: 'AWS Skill Builder', duration: '24 hrs' },
  docker: { course: 'Docker & Production Containerization', provider: 'KodeKloud', duration: '8 hrs' },
  kubernetes: { course: 'Kubernetes Application Deployment', provider: 'Linux Foundation', duration: '16 hrs' },
  mongodb: { course: 'MongoDB Data Modeling & Aggregation', provider: 'MongoDB University', duration: '9 hrs' },
  graphql: { course: 'GraphQL Federation & Schema Design', provider: 'Apollo Odyssey', duration: '6 hrs' },
  tailwind: { course: 'Modern Design Systems with Tailwind CSS', provider: 'UI.dev', duration: '5 hrs' },
  python: { course: 'Python Backend & Async FastAPI', provider: 'DeepLearning.AI', duration: '11 hrs' },
};

export function normalizeSkill(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Exact Weighted Match Formula:
 * Skills Match = 40%
 * Experience Match = 20%
 * Projects Match = 15%
 * Education Match = 15%
 * Certification Match = 10%
 */
export function calculateCandidateMatch(candidate: Candidate, job: Job): MatchBreakdown {
  const reqSkills = job.requiredSkills.length ? job.requiredSkills : ['React', 'TypeScript'];
  const candNormalized = new Set(candidate.skills.map(normalizeSkill));

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of reqSkills) {
    if (candNormalized.has(normalizeSkill(skill))) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Bonus check from preferred skills
  let preferredHits = 0;
  for (const pref of job.preferredSkills) {
    if (candNormalized.has(normalizeSkill(pref))) preferredHits++;
  }

  const baseSkillsRatio = matchedSkills.length / reqSkills.length;
  const prefBonus = job.preferredSkills.length ? (preferredHits / job.preferredSkills.length) * 12 : 0;
  const skillsMatch = Math.min(100, Math.round(baseSkillsRatio * 90 + prefBonus));

  // Experience Match (20%)
  const reqExp = Math.max(1, job.experienceRequired || 1);
  const expRatio = candidate.experienceYears / reqExp;
  const experienceMatch = Math.min(100, Math.round(expRatio >= 1 ? 88 + Math.min(12, (expRatio - 1) * 10) : expRatio * 85));

  // Projects Match (15%)
  const projectCount = candidate.projects?.length || 0;
  const projectTechMatches = (candidate.projects || []).filter((p) =>
    p.techStack.some((t) => reqSkills.some((r) => normalizeSkill(r) === normalizeSkill(t)))
  ).length;
  const projectsMatch = Math.min(
    100,
    Math.round((projectCount > 0 ? 55 : 25) + projectTechMatches * 22)
  );

  // Education Match (15%)
  const hasDegree = Boolean(candidate.degree && candidate.degree.trim().length > 0);
  const eduText = `${candidate.degree} ${candidate.collegeName}`.toLowerCase();
  const isStem = /b\.tech|b\.e|m\.tech|computer|engineering|b\.s|m\.s|mca|bca|cs/i.test(eduText);
  const educationMatch = hasDegree ? (isStem ? 92 : 76) : 50;

  // Certification Match (10%)
  const certCount = candidate.certifications?.length || 0;
  const certificationMatch = Math.min(100, certCount === 0 ? 45 : 70 + certCount * 15);

  const overallScore = Math.min(
    100,
    Math.round(
      skillsMatch * 0.4 +
        experienceMatch * 0.2 +
        projectsMatch * 0.15 +
        educationMatch * 0.15 +
        certificationMatch * 0.1
    )
  );

  const recommendedCourses = missingSkills.slice(0, 4).map((skill) => {
    const entry = COURSE_CATALOG[normalizeSkill(skill)];
    return {
      skill,
      course: entry?.course || `${skill} Production Mastery`,
      provider: entry?.provider || 'Coursera / Udemy',
      duration: entry?.duration || '8 hrs',
    };
  });

  const readinessScore = Math.min(100, Math.round(overallScore * 0.85 + (missingSkills.length === 0 ? 15 : 5)));

  const topSkills = matchedSkills.slice(0, 4).join(', ') || candidate.skills.slice(0, 3).join(', ');
  const tierLabel =
    overallScore >= 80
      ? 'is highly recommended'
      : overallScore >= 60
      ? 'is a solid contender'
      : 'requires upskilling';

  const recommendation = `${candidate.fullName} ${tierLabel} because the candidate possesses ${topSkills} skills and has ${candidate.experienceYears} years of relevant experience${
    missingSkills.length > 0 ? `, with minor skill gaps in ${missingSkills.slice(0, 2).join(', ')}.` : '.'
  }`;

  return {
    skillsMatch,
    experienceMatch,
    projectsMatch,
    educationMatch,
    certificationMatch,
    overallScore,
    matchedSkills,
    missingSkills,
    recommendedCourses,
    readinessScore,
    recommendation,
  };
}

export function getScoreColorClasses(score: number): {
  text: string;
  bar: string;
  surface: string;
  label: string;
} {
  if (score >= 80) {
    return {
      text: 'text-[#14F195]',
      bar: 'bg-[#14F195]',
      surface: 'border-[#14F195]/30 bg-[#14F195]/10',
      label: 'Strong Match',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-amber-400',
      bar: 'bg-amber-400',
      surface: 'border-amber-400/30 bg-amber-400/10',
      label: 'Moderate Match',
    };
  }
  return {
    text: 'text-rose-400',
    bar: 'bg-rose-400',
    surface: 'border-rose-400/30 bg-rose-400/10',
    label: 'Low Match',
  };
}

export interface DuplicateFlag {
  candidateId: string;
  candidateName: string;
  reason: 'Same Email' | 'Same Phone' | 'Same Resume' | 'Duplicate Application';
  matchedWithId: string;
  matchedWithName: string;
  detail: string;
}

export function detectDuplicates(
  candidates: Candidate[],
  applications: Application[]
): DuplicateFlag[] {
  const flags: DuplicateFlag[] = [];
  const seenKey = new Set<string>();

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];

      if (a.email && b.email && a.email.trim().toLowerCase() === b.email.trim().toLowerCase()) {
        const key = `email-${a.id}-${b.id}`;
        if (!seenKey.has(key)) {
          seenKey.add(key);
          flags.push({
            candidateId: b.id,
            candidateName: b.fullName,
            reason: 'Same Email',
            matchedWithId: a.id,
            matchedWithName: a.fullName,
            detail: a.email,
          });
        }
      }

      const normPhoneA = a.phone.replace(/\D/g, '');
      const normPhoneB = b.phone.replace(/\D/g, '');
      if (normPhoneA.length >= 7 && normPhoneA === normPhoneB) {
        const key = `phone-${a.id}-${b.id}`;
        if (!seenKey.has(key)) {
          seenKey.add(key);
          flags.push({
            candidateId: b.id,
            candidateName: b.fullName,
            reason: 'Same Phone',
            matchedWithId: a.id,
            matchedWithName: a.fullName,
            detail: a.phone,
          });
        }
      }

      const textA = a.resumeText.trim().toLowerCase().slice(0, 240);
      const textB = b.resumeText.trim().toLowerCase().slice(0, 240);
      if (textA.length > 60 && textA === textB) {
        const key = `resume-${a.id}-${b.id}`;
        if (!seenKey.has(key)) {
          seenKey.add(key);
          flags.push({
            candidateId: b.id,
            candidateName: b.fullName,
            reason: 'Same Resume',
            matchedWithId: a.id,
            matchedWithName: a.fullName,
            detail: 'Identical resume signature detected',
          });
        }
      }
    }
  }

  // Duplicate applications (same candidateId + same jobId)
  const appMap = new Map<string, Application>();
  for (const app of applications) {
    const pairKey = `${app.candidateId}::${app.jobId}`;
    const prev = appMap.get(pairKey);
    if (prev) {
      const cand = candidates.find((c) => c.id === app.candidateId);
      flags.push({
        candidateId: app.candidateId,
        candidateName: cand?.fullName || app.candidateId,
        reason: 'Duplicate Application',
        matchedWithId: prev.id,
        matchedWithName: cand?.fullName || prev.candidateId,
        detail: `Multiple applications for Job ${app.jobId}`,
      });
    } else {
      appMap.set(pairKey, app);
    }
  }

  return flags;
}

export function exportRowsAsCSV(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportRowsAsExcel(filename: string, sheetName: string, rows: Record<string, string | number>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportReportAsPDF(title: string, subtitle: string, rows: Record<string, string | number>[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 595, 84, 'F');
  doc.setTextColor(0, 212, 255);
  doc.setFontSize(18);
  doc.text('HireSmart AI', 40, 36);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(title, 40, 58);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.text(`${subtitle} · Generated ${new Date().toLocaleDateString()}`, 40, 74);

  let y = 112;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);

  if (rows.length === 0) {
    doc.text('No records available for this report.', 40, y);
  } else {
    const headers = Object.keys(rows[0]);
    doc.setFont('helvetica', 'bold');
    doc.text(headers.join('  |  ').slice(0, 95), 40, y);
    y += 14;
    doc.setDrawColor(203, 213, 225);
    doc.line(40, y, 555, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    for (const row of rows.slice(0, 34)) {
      const line = headers.map((h) => String(row[h] ?? '')).join('  |  ');
      const wrapped = doc.splitTextToSize(line, 515);
      if (y + wrapped.length * 12 > 790) {
        doc.addPage();
        y = 48;
      }
      doc.text(wrapped, 40, y);
      y += wrapped.length * 13 + 6;
    }
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}

import type {
  CandidateInsightsResult,
  FraudAlert,
  InterviewFeedback,
  PredictiveSuccessReport,
  ResumeFraudReport,
  SalaryEstimate,
} from '../types';

export function generateLocalInsights(candidate: Candidate, job?: Job): CandidateInsightsResult {
  const match = job ? calculateCandidateMatch(candidate, job) : null;
  const strengths = match?.matchedSkills.length
    ? match.matchedSkills.slice(0, 4)
    : candidate.skills.slice(0, 4);
  const weaknesses = match?.missingSkills.length
    ? match.missingSkills.slice(0, 3)
    : ['System Design Depth', 'Kubernetes'].filter((s) => !candidate.skills.includes(s)).slice(0, 2);

  const readinessScore = match ? match.readinessScore : Math.min(98, Math.round((candidate.matchScore + candidate.resumeScore) / 2));
  const hiringRecommendation =
    readinessScore >= 82
      ? 'Strong candidate for technical interview.'
      : readinessScore >= 68
      ? 'Recommended for initial technical screening.'
      : 'Hold for alternative junior openings or upskilling.';

  return {
    readinessScore,
    strengths,
    weaknesses,
    technicalSkillSummary: `Proficient across ${candidate.skills.slice(0, 5).join(', ')} with ${candidate.projects?.length || 1} verified project implementations.`,
    experienceSummary: `${candidate.experienceYears} years of industry experience across ${
      candidate.previousCompanies.join(', ') || 'engineering teams'
    }.`,
    hiringRecommendation,
  };
}

export function detectResumeFraud(candidate: Candidate): ResumeFraudReport {
  const alerts: FraudAlert[] = [];

  // 1. Skill exaggeration: e.g. >= 10 skills with <= 1 year experience
  if (candidate.skills.length >= 10 && candidate.experienceYears <= 1) {
    alerts.push({
      type: 'Skill Exaggeration',
      severity: 'High',
      detail: `${candidate.skills.length} advanced skills claimed with only ${candidate.experienceYears} year(s) of experience.`,
    });
  }

  // 2. Duplicate companies
  const companyNorm = candidate.previousCompanies.map((c) => c.trim().toLowerCase()).filter(Boolean);
  if (new Set(companyNorm).size < companyNorm.length) {
    alerts.push({
      type: 'Duplicate Companies',
      severity: 'Medium',
      detail: 'Repeated employer entry detected across employment history.',
    });
  }

  // 3. Overlapping / Inconsistent dates in experience
  const yearsSeen: { start: number; end: number; company: string }[] = [];
  for (const exp of candidate.experience || []) {
    const matches = exp.duration.match(/\b(19|20)\d{2}\b/g);
    const isPresent = /present|current/i.test(exp.duration);
    if (!matches || matches.length === 0) {
      alerts.push({
        type: 'Inconsistent Dates',
        severity: 'Medium',
        detail: `Unstructured or missing date range for ${exp.company || exp.role}.`,
      });
    } else {
      const start = Number(matches[0]);
      const end = isPresent ? 2026 : Number(matches[1] || matches[0]);
      if (end < start) {
        alerts.push({
          type: 'Inconsistent Dates',
          severity: 'High',
          detail: `End year (${end}) precedes start year (${start}) at ${exp.company}.`,
        });
      }
      for (const prev of yearsSeen) {
        if (start < prev.end && end > prev.start && prev.company !== exp.company) {
          alerts.push({
            type: 'Overlapping Experiences',
            severity: 'Medium',
            detail: `Timeline overlap between ${prev.company} (${prev.start}-${prev.end}) and ${exp.company} (${start}-${end}).`,
          });
        }
      }
      yearsSeen.push({ start, end, company: exp.company });
    }
  }

  // 4. Missing employment details
  if (candidate.experienceYears >= 2 && (!candidate.experience || candidate.experience.length === 0)) {
    alerts.push({
      type: 'Missing Employment Details',
      severity: 'High',
      detail: `${candidate.experienceYears} years claimed without itemized role history.`,
    });
  }

  const highCount = alerts.filter((a) => a.severity === 'High').length;
  const riskLevel: 'Low' | 'Medium' | 'High' = highCount > 0 ? 'High' : alerts.length > 0 ? 'Medium' : 'Low';
  const confidenceScore = alerts.length === 0 ? 96 : Math.max(55, 92 - alerts.length * 11);

  return { riskLevel, confidenceScore, alerts };
}

export function estimateSalaryLocally(candidate: Candidate): SalaryEstimate {
  const isIndia = /india|mumbai|bengaluru|bangalore|pune|hyderabad|delhi|noida|chennai/i.test(
    candidate.location || ''
  );
  const exp = Math.max(0, candidate.experienceYears);
  const hasPremiumSkill = candidate.skills.some((s) =>
    /aws|kubernetes|terraform|ai|ml|system|react|nodejs/i.test(s)
  );
  const hasPremierEdu = /iit|nit|bits|iiit|mit|stanford/i.test(candidate.collegeName || '');

  if (isIndia) {
    const baseLpa = 8 + exp * 4.5 + (hasPremiumSkill ? 3 : 0) + (hasPremierEdu ? 2.5 : 0);
    const min = Math.round(baseLpa);
    const max = Math.round(baseLpa * 1.28);
    const med = Math.round((min + max) / 2);
    return {
      minSalary: `₹${min} LPA`,
      maxSalary: `₹${max} LPA`,
      currency: 'INR',
      marketMedian: `₹${med} LPA`,
      rationale: `Calibrated for ${exp} yrs experience in ${candidate.location || 'India'} with ${candidate.skills
        .slice(0, 4)
        .join(', ')}.`,
    };
  }

  const baseUsd = 85 + exp * 16 + (hasPremiumSkill ? 14 : 0) + (hasPremierEdu ? 8 : 0);
  const min = Math.round(baseUsd) * 1000;
  const max = Math.round(baseUsd * 1.24) * 1000;
  const med = Math.round((min + max) / 2);
  return {
    minSalary: `$${min.toLocaleString()}`,
    maxSalary: `$${max.toLocaleString()}`,
    currency: 'USD',
    marketMedian: `$${med.toLocaleString()}`,
    rationale: `Benchmarked for ${exp} yrs experience in ${candidate.location || 'Remote'} across ${candidate.skills
      .slice(0, 4)
      .join(', ')}.`,
  };
}

export function predictHiringSuccess(
  candidate: Candidate,
  job?: Job,
  feedbackList: InterviewFeedback[] = []
): PredictiveSuccessReport {
  const candFeedback = feedbackList.filter((f) => f.candidateId === candidate.id);
  const avgInterview = candFeedback.length
    ? candFeedback.reduce((acc, f) => acc + f.overallScore, 0) / candFeedback.length
    : candidate.matchScore;

  const prob = Math.min(
    97,
    Math.max(
      28,
      Math.round(candidate.matchScore * 0.55 + candidate.resumeScore * 0.2 + avgInterview * 0.25)
    )
  );
  const riskLevel: 'Low' | 'Medium' | 'High' = prob >= 78 ? 'Low' : prob >= 60 ? 'Medium' : 'High';
  const recommendation =
    prob >= 80
      ? 'Proceed to final interview / offer extension.'
      : prob >= 62
      ? 'Proceed with structured technical deep-dive round.'
      : 'High onboarding gap risk; consider talent pool nurture.';

  const keyDrivers = [
    `${candidate.matchScore}% role alignment${job ? ` for ${job.title}` : ''}`,
    `${candidate.experienceYears} years domain tenure with ${candidate.certifications.length} certifications`,
    candFeedback.length > 0
      ? `Verified interview scorecard average: ${Math.round(avgInterview)}/100`
      : `Resume structural quality score: ${candidate.resumeScore}/100`,
  ];

  return { successProbability: prob, riskLevel, recommendation, keyDrivers };
}

export function runLocalSmartSearch(query: string, candidates: Candidate[]): Candidate[] {
  const q = query.trim().toLowerCase();
  if (!q) return candidates;

  // Extract years constraint like "3+ years" or "3 years"
  const expMatch = q.match(/(\d+)\s*\+?\s*(?:years|yrs|year|yr)/);
  const minExp = expMatch ? Number(expMatch[1]) : null;

  // Known city tokens
  const cities = ['mumbai', 'bengaluru', 'bangalore', 'pune', 'hyderabad', 'delhi', 'remote', 'chennai', 'noida'];
  const cityFilter = cities.find((c) => q.includes(c));

  // Extract meaningful tokens excluding stop words
  const stopWords = new Set([
    'find',
    'show',
    'candidates',
    'candidate',
    'developers',
    'developer',
    'engineers',
    'engineer',
    'applicants',
    'with',
    'and',
    'or',
    'from',
    'in',
    'who',
    'have',
    'has',
    'experience',
    'years',
    'year',
    'yrs',
    'top',
    'best',
    'for',
    'the',
    'all',
  ]);
  const tokens = q
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stopWords.has(t) && !/^\d+\+?$/.test(t) && t !== cityFilter);

  return candidates
    .filter((c) => {
      if (minExp !== null && c.experienceYears < minExp) return false;
      if (cityFilter) {
        const loc = (c.location || '').toLowerCase();
        const cityAlt = cityFilter === 'bangalore' ? 'bengaluru' : cityFilter;
        if (!loc.includes(cityFilter) && !loc.includes(cityAlt)) return false;
      }
      if (tokens.length > 0) {
        const haystack = [
          c.fullName,
          c.location,
          c.degree,
          c.collegeName,
          ...c.skills,
          ...c.certifications,
          ...c.previousCompanies,
        ]
          .join(' ')
          .toLowerCase();
        return tokens.every((tok) => haystack.includes(tok));
      }
      return true;
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function suggestRejectionReason(candidate: Candidate, job?: Job): { category: string; reason: string } {
  if (!job) {
    return {
      category: 'Low Match Score',
      reason: `${candidate.fullName}'s profile scored ${candidate.matchScore}% below the shortlist threshold.`,
    };
  }
  const match = calculateCandidateMatch(candidate, job);
  if (job.status === 'Closed') {
    return {
      category: 'Position Closed',
      reason: `The ${job.title} requisition has been closed after final selection.`,
    };
  }
  if (candidate.experienceYears < job.experienceRequired) {
    return {
      category: 'Insufficient Experience',
      reason: `Role requires ${job.experienceRequired}+ years experience; candidate currently has ${candidate.experienceYears} years.`,
    };
  }
  if (match.missingSkills.length > 0) {
    return {
      category: 'Missing Required Skills',
      reason: `Missing core required skills for ${job.title}: ${match.missingSkills.join(', ')}.`,
    };
  }
  return {
    category: 'Low Match Score',
    reason: `Overall weighted score (${match.overallScore}%) ranked below shortlisted finalist cohort.`,
  };
}

