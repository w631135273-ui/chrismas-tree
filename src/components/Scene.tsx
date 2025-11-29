import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { PhotoTree } from './PhotoTree';
import { HandTracker } from './HandTracker';
import { FloatingParticles } from './FloatingParticles';

const CameraController = () => {
    const { mode } = useStore();
    const { camera } = useThree();
    const targetPos = useRef(new THREE.Vector3(0, 0, 28)); // Default to tree view (further back)

    useFrame((_, delta) => {
        // Determine target based on mode
        // Tree: Further back to see full tree
        // Scattered: Closer for immersive feel
        if (mode === 'tree') {
            targetPos.current.set(0, 0, 50); // Further back to see full tree
        } else {
            targetPos.current.set(0, 0, 45); // Further back to see explosion cloud (was 18)
        }

        camera.position.lerp(targetPos.current, delta * 1.5);
        camera.lookAt(0, 0, 0);
    });

    return null;
};

export const Scene = () => {
    return (
        <div className="w-full h-screen bg-black">
            <Canvas camera={{ position: [0, 0, 28], fov: 45 }}>
                <color attach="background" args={['#000000']} />

                <Suspense fallback={null}>
                    <CameraController />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />

                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <FloatingParticles />
                    <PhotoTree />
                    <OrbitControls enableZoom={false} />
                    <EffectComposer>
                        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={0.5} />
                    </EffectComposer>
                </Suspense>
            </Canvas>

            <div className="absolute top-4 left-4 text-white z-10 pointer-events-none">
                <h1 className="text-2xl font-bold">Gesture Christmas Tree</h1>
                <p className="text-sm opacity-70">Show your hand to interact</p>
            </div>
            <HandTracker />
        </div>
    );
};
