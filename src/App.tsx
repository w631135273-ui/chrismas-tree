import { Scene } from './components/Scene';
import { HandTracker } from './components/HandTracker';
import { AdminPanel } from './components/AdminPanel';
import { MusicPlayer } from './components/MusicPlayer';
import { useState } from 'react';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // To force re-fetch of images

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Scene key={refreshKey} />

      <HandTracker />

      <MusicPlayer />

      {/* Admin Button */}
      <button
        onClick={() => setShowAdmin(true)}
        className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        title="Upload Photos"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </button>

      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          onUploadSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
}

export default App;
