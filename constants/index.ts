export const resumes: Resume[] = [
    {
        id: "1",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        jobDescription: "",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "2",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        jobDescription: "",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "3",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        jobDescription: "",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "4",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        jobDescription: "",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "5",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        jobDescription: "",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "6",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        jobDescription: "",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
];

export const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //max 100
      ATS: {
        score: number; //rate based on ATS suitability
        tips: {
          type: "good" | "improve";
          tip: string; //give 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      content: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      structure: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      skills: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
    }`;

export const prepareInstructions = ({jobTitle, jobDescription}: { jobTitle: string; jobDescription: string; }) =>
    `You are an expert in ATS (Applicant Tracking System) and resume analysis.
      Please analyze and rate this resume and suggest how to improve it.
      The rating can be low if the resume is bad.
      Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
      If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
      If available, use the job description for the job user is applying to to give more detailed feedback.
      If provided, take the job description into consideration.
      The job title is: ${jobTitle}
      The job description is: ${jobDescription}
      Provide the feedback using the following format:
      ${AIResponseFormat}
      Return the analysis as an JSON object, without any other text and without the backticks.
      Do not include any other text or comments.`;

export interface KeywordGapAnalysis {
  jobSummary: {
    titleGuess: string;
    seniorityLevel: "intern" | "junior" | "mid" | "senior" | "lead" | "director" | "unknown";
  };
  stats: {
    totalJobKeywords: number;
    matchedKeywordCount: number;
    missingKeywordCount: number;
    overallCoveragePercent: number;
  };
  keywords: {
    all: KeywordRecord[];
    matched: KeywordRecord[];
    missing: KeywordRecord[];
  };
}

export interface KeywordRecord {
  keyword: string;
  normalized: string;
  category: "hard_skill" | "soft_skill" | "tool" | "domain" | "responsibility" | "certification" | "other";
  importance: "must_have" | "nice_to_have";
  jdFrequency: number;
  jdSections: string[];
  isPresentInResume: boolean;
  matchType?: "exact" | "fuzzy";
  resumeOccurrences?: Array<{
    sectionGuess: string;
    snippet: string;
    startCharIndex: number;
    endCharIndex: number;
  }>;
  suggestedPlacementHint?: string;
  suggestionExample?: string;
}

export const prepareKeywordGapInstructions = ({jobTitle, jobDescription}: { jobTitle: string; jobDescription: string; }) =>
`You are the "Resumely Keyword Gap Engine" inside a resume-coaching app.

Your ONLY job is to:
1) Extract and normalize important keywords and phrases from the provided job description (JD).
2) Compare them against the candidate’s resume (attached as a file).
3) Return a STRICTLY TYPED JSON object that tells the front end exactly what is missing and matched.

Treat "keywords" broadly: skills, tools, technologies, frameworks, certifications, domains, responsibilities, and important soft skills. Prefer multi-word phrases over single words when the JD clearly uses a phrase (e.g., “stakeholder management”, “REST APIs”). Group repeated or very similar terms under a single normalized keyword (e.g., “React.js” and “React” → normalized: “react”).

IMPORTANT: Do not be overly literal! If a candidate demonstrates a skill conceptually, describes a core responsibility, or uses an adjacent technology, you SHOULD extrapolate and count it as a "fuzzy" match. If the JD requires basic things that are heavily implied by their level of experience, mark them as fuzzy matches. Predict stuff based on context if explicit info does not exist.

OUTPUT FORMAT (VERY IMPORTANT):
Return ONLY a JSON object that EXACTLY matches this schema structure. Do NOT include any markdown fences, comments, prose, or explanations:

{
  "jobSummary": {
    "titleGuess": "string",
    "seniorityLevel": "intern|junior|mid|senior|lead|director|unknown"
  },
  "stats": {
    "totalJobKeywords": 0,
    "matchedKeywordCount": 0,
    "missingKeywordCount": 0,
    "overallCoveragePercent": 0
  },
  "keywords": {
    "all": [
      {
        "keyword": "string",
        "normalized": "string",
        "category": "hard_skill|soft_skill|tool|domain|responsibility|certification|other",
        "importance": "must_have|nice_to_have",
        "jdFrequency": 0,
        "jdSections": ["string"],
        "isPresentInResume": true,
        "matchType": "exact|fuzzy",
        "resumeOccurrences": [{"sectionGuess": "string", "snippet": "string", "startCharIndex": 0, "endCharIndex": 0}],
        "suggestedPlacementHint": "string",
        "suggestionExample": "string"
      }
    ],
    "matched": [],
    "missing": []
  }
}

INPUTS:
job_description:
Target Title: ${jobTitle}
Description:
${jobDescription.substring(0, 15000)}

Return ONLY JSON. Do not include triple backticks or the word "json".`;