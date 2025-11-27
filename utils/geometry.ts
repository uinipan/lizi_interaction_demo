import * as THREE from 'three';
import { ShapeType } from '../types';

const COUNT = 4000;

const randomPointInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

export const generateParticles = (shape: ShapeType): Float32Array => {
  const positions = new Float32Array(COUNT * 3);
  const tempVec = new THREE.Vector3();

  for (let i = 0; i < COUNT; i++) {
    let x = 0, y = 0, z = 0;

    switch (shape) {
      case ShapeType.SPHERE: {
        const p = randomPointInSphere(2);
        x = p.x; y = p.y; z = p.z;
        break;
      }
      case ShapeType.HEART: {
        // Heart surface equation roughly
        const t = Math.random() * Math.PI * 2;
        const u = Math.random() * Math.PI; // partial sphere mapping approach
        
        // Parametric heart formula
        // x = 16sin^3(t)
        // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
        // We add some Z depth
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI; // limited range for spread
        
        // Simplified volume heart
        const r = 0.15;
        const hx = 16 * Math.pow(Math.sin(phi), 3);
        const hy = 13 * Math.cos(phi) - 5 * Math.cos(2 * phi) - 2 * Math.cos(3 * phi) - Math.cos(4 * phi);
        const hz = (Math.random() - 0.5) * 5; 
        
        // Scale down
        x = hx * r;
        y = hy * r;
        z = hz * (1 - Math.abs(hy)/20); // Taper z based on y
        break;
      }
      case ShapeType.FLOWER: {
        const r = 2.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        // Petals logic: r varies with angle
        const petals = 5;
        const modulation = 1 + 0.5 * Math.sin(petals * theta) * Math.sin(phi);
        
        x = r * modulation * Math.sin(phi) * Math.cos(theta);
        y = r * modulation * Math.sin(phi) * Math.sin(theta);
        z = r * modulation * Math.cos(phi) * 0.5;
        break;
      }
      case ShapeType.SATURN: {
        const isRing = Math.random() > 0.4;
        if (isRing) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 3 + Math.random() * 1.5;
          x = Math.cos(angle) * dist;
          z = Math.sin(angle) * dist;
          y = (Math.random() - 0.5) * 0.2;
        } else {
          // Planet
          const p = randomPointInSphere(1.5);
          x = p.x; y = p.y; z = p.z;
        }
        break;
      }
      case ShapeType.SPIRAL: {
        const angle = i * 0.05;
        const r = angle * 0.05;
        x = r * Math.cos(angle);
        y = (i / COUNT) * 6 - 3;
        z = r * Math.sin(angle);
        break;
      }
      case ShapeType.CLOUD: {
        x = (Math.random() - 0.5) * 6;
        y = (Math.random() - 0.5) * 2;
        z = (Math.random() - 0.5) * 3;
        break;
      }
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
};