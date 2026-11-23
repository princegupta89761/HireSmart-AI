import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { buildDemoData } from '../data/demoData';
import type {
  Application,
  Candidate,
  CandidateActivityEvent,
  Interview,
  InterviewFeedback,
  Job,
  JobStatus,
  NotificationItem,
  PipelineStage,
  ReportRecord,
  UserProfile,
  WorkspaceSettings,
} from '../types';

const GUEST_STORAGE_KEY = 'hiresmart_technova_v2';

function toIso(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

async function commitInChunks(ops: Array<(batch: ReturnType<typeof writeBatch>) => void>, label: string) {
  const CHUNK_SIZE = 350;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + CHUNK_SIZE)) {
      op(batch);
    }
    await batch.commit().catch((err) => handleFirestoreError(err, OperationType.WRITE, `${label}_chunk_${i}`));
  }
}

interface ATSContextValue {
  user: UserProfile | null;
  authReady: boolean;
  isDataLoading: boolean;
  authError: string | null;
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  interviews: Interview[];
  feedback: InterviewFeedback[];
  notifications: NotificationItem[];
  reports: ReportRecord[];
  settings: WorkspaceSettings;
  loginWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  createJob: (job: Omit<Job, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<Job>;
  updateJob: (jobId: string, patch: Partial<Job>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  duplicateJob: (job: Job) => Promise<Job>;
  setJobStatus: (jobId: string, status: JobStatus) => Promise<void>;
  createCandidate: (cand: Omit<Candidate, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<Candidate>;
  updateCandidate: (candidateId: string, patch: Partial<Candidate>) => Promise<void>;
  toggleCandidateFlag: (
    candidateId: string,
    flag: 'isFavorite' | 'isPriority' | 'isWatchlist' | 'inTalentPool'
  ) => Promise<void>;
  appendCandidateActivity: (candidateId: string, event: CandidateActivityEvent) => Promise<void>;
  deleteCandidate: (candidateId: string) => Promise<void>;
  createApplication: (app: Omit<Application, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<Application>;
  updateApplicationStage: (applicationId: string, stage: PipelineStage, rejectionReason?: string) => Promise<void>;
  updateApplicationScore: (applicationId: string, matchScore: number, aiExplanation: string) => Promise<void>;
  scheduleInterview: (interview: Omit<Interview, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<Interview>;
  updateInterview: (interviewId: string, patch: Partial<Interview>) => Promise<void>;
  submitFeedback: (fb: Omit<InterviewFeedback, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<InterviewFeedback>;
  addNotification: (n: Omit<NotificationItem, 'id' | 'ownerId' | 'createdAt'>) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  logReport: (r: Omit<ReportRecord, 'id' | 'ownerId' | 'createdAt'>) => Promise<void>;
  updateSettings: (patch: Partial<WorkspaceSettings>) => Promise<void>;
  resetGuestDemoData: () => void;
  seedTechNovaFirestore: () => Promise<void>;
}

const ATSContext = createContext<ATSContextValue | null>(null);

export function ATSProvider({ children }: { children: React.ReactNode }) {
  const defaultDemo = useMemo(() => buildDemoData('guest'), []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>(defaultDemo.jobs);
  const [candidates, setCandidates] = useState<Candidate[]>(defaultDemo.candidates);
  const [applications, setApplications] = useState<Application[]>(defaultDemo.applications);
  const [interviews, setInterviews] = useState<Interview[]>(defaultDemo.interviews);
  const [feedback, setFeedback] = useState<InterviewFeedback[]>(defaultDemo.feedback);
  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultDemo.notifications);
  const [reports, setReports] = useState<ReportRecord[]>(defaultDemo.reports);
  const [settings, setSettings] = useState<WorkspaceSettings>(defaultDemo.settings);

  // Sync theme with <html class="dark">
  useEffect(() => {
    const isDark = settings.theme !== 'light';
    document.documentElement.classList.toggle('dark', isDark);
  }, [settings.theme]);

  // Persist guest workspace in localStorage
  useEffect(() => {
    if (user?.isGuest) {
      try {
        localStorage.setItem(
          GUEST_STORAGE_KEY,
          JSON.stringify({ jobs, candidates, applications, interviews, feedback, notifications, reports, settings })
        );
      } catch {
        // Ignore storage quota issues
      }
    }
  }, [user?.isGuest, jobs, candidates, applications, interviews, feedback, notifications, reports, settings]);

  async function seedTechNovaForUid(uid: string) {
    const demo = buildDemoData(uid);
    const suffix = uid.slice(0, 6);

    // Phase 1: settings, jobs, candidates, notifications, reports
    const phase1Ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [
      (b) =>
        b.set(doc(db, 'settings', uid), {
          ownerId: uid,
          organizationName: demo.settings.organizationName,
          theme: demo.settings.theme,
          autoScreenThreshold: demo.settings.autoScreenThreshold,
          emailNotifications: demo.settings.emailNotifications,
          updatedAt: serverTimestamp(),
        }),
      ...demo.jobs.map((j) => {
        const jId = `${j.id}_${suffix}`;
        return (b: ReturnType<typeof writeBatch>) =>
          b.set(doc(db, 'jobs', jId), {
            ...j,
            id: jId,
            ownerId: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
      }),
      ...demo.candidates.map((c) => {
        const cId = `${c.id}_${suffix}`;
        const payload: Record<string, unknown> = {
          ...c,
          id: cId,
          ownerId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (!payload.avatarUrl) delete payload.avatarUrl;
        return (b: ReturnType<typeof writeBatch>) => b.set(doc(db, 'candidates', cId), payload);
      }),
      ...demo.notifications.map((n) => {
        const nId = `${n.id}_${suffix}`;
        return (b: ReturnType<typeof writeBatch>) =>
          b.set(doc(db, 'notifications', nId), {
            ...n,
            id: nId,
            ownerId: uid,
            createdAt: serverTimestamp(),
          });
      }),
      ...demo.reports.map((r) => {
        const rId = `${r.id}_${suffix}`;
        return (b: ReturnType<typeof writeBatch>) =>
          b.set(doc(db, 'reports', rId), {
            ...r,
            id: rId,
            ownerId: uid,
            createdAt: serverTimestamp(),
          });
      }),
    ];
    await commitInChunks(phase1Ops, 'seed_phase1');

    // Phase 2: applications & interviews
    const phase2Ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [
      ...demo.applications.map((a) => {
        const aId = `${a.id}_${suffix}`;
        return (b: ReturnType<typeof writeBatch>) =>
          b.set(doc(db, 'applications', aId), {
            ...a,
            id: aId,
            ownerId: uid,
            jobId: `${a.jobId}_${suffix}`,
            candidateId: `${a.candidateId}_${suffix}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
      }),
      ...demo.interviews.map((iv) => {
        const ivId = `${iv.id}_${suffix}`;
        return (b: ReturnType<typeof writeBatch>) =>
          b.set(doc(db, 'interviews', ivId), {
            ...iv,
            id: ivId,
            ownerId: uid,
            jobId: `${iv.jobId}_${suffix}`,
            candidateId: `${iv.candidateId}_${suffix}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
      }),
    ];
    await commitInChunks(phase2Ops, 'seed_phase2');

    // Phase 3: interviewFeedback
    const phase3Ops: Array<(b: ReturnType<typeof writeBatch>) => void> = demo.feedback.map((fb) => {
      const fbId = `${fb.id}_${suffix}`;
      return (b: ReturnType<typeof writeBatch>) =>
        b.set(doc(db, 'interviewFeedback', fbId), {
          ...fb,
          id: fbId,
          ownerId: uid,
          interviewId: `${fb.interviewId}_${suffix}`,
          candidateId: `${fb.candidateId}_${suffix}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
    });
    await commitInChunks(phase3Ops, 'seed_phase3');
  }

  async function ensureSeededForUser(fbUser: FirebaseUser) {
    const userRef = doc(db, 'users', fbUser.uid);
    let userSnap;
    try {
      userSnap = await getDoc(userRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
    }

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: fbUser.uid,
        displayName: (fbUser.displayName || 'Recruiter').slice(0, 120),
        email: (fbUser.email || '').slice(0, 160),
        photoURL: (fbUser.photoURL || '').slice(0, 500),
        organization: 'TechNova Solutions',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`));
    }

    const jobsCheck = await getDocs(query(collection(db, 'jobs'), where('ownerId', '==', fbUser.uid))).catch((err) =>
      handleFirestoreError(err, OperationType.LIST, 'jobs')
    );

    if (jobsCheck.empty) {
      await seedTechNovaForUid(fbUser.uid);
    }
  }

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsDataLoading(true);
        setAuthError(null);
        setUser({
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Recruiter',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || undefined,
          organization: 'TechNova Solutions',
          isGuest: false,
        });
        try {
          await ensureSeededForUser(fbUser);
        } catch (err) {
          setAuthError(err instanceof Error ? err.message : 'Failed to initialize workspace.');
        } finally {
          setIsDataLoading(false);
          setAuthReady(true);
        }
      } else {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Firestore real-time listeners when signed in via Google
  useEffect(() => {
    if (!authReady || !user || user.isGuest) return;
    const uid = user.uid;

    const unsubJobs = onSnapshot(
      query(collection(db, 'jobs'), where('ownerId', '==', uid)),
      (snap) => {
        setJobs(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...data, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) } as Job;
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'jobs')
    );

    const unsubCandidates = onSnapshot(
      query(collection(db, 'candidates'), where('ownerId', '==', uid)),
      (snap) => {
        setCandidates(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...data, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) } as Candidate;
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'candidates')
    );

    const unsubApplications = onSnapshot(
      query(collection(db, 'applications'), where('ownerId', '==', uid)),
      (snap) => {
        setApplications(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...data, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) } as Application;
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
    );

    const unsubInterviews = onSnapshot(
      query(collection(db, 'interviews'), where('ownerId', '==', uid)),
      (snap) => {
        setInterviews(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...data, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) } as Interview;
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'interviews')
    );

    const unsubFeedback = onSnapshot(
      query(collection(db, 'interviewFeedback'), where('ownerId', '==', uid)),
      (snap) => {
        setFeedback(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...data, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) } as InterviewFeedback;
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'interviewFeedback')
    );

    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('ownerId', '==', uid)),
      (snap) => {
        setNotifications(
          snap.docs
            .map((d) => {
              const data = d.data();
              return { ...data, createdAt: toIso(data.createdAt) } as NotificationItem;
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    const unsubReports = onSnapshot(
      query(collection(db, 'reports'), where('ownerId', '==', uid)),
      (snap) => {
        setReports(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...data, createdAt: toIso(data.createdAt) } as ReportRecord;
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSettings({
            ownerId: uid,
            organizationName: data.organizationName || 'TechNova Solutions',
            theme: data.theme === 'light' ? 'light' : 'dark',
            autoScreenThreshold: Number(data.autoScreenThreshold ?? 75),
            emailNotifications: Boolean(data.emailNotifications ?? true),
            updatedAt: toIso(data.updatedAt),
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `settings/${uid}`)
    );

    return () => {
      unsubJobs();
      unsubCandidates();
      unsubApplications();
      unsubInterviews();
      unsubFeedback();
      unsubNotifications();
      unsubReports();
      unsubSettings();
    };
  }, [authReady, user]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google login was cancelled or failed.';
      setAuthError(msg);
    }
  };

  const continueAsGuest = () => {
    setAuthError(null);
    const saved = localStorage.getItem(GUEST_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.jobs && parsed.candidates) {
          setJobs(parsed.jobs);
          setCandidates(parsed.candidates);
          setApplications(parsed.applications || []);
          setInterviews(parsed.interviews || []);
          setFeedback(parsed.feedback || []);
          setNotifications(parsed.notifications || []);
          setReports(parsed.reports || []);
          if (parsed.settings) setSettings(parsed.settings);
        }
      } catch {
        const fresh = buildDemoData('guest');
        setJobs(fresh.jobs);
        setCandidates(fresh.candidates);
        setApplications(fresh.applications);
        setInterviews(fresh.interviews);
        setFeedback(fresh.feedback);
        setNotifications(fresh.notifications);
        setReports(fresh.reports);
        setSettings(fresh.settings);
      }
    } else {
      const fresh = buildDemoData('guest');
      setJobs(fresh.jobs);
      setCandidates(fresh.candidates);
      setApplications(fresh.applications);
      setInterviews(fresh.interviews);
      setFeedback(fresh.feedback);
      setNotifications(fresh.notifications);
      setReports(fresh.reports);
      setSettings(fresh.settings);
    }
    setUser({
      uid: 'guest',
      displayName: 'Guest Recruiter',
      email: 'guest@technova.ai',
      organization: 'TechNova Solutions (Demo)',
      isGuest: true,
    });
  };

  const resetGuestDemoData = () => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    const fresh = buildDemoData('guest');
    setJobs(fresh.jobs);
    setCandidates(fresh.candidates);
    setApplications(fresh.applications);
    setInterviews(fresh.interviews);
    setFeedback(fresh.feedback);
    setNotifications(fresh.notifications);
    setReports(fresh.reports);
    setSettings(fresh.settings);
  };

  const seedTechNovaFirestore = async () => {
    if (!user || user.isGuest) {
      resetGuestDemoData();
      return;
    }
    setIsDataLoading(true);
    try {
      await seedTechNovaForUid(user.uid);
    } finally {
      setIsDataLoading(false);
    }
  };

  const logout = async () => {
    if (user && !user.isGuest) {
      await signOut(auth);
    }
    setUser(null);
  };

  const createJob = async (input: Omit<Job, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
    const id = makeId('job');
    const ownerId = user?.uid || 'guest';
    const now = new Date().toISOString();
    const record: Job = {
      ...input,
      id,
      ownerId,
      requiredSkills: input.requiredSkills.slice(0, 30),
      preferredSkills: input.preferredSkills.slice(0, 30),
      responsibilities: input.responsibilities.slice(0, 30),
      benefits: input.benefits.slice(0, 30),
      createdAt: now,
      updatedAt: now,
    };

    if (user && !user.isGuest) {
      await setDoc(doc(db, 'jobs', id), {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `jobs/${id}`));
    } else {
      setJobs((prev) => [record, ...prev]);
    }
    return record;
  };

  const updateJob = async (jobId: string, patch: Partial<Job>) => {
    if (user && !user.isGuest) {
      const safePatch = { ...patch };
      delete safePatch.id;
      delete safePatch.ownerId;
      delete safePatch.createdAt;
      await updateDoc(doc(db, 'jobs', jobId), {
        ...safePatch,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `jobs/${jobId}`));
    } else {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j))
      );
    }
  };

  const deleteJob = async (jobId: string) => {
    if (user && !user.isGuest) {
      await deleteDoc(doc(db, 'jobs', jobId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `jobs/${jobId}`)
      );
    } else {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setApplications((prev) => prev.filter((a) => a.jobId !== jobId));
    }
  };

  const duplicateJob = async (job: Job): Promise<Job> => {
    const { id: _id, ownerId: _ownerId, createdAt: _c, updatedAt: _u, ...rest } = job;
    return createJob({
      ...rest,
      title: `${job.title} (Copy)`.slice(0, 140),
      status: 'Draft',
    });
  };

  const setJobStatus = async (jobId: string, status: JobStatus) => {
    await updateJob(jobId, { status });
  };

  const createCandidate = async (
    input: Omit<Candidate, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): Promise<Candidate> => {
    const id = makeId('cand');
    const ownerId = user?.uid || 'guest';
    const now = new Date().toISOString();
    const record: Candidate = {
      ...input,
      id,
      ownerId,
      fullName: (input.fullName || 'Unnamed Candidate').slice(0, 120),
      email: (input.email || '').slice(0, 160),
      phone: (input.phone || '').slice(0, 40),
      location: (input.location || '').slice(0, 120),
      linkedin: (input.linkedin || '').slice(0, 240),
      github: (input.github || '').slice(0, 240),
      portfolio: (input.portfolio || '').slice(0, 240),
      collegeName: (input.collegeName || '').slice(0, 160),
      degree: (input.degree || '').slice(0, 160),
      skills: (input.skills || []).slice(0, 40),
      previousCompanies: (input.previousCompanies || []).slice(0, 20),
      certifications: (input.certifications || []).slice(0, 20),
      languages: (input.languages || []).slice(0, 15),
      achievements: (input.achievements || []).slice(0, 20),
      projects: (input.projects || []).slice(0, 15),
      experience: (input.experience || []).slice(0, 15),
      education: (input.education || []).slice(0, 10),
      optimizationSuggestions: (input.optimizationSuggestions || []).slice(0, 15),
      resumeText: (input.resumeText || '').slice(0, 12000),
      inTalentPool: input.inTalentPool ?? true,
      activityTimeline: input.activityTimeline || [
        { stage: 'Resume Uploaded', date: now.slice(0, 10), note: 'Added to TechNova ATS' },
      ],
      createdAt: now,
      updatedAt: now,
    };

    if (user && !user.isGuest) {
      const payload: Record<string, unknown> = {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (!payload.avatarUrl) delete payload.avatarUrl;
      await setDoc(doc(db, 'candidates', id), payload).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `candidates/${id}`)
      );
    } else {
      setCandidates((prev) => [record, ...prev]);
    }
    return record;
  };

  const updateCandidate = async (candidateId: string, patch: Partial<Candidate>) => {
    if (user && !user.isGuest) {
      const safePatch = { ...patch };
      delete safePatch.id;
      delete safePatch.ownerId;
      delete safePatch.createdAt;
      await updateDoc(doc(db, 'candidates', candidateId), {
        ...safePatch,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `candidates/${candidateId}`));
    } else {
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c))
      );
    }
  };

  const toggleCandidateFlag = async (
    candidateId: string,
    flag: 'isFavorite' | 'isPriority' | 'isWatchlist' | 'inTalentPool'
  ) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;
    await updateCandidate(candidateId, { [flag]: !cand[flag] });
  };

  const appendCandidateActivity = async (candidateId: string, event: CandidateActivityEvent) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;
    const next = [...(cand.activityTimeline || []), event].slice(-25);
    await updateCandidate(candidateId, { activityTimeline: next });
  };

