import { useState } from 'react';
import { usePuterStore } from '~/lib/puter';
import { parseJobUrl, parseJobText } from '~/lib/jobParser';
import { cn } from '~/lib/utils';

interface JobUrlInputProps {
    onParsed: (data: { jobTitle: string; companyName: string; jobDescription: string }) => void;
}

export default function JobUrlInput({ onParsed }: JobUrlInputProps) {
    const { ai } = usePuterStore();
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [showFallback, setShowFallback] = useState(false);
    
    // Explicit Claude Sonnet 4 model routing per standard specifications
    const claudeChat = async (prompt: string) => {
        const r: any = await ai.chat(prompt, { model: "claude-sonnet-4-20250514" });
        if (typeof r === "string") return r;
        return r?.message?.content?.[0]?.text ?? r?.content?.[0]?.text ?? JSON.stringify(r);
    };

    const handleAutoFill = async () => {
        if (!url.trim()) return;
        setStatus('loading');
        setErrorMsg('');
        
        try {
            const data = await parseJobUrl(url.trim(), claudeChat);
            onParsed(data);
            setStatus('success');
            setShowFallback(false);
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message || 'Error parsing job URL');
        }
    };
    
    const handleFallbackChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        if (text.length > 200) {
            setStatus('loading');
            setErrorMsg('');
            try {
                const data = await parseJobText(text, claudeChat);
                onParsed(data);
                setStatus('success');
                setShowFallback(false);
            } catch (err: any) {
                setStatus('error');
                setErrorMsg(err.message || 'Error parsing manual text');
            }
        }
    };

    const isIdle = status !== 'success' && status !== 'error';

    return (
        <div className="w-full flex flex-col gap-2">
            <div>
                <label className="font-medium text-gray-800">Auto-fill from job URL</label>
                <span className="text-gray-400 text-sm ml-2 font-normal">(Naukri, Internshala, company sites)</span>
            </div>
            
            <div className="flex flex-row gap-3 w-full">
                <input 
                    type="url" 
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        setStatus('idle');
                    }}
                    placeholder="https://naukri.com/job/..."
                    className={cn(
                        "flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        status === 'error' ? "border-red-500 focus:ring-red-500/50" : "border-gray-200 focus:ring-blue-500/50"
                    )}
                />
                <button 
                    type="button"
                    onClick={handleAutoFill}
                    disabled={status === 'loading'}
                    className="primary-button !w-auto flex shrink-0 items-center justify-center min-w-[120px]"
                >
                    {status === 'loading' ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Fetching...</span>
                        </div>
                    ) : "Auto-fill"}
                </button>
            </div>
            
            <div className="h-6">
                {status === 'success' && (
                    <p className="text-green-600 text-sm font-medium">Job details filled in — review and edit if needed.</p>
                )}
                {status === 'error' && (
                    <p className="text-red-500 text-sm font-medium">{errorMsg}</p>
                )}
                {isIdle && (
                    <p 
                        className="text-gray-400 text-sm cursor-pointer hover:text-gray-600 inline-block"
                        onClick={() => setShowFallback(!showFallback)}
                    >
                        LinkedIn blocked? Paste the job description text instead ↓
                    </p>
                )}
            </div>
            
            {showFallback && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-gray-600 mb-2">Open the LinkedIn job post → select all text (Ctrl+A) → paste below</p>
                    <textarea 
                        rows={6}
                        onChange={handleFallbackChange}
                        placeholder="Paste the full job posting text here..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                    />
                </div>
            )}
        </div>
    );
}
