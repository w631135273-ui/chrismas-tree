import { useEffect, useRef, useState } from 'react';

export const MusicPlayer = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [userInteracted, setUserInteracted] = useState(false);

    useEffect(() => {
        // Fetch custom music
        const fetchMusic = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/music');
                if (response.ok) {
                    const urls = await response.json();
                    if (urls.length > 0 && audioRef.current) {
                        // Play the latest uploaded song
                        audioRef.current.src = urls[0];
                    }
                }
            } catch (err) {
                console.error("Failed to fetch music", err);
            }
        };
        fetchMusic();

        const playAudio = async () => {
            if (audioRef.current) {
                try {
                    audioRef.current.volume = 0.4;
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (err) {
                    console.log("Autoplay blocked, waiting for interaction", err);
                    setIsPlaying(false);
                }
            }
        };

        playAudio();

        const handleInteraction = () => {
            if (!userInteracted) {
                setUserInteracted(true);
                playAudio();
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('mousemove', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('mousemove', handleInteraction);
        };
    }, [userInteracted]);

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <audio
                ref={audioRef}
                src="/assets/christmas_bgm.mp3" // Default fallback
                loop
                autoPlay
            />
            {!isPlaying && (
                <button
                    onClick={() => {
                        if (audioRef.current) {
                            audioRef.current.play();
                            setIsPlaying(true);
                        }
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-700 transition-colors animate-bounce font-bold"
                >
                    🎵 Play Music
                </button>
            )}
            {isPlaying && (
                <button
                    onClick={() => {
                        if (audioRef.current) {
                            if (audioRef.current.paused) {
                                audioRef.current.play();
                            } else {
                                audioRef.current.pause();
                                setIsPlaying(false);
                            }
                        }
                    }}
                    className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                >
                    {isPlaying ? '🔊' : 'mute'}
                </button>
            )}
        </div>
    );
};
