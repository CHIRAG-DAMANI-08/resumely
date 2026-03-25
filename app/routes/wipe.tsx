import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
    const { auth, isLoading, error, clearError, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);
    const [confirmWipe, setConfirmWipe] = useState(false);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [isLoading]);

    const handleDelete = async () => {
        if (!confirmWipe) {
            setConfirmWipe(true);
            return;
        }
        files.forEach(async (file) => {
            await fs.delete(file.path);
        });
        await kv.flush();
        setConfirmWipe(false);
        loadFiles();
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error {error}</div>;
    }

    return (
        <div>
            Authenticated as: {auth.user?.username}
            <div>Existing files:</div>
            <div className="flex flex-col gap-4">
                {files.map((file) => (
                    <div key={file.id} className="flex flex-row gap-4">
                        <p>{file.name}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-row gap-4 mt-4">
                <button
                    className={`${confirmWipe ? "bg-red-600" : "bg-blue-500"} text-white px-4 py-2 rounded-md cursor-pointer`}
                    onClick={() => handleDelete()}
                >
                    {confirmWipe ? "Yes, I'm sure — Wipe Everything" : "Wipe App Data"}
                </button>
                {confirmWipe && (
                    <button
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md cursor-pointer"
                        onClick={() => setConfirmWipe(false)}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

export default WipeApp;