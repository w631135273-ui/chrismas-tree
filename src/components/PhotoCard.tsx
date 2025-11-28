import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';

interface PhotoCardProps {
    url: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale?: number;
    index: number;
}

export const PhotoCard = ({ url, position, rotation, scale = 1 }: PhotoCardProps) => {
    const meshRef = useRef<THREE.Group>(null);
    const targetPosition = useRef(new THREE.Vector3(...position));
    const targetRotation = useRef(new THREE.Euler(...rotation));

    // Random floating offset
    const randomOffset = useMemo(() => Math.random() * 100, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Smooth interpolation to target position/rotation
        meshRef.current.position.lerp(targetPosition.current, delta * 2);

        // Interpolate rotation using Quaternion for smoothness
        const targetQ = new THREE.Quaternion().setFromEuler(targetRotation.current);
        meshRef.current.quaternion.slerp(targetQ, delta * 2);

        // Add slight floating animation
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime + randomOffset) * 0.002;
    });

    // Update targets when props change
    useMemo(() => {
        targetPosition.current.set(...position);
        targetRotation.current.set(...rotation);
    }, [position, rotation]);

    return (
        <group ref={meshRef}>
            <Image url={url} scale={[scale, scale * 1.5]} transparent opacity={0.9} side={THREE.DoubleSide} />
            {/* Optional: Add a frame or backing */}
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[scale * 1.05, scale * 1.55]} />
                <meshStandardMaterial color="#fff" side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};
