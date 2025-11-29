import { useState, useRef, useEffect } from 'react';

export const AdminPanel = ({ onClose, onUploadSuccess }: { onClose: () => void, onUploadSuccess: () => void }) => {
    const [activeTab, setActiveTab] = useState<'photos' | 'music'>('photos');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [existingMusic, setExistingMusic] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch existing files on mount
    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = () => {
        fetch('http://localhost:3000/api/images')
            .then(res => res.json())
            .then(data => setExistingImages(data))
            .catch(err => console.error(err));

        fetch('http://localhost:3000/api/music')
            .then(res => res.json())
            .then(data => setExistingMusic(data))
            .catch(err => console.error(err));
    };

    const handleDelete = async (url: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        const filename = url.split('/').pop();
        if (!filename) return;

        try {
            const response = await fetch('http://localhost:3000/api/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename }),
            });

            if (response.ok) {
                setMessage('File deleted successfully');
                fetchFiles(); // Refresh lists
            } else {
                setMessage('Failed to delete file');
            }
        } catch (error) {
            console.error(error);
            setMessage('Error deleting file');
        }
    };

    const handleUpload = async () => {
        if (!fileInputRef.current?.files?.length) {
            setMessage('Please select files first.');
            return;
        }

        setUploading(true);
        setMessage('');

        const formData = new FormData();
        Array.from(fileInputRef.current.files).forEach(file => {
            formData.append('files', file); // Changed key to 'files' to match server
        });

        try {
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setMessage('Upload successful!');
                if (fileInputRef.current) fileInputRef.current.value = '';
                onUploadSuccess();
                fetchFiles(); // Refresh lists
            } else {
                setMessage('Upload failed.');
            }
        } catch (error) {
            console.error(error);
            setMessage('Error uploading files.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 p-6 rounded-xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Upload Manager</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'photos' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}
                    >
                        📸 Photos
                    </button>
                    <button
                        onClick={() => setActiveTab('music')}
                        className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'music' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}
                    >
                        🎵 Music
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 mb-2">
                        {activeTab === 'photos' ? 'Select Images (JPG, PNG)' : 'Select Music (MP3)'}
                    </label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple={activeTab === 'photos'} // Music usually single file, but multiple ok
                        accept={activeTab === 'photos' ? "image/*" : "audio/*"}
                        className="block w-full text-sm text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-white/10 file:text-white
                            hover:file:bg-white/20
                            cursor-pointer border border-gray-700 rounded-lg p-2"
                    />
                </div>

                <div className="flex justify-end gap-3 mb-6">
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={`px-6 py-2 rounded-lg font-bold text-white transition-colors disabled:opacity-50 ${activeTab === 'photos' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'}`}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>

                {message && (
                    <p className={`mb-6 text-center text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}

                {/* Gallery Preview */}
                {activeTab === 'photos' && (
                    <div>
                        <h3 className="text-white font-bold mb-3">Current Photos ({existingImages.length})</h3>
                        <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-black/30 rounded-lg">
                            {existingImages.map((url, i) => (
                                <div key={i} className="aspect-square relative group">
                                    <img src={url} alt={`uploaded-${i}`} className="w-full h-full object-cover rounded-md" />
                                    <button
                                        onClick={() => handleDelete(url)}
                                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {existingImages.length === 0 && (
                                <p className="col-span-4 text-gray-500 text-center py-4">No photos uploaded yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Music List */}
                {activeTab === 'music' && (
                    <div>
                        <h3 className="text-white font-bold mb-3">Current Music ({existingMusic.length})</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-black/30 rounded-lg">
                            {existingMusic.map((url, i) => {
                                const name = url.split('/').pop();
                                return (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded hover:bg-white/10">
                                        <span className="text-gray-300 text-sm truncate max-w-[80%]">🎵 {name}</span>
                                        <button
                                            onClick={() => handleDelete(url)}
                                            className="text-red-400 hover:text-red-300 px-2"
                                            title="Delete"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                );
                            })}
                            {existingMusic.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No music uploaded yet.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
