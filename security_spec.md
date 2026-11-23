# HireSmart AI — Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every user profile (`/users/{userId}`), workspace setting (`/settings/{userId}`), job (`/jobs/{jobId}`), candidate (`/candidates/{candidateId}`), application (`/applications/{applicationId}`), interview (`/interviews/{interviewId}`), feedback (`/interviewFeedback/{feedbackId}`), notification (`/notifications/{notificationId}`), and report (`/reports/{reportId}`) is strictly owned by a single authenticated, email-verified Google user (`ownerId == request.auth.uid`).
2. **PII Isolation**: User email, phone numbers, LinkedIn/GitHub URLs, and candidate contact data cannot be read or listed by any user other than the owning recruiter (`resource.data.ownerId == request.auth.uid`).
3. **Referential Integrity**: An application or interview cannot be created unless both the referenced `/jobs/{jobId}` and `/candidates/{candidateId}` documents exist and belong to the same owner (`get(...).data.ownerId == request.auth.uid`). Interview feedback cannot be created unless the referenced `/interviews/{interviewId}` and `/candidates/{candidateId}` exist and belong to the same owner.
4. **Immutable Ownership & Creation Timestamps**: `ownerId`, `id`, and `createdAt` can never be altered after document creation. `createdAt` must equal `request.time` on create, and `updatedAt` must equal `request.time` on update.
5. **Terminal State Locking**: Once an application reaches `stage == 'Hired'` or an interview reaches `status == 'Cancelled'`, state-modifying updates are blocked to preserve audit integrity.

## 2. The "Dirty Dozen" Attack Payloads
1. **Unauthenticated Job Read**: Anonymous user attempts `getDoc(doc(db, 'jobs', 'job_1'))` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to create a job -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: User A attempts to create a candidate with `ownerId: "user_B"` -> `PERMISSION_DENIED`.
4. **Cross-Tenant List Scraping**: User A queries `collection(db, 'candidates')` without matching `where('ownerId', '==', uid)` -> `PERMISSION_DENIED`.
5. **PII Cross-Read**: User A attempts `getDoc(doc(db, 'users', 'user_B'))` -> `PERMISSION_DENIED`.
6. **Shadow Field Injection**: User A attempts to create a job with an extra unexpected key `isFeaturedAdmin: true` -> `PERMISSION_DENIED`.
7. **ID Poisoning**: User A attempts to create `/jobs/../../etc/passwd` or a 300-character ID -> `PERMISSION_DENIED`.
8. **Payload Exhaustion ("Denial of Wallet")**: User A submits a candidate with a 50KB `resumeText` string or 100-item `skills` array -> `PERMISSION_DENIED`.
9. **Type Poisoning on Update**: User A updates `applications/app_1` setting `matchScore: "ninety-two"` (string instead of number) -> `PERMISSION_DENIED`.
10. **Temporal Forgery**: User A attempts to create a job with backdated `createdAt: Timestamp(2020-01-01)` instead of `serverTimestamp()` -> `PERMISSION_DENIED`.
11. **Orphaned Application Create**: User A attempts to create an application referencing a non-existent `jobId: "fake_job"` -> `PERMISSION_DENIED`.
12. **Terminal State Bypass**: User A attempts to mutate an application whose `stage` is already `'Hired'` back to `'Applied'` -> `PERMISSION_DENIED`.
