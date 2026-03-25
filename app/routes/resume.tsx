import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import ScoreHistory from "~/components/ScoreHistory";
import KeywordGap from "~/components/KeywordGap";
import { type KeywordGapAnalysis } from "../../constants";

export const meta = () => ([
    { title: 'Resumely | Review' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [keywordData, setKeywordData] = useState<KeywordGapAnalysis | null>(null);
    const [jobTitle, setJobTitle] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            let resumeId = id;
            
            // If no specific resume ID, try to load the user's latest resume
            if (!resumeId && auth.isAuthenticated && auth.user) {
                const latestId = await kv.get(`user:${auth.user.uuid}:latest-resume`);
                if (latestId) {
                    resumeId = latestId;
                }
            }
            
            if (!resumeId) {
                return;
            }
            
            const resume = await kv.get(`resume:${resumeId}`);

            if(!resume) return;

            const data = JSON.parse(resume) as Resume;

            setJobTitle(data.jobTitle || '');

            const resumeBlob = await fs.read(data.resumePath);
            if(!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const newResumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(newResumeUrl);

            const imageBlob = await fs.read(data.imagePath);
            if(!imageBlob) return;
            const newImageUrl = URL.createObjectURL(imageBlob);
            setImageUrl(newImageUrl);

            setFeedback(data.feedback);
            if (data.keywordGapAnalysis) {
                setKeywordData(data.keywordGapAnalysis);
            }
            console.log({resumeUrl: newResumeUrl, imageUrl: newImageUrl, feedback: data.feedback, gapData: data.keywordGapAnalysis });
        }

        loadResume();

        return () => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
            if (resumeUrl) URL.revokeObjectURL(resumeUrl);
        };
    }, [id, auth.isAuthenticated, auth.user]);

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                            <KeywordGap data={keywordData} />
                            {auth.user?.uuid && jobTitle && (
                                <ScoreHistory userId={auth.user.uuid} jobTitle={jobTitle} />
                            )}
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}
                </section>
            </div>
        </main>
    )
}
export default Resume