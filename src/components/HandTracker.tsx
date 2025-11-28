import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

export const HandTracker = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<string>('Initializing...');
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
    const [isAIEnabled, setIsAIEnabled] = useState(true);
    const [gesture, setGesture] = useState<string>('None');

    const { setMode, setRotation, setScrollY, setIsHandDetected, setHandPosition } = useStore();

    const lastGestureRef = useRef<string | null>(null);
    const lastXRef = useRef<number | null>(null);
    const lastYRef = useRef<number | null>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Initialize AI
    useEffect(() => {
        const setupAI = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );
                handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                });
                setStatus(prev => prev === 'Initializing...' ? 'AI Ready' : prev);
            } catch (err) {
                console.error(err);
                setError('AI Load Failed: ' + (err as Error).message);
            }
        };
        setupAI();
    }, []);

    // Get Cameras
    useEffect(() => {
        const getCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCameras(videoDevices);
                if (videoDevices.length > 0) {
                    setCurrentCameraId(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error("Error enumerating devices:", err);
            }
        };
        getCameras();
    }, []);

    const startCamera = useCallback(async (deviceId: string) => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }

            setStatus('Requesting Camera...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                videoRef.current.onloadedmetadata = () => {
                    setDebugInfo(`Res: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
                    if (canvasRef.current && videoRef.current) {
                        canvasRef.current.width = videoRef.current.videoWidth;
                        canvasRef.current.height = videoRef.current.videoHeight;
                    }
                };
                videoRef.current.onplaying = () => {
                    setStatus('Active');
                };
                videoRef.current.onerror = () => {
                    setError(`Video Error: ${videoRef.current?.error?.message}`);
                };

                await videoRef.current.play();
            }
        } catch (err) {
            console.error(err);
            setError('Camera Error: ' + (err as Error).message);
            setStatus('Error');
        }
    }, []);

    // Switch Camera
    useEffect(() => {
        if (currentCameraId) {
            startCamera(currentCameraId);
        }
    }, [currentCameraId, startCamera]);

    // Prediction Loop
    useEffect(() => {
        const predict = () => {
            if (!isAIEnabled || !handLandmarkerRef.current || !videoRef.current || !canvasRef.current) {
                animationFrameRef.current = requestAnimationFrame(predict);
                return;
            }

            const startTimeMs = performance.now();
            if (videoRef.current.currentTime > 0 && !videoRef.current.paused && !videoRef.current.ended) {
                const result = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

                const canvasCtx = canvasRef.current.getContext('2d');
                if (canvasCtx) {
                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    if (result.landmarks && result.landmarks.length > 0) {
                        setIsHandDetected(true);
                        const landmarks = result.landmarks[0];

                        // Draw landmarks
                        const drawingUtils = new DrawingUtils(canvasCtx);
                        for (const landmark of landmarks) {
                            drawingUtils.drawLandmarks([landmark], { color: '#FF0000', lineWidth: 2 });
                        }
                        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });

                        const wrist = landmarks[0];
                        const middleFingerMCP = landmarks[9];
                        const centerX = (wrist.x + middleFingerMCP.x) / 2;
                        const centerY = (wrist.y + middleFingerMCP.y) / 2;

                        setHandPosition({ x: centerX, y: centerY });

                        // Improved Gesture Logic: Fist vs Open Hand
                        const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
                        const mcps = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];

                        let curledFingers = 0;
                        for (let i = 0; i < 4; i++) {
                            const tip = tips[i];
                            const mcp = mcps[i];
                            const distToWrist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
                            const distToMCP = Math.sqrt(Math.pow(tip.x - mcp.x, 2) + Math.pow(tip.y - mcp.y, 2));

                            if (distToWrist < 0.15 || distToMCP < 0.1) {
                                curledFingers++;
                            }
                        }

                        const thumbTip = landmarks[4];
                        const indexMCP = landmarks[5];
                        const thumbDist = Math.sqrt(Math.pow(thumbTip.x - indexMCP.x, 2) + Math.pow(thumbTip.y - indexMCP.y, 2));
                        if (thumbDist < 0.1) curledFingers++;

                        const isFist = curledFingers >= 4;
                        const isOpen = curledFingers <= 1;

                        if (isFist) {
                            setGesture('Fist (Tree)');
                            if (lastGestureRef.current !== 'fist') {
                                setMode('tree');
                                lastGestureRef.current = 'fist';
                            }
                        } else if (isOpen) {
                            setGesture('Open (Scatter)');
                            if (lastGestureRef.current !== 'open') {
                                setMode('scattered');
                                lastGestureRef.current = 'open';
                            }
                        } else {
                            setGesture('Neutral');
                        }

                        // Rotation & Scrolling Logic
                        const currentX = 1 - centerX;
                        const currentY = 1 - centerY;

                        if (lastXRef.current !== null && lastYRef.current !== null) {
                            const deltaX = currentX - lastXRef.current;
                            const deltaY = currentY - lastYRef.current;

                            const sensitivity = 4;
                            const scrollSensitivity = 15;

                            const state = useStore.getState();
                            setRotation(state.rotation + deltaX * sensitivity);

                            // Invert deltaY for natural scrolling (hand up = content up)
                            const newScroll = state.scrollY - (deltaY * scrollSensitivity);
                            setScrollY(Math.max(-10, Math.min(10, newScroll)));
                        }
                        lastXRef.current = currentX;
                        lastYRef.current = currentY;

                    } else {
                        setIsHandDetected(false);
                        lastXRef.current = null;
                        lastYRef.current = null;
                        setGesture('None');
                    }
                    canvasCtx.restore();
                }
            }
            animationFrameRef.current = requestAnimationFrame(predict);
        };

        animationFrameRef.current = requestAnimationFrame(predict);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isAIEnabled, setMode, setRotation, setScrollY, setIsHandDetected, setHandPosition]);

    const cycleCamera = () => {
        if (cameras.length <= 1) return;
        const currentIndex = cameras.findIndex(c => c.deviceId === currentCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        setCurrentCameraId(cameras[nextIndex].deviceId);
    };

    return (
        <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-auto">
            {error && (
                <div className="bg-red-500/90 text-white p-2 rounded text-xs max-w-xs shadow-lg backdrop-blur-sm">
                    <p className="font-bold mb-1">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 bg-white text-red-600 px-2 py-1 rounded text-xs font-bold hover:bg-gray-100"
                    >
                        Reload Page
                    </button>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={() => setIsAIEnabled(!isAIEnabled)}
                    className={`px-2 py-1 rounded text-xs font-bold ${isAIEnabled ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                >
                    AI: {isAIEnabled ? 'ON' : 'OFF'}
                </button>
                {cameras.length > 1 && (
                    <button
                        onClick={cycleCamera}
                        className="px-2 py-1 rounded text-xs font-bold bg-blue-500 text-white"
                    >
                        Switch Cam ({cameras.findIndex(c => c.deviceId === currentCameraId) + 1}/{cameras.length})
                    </button>
                )}
            </div>

            <div className={`px-2 py-1 rounded text-xs mb-1 font-mono flex flex-col items-end ${status === 'Active' ? 'bg-green-500/50 text-green-100' : 'bg-black/50 text-white'}`}>
                <span>Status: {status}</span>
                <span>Gesture: {gesture}</span>
                <span className="text-[10px] opacity-75">{debugInfo}</span>
            </div>

            <div className="relative w-48 h-36 rounded-lg border-2 border-white/20 bg-gray-900 shadow-2xl overflow-hidden">
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                />
            </div>
        </div>
    );
};
