import type {
  Application,
  Candidate,
  Interview,
  InterviewFeedback,
  Job,
  NotificationItem,
  PipelineStage,
  ReportRecord,
  WorkspaceSettings,
} from '../types';

export const HERO_IMAGE_URL = '/src/assets/images/hero_recruiting_workspace_1795405662246.jpg';
export const TALENT_LEAD_AVATAR = '/src/assets/images/avatar_talent_lead_1795405661640.jpg';

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Arjun', 'Ayush', 'Bhavna', 'Chetan', 'Deepak', 'Devika',
  'Divya', 'Gaurav', 'Harsh', 'Ishaan', 'Jhanvi', 'Kabir', 'Kajal', 'Kartik', 'Kavya', 'Kiran',
  'Kriti', 'Lakshay', 'Madhav', 'Manish', 'Meera', 'Mihir', 'Nandini', 'Nikhil', 'Nisha', 'Omkar',
  'Pallavi', 'Parth', 'Pranav', 'Prashant', 'Radhika', 'Raghav', 'Rajat', 'Riya', 'Rohan', 'Roshni',
  'Sagar', 'Sahil', 'Sakshi', 'Samarth', 'Sanya', 'Shruti', 'Siddharth', 'Simran', 'Sneha', 'Soham',
  'Tanvi', 'Tarun', 'Tushar', 'Uday', 'Vaibhav', 'Varun', 'Vedant', 'Vidya', 'Vikram', 'Yash',
];

const LAST_NAMES = [
  'Agarwal', 'Bansal', 'Bhatia', 'Chauhan', 'Choudhary', 'Desai', 'Deshmukh', 'Dubey', 'Garg', 'Ghosh',
  'Goel', 'Gupta', 'Iyer', 'Jain', 'Joshi', 'Kapoor', 'Khanna', 'Kulkarni', 'Malhotra', 'Mehta',
  'Mishra', 'Nair', 'Pandey', 'Patel', 'Pillai', 'Rao', 'Reddy', 'Saxena', 'Sen', 'Sharma',
  'Shukla', 'Singh', 'Sinha', 'Srivastava', 'Subramanian', 'Thakur', 'Tiwari', 'Trivedi', 'Varma', 'Verma',
];

const CITIES = [
  'Bengaluru, India',
  'Mumbai, India',
  'Pune, India',
  'Hyderabad, India',
  'Delhi NCR, India',
  'Chennai, India',
  'Remote',
];

const COLLEGES = [
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Roorkee', 'NIT Trichy', 'NIT Surat',
  'BITS Pilani', 'IIIT Hyderabad', 'DTU Delhi', 'VIT Vellore', 'COEP Pune', 'RVCE Bengaluru',
];

const COMPANIES = [
  'Razorpay', 'Flipkart', 'Swiggy', 'CRED', 'Zomato', 'Freshworks', 'BrowserStack',
  'Chargebee', 'Postman', 'Zerodha', 'Paytm', 'Atlassian', 'Microsoft India', 'Amazon',
];

const SKILL_TRACKS = [
  ['React', 'NodeJS', 'MongoDB', 'AWS', 'TypeScript', 'Docker'],
  ['React', 'TypeScript', 'Tailwind', 'Next.js', 'GraphQL', 'Figma'],
  ['NodeJS', 'Docker', 'AWS', 'Kubernetes', 'Terraform', 'PostgreSQL'],
  ['Python', 'FastAPI', 'PyTorch', 'AWS', 'Docker', 'PostgreSQL'],
  ['Java', 'Spring Boot', 'Kafka', 'AWS', 'MySQL', 'Kubernetes'],
  ['React Native', 'TypeScript', 'GraphQL', 'Firebase', 'Swift'],
  ['React', 'NodeJS', 'AWS', 'Redis', 'CI/CD', 'TypeScript'],
];

const CERTIFICATIONS_POOL = [
  'AWS Certified Developer - Associate',
  'AWS Certified Solutions Architect',
  'CKA (Certified Kubernetes Administrator)',
  'MongoDB Certified Developer',
  'Google Cloud Professional Architect',
  'Meta Front-End Developer Professional',
];

