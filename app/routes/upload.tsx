import {type FormEvent, useState} from 'react'
import Navbar from "~/components/navbar";
import FileUploader from "~/components/FileUploader";
import JobUrlInput from "~/components/JobUrlInput";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage, convertDocToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions, prepareKeywordGapInstructions, type KeywordGapAnalysis} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);

        try {
        setStatusText('Preparing upload...');

        // Ensure user is authenticated and refresh user info for new accounts
        if (!auth.isAuthenticated) {
            navigate(`/auth?next=/upload`);
            return;
        }

        try {
            await auth.refreshUser();
        } catch (e) {
            // ignore refresh error and proceed with whatever user info is available
        }

    const user = usePuterStore.getState().auth.user;
    const userId = user?.uuid || `anon-${generateUUID()}`;



        const uuid = generateUUID();

        // Create user-scoped filenames to avoid collisions between accounts
        // Use upload which manages file placement, but use unique names per user
        const resumeFileName = `resume_${userId}_${uuid}.pdf`;
        const imageFileName = `resume_${userId}_${uuid}.png`;

        setStatusText('Uploading the file...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Error: Failed to upload file');
        
        // Get the uploaded file path and store it with user namespace in KV
        const resumePath = `${uploadedFile.path}`;

        let finalImageFile: File | null = null;
        if (file.type.startsWith('image/')) {
            finalImageFile = file;
        } else if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
            setStatusText('Converting document to image...');
            const docResult = await convertDocToImage(file);
            if (!docResult.file) return setStatusText(docResult.error || 'Error: Failed to convert document');
            finalImageFile = docResult.file;
        } else {
            setStatusText('Converting PDF to image...');
            const pdfResult = await convertPdfToImage(file);
            if (!pdfResult.file) return setStatusText(pdfResult.error || 'Error: Failed to convert PDF');
            finalImageFile = pdfResult.file;
        }

        setStatusText('Extracting text (OCR)...');
        let extractedText = "";
        try {
            const ocrResult = await ai.img2txt(finalImageFile);
            if (ocrResult) extractedText = ocrResult;
        } catch (e) {
            console.warn("OCR failed, proceeding with standard AI check");
        }

        setStatusText('Uploading the image...');
        const uploadedImage = await fs.upload([finalImageFile]);
        if(!uploadedImage) return setStatusText('Error: Failed to upload image');
        
        const imagePath = `${uploadedImage.path}`;

        setStatusText('Preparing data...');

        const data: any = {
            id: uuid,
            resumePath,
            imagePath,
            companyName, jobTitle, jobDescription,
            feedback: '',
            jobKey: `history:${userId}:${jobTitle.trim().toLowerCase()}`,
            fileName: file.name,
            fileSize: file.size,
            createdAt: Date.now(),
        }
        // Store by resume UUID
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        
        // ALSO store a pointer to the latest resume for this user
        // This ensures we can always get the most recent one
        await kv.set(`user:${userId}:latest-resume`, uuid);

        setStatusText('Analyzing...');

        const finalPrompt = prepareInstructions({ jobTitle, jobDescription }) + 
            (extractedText ? `\n\n--- OCR EXTRACTED TEXT FROM RESUME ---\n${extractedText}\n--------------------------------------\n` : "");

        const gapPrompt = prepareKeywordGapInstructions({ jobTitle, jobDescription }) + 
            (extractedText ? `\n\n--- OCR EXTRACTED TEXT FROM RESUME ---\n${extractedText}\n--------------------------------------\n` : "");

        const [feedback, gapFeedback] = await Promise.all([
            ai.feedback(resumePath, finalPrompt),
            ai.feedback(resumePath, gapPrompt)
        ]);
        
        if (!feedback) return setStatusText('Error: Failed to analyze resume');

        const feedbackText = typeof feedback.message.content === 'string'
            ? feedback.message.content
            : feedback.message.content[0].text;

        const gapFeedbackText = typeof gapFeedback?.message?.content === 'string'
            ? gapFeedback.message.content
            : gapFeedback?.message?.content?.[0]?.text || "{}";

        let parsedFeedback: any;
        let parsedGapFeedback: KeywordGapAnalysis | null = null;
        try {
            const cleanedText = feedbackText.replace(/```json/i, '').replace(/```/g, '').trim();
            parsedFeedback = JSON.parse(cleanedText);
            
            // Normalize in case the AI nested the response inside a "feedback" key
            if (parsedFeedback.feedback) parsedFeedback = parsedFeedback.feedback;
            if (parsedFeedback.Feedback) parsedFeedback = parsedFeedback.Feedback;
            
        } catch (parseError) {
            setIsProcessing(false);
            setStatusText('Error: AI returned an unexpected response. Please try again.');
            return;
        }

        try {
            const cleanedGapText = gapFeedbackText.replace(/```json/i, '').replace(/```/g, '').trim();
            parsedGapFeedback = JSON.parse(cleanedGapText) as KeywordGapAnalysis;
        } catch (parseError) {
            console.warn("Keyword gap analysis parsing failed", parseError);
        }

        // Safely extract scores to prevent 0/100 crashes with lowercase or string AI outputs
        const safeScore = (val: any) => Number(val) || 0;
        const normalizedFeedback: Feedback = {
            overallScore: safeScore(parsedFeedback.overallScore || parsedFeedback.overall_score || parsedFeedback.overall || 0),
            ATS: {
                score: safeScore(parsedFeedback.ATS?.score || parsedFeedback.ats?.score || 0),
                tips: parsedFeedback.ATS?.tips || parsedFeedback.ats?.tips || []
            },
            toneAndStyle: {
                score: safeScore(parsedFeedback.toneAndStyle?.score || parsedFeedback.tone_and_style?.score || parsedFeedback.tone?.score || 0),
                tips: parsedFeedback.toneAndStyle?.tips || parsedFeedback.tone_and_style?.tips || parsedFeedback.tone?.tips || []
            },
            content: {
                score: safeScore(parsedFeedback.content?.score || parsedFeedback.content_score || 0),
                tips: parsedFeedback.content?.tips || []
            },
            structure: {
                score: safeScore(parsedFeedback.structure?.score || parsedFeedback.structure_score || 0),
                tips: parsedFeedback.structure?.tips || []
            },
            skills: {
                score: safeScore(parsedFeedback.skills?.score || parsedFeedback.skills_score || 0),
                tips: parsedFeedback.skills?.tips || []
            }
        };

        data.feedback = normalizedFeedback;
        data.keywordGapAnalysis = parsedGapFeedback;
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        // Append score snapshot to history for this job title
        setStatusText('Saving score history...');
        const snapshot: ScoreSnapshot = {
            resumeId: uuid,
            overallScore: normalizedFeedback.overallScore,
            ATS: normalizedFeedback.ATS.score,
            toneAndStyle: normalizedFeedback.toneAndStyle.score,
            content: normalizedFeedback.content.score,
            structure: normalizedFeedback.structure.score,
            skills: normalizedFeedback.skills.score,
            createdAt: Date.now(),
        };
        const historyKey = `history:${userId}:${jobTitle.trim().toLowerCase()}`;
        try {
            const existingHistory = await kv.get(historyKey);
            const history: ScoreSnapshot[] = existingHistory ? JSON.parse(existingHistory as string) : [];
            history.push(snapshot);
            await kv.set(historyKey, JSON.stringify(history));
        } catch {
            // Non-critical — don't block the flow if history save fails
            console.warn('Failed to save score history');
        }

        setStatusText('Analysis complete, redirecting...');
        console.log('AI Parsed Output:', normalizedFeedback);
        
        // Use hard navigation to bypass any react-router quirks that are keeping you glued to the page
        window.location.href = `/resume/${uuid}`;

        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err));
            setStatusText(`Error: ${message}. Please try again.`);
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) {
            setStatusText('Please select a resume file before analyzing.');
            return;
        }

        setStatusText('');
        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" />
                        </>
                    ) : (
                        <>
                            <h2>Drop your resume for an ATS score and improvement tips</h2>
                            {statusText && (
                                <p className="text-red-500 text-sm font-medium mt-2">{statusText}</p>
                            )}
                        </>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="w-full flex">
                                <JobUrlInput 
                                    onParsed={(data) => {
                                        setCompanyName(data.companyName);
                                        setJobTitle(data.jobTitle);
                                        setJobDescription(data.jobDescription);
                                    }} 
                                />
                            </div>

                            <div className="flex items-center gap-4 my-2">
                                <hr className="flex-1 border-gray-200" />
                                <span className="text-gray-400 text-sm">or fill in manually</span>
                                <hr className="flex-1 border-gray-200" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Job Description" id="job-description" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload