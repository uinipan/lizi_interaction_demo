export enum ShapeType {
  SPHERE = 'Sphere',
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  SPIRAL = 'Spiral',
  CLOUD = 'Cloud'
}

export interface ParticleConfig {
  count: number;
  size: number;
  color: string;
  shape: ShapeType;
}

export interface HandGesture {
  isOpen: boolean;
  pinchDistance: number; // 0 to 1
  detected: boolean;
}