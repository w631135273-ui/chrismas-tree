import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import { PhotoCard } from './PhotoCard';
import * as THREE from 'three';

const PHOTO_COUNT = 180;
const ORNAMENT_COUNT = 100;
const IMAGES = [
    '/assets/image1.png',
    '/assets/image2.png',
    '/assets/image3.png',
];

export const PhotoTree = () => {
    const { mode, rotation, scrollY } = useStore();
    const groupRef = useRef<THREE.Group>(null);

    // Generate photos data
    const photos = useMemo(() => {
        return Array.from({ length: PHOTO_COUNT }).map((_, i) => ({
            id: i,
            url: IMAGES[i % IMAGES.length],
        }));
    }, []);

    // Generate ornaments data
    const ornaments = useMemo(() => {
        const colors = ['#ff0000', '#ffd700', '#00ff00', '#0088ff', '#ff00ff'];
        return Array.from({ length: ORNAMENT_COUNT }).map((_, i) => ({
            id: i + PHOTO_COUNT,
            color: colors[i % colors.length],
        }));
    }, []);

    // Calculate positions for Tree mode (Tiered/Layered)
    const treeLayout = useMemo(() => {
        return photos.map((_, i) => {
            const t = i / (PHOTO_COUNT - 1);

            // Tiered Spiral
            // Create distinct layers for a more "pine tree" look
            const layers = 8;
            const layerT = (t * layers) % 1; // Position within layer

            const height = 16;
            const y = -height / 2 + t * height;

            // Radius varies per layer to create "branches"
            const maxRadius = 7.0;
            const baseRadius = maxRadius * (1 - t);
            const branchOffset = Math.sin(layerT * Math.PI) * 0.5; // Bulge out in middle of layer
            const radius = baseRadius + branchOffset + 0.5;

            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const angle = i * goldenAngle;

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const lookAtPos = new THREE.Vector3(0, y, 0);
            const pos = new THREE.Vector3(x, y, z);
            const dummy = new THREE.Object3D();
            dummy.position.copy(pos);
            dummy.lookAt(lookAtPos);
            dummy.rotateY(Math.PI); // Face out

            // Random tilt
            dummy.rotateX((Math.random() - 0.5) * 0.3);
            dummy.rotateZ((Math.random() - 0.5) * 0.3);

            return {
                position: [x, y, z] as [number, number, number],
                rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z] as [number, number, number],
            };
        });
    }, [photos]);

    // Ornament Layout
    const ornamentLayout = useMemo(() => {
        return ornaments.map((_, i) => {
            const t = i / (ORNAMENT_COUNT - 1);
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const angle = i * goldenAngle + Math.PI / 2;

            const height = 16;
            const y = -height / 2 + t * height;

            const maxRadius = 7.2;
            const radius = maxRadius * (1 - t) + 0.8; // Slightly further out

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            return {
                position: [x, y, z] as [number, number, number],
            };
        });
    }, [ornaments]);

    // Calculate positions for Scattered mode
    const scatterLayout = useMemo(() => {
        return photos.map((_, i) => {
            const range = 25;
            const isFront = i % 2 === 0;
            const baseRotationY = isFront ? 0 : Math.PI;

            return {
                position: [
                    (Math.random() - 0.5) * range,
                    (Math.random() - 0.5) * range,
                    (Math.random() - 0.5) * range,
                ] as [number, number, number],
                rotation: [
                    (Math.random() - 0.5) * 0.5,
                    baseRotationY + (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                ] as [number, number, number],
            };
        });
    }, [photos]);

    const scatterOrnamentLayout = useMemo(() => {
        return ornaments.map(() => {
            const range = 25;
            return {
                position: [
                    (Math.random() - 0.5) * range,
                    (Math.random() - 0.5) * range,
                    (Math.random() - 0.5) * range,
                ] as [number, number, number],
            };
        });
    }, [ornaments]);

    useFrame((_, delta) => {
        if (groupRef.current) {
            // Smooth rotation
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation, delta * 2);

            // Smooth scroll
            const currentY = groupRef.current.position.y;
            groupRef.current.position.y = THREE.MathUtils.lerp(currentY, scrollY, delta * 5);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Tree Trunk */}
            {mode === 'tree' && (
                <mesh position={[0, -9, 0]}>
                    <cylinderGeometry args={[1, 1.5, 4, 8]} />
                    <meshStandardMaterial color="#3e2723" roughness={0.9} />
                </mesh>
            )}

            {photos.map((photo, i) => {
                const layout = mode === 'tree' ? treeLayout[i] : scatterLayout[i];

                return (
                    <PhotoCard
                        key={photo.id}
                        index={i}
                        url={photo.url}
                        position={layout.position}
                        rotation={layout.rotation}
                        scale={1.2}
                    />
                );
            })}

            {ornaments.map((ornament, i) => {
                const layout = mode === 'tree' ? ornamentLayout[i] : scatterOrnamentLayout[i];
                return (
                    <mesh key={ornament.id} position={layout.position}>
                        <sphereGeometry args={[0.18, 16, 16]} />
                        <meshStandardMaterial color={ornament.color} emissive={ornament.color} emissiveIntensity={2} toneMapped={false} />
                        <pointLight distance={3} intensity={0.8} color={ornament.color} decay={2} />
                    </mesh>
                );
            })}

            {/* Star at the top */}
            {mode === 'tree' && (
                <mesh position={[0, 8.5, 0]}>
                    <octahedronGeometry args={[1.0, 0]} />
                    <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={5} toneMapped={false} />
                    <pointLight distance={20} intensity={4} color="#ffd700" />
                </mesh>
            )}
        </group>
    );
};
