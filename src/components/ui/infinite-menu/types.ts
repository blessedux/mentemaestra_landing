// TypeScript interfaces and types for Infinite Menu

export interface MenuItem {
  image: string;
  link: string;
  title: string;
  description: string;
}

export type ActiveItemCallback = (index: number) => void;
export type MovementChangeCallback = (isMoving: boolean) => void;
export type InitCallback = (instance: InfiniteGridMenuInterface) => void;
export type UpdateCallback = (deltaTime: number) => void;

export interface Camera {
  matrix: Float32Array;
  near: number;
  far: number;
  fov: number;
  aspect: number;
  position: Float32Array;
  up: Float32Array;
  matrices: {
    view: Float32Array;
    projection: Float32Array;
    inversProjection: Float32Array;
  };
}

export interface InfiniteMenuProps {
  items?: MenuItem[];
}

export interface DiscLocations {
  aModelPosition: number;
  aModelUvs: number;
  aInstanceMatrix: number;
  uWorldMatrix: WebGLUniformLocation | null;
  uViewMatrix: WebGLUniformLocation | null;
  uProjectionMatrix: WebGLUniformLocation | null;
  uCameraPosition: WebGLUniformLocation | null;
  uScaleFactor: WebGLUniformLocation | null;
  uRotationAxisVelocity: WebGLUniformLocation | null;
  uTex: WebGLUniformLocation | null;
  uFrames: WebGLUniformLocation | null;
  uItemCount: WebGLUniformLocation | null;
  uAtlasSize: WebGLUniformLocation | null;
}

export interface DiscBuffers {
  vertices: Float32Array;
  indices: Uint16Array;
  normals: Float32Array;
  uvs: Float32Array;
}

export interface DiscInstances {
  matricesArray: Float32Array;
  matrices: Float32Array[];
  buffer: WebGLBuffer | null;
}

// Forward declaration for InfiniteGridMenu (will be imported from the main class file)
export interface InfiniteGridMenuInterface {
  run(time?: number): void;
  resize(): void;
}
