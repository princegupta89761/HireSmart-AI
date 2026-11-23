import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'HireSmart AI API' });
});

// 1. AI Job Description Generator
app.post('/api/ai/job-description', async (req, res) => {
  try {
    const { title, department, experienceRequired, location, employmentType } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Job title is required.' });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate a comprehensive, modern SaaS tech job description for:
Title: ${title}
Department: ${department || 'Engineering'}
Employment Type: ${employmentType || 'Full-Time'}
Experience Required: ${experienceRequired ?? 3} years
Location: ${location || 'Remote / Hybrid'}

Return concise, high-signal hiring copy.`,
      config: {
        systemInstruction:
          'You are an expert technical recruiter and talent architect. Produce crisp, realistic job descriptions with concrete responsibilities and modern technical requirements.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            qualifications: { type: Type.STRING },
            benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            salaryRange: { type: Type.STRING },
          },
          required: [
            'overview',
            'requirements',
            'responsibilities',
            'qualifications',
            'benefits',
            'requiredSkills',
            'preferredSkills',
            'salaryRange',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err) {
    console.error('AI Job Description Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate job description.' });
  }
});

// 2. AI Resume Parser (supports PDF base64, DOCX base64, or raw text)
app.post('/api/ai/parse-resume', async (req, res) => {
  try {
    const { fileName, mimeType, fileBase64, rawText } = req.body;
    const ai = getGeminiClient();

    let extractedText = typeof rawText === 'string' ? rawText : '';
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (fileBase64 && typeof fileBase64 === 'string') {
      const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
      const isDocx =
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        (typeof fileName === 'string' && fileName.toLowerCase().endsWith('.docx'));
      const isPdf =
        mimeType === 'application/pdf' ||
        (typeof fileName === 'string' && fileName.toLowerCase().endsWith('.pdf'));

      if (isDocx) {
        const buffer = Buffer.from(cleanBase64, 'base64');
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedText = docxResult.value || extractedText;
      } else if (isPdf) {
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64,
          },
        });
      } else {
        const buffer = Buffer.from(cleanBase64, 'base64');
        extractedText = buffer.toString('utf-8');
      }
    }

    if (!extractedText.trim() && parts.length === 0) {
      return res.status(400).json({ error: 'Resume file or text is required.' });
    }

    const promptText = `Extract every structured detail from this candidate resume${
      fileName ? ` (${fileName})` : ''
    }. Also evaluate the resume clarity, impact metrics, and technical depth to provide a resumeScore (0-100) and 3-5 actionable optimizationSuggestions.
If a field is absent in the resume, return an empty string "" or empty array [] and 0 for missing experienceYears.
${extractedText ? `\nResume Text:\n${extractedText.slice(0, 20000)}` : ''}`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction:
          'You are an enterprise ATS AI Resume Parser. Extract accurate structured candidate fields with zero hallucinated facts.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            location: { type: Type.STRING },
            linkedin: { type: Type.STRING },
            github: { type: Type.STRING },
            portfolio: { type: Type.STRING },
            collegeName: { type: Type.STRING },
            degree: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experienceYears: { type: Type.NUMBER },
            previousCompanies: { type: Type.ARRAY, items: { type: Type.STRING } },
            certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
            languages: { type: Type.ARRAY, items: { type: Type.STRING } },
            achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'description', 'techStack'],
              },
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  highlights: { type: Type.STRING },
                },
                required: ['role', 'company', 'duration', 'highlights'],
              },
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  year: { type: Type.STRING },
                  grade: { type: Type.STRING },
                },
                required: ['degree', 'institution', 'year', 'grade'],
              },
            },
            optimizationSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            resumeScore: { type: Type.NUMBER },
            rawSummaryText: { type: Type.STRING },
          },
          required: [
            'fullName',
            'email',
            'phone',
            'location',
            'skills',
            'experienceYears',
            'resumeScore',
            'optimizationSuggestions',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({
      ...parsed,
      resumeText: extractedText || parsed.rawSummaryText || `Parsed resume for ${parsed.fullName}`,
    });
  } catch (err) {
    console.error('AI Resume Parse Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to parse resume.' });
  }
});

// 3. AI Candidate Matching, Skill Gap & Recommendation Engine
app.post('/api/ai/match-candidate', async (req, res) => {
  try {
    const { candidate, job } = req.body;
    if (!candidate || !job) {
      return res.status(400).json({ error: 'Candidate and Job objects are required.' });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Evaluate candidate fit for the target job using these exact weights:
- Skills Match: 40%
- Experience Match: 20%
- Projects Match: 15%
- Education Match: 15%
- Certification Match: 10%

Job:
Title: ${job.title}
Required Skills: ${(job.requiredSkills || []).join(', ')}
Preferred Skills: ${(job.preferredSkills || []).join(', ')}
Experience Required: ${job.experienceRequired} years
Education Requirement: ${job.educationRequirement}

Candidate:
Name: ${candidate.fullName}
Skills: ${(candidate.skills || []).join(', ')}
Experience: ${candidate.experienceYears} years
Companies: ${(candidate.previousCompanies || []).join(', ')}
Degree: ${candidate.degree} (${candidate.collegeName})
Certifications: ${(candidate.certifications || []).join(', ')}
Projects: ${JSON.stringify(candidate.projects || [])}

Compute each category score out of 100, compute weighted overallScore = Math.round(skillsMatch*0.4 + experienceMatch*0.2 + projectsMatch*0.15 + educationMatch*0.15 + certificationMatch*0.1), identify matchedSkills, missingSkills, recommendedCourses for missing skills, readinessScore (0-100), and a concise recruiter recommendation sentence.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skillsMatch: { type: Type.NUMBER },
            experienceMatch: { type: Type.NUMBER },
            projectsMatch: { type: Type.NUMBER },
            educationMatch: { type: Type.NUMBER },
            certificationMatch: { type: Type.NUMBER },
            overallScore: { type: Type.NUMBER },
            matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedCourses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  course: { type: Type.STRING },
                  provider: { type: Type.STRING },
                  duration: { type: Type.STRING },
                },
                required: ['skill', 'course', 'provider', 'duration'],
              },
            },
            readinessScore: { type: Type.NUMBER },
            recommendation: { type: Type.STRING },
          },
          required: [
            'skillsMatch',
            'experienceMatch',
            'projectsMatch',
            'educationMatch',
            'certificationMatch',
            'overallScore',
            'matchedSkills',
            'missingSkills',
            'recommendedCourses',
            'readinessScore',
            'recommendation',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err) {
    console.error('AI Match Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to match candidate.' });
  }
});

// 4. AI Interview Question Generator
app.post('/api/ai/interview-questions', async (req, res) => {
  try {
    const { candidate, job, difficulty, focusSkills } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate 6 targeted interview questions for:
Role: ${job?.title || 'Full Stack Engineer'}
Difficulty Level: ${difficulty || 'Medium'}
Focus Skills: ${Array.isArray(focusSkills) && focusSkills.length ? focusSkills.join(', ') : (candidate?.skills || []).join(', ')}
Candidate: ${candidate?.fullName || 'Candidate'} (${candidate?.experienceYears || 3} years experience)
Include questions spanning technical skills (e.g. React/Frontend, NodeJS/Backend), System Design, and Behavioral assessment, tailored to the candidate's background.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              question: { type: Type.STRING },
              expectedKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['category', 'difficulty', 'question', 'expectedKeyPoints'],
          },
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '[]').trim());
    res.json({ questions: parsed });
  } catch (err) {
    console.error('AI Interview Questions Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate questions.' });
  }
});

// 5. AI Interview Feedback Summary
app.post('/api/ai/interview-summary', async (req, res) => {
  try {
    const { candidateName, jobTitle, ratings, notes } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Synthesize an executive hiring scorecard summary for:
Candidate: ${candidateName}
Role: ${jobTitle}
Ratings (1-10): Communication ${ratings?.communication}/10, Technical Skills ${ratings?.technicalSkills}/10, Problem Solving ${ratings?.problemSolving}/10, Leadership ${ratings?.leadership}/10, Culture Fit ${ratings?.cultureFit}/10.
Interviewer Notes: ${notes || 'Strong performance across technical fundamentals.'}

Provide a clear 3-sentence hiring assessment and recommendation (Strong Hire / Hire / Hold / No Hire).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            verdict: { type: Type.STRING },
          },
          required: ['summary', 'verdict'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err) {
    console.error('AI Interview Summary Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate interview summary.' });
  }
});

// 6. AI Email Automation Draft Generator
app.post('/api/ai/email-draft', async (req, res) => {
  try {
    const { templateType, candidateName, jobTitle, organizationName, interviewDate, interviewTime, meetingLink } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Write a polished, warm, professional recruiting email.
Template Type: ${templateType}
Candidate Name: ${candidateName}
Job Title: ${jobTitle}
Organization: ${organizationName || 'HireSmart Talent Team'}
${interviewDate ? `Interview Date: ${interviewDate}` : ''}
${interviewTime ? `Interview Time: ${interviewTime}` : ''}
${meetingLink ? `Meeting Link: ${meetingLink}` : ''}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ['subject', 'body'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err) {
    console.error('AI Email Draft Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate email draft.' });
  }
});

// 7. AI Recruitment Assistant Chatbot
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { query, context } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required.' });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Recruiter Query: "${query}"

Current ATS Workspace Data:
Jobs: ${JSON.stringify(context?.jobs || [])}
Candidates: ${JSON.stringify(context?.candidates || [])}
Applications: ${JSON.stringify(context?.applications || [])}
Interviews: ${JSON.stringify(context?.interviews || [])}

Answer the recruiter's question accurately using ONLY the workspace data above. List matching candidates with their scores, skills, and experience, and include their exact IDs in matchedCandidateIds.`,
      config: {
        systemInstruction:
          'You are HireSmart AI Recruitment Assistant. Provide instant, accurate, data-grounded answers to recruiter queries about candidates, skills, certifications, scores, pipeline stages, and jobs.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            matchedCandidateIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchedJobIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedFollowUps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['answer', 'matchedCandidateIds', 'matchedJobIds', 'suggestedFollowUps'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err) {
    console.error('AI Assistant Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to query recruitment assistant.' });
  }
});

