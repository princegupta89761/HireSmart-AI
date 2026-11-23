export type NavModule =
  | 'dashboard'
  | 'jobs'
  | 'candidates'
  | 'applications'
  | 'resume-parser'
  | 'ai-recommendations'
  | 'interview-center'
  | 'talent-pool'
  | 'leaderboard'
  | 'analytics'
  | 'assistant'
  | 'reports'
  | 'settings';

export type JobStatus = 'Published' | 'Paused' | 'Closed' | 'Draft';
export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship' | 'Remote';

export type PipelineStage =
  | 'Applied'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview'
  | 'Selected'
  | 'Offer Sent'
  | 'Hired'
  | 'Rejected';

export const PIPELINE_STAGES: PipelineStage[] = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview',
  'Selected',
  'Offer Sent',
  'Hired',
  'Rejected',
];

export type InterviewMode = 'Online' | 'Offline';
export type InterviewStatus = 'Scheduled' | 'Completed' | 'Rescheduled' | 'Cancelled';

export type NotificationType =
  | 'New Application'
  | 'Interview Reminder'
  | 'Job Expiry'
  | 'Candidate Shortlisted'
  | 'Offer Accepted'
  | 'Rejected Candidate';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  organization: string;
  isGuest: boolean;
}

export interface Job {
  id: string;
  ownerId: string;
  title: string;
  department: string;
  employmentType: EmploymentType;
  experienceRequired: number;
  salaryRange: string;
  location: string;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirement: string;
  description: string;
  responsibilities: string[];
  benefits: string[];
  deadline: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProject {
  title: string;
  description: string;
  techStack: string[];
}

export interface CandidateExperienceItem {
  role: string;
  company: string;
  duration: string;
  highlights: string;
}

export interface CandidateEducationItem {
  degree: string;
  institution: string;
  year: string;
  grade: string;
}

export interface CandidateActivityEvent {
  stage: string;
  date: string;
  note: string;
}

export interface Candidate {
  id: string;
  ownerId: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  collegeName: string;
  degree: string;
  skills: string[];
  experienceYears: number;
  previousCompanies: string[];
  certifications: string[];
  languages: string[];
  achievements: string[];
  projects: CandidateProject[];
  experience: CandidateExperienceItem[];
  education: CandidateEducationItem[];
  optimizationSuggestions: string[];
  resumeScore: number;
  matchScore: number;
  source: string;
  resumeText: string;
  avatarUrl?: string;
  isFavorite?: boolean;
  isPriority?: boolean;
  isWatchlist?: boolean;
  inTalentPool?: boolean;
  activityTimeline?: CandidateActivityEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  ownerId: string;
  jobId: string;
  candidateId: string;
  stage: PipelineStage;
  matchScore: number;
  appliedAt: string;
  aiExplanation: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  ownerId: string;
  candidateId: string;
  jobId: string;
  date: string;
  time: string;
  interviewer: string;
  mode: InterviewMode;
  status: InterviewStatus;
  meetingLink: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewFeedback {
  id: string;
  ownerId: string;
  interviewId: string;
  candidateId: string;
  communication: number;
  technicalSkills: number;
  problemSolving: number;
  leadership: number;
  teamwork?: number;
  cultureFit: number;
  overallScore: number;
  notes: string;
  aiSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  ownerId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  ownerId: string;
  reportType: 'Candidate Report' | 'Hiring Report' | 'Interview Report' | 'Analytics Report';
  title: string;
  format: 'PDF' | 'Excel' | 'CSV';
  createdAt: string;
}

export interface WorkspaceSettings {
  ownerId: string;
  organizationName: string;
  theme: 'dark' | 'light';
  autoScreenThreshold: number;
  emailNotifications: boolean;
  updatedAt: string;
}

export interface MatchBreakdown {
  skillsMatch: number;
  experienceMatch: number;
  projectsMatch: number;
  educationMatch: number;
  certificationMatch: number;
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendedCourses: { skill: string; course: string; provider: string; duration: string }[];
  readinessScore: number;
  recommendation: string;
}

export interface GeneratedQuestion {
  category: 'React / Frontend' | 'NodeJS / Backend' | 'System Design' | 'Behavioral' | 'Role Specific';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  expectedKeyPoints: string[];
}

export interface CandidateInsightsResult {
  readinessScore: number;
  strengths: string[];
  weaknesses: string[];
  technicalSkillSummary: string;
  experienceSummary: string;
  hiringRecommendation: string;
}

export interface FraudAlert {
  type:
    | 'Skill Exaggeration'
    | 'Duplicate Companies'
    | 'Inconsistent Dates'
    | 'Overlapping Experiences'
    | 'Missing Employment Details';
  severity: 'Low' | 'Medium' | 'High';
  detail: string;
}

export interface ResumeFraudReport {
  riskLevel: 'Low' | 'Medium' | 'High';
  confidenceScore: number;
  alerts: FraudAlert[];
}

export interface SalaryEstimate {
  minSalary: string;
  maxSalary: string;
  currency: string;
  marketMedian: string;
  rationale: string;
}

export interface PredictiveSuccessReport {
  successProbability: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendation: string;
  keyDrivers: string[];
}