export function buildDemoData(ownerId: string): {
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  interviews: Interview[];
  feedback: InterviewFeedback[];
  notifications: NotificationItem[];
  reports: ReportRecord[];
  settings: WorkspaceSettings;
} {
  const now = new Date().toISOString();

  // 15 Jobs for TechNova Solutions
  const jobSpecs: Array<{
    id: string;
    title: string;
    dept: string;
    type: Job['employmentType'];
    exp: number;
    salary: string;
    loc: string;
    req: string[];
    pref: string[];
    status: Job['status'];
  }> = [
    {
      id: 'job_fullstack',
      title: 'Senior Full Stack Engineer',
      dept: 'Engineering',
      type: 'Full-Time',
      exp: 3,
      salary: '$135,000 - $165,000',
      loc: 'Bengaluru / Hybrid',
      req: ['React', 'NodeJS', 'MongoDB', 'AWS', 'TypeScript'],
      pref: ['Docker', 'GraphQL', 'CI/CD'],
      status: 'Published',
    },
    {
      id: 'job_frontend',
      title: 'Frontend Developer',
      dept: 'Product Engineering',
      type: 'Full-Time',
      exp: 2,
      salary: '$105,000 - $130,000',
      loc: 'Remote',
      req: ['React', 'TypeScript', 'Tailwind', 'Next.js'],
      pref: ['Framer Motion', 'GraphQL', 'Vitest'],
      status: 'Published',
    },
    {
      id: 'job_devops',
      title: 'Cloud Infrastructure Engineer',
      dept: 'Platform & SRE',
      type: 'Full-Time',
      exp: 4,
      salary: '$145,000 - $175,000',
      loc: 'Mumbai / Hybrid',
      req: ['NodeJS', 'Docker', 'AWS', 'Kubernetes', 'Terraform'],
      pref: ['Prometheus', 'Redis', 'PostgreSQL'],
      status: 'Published',
    },
    {
      id: 'job_ai_ml',
      title: 'Applied AI / ML Engineer',
      dept: 'AI Research',
      type: 'Full-Time',
      exp: 3,
      salary: '$150,000 - $185,000',
      loc: 'Bengaluru / Hybrid',
      req: ['Python', 'PyTorch', 'FastAPI', 'AWS', 'Docker'],
      pref: ['Kubernetes', 'PostgreSQL', 'LLM Evaluation'],
      status: 'Published',
    },
    {
      id: 'job_backend',
      title: 'Staff Backend Architect',
      dept: 'Core Platform',
      type: 'Full-Time',
      exp: 5,
      salary: '$160,000 - $195,000',
      loc: 'Hyderabad / Hybrid',
      req: ['NodeJS', 'Java', 'Kafka', 'AWS', 'PostgreSQL'],
      pref: ['Kubernetes', 'Redis', 'Terraform'],
      status: 'Published',
    },
    {
      id: 'job_designer',
      title: 'Senior Product Designer',
      dept: 'Design',
      type: 'Contract',
      exp: 3,
      salary: '$95,000 - $120,000',
      loc: 'Remote',
      req: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
      pref: ['Tailwind', 'Motion Design'],
      status: 'Published',
    },
    {
      id: 'job_mobile',
      title: 'Senior Mobile Engineer',
      dept: 'Mobile Apps',
      type: 'Full-Time',
      exp: 3,
      salary: '$120,000 - $148,000',
      loc: 'Pune / Hybrid',
      req: ['React Native', 'TypeScript', 'GraphQL', 'Firebase'],
      pref: ['Swift', 'CI/CD'],
      status: 'Published',
    },
    {
      id: 'job_data_eng',
      title: 'Data Platform Engineer',
      dept: 'Data & Analytics',
      type: 'Full-Time',
      exp: 3,
      salary: '$130,000 - $155,000',
      loc: 'Bengaluru / Hybrid',
      req: ['Python', 'PostgreSQL', 'AWS', 'Docker', 'Kafka'],
      pref: ['Terraform', 'Snowflake'],
      status: 'Published',
    },
    {
      id: 'job_sec',
      title: 'Application Security Engineer',
      dept: 'Security',
      type: 'Full-Time',
      exp: 4,
      salary: '$140,000 - $170,000',
      loc: 'Mumbai / Hybrid',
      req: ['AWS', 'Docker', 'Kubernetes', 'NodeJS'],
      pref: ['Terraform', 'OWASP'],
      status: 'Published',
    },
    {
      id: 'job_qa',
      title: 'SDET / Automation Lead',
      dept: 'Quality Engineering',
      type: 'Full-Time',
      exp: 3,
      salary: '$95,000 - $118,000',
      loc: 'Chennai / Hybrid',
      req: ['TypeScript', 'React', 'CI/CD', 'Docker'],
      pref: ['Playwright', 'AWS'],
      status: 'Published',
    },
    {
      id: 'job_pm',
      title: 'Technical Product Manager',
      dept: 'Product',
      type: 'Full-Time',
      exp: 4,
      salary: '$140,000 - $168,000',
      loc: 'Bengaluru / Hybrid',
      req: ['Product Strategy', 'SQL', 'Analytics', 'API Design'],
      pref: ['AI Workflows', 'Figma'],
      status: 'Published',
    },
    {
      id: 'job_sre',
      title: 'Site Reliability Engineer',
      dept: 'Platform & SRE',
      type: 'Full-Time',
      exp: 3,
      salary: '$132,000 - $158,000',
      loc: 'Remote',
      req: ['Kubernetes', 'AWS', 'Docker', 'Terraform'],
      pref: ['Python', 'Prometheus'],
      status: 'Published',
    },
    {
      id: 'job_ui_intern',
      title: 'Frontend Engineering Intern',
      dept: 'Product Engineering',
      type: 'Internship',
      exp: 0,
      salary: '$35,000 - $45,000',
      loc: 'Pune / Hybrid',
      req: ['React', 'TypeScript', 'Tailwind'],
      pref: ['Next.js'],
      status: 'Published',
    },
    {
      id: 'job_solutions',
      title: 'Solutions Architect',
      dept: 'Enterprise Delivery',
      type: 'Full-Time',
      exp: 5,
      salary: '$155,000 - $185,000',
      loc: 'Delhi NCR / Hybrid',
      req: ['AWS', 'NodeJS', 'MongoDB', 'Docker', 'Kubernetes'],
      pref: ['Terraform', 'GraphQL'],
      status: 'Paused',
    },
    {
      id: 'job_growth',
      title: 'Full Stack Growth Engineer',
      dept: 'Growth',
      type: 'Full-Time',
      exp: 2,
      salary: '$112,000 - $138,000',
      loc: 'Remote',
      req: ['React', 'TypeScript', 'NodeJS', 'PostgreSQL'],
      pref: ['Next.js', 'Tailwind'],
      status: 'Closed',
    },
  ];

  const jobs: Job[] = jobSpecs.map((spec, idx) => ({
    id: spec.id,
    ownerId,
    title: spec.title,
    department: spec.dept,
    employmentType: spec.type,
    experienceRequired: spec.exp,
    salaryRange: spec.salary,
    location: spec.loc,
    requiredSkills: spec.req,
    preferredSkills: spec.pref,
    educationRequirement: 'B.Tech / B.E. in Computer Science or equivalent',
    description: `Join TechNova Solutions as ${spec.title} in ${spec.dept}. Build resilient, high-throughput cloud systems and modern developer workflows using ${spec.req.join(', ')}.`,
    responsibilities: [
      `Design and ship scalable production features using ${spec.req.slice(0, 3).join(', ')}.`,
      'Collaborate across engineering, product, and design teams to maintain SLA excellence.',
      'Mentor engineers through architectural reviews and automated testing.',
    ],
    benefits: ['Hybrid flexibility', 'Comprehensive health coverage', 'Annual L&D budget', 'ESOP equity plan'],
    deadline: `2026-12-${String(12 + (idx % 18)).padStart(2, '0')}`,
    status: spec.status,
    createdAt: `2026-10-${String(10 + idx).padStart(2, '0')}T09:00:00.000Z`,
    updatedAt: now,
  }));

  // Core 3 named showcase candidates + 97 generated TechNova candidates = 100 Candidates
  const coreCandidates: Candidate[] = [
    {
      id: 'cand_rahul',
      ownerId,
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@devmail.in',
      phone: '+91 98201 44510',
      location: 'Bengaluru, India',
      linkedin: 'linkedin.com/in/rahulsharma-dev',
      github: 'github.com/rahulsharma-fs',
      portfolio: 'rahulsharma.dev',
      collegeName: 'IIT Roorkee',
      degree: 'B.Tech in Computer Science & Engineering',
      skills: ['React', 'NodeJS', 'MongoDB', 'AWS', 'TypeScript', 'Docker', 'GraphQL'],
      experienceYears: 3,
      previousCompanies: ['Razorpay', 'Zomato'],
      certifications: ['AWS Certified Developer - Associate', 'MongoDB Certified Developer'],
      languages: ['English', 'Hindi'],
      achievements: [
        'Reduced checkout API p95 latency by 42% across 1.2M daily requests',
        'Winner of FinTech Cloud Hackathon 2024',
      ],
      projects: [
        {
          title: 'PulseFlow Distributed Queue Monitor',
          description: 'Real-time event telemetry UI in React + NodeJS backed by MongoDB and AWS SQS.',
          techStack: ['React', 'NodeJS', 'MongoDB', 'AWS'],
        },
        {
          title: 'CloudScale Auto-Deployer',
          description: 'Zero-downtime blue/green deployment CLI integrated with AWS ECS.',
          techStack: ['NodeJS', 'AWS', 'Docker'],
        },
      ],
      experience: [
        {
          role: 'Software Engineer II',
          company: 'Razorpay',
          duration: '2024 - Present',
          highlights: 'Led merchant analytics dashboard in React/TypeScript and NodeJS microservices on AWS.',
        },
        {
          role: 'Full Stack Developer',
          company: 'Zomato',
          duration: '2023 - 2024',
          highlights: 'Built partner onboarding portals with MongoDB aggregation pipelines.',
        },
      ],
      education: [{ degree: 'B.Tech in Computer Science', institution: 'IIT Roorkee', year: '2023', grade: '8.9 CGPA' }],
      optimizationSuggestions: [
        'Add quantifiable cost-savings metrics to AWS ECS migration bullet points.',
        'Include live demo links for PulseFlow Distributed Queue Monitor.',
      ],
      resumeScore: 94,
      matchScore: 92,
      source: 'LinkedIn',
      resumeText:
        'Rahul Sharma | Full Stack Engineer | 3 Years Experience | React, NodeJS, MongoDB, AWS, TypeScript, Docker. B.Tech CS IIT Roorkee. AWS Certified Developer.',
      avatarUrl: '/src/assets/images/avatar_rahul_sharma_1795405661907.jpg',
      isFavorite: true,
      isPriority: true,
      isWatchlist: false,
      inTalentPool: true,
      activityTimeline: [
        { stage: 'Resume Uploaded', date: '2026-11-10', note: 'Parsed via LinkedIn PDF import' },
        { stage: 'Screened', date: '2026-11-11', note: 'Scored 92% against Senior Full Stack Engineer' },
        { stage: 'Shortlisted', date: '2026-11-12', note: 'Priority shortlist approved' },
        { stage: 'Interview Scheduled', date: '2026-11-16', note: 'System design panel with Vikram Desai' },
      ],
      createdAt: '2026-11-10T09:15:00.000Z',
      updatedAt: now,
    },
    {
      id: 'cand_priya',
      ownerId,
      fullName: 'Priya Patel',
      email: 'priya.patel@frontend.io',
      phone: '+91 98112 77823',
      location: 'Pune, India',
      linkedin: 'linkedin.com/in/priyapatel-ui',
      github: 'github.com/priyapatel-dev',
      portfolio: 'priyapatel.design',
      collegeName: 'NIT Surat',
      degree: 'B.Tech in Information Technology',
      skills: ['React', 'TypeScript', 'Tailwind', 'Next.js', 'Framer Motion', 'Figma'],
      experienceYears: 2,
      previousCompanies: ['Freshworks', 'BrowserStack'],
      certifications: ['Meta Front-End Developer Professional'],
      languages: ['English', 'Gujarati', 'Hindi'],
      achievements: [
        'Built accessible component library adopted across 4 SaaS product lines',
        'Improved Lighthouse performance score from 68 to 97',
      ],
      projects: [
        {
          title: 'DesignToken Studio',
          description: 'Interactive React + Tailwind theme compiler with live WCAG contrast verification.',
          techStack: ['React', 'TypeScript', 'Tailwind'],
        },
      ],
      experience: [
        {
          role: 'Frontend Engineer',
          company: 'Freshworks',
          duration: '2024 - Present',
          highlights: 'Engineered CRM analytics views using React, TypeScript, and Tailwind CSS.',
        },
        {
          role: 'UI Engineering Intern',
          company: 'BrowserStack',
          duration: '2023 - 2024',
          highlights: 'Implemented interactive test run visualizers and keyboard accessibility.',
        },
      ],
      education: [{ degree: 'B.Tech in Information Technology', institution: 'NIT Surat', year: '2024', grade: '9.1 CGPA' }],
      optimizationSuggestions: [
        'Highlight Vitest or Playwright integration testing coverage.',
        'Add REST/GraphQL caching strategy examples.',
      ],
      resumeScore: 90,
      matchScore: 88,
      source: 'Direct Referral',
      resumeText: 'Priya Patel | Frontend Developer | 2 Years | React, TypeScript, Tailwind, Next.js, Framer Motion.',
      avatarUrl: '/src/assets/images/avatar_priya_patel_1795405662032.jpg',
      isFavorite: true,
      isPriority: false,
      isWatchlist: true,
      inTalentPool: true,
      activityTimeline: [
        { stage: 'Resume Uploaded', date: '2026-11-11', note: 'Employee referral submission' },
        { stage: 'Screened', date: '2026-11-12', note: 'Scored 88% for Frontend Developer' },
        { stage: 'Shortlisted', date: '2026-11-13', note: 'Fast-tracked to technical interview' },
        { stage: 'Interview Completed', date: '2026-11-19', note: 'Scored 89/100 in UI Architecture' },
        { stage: 'Offer Sent', date: '2026-11-20', note: 'Offer letter dispatched' },
      ],
      createdAt: '2026-11-11T14:20:00.000Z',
      updatedAt: now,
    },
    {
      id: 'cand_amit',
      ownerId,
      fullName: 'Amit Singh',
      email: 'amit.singh@cloudops.in',
      phone: '+91 99304 51908',
      location: 'Mumbai, India',
      linkedin: 'linkedin.com/in/amitsingh-cloud',
      github: 'github.com/amitsingh-sre',
      portfolio: 'amitsingh.cloud',
      collegeName: 'BITS Pilani',
      degree: 'B.E. in Computer Science',
      skills: ['NodeJS', 'Docker', 'AWS', 'Kubernetes', 'Terraform', 'PostgreSQL'],
      experienceYears: 4,
      previousCompanies: ['CRED', 'Paytm'],
      certifications: ['AWS Certified Solutions Architect', 'CKA (Certified Kubernetes Administrator)'],
      languages: ['English', 'Hindi'],
      achievements: [
        'Cut monthly AWS compute spend by $28,000 via Spot autoscaling',
        'Maintained 99.98% uptime across peak billing cycles',
      ],
      projects: [
        {
          title: 'KubeGuard Drift Detector',
          description: 'NodeJS operator detecting Terraform & Kubernetes drift on AWS EKS.',
          techStack: ['NodeJS', 'Docker', 'AWS', 'Kubernetes'],
        },
      ],
      experience: [
        {
          role: 'Senior Platform Engineer',
          company: 'CRED',
          duration: '2024 - Present',
          highlights: 'Architected multi-AZ Kubernetes clusters and NodeJS tooling on AWS.',
        },
        {
          role: 'DevOps Engineer',
          company: 'Paytm',
          duration: '2022 - 2024',
          highlights: 'Automated CI/CD pipelines and containerized payment microservices.',
        },
      ],
      education: [{ degree: 'B.E. in Computer Science', institution: 'BITS Pilani', year: '2022', grade: '8.7 CGPA' }],
      optimizationSuggestions: ['Include specific Terraform module counts and disaster recovery RTO/RPO metrics.'],
      resumeScore: 89,
      matchScore: 85,
      source: 'GitHub Talent',
      resumeText: 'Amit Singh | Cloud & Backend Engineer | 4 Years | NodeJS, Docker, AWS, Kubernetes, Terraform.',
      avatarUrl: '/src/assets/images/avatar_amit_singh_1795405662033.jpg',
      isFavorite: true,
      isPriority: true,
      isWatchlist: false,
      inTalentPool: true,
      activityTimeline: [
        { stage: 'Resume Uploaded', date: '2026-11-12', note: 'Imported from GitHub Talent' },
        { stage: 'Screened', date: '2026-11-13', note: 'Scored 85% for Cloud Infrastructure Engineer' },
        { stage: 'Shortlisted', date: '2026-11-14', note: 'Shortlisted by SRE lead' },
        { stage: 'Interview Scheduled', date: '2026-11-18', note: 'Scheduled for 2026-11-25' },
      ],
      createdAt: '2026-11-12T11:05:00.000Z',
      updatedAt: now,
    },
  ];

  // Generate 97 more realistic candidates -> 100 total
  const candidates: Candidate[] = [...coreCandidates];
  const sources = ['LinkedIn', 'Direct Referral', 'GitHub Talent', 'Career Portal', 'Campus Drive'];

  for (let i = 4; i <= 100; i++) {
    const first = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 11) % LAST_NAMES.length];
    const fullName = `${first} ${last}`;
    const slug = `${first.toLowerCase()}.${last.toLowerCase()}.${i}`;
    const track = SKILL_TRACKS[i % SKILL_TRACKS.length];
    const city = CITIES[i % CITIES.length];
    const college = COLLEGES[i % COLLEGES.length];
    const comp1 = COMPANIES[i % COMPANIES.length];
    const comp2 = COMPANIES[(i + 5) % COMPANIES.length];
    const expYears = i === 14 ? 1 : (i % 7) + 1;
    const matchScore = Math.max(46, Math.min(95, 91 - ((i * 3) % 42)));
    const resumeScore = Math.max(55, Math.min(96, matchScore + 3));
    const certCount = i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0;
    const certs = Array.from({ length: certCount }, (_, cIdx) => CERTIFICATIONS_POOL[(i + cIdx) % CERTIFICATIONS_POOL.length]);

    // Include 2 realistic resumes with fraud/anomaly signals for Resume Fraud Detection demo
    const isFraudDemoA = i === 14; // Skill exaggeration: 11 skills with 1 yr exp
    const isFraudDemoB = i === 27; // Overlapping dates / duplicate company
    const skills = isFraudDemoA
      ? ['React', 'NodeJS', 'MongoDB', 'AWS', 'Kubernetes', 'Terraform', 'PyTorch', 'Rust', 'Go', 'Kafka', 'GraphQL']
      : track;
    const prevCompanies = isFraudDemoB ? [comp1, comp1] : expYears >= 2 ? [comp1, comp2] : [comp1];
    const expItems = isFraudDemoB
      ? [
          { role: 'Senior Engineer', company: comp1, duration: '2023 - 2026', highlights: 'Led platform APIs.' },
          { role: 'Platform Engineer', company: comp2, duration: '2022 - 2025', highlights: 'Built cloud workflows.' },
        ]
      : [
          {
            role: expYears >= 4 ? 'Senior Software Engineer' : 'Software Engineer',
            company: comp1,
            duration: `${2026 - Math.max(1, Math.floor(expYears / 2))} - Present`,
            highlights: `Delivered production ${track[0]} and ${track[1]} modules at scale.`,
          },
        ];

    candidates.push({
      id: `cand_${String(i).padStart(3, '0')}`,
      ownerId,
      fullName,
      email: `${slug}@techmail.in`,
      phone: `+91 98${String(100 + i).slice(0, 3)} ${String(40000 + i * 137).slice(0, 5)}`,
      location: city,
      linkedin: `linkedin.com/in/${slug}`,
      github: `github.com/${first.toLowerCase()}${i}`,
      portfolio: i % 3 === 0 ? `${first.toLowerCase()}${i}.dev` : '',
      collegeName: college,
      degree: i % 4 === 0 ? 'M.Tech in Computer Science' : 'B.Tech in Computer Science',
      skills,
      experienceYears: expYears,
      previousCompanies: prevCompanies,
      certifications: certs,
      languages: ['English', 'Hindi'],
      achievements: [`Optimized core workflow latency by ${18 + (i % 30)}%`],
      projects: [
        {
          title: `${track[0]} Telemetry Workbench`,
          description: `Production analytics system built with ${track.slice(0, 3).join(', ')}.`,
          techStack: track.slice(0, 3),
        },
      ],
      experience: expItems,
      education: [{ degree: 'B.Tech in Computer Science', institution: college, year: String(2026 - expYears), grade: '8.5 CGPA' }],
      optimizationSuggestions: [
        'Quantify business impact with revenue or latency metrics.',
        certs.length === 0 ? 'Add an AWS or cloud engineering certification.' : 'Highlight system design leadership.',
      ],
      resumeScore,
      matchScore,
      source: sources[i % sources.length],
      resumeText: `${fullName} | ${expYears} Years Experience | ${skills.join(', ')} | ${college} | ${city}`,
      isFavorite: i <= 8,
      isPriority: i <= 5,
      isWatchlist: i >= 9 && i <= 12,
      inTalentPool: true,
      activityTimeline: [
        { stage: 'Resume Uploaded', date: `2026-10-${String((i % 20) + 10).padStart(2, '0')}`, note: `Imported via ${sources[i % sources.length]}` },
        { stage: 'Screened', date: `2026-11-${String((i % 15) + 1).padStart(2, '0')}`, note: `AI scored ${matchScore}% match` },
      ],
      createdAt: `2026-11-${String((i % 20) + 1).padStart(2, '0')}T10:00:00.000Z`,
      updatedAt: now,
    });
  }

  // 100 Applications with exact target counts:
  // 20 Shortlisted, 8 Hired, plus Interview, Offer Sent, Selected, Screening, Applied, Rejected
  const rejectionReasonsPool = [
    'Missing Required Skills: Kubernetes and Terraform production experience.',
    'Insufficient Experience: Role requires 4+ years backend architecture tenure.',
    'Low Match Score: Weighted technical match fell below 60% shortlist threshold.',
    'Position Closed: Final offer accepted by priority candidate.',
  ];

  const stagePlan: PipelineStage[] = [];
  for (let i = 0; i < 100; i++) {
    if (i === 0) stagePlan.push('Interview'); // Rahul
    else if (i === 1) stagePlan.push('Offer Sent'); // Priya
    else if (i === 2) stagePlan.push('Shortlisted'); // Amit
    else if (i < 22) stagePlan.push('Shortlisted'); // 20 total Shortlisted (idx 2..21)
    else if (i < 30) stagePlan.push('Hired'); // 8 total Hired (idx 22..29)
    else if (i < 44) stagePlan.push('Interview'); // 14+1 = 15 Interview
    else if (i < 52) stagePlan.push('Selected'); // 8 Selected
    else if (i < 59) stagePlan.push('Offer Sent'); // 7+1 = 8 Offer Sent
    else if (i < 74) stagePlan.push('Screening'); // 15 Screening
    else if (i < 88) stagePlan.push('Applied'); // 14 Applied
    else stagePlan.push('Rejected'); // 12 Rejected
  }

  const applications: Application[] = candidates.map((cand, idx) => {
    const job = jobs[idx % jobs.length];
    const stage = stagePlan[idx];
    const isRejected = stage === 'Rejected';
    return {
      id: `app_${String(idx + 1).padStart(3, '0')}`,
      ownerId,
      jobId: job.id,
      candidateId: cand.id,
      stage,
      matchScore: cand.matchScore,
      appliedAt: `2026-11-${String((idx % 20) + 1).padStart(2, '0')}`,
      aiExplanation: `${cand.fullName} scored ${cand.matchScore}% for ${job.title} with ${cand.skills.slice(0, 3).join(', ')} and ${cand.experienceYears} years experience.`,
      ...(isRejected ? { rejectionReason: rejectionReasonsPool[idx % rejectionReasonsPool.length] } : {}),
      createdAt: cand.createdAt,
      updatedAt: now,
    };
  });

  // 50 Interviews
  const interviewers = [
    'Vikram Desai (VP Engineering)',
    'Meera Nair (Staff Frontend)',
    'Rohan Kulkarni (Principal SRE)',
    'Ananya Sen (AI Lead)',
    'Siddharth Rao (Director of Product)',
  ];
  const ivStatuses: Interview['status'][] = ['Scheduled', 'Completed', 'Completed', 'Rescheduled', 'Cancelled'];
  const interviews: Interview[] = Array.from({ length: 50 }, (_, idx) => {
    const cand = candidates[idx];
    const app = applications[idx];
    const status: Interview['status'] =
      idx === 0 ? 'Scheduled' : idx === 1 ? 'Completed' : idx === 2 ? 'Scheduled' : ivStatuses[idx % ivStatuses.length];
    return {
      id: `int_${String(idx + 1).padStart(2, '0')}`,
      ownerId,
      candidateId: cand.id,
      jobId: app.jobId,
      date: `2026-11-${String(15 + (idx % 14)).padStart(2, '0')}`,
      time: idx % 2 === 0 ? '11:00 AM' : '03:30 PM',
      interviewer: interviewers[idx % interviewers.length],
      mode: idx % 3 === 0 ? 'Offline' : 'Online',
      status,
      meetingLink:
        idx % 3 === 0
          ? `TechNova HQ · Room ${101 + (idx % 8)}`
          : `https://meet.technova.ai/round-${idx + 1}`,
      createdAt: cand.createdAt,
      updatedAt: now,
    };
  });

  // 25 Interview Feedback Scorecards (including 6th Teamwork rating)
  const feedback: InterviewFeedback[] = interviews
    .filter((_, idx) => idx < 25)
    .map((iv, idx) => {
      const cand = candidates[idx];
      const comm = 7 + (idx % 4);
      const tech = 7 + ((idx + 1) % 4);
      const prob = 7 + ((idx + 2) % 4);
      const lead = 7 + (idx % 3);
      const team = 8 + (idx % 3);
      const cult = 8 + ((idx + 1) % 3);
      const overall = Math.round(((comm + tech + prob + lead + team + cult) / 60) * 100);
      return {
        id: `fb_${String(idx + 1).padStart(2, '0')}`,
        ownerId,
        interviewId: iv.id,
        candidateId: cand.id,
        communication: comm,
        technicalSkills: tech,
        problemSolving: prob,
        leadership: lead,
        teamwork: team,
        cultureFit: cult,
        overallScore: overall,
        notes: `${cand.fullName} demonstrated strong engineering fundamentals and clear communication during system probing.`,
        aiSummary: `${overall >= 85 ? 'Strong Hire' : 'Hire'} recommendation (${overall}/100): ${cand.fullName} excelled in technical problem solving (${tech}/10) and teamwork (${team}/10).`,
        createdAt: iv.createdAt,
        updatedAt: now,
      };
    });

  const notifications: NotificationItem[] = [
    {
      id: 'notif_1',
      ownerId,
      type: 'Candidate Shortlisted',
      title: 'Rahul Sharma scored 92% match',
      message: 'Top ranked for Senior Full Stack Engineer at TechNova Solutions.',
      read: false,
      createdAt: '2026-11-22T15:30:00.000Z',
    },
    {
      id: 'notif_2',
      ownerId,
      type: 'Interview Reminder',
      title: 'Upcoming System Design Round: Rahul Sharma',
      message: 'Scheduled with Vikram Desai (VP Engineering) at 11:00 AM.',
      read: false,
      createdAt: '2026-11-22T12:15:00.000Z',
    },
    {
      id: 'notif_3',
      ownerId,
      type: 'Offer Accepted',
      title: '8 Candidates Hired in Q4 Cohort',
      message: 'TechNova Solutions achieved 88% offer acceptance rate across Engineering.',
      read: false,
      createdAt: '2026-11-21T16:10:00.000Z',
    },
    {
      id: 'notif_4',
      ownerId,
      type: 'New Application',
      title: '100 Candidates Active in Pipeline',
      message: '20 candidates currently shortlisted across 15 TechNova requisitions.',
      read: true,
      createdAt: '2026-11-20T09:45:00.000Z',
    },
    {
      id: 'notif_5',
      ownerId,
      type: 'Job Expiry',
      title: 'Senior Product Designer deadline approaching',
      message: 'Application window closes on 2026-12-17.',
      read: true,
      createdAt: '2026-11-18T11:00:00.000Z',
    },
  ];

  const reports: ReportRecord[] = [
    {
      id: 'rep_1',
      ownerId,
      reportType: 'Candidate Report',
      title: 'TechNova Q4 Candidate Ranking Report (100 Profiles)',
      format: 'PDF',
      createdAt: '2026-11-20T14:00:00.000Z',
    },
    {
      id: 'rep_2',
      ownerId,
      reportType: 'Hiring Report',
      title: 'TechNova 15-Job Pipeline Conversion Summary',
      format: 'Excel',
      createdAt: '2026-11-18T10:30:00.000Z',
    },
    {
      id: 'rep_3',
      ownerId,
      reportType: 'Interview Report',
      title: '50-Interview Scorecard Calibration Audit',
      format: 'CSV',
      createdAt: '2026-11-17T09:15:00.000Z',
    },
  ];

  const settings: WorkspaceSettings = {
    ownerId,
    organizationName: 'TechNova Solutions',
    theme: 'dark',
    autoScreenThreshold: 75,
    emailNotifications: true,
    updatedAt: now,
  };

  return { jobs, candidates, applications, interviews, feedback, notifications, reports, settings };
}