// 8. AI Candidate Insights
app.post('/api/ai/candidate-insights', async (req, res) => {
  try {
    const { candidate, job } = req.body;
    if (!candidate) return res.status(400).json({ error: 'Candidate is required.' });
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Analyze this candidate profile${job ? ` for the role "${job.title}"` : ''}:
Name: ${candidate.fullName}
Experience: ${candidate.experienceYears} years
Skills: ${(candidate.skills || []).join(', ')}
Education: ${candidate.degree} (${candidate.collegeName})
Certifications: ${(candidate.certifications || []).join(', ')}
Companies: ${(candidate.previousCompanies || []).join(', ')}
Projects: ${JSON.stringify(candidate.projects || [])}
${job ? `Job Required Skills: ${(job.requiredSkills || []).join(', ')}` : ''}

Provide readinessScore (0-100), top 3-5 strengths, 2-4 weaknesses/gaps, technicalSkillSummary, experienceSummary, and hiringRecommendation.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            readinessScore: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            technicalSkillSummary: { type: Type.STRING },
            experienceSummary: { type: Type.STRING },
            hiringRecommendation: { type: Type.STRING },
          },
          required: [
            'readinessScore',
            'strengths',
            'weaknesses',
            'technicalSkillSummary',
            'experienceSummary',
            'hiringRecommendation',
          ],
        },
      },
    });
    res.json(JSON.parse((response.text ?? '{}').trim()));
  } catch (err) {
    console.error('AI Candidate Insights Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate candidate insights.' });
  }
});

