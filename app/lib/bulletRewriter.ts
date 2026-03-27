export interface BulletSuggestion {
  original: string;      // the weak bullet point, verbatim
  rewritten: string;     // Claude's stronger version
  reason: string;        // one sentence explaining what was wrong
}

export async function rewriteBullets(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  aiChat: (prompt: string) => Promise<string>
): Promise<BulletSuggestion[]> {
  const prompt = `You are an expert resume coach reviewing a resume for the role of ${jobTitle}.

The job description is:
"""
${jobDescription}
"""

Here is the full resume text:
"""
${resumeText}
"""

Identify the 3 bullet points from the resume that are weakest. A weak bullet point is one that has vague language, no measurable impact, missing action verbs, or poor relevance to the job description above.

For each weak bullet point, write a stronger version. The rewritten version must:
- Start with a strong action verb
- Include a quantifiable result where plausible (use realistic placeholder numbers like "~20%" if no number exists in the original)
- Be tailored to the job title "${jobTitle}"

Return ONLY a JSON array of exactly 3 objects. Each object must have these keys:
- "original": the weak bullet point copied verbatim from the resume
- "rewritten": your stronger replacement
- "reason": one sentence in plain English explaining what was wrong with the original

Do not include any markdown formatting, code fences, preamble, or explanation outside the JSON array. Return nothing but the JSON array.`;

  const raw = await aiChat(prompt);

  // Strip markdown fences if the model wrapped its response
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Could not parse rewrite suggestions. Please try again.");
  }

  // Claude sometimes wraps the array inside an object like { suggestions: [...] }
  // Unwrap it by grabbing the first array-valued property
  let suggestions: BulletSuggestion[];
  if (Array.isArray(parsed)) {
    suggestions = parsed;
  } else if (parsed && typeof parsed === "object") {
    const arrayValue = Object.values(parsed).find(Array.isArray);
    if (arrayValue) {
      suggestions = arrayValue as BulletSuggestion[];
    } else {
      throw new Error("Could not parse rewrite suggestions. Please try again.");
    }
  } else {
    throw new Error("Could not parse rewrite suggestions. Please try again.");
  }

  return suggestions;
}
