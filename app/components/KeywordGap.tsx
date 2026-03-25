import { type KeywordGapAnalysis } from '../../constants';

interface KeywordGapProps {
    data?: KeywordGapAnalysis | null;
}

export default function KeywordGap({ data }: KeywordGapProps) {
    if (!data || !data.stats) {
        return (
            <div className="w-full bg-white rounded-xl shadow p-6 flex flex-col gap-6 mt-8">
                <h3 className="text-xl font-bold text-gray-800">Keyword Gap Analysis</h3>
                <p className="text-red-500 font-medium">
                    Analysis not available. Either this is an old resume, or the AI failed to extract enough keywords from the provided job description.
                </p>
                <p className="text-xs text-gray-400">Raw Data Check: {JSON.stringify(data || null)}</p>
            </div>
        );
    }

    const { stats, keywords } = data;
    
    // Sort critical missing keywords first
    const missing = [...(keywords.missing || [])].sort((a, b) => {
        if (a.importance === 'must_have' && b.importance !== 'must_have') return -1;
        if (a.importance !== 'must_have' && b.importance === 'must_have') return 1;
        return b.jdFrequency - a.jdFrequency;
    });
    
    const matched = keywords.matched || [];

    return (
        <div className="w-full bg-white rounded-xl shadow p-6 flex flex-col gap-6 mt-8">
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-gray-800">Keyword Gap Analysis</h3>
                <p className="text-gray-500 text-sm">
                    We scanned your resume against the job description to find missing skills and keywords.
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50/50 p-4 rounded-lg flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-blue-600">{stats.overallCoveragePercent}%</span>
                    <span className="text-xs text-blue-800/70 font-medium uppercase tracking-wider mt-1">Match Rate</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-gray-700">{stats.totalJobKeywords}</span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Total JD Keywords</span>
                </div>
                <div className="bg-green-50 p-4 rounded-lg flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-green-600">{stats.matchedKeywordCount}</span>
                    <span className="text-xs text-green-800/70 font-medium uppercase tracking-wider mt-1">Matched</span>
                </div>
                <div className="bg-red-50 p-4 rounded-lg flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-red-600">{stats.missingKeywordCount}</span>
                    <span className="text-xs text-red-800/70 font-medium uppercase tracking-wider mt-1">Missing</span>
                </div>
            </div>

            {/* Missing Keywords */}
            <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Missing from Resume
                </h4>
                {missing.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Great job! You hit all the major keywords.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {missing.map((kw, idx) => (
                            <span 
                                key={idx} 
                                title={kw.suggestedPlacementHint ? `Suggestion: ${kw.suggestedPlacementHint}` : undefined}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                                    kw.importance === 'must_have' 
                                        ? 'bg-red-50 border-red-200 text-red-700' 
                                        : 'bg-orange-50 border-orange-200 text-orange-700'
                                }`}
                            >
                                {kw.keyword}
                                {kw.importance === 'must_have' && <span className="ml-1 text-red-500 font-bold">*</span>}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Matched Keywords */}
            <div className="flex flex-col gap-3 mt-2">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Successfully Matched
                </h4>
                {matched.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No exact keyword matches found.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {matched.map((kw, idx) => (
                            <span 
                                key={idx} 
                                className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 border border-green-200 text-green-700"
                            >
                                {kw.keyword}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="text-xs text-gray-400 mt-2">
                * Must-have keyword according to job description analysis
            </div>
        </div>
    );
}