// 9. Resume Fraud Detection
app.post('/api/ai/resume-fraud', async (req, res) => {
  try {
    const { candidate } = req.body;
    if (!candidate) return res.status(400).json({ error: 'Candidate is required.' });
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Audit this candidate resume for potential anomalies or fraud signals:
1. Skill exaggeration (too many advanced skills for years of experience)
2. Duplicate companies
3. Inconsistent dates
4. Overlapping experiences
5. Missing employment details

Candidate: ${candidate.fullName}
Experience Years: ${candidate.experienceYears}
Skills (${(candidate.skills || []).length}): ${(candidate.skills || []).join(', ')}
Previous Companies: ${(candidate.previousCompanies || []).join(', ')}
Experience Timeline: ${JSON.stringify(candidate.experience || [])}
Resume Text: ${(candidate.resumeText || '').slice(0, 4000)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            alerts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  detail: { type: Type.STRING },
                },
                required: ['type', 'severity', 'detail'],
              },
            },
          },
          required: ['riskLevel', 'confidenceScore', 'alerts'],
        },
      },
    });
    res.json(JSON.parse((response.text ?? '{}').trim()));
  } catch (err) {
    console.error('AI Fraud Check Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to run fraud check.' });
  }
});

// 10. AI Salary Estimator
app.post('/api/ai/salary-estimator', async (req, res) => {
  try {
    const { candidate } = req.body;
    if (!candidate) return res.status(400).json({ error: 'Candidate is required.' });
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Estimate realistic annual compensation range based on:
Skills: ${(candidate.skills || []).join(', ')}
Experience: ${candidate.experienceYears} years
Location: ${candidate.location || 'Bengaluru, India'}
Education: ${candidate.degree} (${candidate.collegeName})
Certifications: ${(candidate.certifications || []).join(', ')}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            minSalary: { type: Type.STRING },
            maxSalary: { type: Type.STRING },
            currency: { type: Type.STRING },
            marketMedian: { type: Type.STRING },
            rationale: { type: Type.STRING },
          },
          required: ['minSalary', 'maxSalary', 'currency', 'marketMedian', 'rationale'],
        },
      },
    });
    res.json(JSON.parse((response.text ?? '{}').trim()));
  } catch (err) {
    console.error('AI Salary Estimator Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to estimate salary.' });
  }
});

