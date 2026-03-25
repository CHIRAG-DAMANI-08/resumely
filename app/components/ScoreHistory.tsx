"use client";
import { useEffect, useState } from 'react';
import { usePuterStore } from '~/lib/puter';
import { cn } from '~/lib/utils';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    CartesianGrid,
} from 'recharts';

type CategoryKey = 'overallScore' | 'ATS' | 'toneAndStyle' | 'content' | 'structure' | 'skills';

const categories: { key: CategoryKey; label: string }[] = [
    { key: 'overallScore', label: 'Overall' },
    { key: 'ATS', label: 'ATS' },
    { key: 'toneAndStyle', label: 'Tone' },
    { key: 'content', label: 'Content' },
    { key: 'structure', label: 'Structure' },
    { key: 'skills', label: 'Skills' },
];

const ScoreLineChart = ({
    history,
    activeCategory,
}: {
    history: ScoreSnapshot[];
    activeCategory: CategoryKey;
}) => {
    const data = history.map((s, i) => ({
        name: `#${i + 1}`,
        score: s[activeCategory],
    }));

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                />
                <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                />
                <Tooltip
                    contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '13px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => [`${value ?? 0}`, 'Score']}
                />
                <ReferenceLine
                    y={70}
                    stroke="#f59e0b"
                    strokeDasharray="6 3"
                    label={{
                        value: 'ATS Threshold',
                        position: 'right',
                        fill: '#f59e0b',
                        fontSize: 11,
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#606beb"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#606beb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#606beb', strokeWidth: 2, stroke: '#fff' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

const ScoreHistory = ({ userId, jobTitle }: { userId: string; jobTitle: string }) => {
    const { kv } = usePuterStore();
    const [history, setHistory] = useState<ScoreSnapshot[]>([]);
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('overallScore');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || !jobTitle) {
            setLoading(false);
            return;
        }

        const loadHistory = async () => {
            setLoading(true);
            try {
                const historyKey = `history:${userId}:${jobTitle.trim().toLowerCase()}`;
                const raw = await kv.get(historyKey);
                if (raw) {
                    const parsed = JSON.parse(raw as string) as ScoreSnapshot[];
                    setHistory(parsed);
                }
            } catch {
                console.warn('Failed to load score history');
            }
            setLoading(false);
        };

        loadHistory();
    }, [userId, jobTitle]);

    // Loading skeleton
    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-md w-full p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded-lg w-48 mb-4"></div>
                <div className="flex gap-2 mb-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-8 w-16 bg-gray-200 rounded-full"></div>
                    ))}
                </div>
                <div className="h-[200px] bg-gray-100 rounded-xl"></div>
            </div>
        );
    }

    // Need at least 2 snapshots to show a meaningful chart
    if (history.length < 2) {
        return (
            <div className="bg-white rounded-2xl shadow-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Score History</h3>
                <p className="text-sm text-gray-500">
                    Upload more resumes for <span className="font-medium text-gray-700">"{jobTitle}"</span> to see your progress over time.
                </p>
            </div>
        );
    }

    // Compute delta
    const firstScore = history[0][activeCategory];
    const lastScore = history[history.length - 1][activeCategory];
    const delta = lastScore - firstScore;

    return (
        <div className="bg-white rounded-2xl shadow-md w-full p-6">
            <div className="flex flex-row items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-xl font-bold text-gray-800">Score History</h3>
                {delta !== 0 && (
                    <span
                        className={cn(
                            'text-sm font-semibold px-3 py-1 rounded-full',
                            delta > 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700',
                        )}
                    >
                        {delta > 0 ? '+' : ''}{delta} pts since first
                    </span>
                )}
            </div>

            {/* Category pills */}
            <div className="flex flex-row gap-2 mb-4 flex-wrap">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={cn(
                            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
                            activeCategory === cat.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Line chart */}
            <ScoreLineChart history={history} activeCategory={activeCategory} />

            <p className="text-xs text-gray-400 mt-2 text-center">
                {history.length} reviews for "{jobTitle}"
            </p>
        </div>
    );
};

export default ScoreHistory;
