import { create } from 'zustand';



interface AppState {
    mode: 'scattered' | 'tree';
    setMode: (mode: 'scattered' | 'tree') => void;
    toggleMode: () => void;

    rotation: number;
    setRotation: (rotation: number) => void;

    scrollY: number;
    setScrollY: (scrollY: number) => void;

    isHandDetected: boolean;
    setIsHandDetected: (detected: boolean) => void;

    handPosition: { x: number; y: number };
    setHandPosition: (pos: { x: number; y: number }) => void;
}

export const useStore = create<AppState>((set) => ({
    mode: 'tree',
    setMode: (mode) => set({ mode }),
    toggleMode: () => set((state) => ({ mode: state.mode === 'tree' ? 'scattered' : 'tree' })),

    rotation: 0,
    setRotation: (rotation) => set({ rotation }),

    scrollY: 0,
    setScrollY: (scrollY) => set({ scrollY }),

    isHandDetected: false,
    setIsHandDetected: (isHandDetected) => set({ isHandDetected }),

    handPosition: { x: 0, y: 0 },
    setHandPosition: (handPosition) => set({ handPosition }),
}));
