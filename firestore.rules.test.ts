/**
 * HireSmart AI — Firestore Rules Security Verification Suite
 * Verifies the "Dirty Dozen" attack payloads against the Eight Pillars.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Job Read',
    operation: 'get',
    path: 'jobs/job_1',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    operation: 'create',
    path: 'jobs/job_unverified',
    auth: { uid: 'user_a', email_verified: false },
    payload: { id: 'job_unverified', ownerId: 'user_a', title: 'Engineer' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Identity Spoofing on Create',
    operation: 'create',
    path: 'candidates/cand_spoof',
    auth: { uid: 'user_a', email_verified: true },
    payload: { id: 'cand_spoof', ownerId: 'user_b', fullName: 'Spoofed' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-Tenant List Scraping',
    operation: 'list',
    path: 'candidates',
    auth: { uid: 'user_a', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'PII Cross-Read on Users',
    operation: 'get',
    path: 'users/user_b',
    auth: { uid: 'user_a', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Shadow Field Injection',
    operation: 'create',
    path: 'jobs/job_shadow',
    auth: { uid: 'user_a', email_verified: true },
    payload: { id: 'job_shadow', ownerId: 'user_a', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'ID Poisoning (Invalid Characters)',
    operation: 'create',
    path: 'jobs/bad$id!withSpaces',
    auth: { uid: 'user_a', email_verified: true },
    payload: { id: 'bad$id!withSpaces', ownerId: 'user_a' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Payload Exhaustion (Oversized Skills Array)',
    operation: 'create',
    path: 'candidates/cand_exhaust',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      id: 'cand_exhaust',
      ownerId: 'user_a',
      skills: Array.from({ length: 100 }, (_, i) => `Skill${i}`),
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Type Poisoning on Update',
    operation: 'update',
    path: 'applications/app_1',
    auth: { uid: 'user_a', email_verified: true },
    payload: { matchScore: 'ninety-two' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Temporal Forgery (Client-Supplied Backdated Timestamp)',
    operation: 'create',
    path: 'jobs/job_backdate',
    auth: { uid: 'user_a', email_verified: true },
    payload: { id: 'job_backdate', ownerId: 'user_a', createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Orphaned Application Create (Missing Parent Job)',
    operation: 'create',
    path: 'applications/app_orphan',
    auth: { uid: 'user_a', email_verified: true },
    payload: { id: 'app_orphan', ownerId: 'user_a', jobId: 'nonexistent_job', candidateId: 'cand_1' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Terminal State Bypass (Mutating Hired Application)',
    operation: 'update',
    path: 'applications/app_hired',
    auth: { uid: 'user_a', email_verified: true },
    payload: { stage: 'Applied' },
    expected: 'PERMISSION_DENIED',
  },
];
