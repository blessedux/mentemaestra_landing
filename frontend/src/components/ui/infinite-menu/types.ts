// TypeScript interfaces and types for Infinite Menu
import { mat4, vec3 } from "gl-matrix";

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
export type ImagesLoadedCallback = () => void;

export interface Camera {
  matrix: mat4;
  near: number;
  far: number;
  fov: number;
  aspect: number;
  position: vec3;
  up: vec3;
  matrices: {
    view: mat4;
    projection: mat4;
    inversProjection: mat4;
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
