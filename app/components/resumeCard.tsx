import {Link} from "react-router";
import ScoreCircle from "~/components/scoreCircle";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";

interface ResumeCardProps {
    resume: Resume;
    onDelete?: () => void;
    isCompareMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}

const ResumeCard = ({ resume, onDelete, isCompareMode = false, isSelected = false, onToggleSelect }: ResumeCardProps) => {
    const { fs, kv } = usePuterStore();
    const { id, companyName, jobTitle, feedback, imagePath, resumePath } = resume;
    const [resumeUrl, setResumeUrl] = useState('');
    const [imageLoadFailed, setImageLoadFailed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!imagePath) {
            setImageLoadFailed(true);
            return;
        }

        const loadResume = async () => {
            try {
                const blob = await fs.read(imagePath);
                if(!blob) {
                    setImageLoadFailed(true);
                    return;
                }
                let url = URL.createObjectURL(blob);
                setResumeUrl(url);
            } catch {
                setImageLoadFailed(true);
            }
        }

        loadResume();

        return () => {
            if (resumeUrl) URL.revokeObjectURL(resumeUrl);
        };
    }, [imagePath]);

    const ImagePlaceholder = () => (
        <div className="w-full h-[350px] max-sm:h-[200px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center gap-3">
            <img src="/icons/info.svg" alt="no preview" className="w-12 h-12 opacity-40" />
            <p className="text-gray-400 text-sm font-medium">Preview not available</p>
        </div>
    );

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowDeleteModal(true);
    };

    const confirmDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleting(true);
        setShowDeleteModal(false);
        try {
            const key = `resume:${id}`;
            await kv.delete(key);

            try { if (imagePath) await fs.delete(imagePath); } catch (err) {}
            try { if (resumePath) await fs.delete(resumePath); } catch (err) {}
            
            if (onDelete) onDelete();
        } catch (error) {
            console.error('Failed to delete resume:', error);
            setIsDeleting(false);
        }
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowDeleteModal(false);
    };

    const cardContent = (
        <>
            {/* Selection Checkmark Overlay */}
            {isCompareMode && (
                <div className={`absolute -top-3 -left-3 z-30 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors shadow-md ${
                    isSelected 
                        ? 'bg-blue-600 border-white text-white' 
                        : 'bg-white border-gray-300 text-transparent'
                }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                </div>
            )}
            
            <div className={`resume-card-header relative ${isCompareMode ? 'pointer-events-none' : ''}`}>
                    <button 
                        onClick={handleDeleteClick}
                        className="absolute top-0 right-0 z-10 p-2 bg-white/80 hover:bg-red-50 text-red-500 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Delete resume"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                    <div className="flex flex-col gap-2 pr-6">
                        {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                        {jobTitle && <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>}
                        {!companyName && !jobTitle && <h2 className="!text-black font-bold">Resume</h2>}
                    </div>
                    <div className="flex-shrink-0">
                        <ScoreCircle score={feedback?.overallScore ?? 0} />
                    </div>
                </div>
                <div className="gradient-border animate-in fade-in duration-1000">
                    <div className="w-full h-full">
                        {!imageLoadFailed && resumeUrl ? (
                            <img
                                src={resumeUrl}
                                alt="resume"
                                className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
                                onError={() => setImageLoadFailed(true)}
                            />
                        ) : (
                            <ImagePlaceholder />
                        )}
                    </div>
                </div>
        </>
    );

    const cardClasses = `resume-card animate-in fade-in duration-1000 ${isDeleting ? 'opacity-50 pointer-events-none' : ''} ${
        isCompareMode ? 'cursor-pointer transition-all hover:scale-[1.02]' : ''
    } ${
        isSelected ? 'ring-4 ring-blue-500 shadow-xl scale-[1.02]' : ''
    }`;

    return (
        <div className="relative group">
            {isCompareMode ? (
                <div 
                    onClick={onToggleSelect}
                    className={cardClasses}
                >
                    {cardContent}
                </div>
            ) : (
                <Link to={`/resume/${id}`} className={cardClasses}>
                    {cardContent}
                </Link>
            )}

            {showDeleteModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <div className="bg-white border rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Delete Resume?</h3>
                        <p className="text-sm text-gray-500">This action cannot be undone. All AI feedback and files will be permanently deleted.</p>
                        
                        <div className="flex gap-3 w-full mt-2">
                            <button 
                                onClick={cancelDelete}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default ResumeCard