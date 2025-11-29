import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import { PhotoCard } from './PhotoCard';
import * as THREE from 'three';

const PHOTO_COUNT = 400; // Increased for density
const FOLIAGE_COUNT = 800; // New green foliage elements
const ORNAMENT_COUNT = 150;
const IMAGES = [
    '/assets/image1.png',
    '/assets/image2.png',
    '/assets/image3.png',
];

export const PhotoTree = () => {
    // Optimize: Only subscribe to mode changes to avoid re-renders on every frame
    const mode = useStore((state) => state.mode);
    const groupRef = useRef<THREE.Group>(null);

    // Generate photos data
    const photos = useMemo(() => {
        return Array.from({ length: PHOTO_COUNT }).map((_, i) => ({
            id: i,
            url: IMAGES[i % IMAGES.length],
        }));
    }, []);

    // Generate foliage data
    const foliage = useMemo(() => {
        return Array.from({ length: FOLIAGE_COUNT }).map((_, i) => ({
            id: i + PHOTO_COUNT + ORNAMENT_COUNT,
            scale: 0.5 + Math.random() * 0.5,
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

            // Power curve for pine shape (wider bottom, narrow top)
            const height = 22;
            const y = -height / 2 + t * height;

            // Normalized height from top (0) to bottom (1)
            const hNorm = 1 - t;

            // Radius curve: x^1.5 gives a nice concave slope
            const maxRadius = 9.0;
            const radius = maxRadius * Math.pow(hNorm, 1.2) + 0.5;

            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const angle = i * goldenAngle;

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // Add some jitter
            const jitterX = (Math.random() - 0.5) * 0.5;
            const jitterY = (Math.random() - 0.5) * 0.5;
            const jitterZ = (Math.random() - 0.5) * 0.5;

            const lookAtPos = new THREE.Vector3(0, y, 0);
            const pos = new THREE.Vector3(x + jitterX, y + jitterY, z + jitterZ);
            const dummy = new THREE.Object3D();
            dummy.position.copy(pos);
            dummy.lookAt(lookAtPos);
            dummy.rotateY(Math.PI); // Face out

            // Random tilt - more organic
            dummy.rotateX((Math.random() - 0.5) * 0.5);
            dummy.rotateZ((Math.random() - 0.5) * 0.5);
            dummy.rotateY((Math.random() - 0.5) * 0.2);

            return {
                position: [pos.x, pos.y, pos.z] as [number, number, number],
                rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z] as [number, number, number],
            };
        });
    }, [photos]);

    // Foliage Layout (Interspersed with photos)
    const foliageLayout = useMemo(() => {
        return foliage.map((_, i) => {
            const t = i / (FOLIAGE_COUNT - 1);
            const height = 22;
            const y = -height / 2 + t * height;
            const hNorm = 1 - t;

            const maxRadius = 8.5; // Slightly inside the photos
            const radius = maxRadius * Math.pow(hNorm, 1.2) * (0.8 + Math.random() * 0.4); // Variation in depth

            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const angle = i * goldenAngle + 2; // Offset angle

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const lookAtPos = new THREE.Vector3(0, y, 0);
            const pos = new THREE.Vector3(x, y, z);
            const dummy = new THREE.Object3D();
            dummy.position.copy(pos);
            dummy.lookAt(lookAtPos);
            dummy.rotateY(Math.PI);

            // Random rotation for leaves
            dummy.rotateX((Math.random() - 0.5) * 1.0);
            dummy.rotateZ((Math.random() - 0.5) * 1.0);
            dummy.rotateY((Math.random() - 0.5) * 3.0);

            return {
                position: [x, y, z] as [number, number, number],
                rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z] as [number, number, number],
            };
        });
    }, [foliage]);

    // Ornament Layout
    const ornamentLayout = useMemo(() => {
        return ornaments.map((_, i) => {
            const t = i / (ORNAMENT_COUNT - 1);
            const height = 22;
            const y = -height / 2 + t * height;
            const hNorm = 1 - t;

            const maxRadius = 9.2;
            const radius = maxRadius * Math.pow(hNorm, 1.2) + 0.2; // On the tips

            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const angle = i * goldenAngle + Math.PI; // Offset

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            return {
                position: [x, y, z] as [number, number, number],
            };
        });
    }, [ornaments]);

    // Calculate positions for Scattered mode (Explosion)
    const scatterLayout = useMemo(() => {
        return photos.map(() => {
            const range = 35; // Reduced range to keep in screen

            // Add velocity/direction based on index to make it look like an outward burst
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 2 + Math.random() * range; // Smaller min radius to fill center

            return {
                position: [
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi),
                ] as [number, number, number],
                rotation: [
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                ] as [number, number, number],
            };
        });
    }, [photos]);

    const scatterFoliageLayout = useMemo(() => {
        return foliage.map(() => {
            const range = 35;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 2 + Math.random() * range;

            return {
                position: [
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi),
                ] as [number, number, number],
                rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
            };
        });
    }, [foliage]);

    const scatterOrnamentLayout = useMemo(() => {
        return ornaments.map(() => {
            const range = 35;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 2 + Math.random() * range;

            return {
                position: [
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi),
                ] as [number, number, number],
            };
        });
    }, [ornaments]);

    useFrame((_, delta) => {
        if (groupRef.current) {
            // Optimize: Read state directly to avoid re-renders
            const state = useStore.getState();

            // Smooth rotation
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.rotation, delta * 2);

            // Smooth scroll
            const currentY = groupRef.current.position.y;
            groupRef.current.position.y = THREE.MathUtils.lerp(currentY, state.scrollY, delta * 5);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Tree Trunk - Wooden Style */}
            {mode === 'tree' && (
                <mesh position={[0, -12, 0]}>
                    <cylinderGeometry args={[0.8, 1.8, 6, 12]} />
                    <meshStandardMaterial
                        color="#5d4037"
                        roughness={0.9}
                        metalness={0.1}
                    />
                </mesh>
            )}

            {/* Foliage (Greenery) */}
            {foliage.map((leaf, i) => {
                const layout = mode === 'tree' ? foliageLayout[i] : scatterFoliageLayout[i];
                return (
                    <mesh
                        key={leaf.id}
                        position={layout.position}
                        rotation={layout.rotation}
                        scale={leaf.scale}
                    >
                        <coneGeometry args={[0.5, 1.5, 4]} />
                        <meshStandardMaterial
                            color="#2e7d32"
                            roughness={0.8}
                            emissive="#1b5e20"
                            emissiveIntensity={0.2}
                        />
                    </mesh>
                );
            })}

            {/* Photos */}
            {photos.map((photo, i) => {
                const layout = mode === 'tree' ? treeLayout[i] : scatterLayout[i];
                return (
                    <PhotoCard
                        key={photo.id}
                        index={i}
                        url={photo.url}
                        position={layout.position}
                        rotation={layout.rotation}
                        scale={mode === 'tree' ? 1.2 : 2.0} // Larger photos in scatter mode
                    />
                );
            })}

            {/* Ornaments */}
            {ornaments.map((ornament, i) => {
                const layout = mode === 'tree' ? ornamentLayout[i] : scatterOrnamentLayout[i];
                return (
                    <mesh key={ornament.id} position={layout.position}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color={ornament.color} emissive={ornament.color} emissiveIntensity={2} toneMapped={false} />
                        <pointLight distance={3} intensity={0.8} color={ornament.color} decay={2} />
                    </mesh>
                );
            })}

            {/* Star at the top */}
            {mode === 'tree' && (
                <mesh position={[0, 11.5, 0]}>
                    <octahedronGeometry args={[1.2, 0]} />
                    <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={5} toneMapped={false} />
                    <pointLight distance={20} intensity={4} color="#ffd700" />
                </mesh>
            )}
        </group>
    );
};
