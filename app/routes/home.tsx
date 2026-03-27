import type { Route } from "./+types/home";
import Navbar from "~/components/navbar";
import ResumeCard from "~/components/resumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumely" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

const SkeletonCard = () => (
  <div className="resume-card animate-pulse">
    <div className="resume-card-header">
      <div className="flex flex-col gap-2 w-full">
        <div className="h-7 bg-gray-200 rounded-lg w-3/4"></div>
        <div className="h-5 bg-gray-100 rounded-lg w-1/2"></div>
      </div>
      <div className="flex-shrink-0">
        <div className="w-[100px] h-[100px] rounded-full bg-gray-200"></div>
      </div>
    </div>
    <div className="gradient-border">
      <div className="w-full h-[350px] max-sm:h-[200px] bg-gray-100 rounded-xl"></div>
    </div>
  </div>
);

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);

  useEffect(() => {
    if(!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated])

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      const rawEntries = (await kv.list('resume:*', true)) as KVItem[] | undefined;

      const parsed: Resume[] = [];
      if (rawEntries) {
        for (const entry of rawEntries) {
          try {
            const resume = JSON.parse(entry.value) as Resume;
            if (resume && resume.id) {
              parsed.push(resume);
            }
          } catch {
            // Skip malformed KV entries
          }
        }
      }

      // Sort by createdAt descending (newest first), entries without createdAt go last
      parsed.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      setResumes(parsed);
      setLoadingResumes(false);
    }

    loadResumes()
  }, []);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        {loadingResumes ? (
            <h2>Loading your resumes...</h2>
        ) : resumes.length === 0 ? (
            <h2>No resumes yet — upload your first one to get feedback.</h2>
        ) : (
            <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
        
        {!loadingResumes && resumes.length >= 2 && (
            <div className="mt-6">
              <button 
                  onClick={() => {
                      setIsCompareMode(!isCompareMode);
                      setSelectedResumes([]);
                  }}
                  className={`px-6 py-2 rounded-full font-semibold border transition-all ${
                      isCompareMode 
                          ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' 
                          : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm'
                  }`}
              >
                  {isCompareMode ? "Cancel Comparison" : "Compare Resumes"}
              </button>
            </div>
        )}
      </div>

      {loadingResumes && (
          <div className="resumes-section">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
      )}

      {!loadingResumes && resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
              <ResumeCard 
                  key={resume.id} 
                  resume={resume} 
                  onDelete={() => setResumes(prev => prev.filter(r => r.id !== resume.id))} 
                  isCompareMode={isCompareMode}
                  isSelected={selectedResumes.includes(resume.id)}
                  onToggleSelect={() => {
                      if (selectedResumes.includes(resume.id)) {
                          setSelectedResumes(prev => prev.filter(id => id !== resume.id));
                      } else if (selectedResumes.length < 2) {
                          setSelectedResumes(prev => [...prev, resume.id]);
                      }
                  }}
              />
          ))}
        </div>
      )}

      {!loadingResumes && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
      )}

      {isCompareMode && selectedResumes.length === 2 && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <Link 
            to={`/compare?r1=${selectedResumes[0]}&r2=${selectedResumes[1]}`}
            className="primary-button !w-auto shadow-2xl px-12 py-4 text-xl flex items-center justify-center gap-3 ring-4 ring-blue-100"
          >
            <span>Compare Selected Resumes</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
        </div>
      )}
    </section>
  </main>
}