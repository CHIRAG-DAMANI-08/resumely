export async function parseJobUrl(url: string, aiChat: (prompt: string) => Promise<string>): Promise<{ jobTitle: string; companyName: string; jobDescription: string }> {
    const encoded = encodeURIComponent(url);
    const proxies = [
        `https://api.allorigins.win/get?url=${encoded}`,
        `https://corsproxy.io/?${encoded}`
    ];
    
    let html = "";
    for (const proxy of proxies) {
        try {
            const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) continue;
            
            if (proxy.includes("allorigins")) {
                const data = await res.json();
                if (data.contents) {
                    html = data.contents;
                    break;
                }
            } else {
                html = await res.text();
                if (html) break;
            }
        } catch {
            continue;
        }
    }

    if (!html) {
        throw new Error("Could not fetch the page. Try copying the job description manually.");
    }
    
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                   .replace(/<[^>]+>/g, ' ')
                   .replace(/\s+/g, ' ')
                   .trim();
                   
    text = text.substring(0, 12000);
    if (text.length < 200) {
        throw new Error("Could not fetch the page. Try copying the job description manually.");
    }

    return parseJobText(text, aiChat);
}

export async function parseJobText(rawText: string, aiChat: (prompt: string) => Promise<string>): Promise<{ jobTitle: string; companyName: string; jobDescription: string }> {
    const prompt = `Extract the exact job title, company name, and job description from the text below.
CRITICAL INSTRUCTION FOR "jobDescription": The page might NOT explicitly label anything as a "job description". You MUST combine ALL relevant sections into the jobDescription field, including:
- "About the Role", "What you'll do", "Responsibilities"
- "Requirements", "Qualifications", "What we're looking for"
- Any other paragraphs that describe the duties and expectations of this job.
If the company name or title is missing, leave them as an empty string "".

Return ONLY valid JSON with exactly these three keys: "jobTitle", "companyName", "jobDescription".
Do NOT return any other text, reasoning, or markdown surrounding the JSON.

Text to analyze:
${rawText.substring(0, 12000)}`;

    const aiRes = await aiChat(prompt);
    const cleaned = aiRes.replace(/```json/i, '').replace(/```/g, '').trim();
    
    let parsed: any;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error("Couldn't extract job details from this page.");
    }

    const result = {
        jobTitle: parsed.jobTitle || "",
        companyName: parsed.companyName || "",
        jobDescription: parsed.jobDescription || ""
    };

    if (!result.jobTitle && !result.jobDescription) {
        throw new Error("Couldn't extract job details from this page.");
    }

    return result;
}
