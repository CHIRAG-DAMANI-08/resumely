import {Link, useSearchParams, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import { prepareKeywordGapInstructions, type KeywordGapAnalysis } from "../../constants";

export const meta = () => ([
    { title: 'Resumely | Compare' },
    { name: 'description', content: 'Side-by-side resume comparison' },
])

const CompareScoreBar = ({ label, score1, score2 }: { label: string, score1: number, score2: number }) => {
    return (
        <div className="flex flex-col gap-2 w-full mb-4">
            <div className="flex justify-between text-sm font-semibold text-gray-700">
                <span>{label}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${score1}%` }}></div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${score2}%` }}></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-500 mt-1">
                <div>{score1}%</div>
                <div>{score2}%</div>
            </div>
        </div>
    );
};

const CompareReviewCategory = ({ title, tips1, tips2 }: { title: string, tips1: any[], tips2: any[] }) => {
    return (
        <div className="flex flex-col gap-4">
            <h4 className="text-xl font-bold text-gray-800">{title}</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    {tips1?.length > 0 ? tips1.map((t, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <div className="flex items-start gap-2">
                                <span className={`w-3 h-3 mt-1 rounded-full flex-shrink-0 ${t.type === 'good' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                <span className="font-semibold text-gray-800">{t.tip}</span>
                            </div>
                            {t.explanation && <p className="text-sm text-gray-600 ml-5">{t.explanation}</p>}
                        </div>
                    )) : <p className="text-sm text-gray-400 italic">No detailed feedback available.</p>}
                </div>
                <div className="flex flex-col gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    {tips2?.length > 0 ? tips2.map((t, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <div className="flex items-start gap-2">
                                <span className={`w-3 h-3 mt-1 rounded-full flex-shrink-0 ${t.type === 'good' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                <span className="font-semibold text-gray-800">{t.tip}</span>
                            </div>
                            {t.explanation && <p className="text-sm text-gray-600 ml-5">{t.explanation}</p>}
                        </div>
                    )) : <p className="text-sm text-gray-400 italic">No detailed feedback available.</p>}
                </div>
            </div>
        </div>
    );
};

export default function Compare() {
    const { auth, isLoading, fs, kv, ai } = usePuterStore();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const r1Id = searchParams.get('r1');
    const r2Id = searchParams.get('r2');

    const [resume1, setResume1] = useState<Resume | null>(null);
    const [resume2, setResume2] = useState<Resume | null>(null);
    const [img1, setImg1] = useState('');
    const [img2, setImg2] = useState('');
    const [isAnalyzingGap, setIsAnalyzingGap] = useState(false);
    const [gapProgress, setGapProgress] = useState('');

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/compare?r1=${r1Id}&r2=${r2Id}`);
    }, [isLoading])

    useEffect(() => {
        if (!r1Id || !r2Id) return;

        const loadComparisons = async () => {
            const [res1Raw, res2Raw] = await Promise.all([
                kv.get(`resume:${r1Id}`),
                kv.get(`resume:${r2Id}`)
            ]);
            
            let data1: Resume | null = null;
            let data2: Resume | null = null;

            if (res1Raw) {
                data1 = JSON.parse(res1Raw) as Resume;
                if (data1.imagePath) {
                    const blob1 = await fs.read(data1.imagePath);
                    if (blob1) setImg1(URL.createObjectURL(blob1));
                }
            }
            if (res2Raw) {
                data2 = JSON.parse(res2Raw) as Resume;
                if (data2.imagePath) {
                    const blob2 = await fs.read(data2.imagePath);
                    if (blob2) setImg2(URL.createObjectURL(blob2));
                }
            }
            
            // Cross-pollination of Gap Analysis
            if (data1 && data2) {
                const targetJD = data1.jobDescription || data2.jobDescription;
                const targetTitle = data1.jobTitle || data2.jobTitle;

                if (targetJD && targetTitle) {
                    const runGap = async (data: Resume) => {
                        setIsAnalyzingGap(true);
                        setGapProgress(`Analyzing missing keywords for ${data.companyName || 'Candidate'}...`);
                        try {
                            const blob = await fs.read(data.imagePath);
                            if (!blob) return;
                            const imgFile = new File([blob], "resume.png", { type: blob.type });
                            const ocrText = await ai.img2txt(imgFile);
                            const gapPrompt = prepareKeywordGapInstructions({ jobTitle: targetTitle, jobDescription: targetJD }) + 
                                (ocrText ? `\n\n--- OCR EXTRACTED TEXT FROM RESUME ---\n${ocrText}\n--------------------------------------\n` : "");
                            
                            const response = await ai.chat(gapPrompt);
                            const text = typeof response === 'string' ? response : (response as any).message?.content || (response as any).text || "{}";
                            const cleanedGapText = text.replace(/```json/i, '').replace(/```/g, '').trim();
                            const parsed = JSON.parse(cleanedGapText) as KeywordGapAnalysis;
                            
                            data.keywordGapAnalysis = parsed;
                            // Optionally cache it to avoid double-fetching
                            await kv.set(`resume:${data.id}`, JSON.stringify(data));
                        } catch (e) {
                            console.error("Gap analysis failed:", e);
                        }
                    };

                    // If neither has it, or one is missing it, they process sequentially to not rate-limit
                    if (!data1.keywordGapAnalysis) await runGap(data1);
                    if (!data2.keywordGapAnalysis) await runGap(data2);
                    
                    setIsAnalyzingGap(false);
                }
            }

            if (data1) setResume1(data1);
            if (data2) setResume2(data2);
        };
        
        loadComparisons();
        
        return () => {
            if (img1) URL.revokeObjectURL(img1);
            if (img2) URL.revokeObjectURL(img2);
        };
    }, [r1Id, r2Id]);

    if (!resume1 || !resume2) {
        return (
            <main className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover pt-10 px-8 flex flex-col">
                <nav className="flex justify-between items-center bg-white rounded-full p-4 w-full px-10 max-w-[1200px] mx-auto mb-12 shadow-sm">
                    <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        <span className="font-semibold">Back to Home</span>
                    </Link>
                </nav>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <h2 className="text-2xl text-gray-500 font-semibold animate-pulse">Loading comparison data...</h2>
                    {isAnalyzingGap && <p className="text-blue-500 font-medium">{gapProgress}</p>}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover pt-10 px-4 md:px-8 pb-16 relative">
            <nav className="flex justify-between items-center bg-white rounded-full p-4 w-full px-10 max-w-6xl mx-auto mb-10 shadow-sm sticky top-6 z-40">
                <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
                    <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    <span className="font-semibold">Back to Home</span>
                </Link>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Resume Comparison</h1>
                <div className="w-24"></div> {/* Balance flexbox */}
            </nav>

            <div className="max-w-[1600px] mx-auto flex flex-col gap-10 lg:gap-14">
                
                {/* Titles */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-t-4 border-blue-500 flex flex-col gap-2">
                        <span className="text-sm font-semibold uppercase tracking-widest text-blue-500">Candidate A</span>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                            {resume1.companyName || 'Unknown Company'}
                        </h2>
                        <h3 className="text-lg md:text-xl text-gray-500 font-medium">{resume1.jobTitle || 'No Title Provided'}</h3>
                    </div>
                    
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-t-4 border-indigo-500 flex flex-col gap-2">
                        <span className="text-sm font-semibold uppercase tracking-widest text-indigo-500">Candidate B</span>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                            {resume2.companyName || 'Unknown Company'}
                        </h2>
                        <h3 className="text-lg md:text-xl text-gray-500 font-medium">{resume2.jobTitle || 'No Title Provided'}</h3>
                    </div>
                </div>

                {/* Score Breakdown Section */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-md">
                    <h3 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-4">Performance Metrics</h3>
                    
                    <CompareScoreBar 
                        label="Overall Score" 
                        score1={resume1.feedback?.overallScore || 0} 
                        score2={resume2.feedback?.overallScore || 0} 
                    />
                    <CompareScoreBar 
                        label="ATS Compatibility" 
                        score1={resume1.feedback?.ATS.score || 0} 
                        score2={resume2.feedback?.ATS.score || 0} 
                    />
                    <CompareScoreBar 
                        label="Content Quality" 
                        score1={resume1.feedback?.content.score || 0} 
                        score2={resume2.feedback?.content.score || 0} 
                    />
                    <CompareScoreBar 
                        label="Structure & Formatting" 
                        score1={resume1.feedback?.structure.score || 0} 
                        score2={resume2.feedback?.structure.score || 0} 
                    />
                    <CompareScoreBar 
                        label="Tone & Style" 
                        score1={resume1.feedback?.toneAndStyle.score || 0} 
                        score2={resume2.feedback?.toneAndStyle.score || 0} 
                    />
                </div>

                {/* Keyword Analysis Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-3xl p-8 shadow-md flex flex-col gap-4">
                        <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            Candidate A Missing Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {resume1.keywordGapAnalysis?.keywords?.missing?.map((k, i) => {
                                const text = typeof k === 'string' ? k : k.keyword;
                                if (!text) return null;
                                return (
                                    <span key={text + i} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-sm font-medium">
                                        {text}
                                    </span>
                                );
                            }) || <p className="text-gray-500 italic">No missing keywords found.</p>}
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-8 shadow-md flex flex-col gap-4">
                        <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                            Candidate B Missing Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {resume2.keywordGapAnalysis?.keywords?.missing?.map((k, i) => {
                                const text = typeof k === 'string' ? k : k.keyword;
                                if (!text) return null;
                                return (
                                    <span key={text + i} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-sm font-medium">
                                        {text}
                                    </span>
                                );
                            }) || <p className="text-gray-500 italic">No missing keywords found.</p>}
                        </div>
                    </div>
                </div>

                {/* Detailed Textual Reviews */}
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-md flex flex-col gap-12">
                    <h3 className="text-2xl font-bold text-gray-800 border-b pb-4">Detailed AI Reviews</h3>
                    
                    <CompareReviewCategory 
                        title="Tone & Style" 
                        tips1={resume1.feedback?.toneAndStyle.tips || []}
                        tips2={resume2.feedback?.toneAndStyle.tips || []}
                    />
                    <CompareReviewCategory 
                        title="Structure & Formatting" 
                        tips1={resume1.feedback?.structure.tips || []}
                        tips2={resume2.feedback?.structure.tips || []}
                    />
                    <CompareReviewCategory 
                        title="Content Quality" 
                        tips1={resume1.feedback?.content.tips || []}
                        tips2={resume2.feedback?.content.tips || []}
                    />
                </div>

                {/* Visual Resume Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col h-full">
                        <div className="bg-blue-50/50 p-4 border-b border-gray-100">
                            <h4 className="font-semibold text-blue-900 text-center">Candidate A Document</h4>
                        </div>
                        <div className="p-4 bg-gray-50 h-[800px]">
                            {img1 ? (
                                <img src={img1} alt="Resume 1" className="w-full h-full object-contain rounded-xl shadow-sm bg-white" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Available</div>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col h-full">
                        <div className="bg-indigo-50/50 p-4 border-b border-gray-100">
                            <h4 className="font-semibold text-indigo-900 text-center">Candidate B Document</h4>
                        </div>
                        <div className="p-4 bg-gray-50 h-[800px]">
                            {img2 ? (
                                <img src={img2} alt="Resume 2" className="w-full h-full object-contain rounded-xl shadow-sm bg-white" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Available</div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </main>
    )
}