// 11. Predictive Hiring Success
app.post('/api/ai/predictive-success', async (req, res) => {
  try {
    const { candidate, job, interviewScores } = req.body;
    if (!candidate) return res.status(400).json({ error: 'Candidate is required.' });
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Predict hiring success probability (0-100), risk level (Low/Medium/High), recommendation, and 3 key drivers:
Candidate: ${candidate.fullName}, Match Score: ${candidate.matchScore}%, Resume Score: ${candidate.resumeScore}/100, Experience: ${candidate.experienceYears} yrs
Skills: ${(candidate.skills || []).join(', ')}
Target Role: ${job?.title || 'Software Engineer'}
Interview Feedback Scores: ${JSON.stringify(interviewScores || [])}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            successProbability: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            keyDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['successProbability', 'riskLevel', 'recommendation', 'keyDrivers'],
        },
      },
    });
    res.json(JSON.parse((response.text ?? '{}').trim()));
  } catch (err) {
    console.error('AI Predictive Success Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to predict hiring success.' });
  }
});

// 12. Smart Natural-Language Search
app.post('/api/ai/smart-search', async (req, res) => {
  try {
    const { query, candidates } = req.body;
    if (!query) return res.status(400).json({ error: 'Search query is required.' });
    const ai = getGeminiClient();

    const compact = (candidates || []).slice(0, 100).map((c: Record<string, unknown>) => ({
      id: c.id,
      fullName: c.fullName,
      location: c.location,
      skills: c.skills,
      experienceYears: c.experienceYears,
      matchScore: c.matchScore,
      certifications: c.certifications,
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Natural language candidate search query: "${query}"
Candidates dataset (${compact.length} profiles):
${JSON.stringify(compact)}

Return matching candidate IDs ranked by relevance and a brief 1-sentence explanation.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
          },
          required: ['matchedIds', 'summary'],
        },
      },
    });
    res.json(JSON.parse((response.text ?? '{}').trim()));
  } catch (err) {
    console.error('AI Smart Search Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to run smart search.' });
  }
});

// 13. AI Rejection Reasons
app.post('/api/ai/rejection-reason', async (req, res) => {
  try {
    const { candidate, job } = req.body;
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Suggest a constructive, accurate rejection reason category and explanation for:
Candidate: ${candidate?.fullName} (${candidate?.experienceYears} yrs, skills: ${(candidate?.skills || []).join(', ')})
Job: ${job?.title} (required skills: ${(job?.requiredSkills || []).join(', ')}, min exp: ${job?.experienceRequired} yrs)`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ['category', 'reason'],
        },
      },
    });
    res.json(JSON.parse((response.text ?? '{}').trim()));
  } catch (err) {
    console.error('AI Rejection Reason Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate rejection reason.' });
  }
});

// 14. Global Recruitment Copilot & Voice Command Interpreter
app.post('/api/ai/copilot', async (req, res) => {
  try {
    const { command, context } = req.body;
    if (!command) return res.status(400).json({ error: 'Command is required.' });
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `You are the HireSmart AI Recruitment Copilot & Voice Assistant.
User Command / Request: "${command}"
Workspace Summary:
Total Jobs: ${(context?.jobs || []).length}
Jobs Sample: ${JSON.stringify((context?.jobs || []).slice(0, 15))}
Total Candidates: ${(context?.candidates || []).length}
Candidates Sample: ${JSON.stringify((context?.candidates || []).slice(0, 25))}
Shortlisted Count: ${context?.shortlistedCount || 0}

Determine the best response and optional UI action:
- actionType: "navigate" | "filter_candidates" | "open_candidate" | "open_create_job" | "schedule_interview" | "answer_only"
- targetModule: one of dashboard, jobs, candidates, applications, resume-parser, ai-recommendations, interview-center, talent-pool, leaderboard, analytics, assistant, reports, settings
- filterSkillOrQuery: optional search keyword (e.g. "React")
- candidateId: optional exact candidate id if the command mentions a specific candidate (e.g. Rahul Sharma)`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            actionType: { type: Type.STRING },
            targetModule: { type: Type.STRING },
            filterSkillOrQuery: { type: Type.STRING },
            candidateId: { type: Type.STRING },
          },
          required: ['reply', 'actionType'],
        },
      },
    });
    res.json(JSON.parse((response.text ?? '{}').trim()));
  } catch (err) {
    console.error('AI Copilot Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Copilot request failed.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });

    // Prevent @vite/client from opening a WebSocket when HMR is disabled
    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const transformed = await vite.transformRequest('/@vite/client');
        if (!transformed) return next();
        const patchedCode = transformed.code
          .replace('console.debug("[vite] connecting...");', 'console.debug("[vite] HMR disabled.");')
          .replace('transport.connect(createHMRHandler(handleMessage));', '/* HMR WebSocket disabled */');
        res.type('application/javascript').send(patchedCode);
      } catch (err) {
        next(err);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HireSmart AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
