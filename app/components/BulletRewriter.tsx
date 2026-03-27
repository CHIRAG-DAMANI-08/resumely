import { useState } from "react";
import { cn } from "~/lib/utils";
import { usePuterStore } from "~/lib/puter";
import { rewriteBullets, type BulletSuggestion } from "~/lib/bulletRewriter";

interface Props {
  resumePath: string;
  imagePath: string;
  jobTitle: string;
  jobDescription: string;
}

export default function BulletRewriter({ resumePath, imagePath, jobTitle, jobDescription }: Props) {
  const { ai, fs } = usePuterStore();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [suggestions, setSuggestions] = useState<BulletSuggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAnalyse = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      // Step 1: Read the resume image and OCR it to get text
      const imageBlob = await fs.read(imagePath);
      if (!imageBlob) throw new Error("Could not read resume image");

      const resumeText = await ai.img2txt(imageBlob);
      if (!resumeText) throw new Error("Could not extract text from resume");

      // Step 2: Use ai.chat with the extracted text in the prompt
      const aiChat = (prompt: string) =>
        ai.chat(prompt).then((r: any) => {
          if (!r) throw new Error("No response from AI");
          const content = r?.message?.content;
          if (typeof content === "string") return content;
          if (Array.isArray(content) && content[0]?.text) return content[0].text;
          throw new Error("Unexpected AI response format");
        });

      const results = await rewriteBullets(resumeText, jobTitle, jobDescription, aiChat);
      setSuggestions(results);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReanalyse = () => {
    setSuggestions([]);
    setStatus("idle");
  };

  return (
    <div className="w-full bg-white rounded-xl shadow p-6 flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Improve your bullet points</h3>

        {(status === "idle" || status === "error") && (
          <button className="primary-button !w-auto" onClick={handleAnalyse}>
            Analyse
          </button>
        )}
      </div>

      {/* Idle description */}
      {status === "idle" && (
        <p className="text-gray-500 text-sm">
          Claude will find your 3 weakest bullet points and rewrite them for this role.
        </p>
      )}

      {/* Loading state */}
      {status === "loading" && (
        <div className="flex items-center gap-3 text-gray-400">
          <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
          <span className="text-sm">Claude is reviewing your resume…</span>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
      )}

      {/* Success state — suggestion cards */}
      {status === "success" && (
        <div className="flex flex-col gap-4">
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-xl border border-gray-100 overflow-hidden relative">
              {/* Copy button */}
              <button
                onClick={() => handleCopy(s.rewritten, i)}
                className={cn(
                  "absolute top-3 right-3 text-xs border border-gray-200 rounded-md px-2 py-1 bg-white z-10",
                  "hover:bg-gray-50 transition-colors cursor-pointer"
                )}
              >
                {copiedIndex === i ? "Copied!" : "Copy"}
              </button>

              {/* Before section */}
              <div className="bg-red-50 dark:bg-red-950 px-4 py-3">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-red-400 bg-red-100 dark:bg-red-900 rounded-full px-2 py-0.5 mb-2">
                  Before
                </span>
                <p className="text-red-900 dark:text-red-200 text-sm leading-relaxed">{s.original}</p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* After section */}
              <div className="bg-green-50 dark:bg-green-950 px-4 py-3">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-green-400 bg-green-100 dark:bg-green-900 rounded-full px-2 py-0.5 mb-2">
                  After
                </span>
                <p className="text-green-900 dark:text-green-200 text-sm font-medium leading-relaxed">
                  {s.rewritten}
                </p>
              </div>

              {/* Reason row */}
              <div className="bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-400 italic">
                <span className="font-medium not-italic text-gray-500">Why: </span>
                {s.reason}
              </div>
            </div>
          ))}

          {/* Re-analyse link */}
          <button
            onClick={handleReanalyse}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors mt-1 self-start cursor-pointer"
          >
            Re-analyse
          </button>
        </div>
      )}
    </div>
  );
}