  const deleteCandidate = async (candidateId: string) => {
    if (user && !user.isGuest) {
      await deleteDoc(doc(db, 'candidates', candidateId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `candidates/${candidateId}`)
      );
    } else {
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      setApplications((prev) => prev.filter((a) => a.candidateId !== candidateId));
    }
  };

  const createApplication = async (
    input: Omit<Application, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): Promise<Application> => {
    const id = makeId('app');
    const ownerId = user?.uid || 'guest';
    const now = new Date().toISOString();
    const record: Application = {
      ...input,
      id,
      ownerId,
      aiExplanation: (input.aiExplanation || '').slice(0, 1000),
      createdAt: now,
      updatedAt: now,
    };

    if (user && !user.isGuest) {
      const payload: Record<string, unknown> = {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (!payload.rejectionReason) delete payload.rejectionReason;
      await setDoc(doc(db, 'applications', id), payload).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `applications/${id}`)
      );
    } else {
      setApplications((prev) => [record, ...prev]);
    }
    return record;
  };

  const updateApplicationStage = async (applicationId: string, stage: PipelineStage, rejectionReason?: string) => {
    const app = applications.find((a) => a.id === applicationId);
    if (user && !user.isGuest) {
      const patch: Record<string, unknown> = { stage, updatedAt: serverTimestamp() };
      if (rejectionReason) patch.rejectionReason = rejectionReason.slice(0, 300);
      await updateDoc(doc(db, 'applications', applicationId), patch).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `applications/${applicationId}`)
      );
    } else {
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? {
                ...a,
                stage,
                ...(rejectionReason ? { rejectionReason } : {}),
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
    }

    if (app) {
      await appendCandidateActivity(app.candidateId, {
        stage,
        date: new Date().toISOString().slice(0, 10),
        note: rejectionReason ? `Rejected: ${rejectionReason}` : `Moved to ${stage}`,
      });
    }
  };

  const updateApplicationScore = async (applicationId: string, matchScore: number, aiExplanation: string) => {
    if (user && !user.isGuest) {
      await updateDoc(doc(db, 'applications', applicationId), {
        matchScore,
        aiExplanation: aiExplanation.slice(0, 1000),
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `applications/${applicationId}`));
    } else {
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId ? { ...a, matchScore, aiExplanation, updatedAt: new Date().toISOString() } : a
        )
      );
    }
  };

  const scheduleInterview = async (
    input: Omit<Interview, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): Promise<Interview> => {
    const id = makeId('int');
    const ownerId = user?.uid || 'guest';
    const now = new Date().toISOString();
    const record: Interview = { ...input, id, ownerId, createdAt: now, updatedAt: now };

    if (user && !user.isGuest) {
      await setDoc(doc(db, 'interviews', id), {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `interviews/${id}`));
    } else {
      setInterviews((prev) => [record, ...prev]);
    }

    await appendCandidateActivity(input.candidateId, {
      stage: 'Interview Scheduled',
      date: input.date,
      note: `${input.mode} interview with ${input.interviewer} at ${input.time}`,
    });

    return record;
  };

  const updateInterview = async (interviewId: string, patch: Partial<Interview>) => {
    if (user && !user.isGuest) {
      const safePatch = { ...patch };
      delete safePatch.id;
      delete safePatch.ownerId;
      delete safePatch.createdAt;
      await updateDoc(doc(db, 'interviews', interviewId), {
        ...safePatch,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `interviews/${interviewId}`));
    } else {
      setInterviews((prev) =>
        prev.map((iv) => (iv.id === interviewId ? { ...iv, ...patch, updatedAt: new Date().toISOString() } : iv))
      );
    }
  };

  const submitFeedback = async (
    input: Omit<InterviewFeedback, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): Promise<InterviewFeedback> => {
    const id = makeId('fb');
    const ownerId = user?.uid || 'guest';
    const now = new Date().toISOString();
    const record: InterviewFeedback = {
      ...input,
      id,
      ownerId,
      notes: input.notes.slice(0, 3000),
      aiSummary: input.aiSummary.slice(0, 2000),
      createdAt: now,
      updatedAt: now,
    };

    if (user && !user.isGuest) {
      await setDoc(doc(db, 'interviewFeedback', id), {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `interviewFeedback/${id}`));
    } else {
      setFeedback((prev) => [record, ...prev]);
    }

    await appendCandidateActivity(input.candidateId, {
      stage: 'Interview Completed',
      date: now.slice(0, 10),
      note: `Scorecard submitted: ${input.overallScore}/100`,
    });

    return record;
  };

  const addNotification = async (input: Omit<NotificationItem, 'id' | 'ownerId' | 'createdAt'>) => {
    const id = makeId('notif');
    const ownerId = user?.uid || 'guest';
    const now = new Date().toISOString();
    const record: NotificationItem = {
      ...input,
      id,
      ownerId,
      title: input.title.slice(0, 160),
      message: input.message.slice(0, 500),
      createdAt: now,
    };

    if (user && !user.isGuest) {
      await setDoc(doc(db, 'notifications', id), {
        ...record,
        createdAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `notifications/${id}`));
    } else {
      setNotifications((prev) => [record, ...prev]);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    if (user && !user.isGuest) {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`)
      );
    } else {
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (user && !user.isGuest) {
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const logReport = async (input: Omit<ReportRecord, 'id' | 'ownerId' | 'createdAt'>) => {
    const id = makeId('rep');
    const ownerId = user?.uid || 'guest';
    const record: ReportRecord = { ...input, id, ownerId, createdAt: new Date().toISOString() };

    if (user && !user.isGuest) {
      await setDoc(doc(db, 'reports', id), {
        ...record,
        createdAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `reports/${id}`));
    } else {
      setReports((prev) => [record, ...prev]);
    }
  };

  const updateSettings = async (patch: Partial<WorkspaceSettings>) => {
    const next: WorkspaceSettings = {
      ...settings,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setSettings(next);
    if (user && !user.isGuest) {
      await updateDoc(doc(db, 'settings', user.uid), {
        organizationName: next.organizationName,
        theme: next.theme,
        autoScreenThreshold: next.autoScreenThreshold,
        emailNotifications: next.emailNotifications,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `settings/${user.uid}`));
    }
  };

  return (
    <ATSContext.Provider
      value={{
        user,
        authReady,
        isDataLoading,
        authError,
        jobs,
        candidates,
        applications,
        interviews,
        feedback,
        notifications,
        reports,
        settings,
        loginWithGoogle,
        continueAsGuest,
        logout,
        createJob,
        updateJob,
        deleteJob,
        duplicateJob,
        setJobStatus,
        createCandidate,
        updateCandidate,
        toggleCandidateFlag,
        appendCandidateActivity,
        deleteCandidate,
        createApplication,
        updateApplicationStage,
        updateApplicationScore,
        scheduleInterview,
        updateInterview,
        submitFeedback,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        logReport,
        updateSettings,
        resetGuestDemoData,
        seedTechNovaFirestore,
      }}
    >
      {children}
    </ATSContext.Provider>
  );
}

export function useATS() {
  const ctx = useContext(ATSContext);
  if (!ctx) throw new Error('useATS must be used inside ATSProvider');
  return ctx;
}
