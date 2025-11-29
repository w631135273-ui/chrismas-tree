import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import { PhotoCard } from './PhotoCard';
import * as THREE from 'three';

const PHOTO_COUNT = 400;
const FOLIAGE_COUNT = 800;
const ORNAMENT_COUNT = 150;
const GIFT_COUNT = 60;
const SOCK_COUNT = 60;

const DEFAULT_IMAGES = [
    '/assets/image1.png',
    '/assets/image2.png',
    '/assets/image3.png',
];

export const PhotoTree = () => {
    const mode = useStore((state) => state.mode);
    const groupRef = useRef<THREE.Group>(null);
    const [images, setImages] = useState<string[]>(DEFAULT_IMAGES);

    // Refs for InstancedMeshes
    const foliageRef = useRef<THREE.InstancedMesh>(null);
    const ornamentRef = useRef<THREE.InstancedMesh>(null);
    const giftRef = useRef<THREE.InstancedMesh>(null);
    const sockRef = useRef<THREE.InstancedMesh>(null);

    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    // Fetch images
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/images');
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setImages(data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch images:', error);
            }
        };
        fetchImages();
    }, []);

    // Generate Data
    const photos = useMemo(() => Array.from({ length: PHOTO_COUNT }).map((_, i) => ({
        id: i,
        url: images[i % images.length],
    })), [images]);

    const foliage = useMemo(() => Array.from({ length: FOLIAGE_COUNT }).map((_, i) => ({
        id: i + PHOTO_COUNT + ORNAMENT_COUNT,
        scale: 0.5 + Math.random() * 0.5,
    })), []);

    const ornaments = useMemo(() => {
        const colors = ['#ff0000', '#ffd700', '#00ff00', '#0088ff', '#ff00ff'];
        return Array.from({ length: ORNAMENT_COUNT }).map((_, i) => ({
            id: i + PHOTO_COUNT,
            color: colors[i % colors.length],
        }));
    }, []);

    const gifts = useMemo(() => {
        const colors = ['#e53935', '#1e88e5', '#fdd835', '#8e24aa', '#ffffff']; // Red, Blue, Gold, Purple, White
        return Array.from({ length: GIFT_COUNT }).map((_, i) => ({
            id: i + PHOTO_COUNT + ORNAMENT_COUNT + FOLIAGE_COUNT,
            color: colors[i % colors.length],
            scale: 0.6 + Math.random() * 0.4,
        }));
    }, []);

    const socks = useMemo(() => {
        return Array.from({ length: SOCK_COUNT }).map((_, i) => ({
            id: i + PHOTO_COUNT + ORNAMENT_COUNT + FOLIAGE_COUNT + GIFT_COUNT,
            scale: 0.5 + Math.random() * 0.3,
        }));
    }, []);

    // Geometries
    const giftGeometry = useMemo(() => new THREE.BoxGeometry(0.5, 0.5, 0.5), []);
    const sockGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        // Simple Sock Shape
        shape.moveTo(0, 1.0);
        shape.lineTo(0.4, 1.0);
        shape.lineTo(0.4, 0.4); // Ankle
        shape.quadraticCurveTo(0.4, 0, 0.8, 0); // Toe curve
        shape.lineTo(0.8, 0.3);
        shape.lineTo(0.5, 0.3); // Heel area
        shape.lineTo(0.5, 0.5);
        shape.lineTo(0, 0.5);
        shape.lineTo(0, 1.0);

        const extrudeSettings = {
            steps: 1,
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 2
        };
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, []);

    // --- LAYOUT CALCULATIONS ---

    // Tree Layouts
    const treeLayout = useMemo(() => photos.map((_, i) => {
        const t = i / (PHOTO_COUNT - 1);
        const height = 22;
        const y = -height / 2 + t * height;
        const hNorm = 1 - t;
        const maxRadius = 9.0;
        const radius = maxRadius * Math.pow(hNorm, 1.2) + 0.5;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const angle = i * goldenAngle;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const jitterX = (Math.random() - 0.5) * 0.5;
        const jitterY = (Math.random() - 0.5) * 0.5;
        const jitterZ = (Math.random() - 0.5) * 0.5;
        const lookAtPos = new THREE.Vector3(0, y, 0);
        const pos = new THREE.Vector3(x + jitterX, y + jitterY, z + jitterZ);
        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        dummy.lookAt(lookAtPos);
        dummy.rotateY(Math.PI);
        dummy.rotateX((Math.random() - 0.5) * 0.5);
        dummy.rotateZ((Math.random() - 0.5) * 0.5);
        dummy.rotateY((Math.random() - 0.5) * 0.2);
        return { position: [pos.x, pos.y, pos.z] as [number, number, number], rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z] as [number, number, number] };
    }), [photos]);

    const foliageLayout = useMemo(() => foliage.map((_, i) => {
        const t = i / (FOLIAGE_COUNT - 1);
        const height = 22;
        const y = -height / 2 + t * height;
        const hNorm = 1 - t;
        const maxRadius = 8.5;
        const radius = maxRadius * Math.pow(hNorm, 1.2) * (0.8 + Math.random() * 0.4);
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const angle = i * goldenAngle + 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const lookAtPos = new THREE.Vector3(0, y, 0);
        const pos = new THREE.Vector3(x, y, z);
        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        dummy.lookAt(lookAtPos);
        dummy.rotateY(Math.PI);
        dummy.rotateX((Math.random() - 0.5) * 1.0);
        dummy.rotateZ((Math.random() - 0.5) * 1.0);
        dummy.rotateY((Math.random() - 0.5) * 3.0);
        return { position: [x, y, z] as [number, number, number], rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z] as [number, number, number] };
    }), [foliage]);

    const ornamentLayout = useMemo(() => ornaments.map((_, i) => {
        const t = i / (ORNAMENT_COUNT - 1);
        const height = 22;
        const y = -height / 2 + t * height;
        const hNorm = 1 - t;
        const maxRadius = 9.2;
        const radius = maxRadius * Math.pow(hNorm, 1.2) + 0.2;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const angle = i * goldenAngle + Math.PI;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return { position: [x, y, z] as [number, number, number] };
    }), [ornaments]);

    const giftLayout = useMemo(() => gifts.map((_, i) => {
        const t = i / (GIFT_COUNT - 1);
        const height = 20;
        const y = -height / 2 + t * height;
        const hNorm = 1 - t;
        const maxRadius = 9.5;
        const radius = maxRadius * Math.pow(hNorm, 1.2) + 0.5;
        const angle = i * 2.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return { position: [x, y, z] as [number, number, number], rotation: [Math.random(), Math.random(), Math.random()] as [number, number, number] };
    }), [gifts]);

    const sockLayout = useMemo(() => socks.map((_, i) => {
        const t = i / (SOCK_COUNT - 1);
        const height = 18;
        const y = -height / 2 + t * height;
        const hNorm = 1 - t;
        const maxRadius = 9.2;
        const radius = maxRadius * Math.pow(hNorm, 1.2) + 0.8;
        const angle = i * 3.8 + 1;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return { position: [x, y, z] as [number, number, number], rotation: [Math.PI, angle, 0] as [number, number, number] };
    }), [socks]);

    // Scatter Layouts
    const scatterLayout = useMemo(() => photos.map(() => {
        const range = 35;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 2 + Math.random() * range;
        return {
            position: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)] as [number, number, number],
            rotation: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2] as [number, number, number],
        };
    }), [photos]);

    const scatterFoliageLayout = useMemo(() => foliage.map(() => {
        const range = 35;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 2 + Math.random() * range;
        return {
            position: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)] as [number, number, number],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
        };
    }), [foliage]);

    const scatterOrnamentLayout = useMemo(() => ornaments.map(() => {
        const range = 35;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 2 + Math.random() * range;
        return { position: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)] as [number, number, number] };
    }), [ornaments]);

    const scatterGiftLayout = useMemo(() => gifts.map(() => {
        const range = 35;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 2 + Math.random() * range;
        return {
            position: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)] as [number, number, number],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
        };
    }), [gifts]);

    const scatterSockLayout = useMemo(() => socks.map(() => {
        const range = 35;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 2 + Math.random() * range;
        return {
            position: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)] as [number, number, number],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
        };
    }), [socks]);

    // Fairy Dust Logic
    const fairyDust = useMemo(() => {
        const points: number[] = [];
        const colors: number[] = [];
        const turns = 8;
        const height = 26;
        const startY = -13;
        const particleCount = 1200;

        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const yBase = startY + t * height;
            const hNorm = 1 - t;
            const maxRadius = 11.0;
            const radiusBase = maxRadius * Math.pow(hNorm, 1.1) + 1.5;
            const angleBase = t * turns * Math.PI * 2;
            const spread = 0.8;
            const x = Math.cos(angleBase) * radiusBase + (Math.random() - 0.5) * spread;
            const y = yBase + (Math.random() - 0.5) * spread;
            const z = Math.sin(angleBase) * radiusBase + (Math.random() - 0.5) * spread;
            points.push(x, y, z);

            const color = new THREE.Color();
            if (Math.random() > 0.5) {
                color.setHSL(0.1 + Math.random() * 0.05, 0.9, 0.6); // Gold
            } else {
                color.setHSL(0.05 + Math.random() * 0.05, 0.8, 0.8); // Warm White
            }
            colors.push(color.r, color.g, color.b);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        return geometry;
    }, []);

    useFrame((_, delta) => {
        if (groupRef.current) {
            const stateStore = useStore.getState();
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, stateStore.rotation, delta * 2);
            const currentY = groupRef.current.position.y;
            groupRef.current.position.y = THREE.MathUtils.lerp(currentY, stateStore.scrollY, delta * 5);
        }

        // Animate Foliage Instances
        if (foliageRef.current) {
            for (let i = 0; i < FOLIAGE_COUNT; i++) {
                const layout = mode === 'tree' ? foliageLayout[i] : scatterFoliageLayout[i];
                const leaf = foliage[i];
                tempObject.position.set(...layout.position);
                tempObject.rotation.set(...layout.rotation);
                tempObject.scale.setScalar(leaf.scale);
                tempObject.updateMatrix();
                foliageRef.current.setMatrixAt(i, tempObject.matrix);
            }
            foliageRef.current.instanceMatrix.needsUpdate = true;
        }

        // Animate Ornament Instances
        if (ornamentRef.current) {
            for (let i = 0; i < ORNAMENT_COUNT; i++) {
                const layout = mode === 'tree' ? ornamentLayout[i] : scatterOrnamentLayout[i];
                const ornament = ornaments[i];
                tempObject.position.set(...layout.position);
                tempObject.scale.setScalar(1);
                tempObject.updateMatrix();
                ornamentRef.current.setMatrixAt(i, tempObject.matrix);
                tempColor.set(ornament.color);
                ornamentRef.current.setColorAt(i, tempColor);
            }
            ornamentRef.current.instanceMatrix.needsUpdate = true;
            if (ornamentRef.current.instanceColor) ornamentRef.current.instanceColor.needsUpdate = true;
        }

        // Animate Gifts
        if (giftRef.current) {
            for (let i = 0; i < GIFT_COUNT; i++) {
                const layout = mode === 'tree' ? giftLayout[i] : scatterGiftLayout[i];
                const gift = gifts[i];
                tempObject.position.set(...layout.position);
                tempObject.rotation.set(...layout.rotation);
                tempObject.scale.setScalar(gift.scale);

                if (mode === 'scattered') {
                    tempObject.rotation.x += delta * 0.5;
                    tempObject.rotation.y += delta * 0.5;
                }

                tempObject.updateMatrix();
                giftRef.current.setMatrixAt(i, tempObject.matrix);
                tempColor.set(gift.color);
                giftRef.current.setColorAt(i, tempColor);
            }
            giftRef.current.instanceMatrix.needsUpdate = true;
            if (giftRef.current.instanceColor) giftRef.current.instanceColor.needsUpdate = true;
        }

        // Animate Socks
        if (sockRef.current) {
            for (let i = 0; i < SOCK_COUNT; i++) {
                const layout = mode === 'tree' ? sockLayout[i] : scatterSockLayout[i];
                const sock = socks[i];
                tempObject.position.set(...layout.position);
                tempObject.rotation.set(...layout.rotation);
                tempObject.scale.setScalar(sock.scale);

                if (mode === 'scattered') {
                    tempObject.rotation.z += delta * 0.3;
                }

                tempObject.updateMatrix();
                sockRef.current.setMatrixAt(i, tempObject.matrix);
            }
            sockRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Tree Trunk */}
            {mode === 'tree' && (
                <mesh position={[0, -12, 0]}>
                    <cylinderGeometry args={[0.8, 1.8, 6, 12]} />
                    <meshStandardMaterial color="#5d4037" roughness={0.9} metalness={0.1} />
                </mesh>
            )}

            {/* Fairy Dust Lights (Only in Tree Mode) */}
            {mode === 'tree' && (
                <points geometry={fairyDust}>
                    <pointsMaterial size={0.15} vertexColors transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
                </points>
            )}

            {/* Instanced Foliage */}
            <instancedMesh ref={foliageRef} args={[undefined, undefined, FOLIAGE_COUNT]}>
                <coneGeometry args={[0.5, 1.5, 4]} />
                <meshStandardMaterial color="#2e7d32" roughness={0.8} emissive="#1b5e20" emissiveIntensity={0.2} />
            </instancedMesh>

            {/* Instanced Ornaments */}
            <instancedMesh ref={ornamentRef} args={[undefined, undefined, ORNAMENT_COUNT]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial roughness={0.3} metalness={0.8} emissiveIntensity={0.5} />
            </instancedMesh>

            {/* Instanced Gifts */}
            <instancedMesh ref={giftRef} args={[giftGeometry, undefined, GIFT_COUNT]}>
                <meshStandardMaterial roughness={0.4} metalness={0.3} />
            </instancedMesh>

            {/* Instanced Socks */}
            <instancedMesh ref={sockRef} args={[sockGeometry, undefined, SOCK_COUNT]}>
                <meshStandardMaterial color="#d32f2f" roughness={0.8} />
            </instancedMesh>

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
                        scale={mode === 'tree' ? 1.2 : 2.0}
                        mode={mode}
                    />
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
