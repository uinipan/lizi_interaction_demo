/// <reference types="@react-three/fiber" />
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { generateParticles } from '../utils/geometry';
import { HandGesture, ShapeType } from '../types';

interface SceneProps {
  currentShape: ShapeType;
  color: string;
  gesture: HandGesture;
}

const Particles: React.FC<SceneProps> = ({ currentShape, color, gesture }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Memoize target positions for the current shape
  const targetPositions = useMemo(() => generateParticles(currentShape), [currentShape]);
  const count = targetPositions.length / 3;

  // Generate stable random offsets for explosion/dissipation effect
  const randomOffsets = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      // Create a random normalized vector for each particle to fly along
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.0; // Unit vector
      
      arr[i] = r * Math.sin(phi) * Math.cos(theta);
      arr[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);
  
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  
  // Initialize positions
  useMemo(() => {
    if (geometryRef.current) {
      geometryRef.current.setAttribute(
        'position', 
        new THREE.BufferAttribute(new Float32Array(targetPositions), 3)
      );
    }
  }, [targetPositions]);

  useFrame((state, delta) => {
    if (!geometryRef.current || !pointsRef.current) return;
    
    const positions = geometryRef.current.attributes.position.array as Float32Array;
    const lerpSpeed = 3.5 * delta;
    
    const { detected, pinchDistance } = gesture;

    // Interaction Logic:
    // If Hand Detected:
    //   pinchDistance ~ 0 (Fist) -> Scatter 0 (Tight Shape)
    //   pinchDistance ~ 1 (Open) -> Scatter High (Explosion)
    
    // Non-linear scatter curve for dramatic effect at full open
    const scatterIntensity = detected ? Math.pow(pinchDistance, 2) * 6.0 : 0;
    const expansionScale = detected ? 1.0 + pinchDistance * 0.5 : 1.0;

    // Rotate system
    if (!detected) {
       pointsRef.current.rotation.y += 0.1 * delta; // Idle rotation
    } else {
       // Slow down rotation when interacting to focus on the shape morph
       pointsRef.current.rotation.y += 0.05 * delta;
    }

    // Update Particles
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // 1. Calculate Target Position based on Shape
      let tx = targetPositions[ix] * expansionScale;
      let ty = targetPositions[iy] * expansionScale;
      let tz = targetPositions[iz] * expansionScale;

      // 2. Add Dissipation/Scatter Force
      // We project the particle out along its random offset vector
      if (detected && scatterIntensity > 0.01) {
         tx += randomOffsets[ix] * scatterIntensity;
         ty += randomOffsets[iy] * scatterIntensity;
         tz += randomOffsets[iz] * scatterIntensity;
      }

      // 3. Lerp current position to target
      // We use a slightly faster lerp when returning to shape (snappy) vs exploding
      const currentSpeed = (detected && pinchDistance < 0.2) ? lerpSpeed * 1.5 : lerpSpeed;

      positions[ix] += (tx - positions[ix]) * currentSpeed;
      positions[iy] += (ty - positions[iy]) * currentSpeed;
      positions[iz] += (tz - positions[iz]) * currentSpeed;
    }
    
    geometryRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(targetPositions)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const ParticleScene: React.FC<SceneProps> = (props) => {
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 60 }} dpr={[1, 2]}>
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={0.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Particles {...props} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={!props.gesture.detected} autoRotateSpeed={0.5} />
    </Canvas>
  );
};

export default ParticleScene;