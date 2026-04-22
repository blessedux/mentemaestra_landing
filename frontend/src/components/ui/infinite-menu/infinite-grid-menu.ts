// InfiniteGridMenu class - Main WebGL rendering engine
import { mat4, quat, vec2, vec3 } from "gl-matrix";
import { 
  MenuItem, 
  ActiveItemCallback, 
  MovementChangeCallback, 
  InitCallback,
  ImagesLoadedCallback,
  Camera,
  DiscLocations,
  DiscBuffers,
  DiscInstances
} from "./types";
import { discVertShaderSource, discFragShaderSource } from "./shaders";
import { IcosahedronGeometry, DiscGeometry } from "./geometry";
import { 
  createProgram, 
  makeVertexArray, 
  resizeCanvasToDisplaySize, 
  makeBuffer, 
  createAndSetupTexture 
} from "./webgl-helpers";
import { ArcballControl } from "./arcball-control";

export class InfiniteGridMenu {
  private gl: WebGL2RenderingContext | null = null;
  private discProgram: WebGLProgram | null = null;
  private discVAO: WebGLVertexArrayObject | null = null;
  private discBuffers!: DiscBuffers;
  private icoGeo!: IcosahedronGeometry;
  private discGeo!: DiscGeometry;
  private worldMatrix = mat4.create();
  private tex: WebGLTexture | null = null;
  private individualTextures: WebGLTexture[] = [];
  private control!: ArcballControl;

  private discLocations!: DiscLocations;

  private viewportSize = vec2.create();
  private drawBufferSize = vec2.create();

  private discInstances!: DiscInstances;

  private instancePositions: vec3[] = [];
  private DISC_INSTANCE_COUNT = 0;
  private atlasSize = 1;

  private _time = 0;
  private _deltaTime = 0;
  private _deltaFrames = 0;
  private _frames = 0;

  private movementActive = false;

  private TARGET_FRAME_DURATION = 1000 / 60; // 60 fps
  private SPHERE_RADIUS = 2;

  public camera: Camera = {
    matrix: mat4.create(),
    near: 0.1,
    far: 40,
    fov: Math.PI / 4,
    aspect: 1,
    position: vec3.fromValues(0, 0, 3),
    up: vec3.fromValues(0, 1, 0),
    matrices: {
      view: mat4.create(),
      projection: mat4.create(),
      inversProjection: mat4.create(),
    },
  };

  public smoothRotationVelocity = 0;
  public scaleFactor = 1.0;

  constructor(
    private canvas: HTMLCanvasElement,
    private items: MenuItem[],
    private onActiveItemChange: ActiveItemCallback,
    private onMovementChange: MovementChangeCallback,
    onInit?: InitCallback,
    private onImagesLoaded?: ImagesLoadedCallback
  ) {
    this.init(onInit);
  }

  public resize(): void {
    const needsResize = resizeCanvasToDisplaySize(this.canvas);
    if (!this.gl) return;
    if (needsResize) {
      this.gl.viewport(
        0,
        0,
        this.gl.drawingBufferWidth,
        this.gl.drawingBufferHeight
      );
    }
    this.updateProjectionMatrix();
  }

  public run(time = 0): void {
    this._deltaTime = Math.min(32, time - this._time);
    this._time = time;
    this._deltaFrames = this._deltaTime / this.TARGET_FRAME_DURATION;
    this._frames += this._deltaFrames;

    this.animate(this._deltaTime);
    this.render();

    requestAnimationFrame((t) => this.run(t));
  }

  private init(onInit?: InitCallback): void {
    const gl = this.canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
    });
    if (!gl) {
      throw new Error("No WebGL 2 context!");
    }
    this.gl = gl;

    vec2.set(
      this.viewportSize,
      this.canvas.clientWidth,
      this.canvas.clientHeight
    );
    vec2.clone(this.drawBufferSize);

    this.discProgram = createProgram(
      gl,
      [discVertShaderSource, discFragShaderSource],
      null,
      {
        aModelPosition: 0,
        aModelNormal: 1, // not used in the code, but let's keep the location
        aModelUvs: 2,
        aInstanceMatrix: 3,
      }
    );

    this.discLocations = {
      aModelPosition: gl.getAttribLocation(this.discProgram!, "aModelPosition"),
      aModelUvs: gl.getAttribLocation(this.discProgram!, "aModelUvs"),
      aInstanceMatrix: gl.getAttribLocation(
        this.discProgram!,
        "aInstanceMatrix"
      ),
      uWorldMatrix: gl.getUniformLocation(this.discProgram!, "uWorldMatrix"),
      uViewMatrix: gl.getUniformLocation(this.discProgram!, "uViewMatrix"),
      uProjectionMatrix: gl.getUniformLocation(
        this.discProgram!,
        "uProjectionMatrix"
      ),
      uCameraPosition: gl.getUniformLocation(
        this.discProgram!,
        "uCameraPosition"
      ),
      uScaleFactor: gl.getUniformLocation(this.discProgram!, "uScaleFactor"),
      uRotationAxisVelocity: gl.getUniformLocation(
        this.discProgram!,
        "uRotationAxisVelocity"
      ),
      uTex: gl.getUniformLocation(this.discProgram!, "uTex"),
      uFrames: gl.getUniformLocation(this.discProgram!, "uFrames"),
      uItemCount: gl.getUniformLocation(this.discProgram!, "uItemCount"),
      uAtlasSize: gl.getUniformLocation(this.discProgram!, "uAtlasSize"),
    };

    // Geometry
    this.discGeo = new DiscGeometry(56, 1);
    this.discBuffers = this.discGeo.data;
    this.discVAO = makeVertexArray(
      gl,
      [
        [
          makeBuffer(gl, this.discBuffers.vertices, gl.STATIC_DRAW),
          this.discLocations.aModelPosition,
          3,
        ],
        [
          makeBuffer(gl, this.discBuffers.uvs, gl.STATIC_DRAW),
          this.discLocations.aModelUvs,
          2,
        ],
      ],
      this.discBuffers.indices
    );

    this.icoGeo = new IcosahedronGeometry();
    this.icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS);
    this.instancePositions = this.icoGeo.vertices.map((v) => v.position);
    this.DISC_INSTANCE_COUNT = this.icoGeo.vertices.length;
    this.initDiscInstances(this.DISC_INSTANCE_COUNT);

    // Texture
    this.initTexture();

    // Arcball
    this.control = new ArcballControl(this.canvas, (deltaTime) =>
      this.onControlUpdate(deltaTime)
    );

    this.updateCameraMatrix();
    this.updateProjectionMatrix();

    // Ensure correct size on first load
    this.resize();

    if (onInit) {
      onInit(this);
    }
  }

  private initTexture(): void {
    if (!this.gl) return;
    const gl = this.gl;
    
    // Check if we're on mobile/iOS
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    console.log('Device info:', { isMobile, isIOS, userAgent: navigator.userAgent });
    
    // For iOS, try a different texture loading approach
    if (isIOS) {
      console.log('iOS detected - using iOS-specific texture loading');
      this.initIOSTexture();
      return;
    }
    
    // Use different texture filtering for mobile devices
    const minFilter = isMobile ? gl.NEAREST : gl.LINEAR;
    const magFilter = isMobile ? gl.NEAREST : gl.LINEAR;
    
    console.log('Using texture filters:', { minFilter, magFilter, isMobile });
    
    this.tex = createAndSetupTexture(
      gl,
      minFilter,
      magFilter,
      gl.CLAMP_TO_EDGE,
      gl.CLAMP_TO_EDGE
    );

    const itemCount = Math.max(1, this.items.length);
    this.atlasSize = Math.ceil(Math.sqrt(itemCount));
    
    // Use smaller cell size on mobile to reduce memory usage
    const cellSize = isMobile ? 256 : 512;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = this.atlasSize * cellSize;
    canvas.height = this.atlasSize * cellSize;
    
    console.log(`Canvas size: ${canvas.width}x${canvas.height}, cell size: ${cellSize}, mobile: ${isMobile}`);

    console.log(`Initializing texture with ${itemCount} items, atlas size: ${this.atlasSize}x${this.atlasSize}, canvas: ${canvas.width}x${canvas.height}`);
    console.log('Items to load:', this.items.map(item => item.image));

    Promise.all(
      this.items.map(
        (item) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            // Only set crossOrigin for external URLs, not local images
            if (item.image.startsWith('http')) {
              img.crossOrigin = "anonymous";
            }
            
            // Mobile-specific optimizations
            img.loading = "eager";
            img.decoding = "async";
            
            // Add timeout for mobile devices
            const timeout = setTimeout(() => {
              console.error(`Image load timeout: ${item.image}`);
              reject(new Error(`Image load timeout: ${item.image}`));
            }, 10000); // 10 second timeout
            
            img.onload = () => {
              clearTimeout(timeout);
              console.log(`Successfully loaded image: ${item.image} (${img.width}x${img.height})`);
              resolve(img);
            };
            img.onerror = (error) => {
              clearTimeout(timeout);
              console.error(`Failed to load image: ${item.image}`, error);
              reject(new Error(`Failed to load image: ${item.image}`));
            };
            
            img.src = item.image;
          })
      )
    ).then((images) => {
      console.log(`Successfully loaded ${images.length} images`);
      images.forEach((img, i) => {
        const x = (i % this.atlasSize) * cellSize;
        const y = Math.floor(i / this.atlasSize) * cellSize;
        console.log(`Drawing image ${i} at position (${x}, ${y}) with size ${cellSize}x${cellSize}`);
        ctx.drawImage(img, x, y, cellSize, cellSize);
      });

      console.log('Uploading texture to GPU...');
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      
      // Mobile/iOS specific texture handling
      // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isIOS) {
        // iOS WebGL texture format compatibility
        console.log('Using iOS-compatible texture format');
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          canvas
        );
        // Don't generate mipmaps on iOS as it can cause issues
        console.log('Skipping mipmap generation on iOS');
      } else {
        // Standard texture upload
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          canvas
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        console.log('Mipmaps generated');
      }
      
      // Check for WebGL errors
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error('WebGL error after texture upload:', error);
      } else {
        console.log('Texture uploaded successfully');
      }
      
      // Call the images loaded callback
      this.onImagesLoaded?.();
    }).catch((error) => {
      console.error('Failed to load images:', error);
      // Still call the callback to hide the loading spinner even if images fail
      this.onImagesLoaded?.();
    });
  }

  private initIOSTexture(): void {
    if (!this.gl) return;
    const gl = this.gl;
    
    console.log('Initializing iOS-specific texture...');
    
    // Create texture with iOS-optimized settings
    this.tex = createAndSetupTexture(
      gl,
      gl.NEAREST,
      gl.NEAREST,
      gl.CLAMP_TO_EDGE,
      gl.CLAMP_TO_EDGE
    );

    const itemCount = Math.max(1, this.items.length);
    this.atlasSize = Math.ceil(Math.sqrt(itemCount));
    
    // Use optimized cell size for iOS - 256px for better quality
    const cellSize = 256;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = this.atlasSize * cellSize;
    canvas.height = this.atlasSize * cellSize;
    
    console.log(`iOS Canvas size: ${canvas.width}x${canvas.height}, cell size: ${cellSize}`);

    // Load images one by one for iOS to avoid overwhelming the GPU
    let loadedCount = 0;
    const totalImages = this.items.length;
    
    const loadNextImage = (index: number) => {
      if (index >= totalImages) {
        console.log('All images loaded for iOS, uploading texture...');
        this.uploadIOSTexture(canvas);
        return;
      }
      
      const item = this.items[index];
      const img = new Image();
      
      img.onload = () => {
        const x = (index % this.atlasSize) * cellSize;
        const y = Math.floor(index / this.atlasSize) * cellSize;
        ctx.drawImage(img, x, y, cellSize, cellSize);
        loadedCount++;
        
        console.log(`iOS: Loaded image ${index + 1}/${totalImages}: ${item.image} (${img.width}x${img.height})`);
        
        // Load next image after a small delay to avoid overwhelming iOS
        setTimeout(() => loadNextImage(index + 1), 50);
      };
      
      img.onerror = (error) => {
        console.error(`iOS: Failed to load image ${item.image}:`, error);
        loadedCount++;
        setTimeout(() => loadNextImage(index + 1), 50);
      };
      
      img.src = item.image;
    };
    
    loadNextImage(0);
  }
  
  private uploadIOSTexture(canvas: HTMLCanvasElement): void {
    if (!this.gl || !this.tex) return;
    const gl = this.gl;
    
    console.log('Uploading texture to iOS GPU...');
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        canvas
      );
      
      // Don't generate mipmaps on iOS
      console.log('iOS texture uploaded successfully (no mipmaps)');
      
      // Check for errors
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error('iOS WebGL error after texture upload:', error);
      }
      
      this.onImagesLoaded?.();
    } catch (error) {
      console.error('iOS texture upload failed:', error);
      this.onImagesLoaded?.();
    }
  }

  private initDiscInstances(count: number): void {
    if (!this.gl || !this.discVAO) return;
    const gl = this.gl;

    const matricesArray = new Float32Array(count * 16);
    const matrices: Float32Array[] = [];
    for (let i = 0; i < count; ++i) {
      const instanceMatrixArray = new Float32Array(
        matricesArray.buffer,
        i * 16 * 4,
        16
      );
      mat4.identity(instanceMatrixArray as unknown as mat4);
      matrices.push(instanceMatrixArray);
    }

    this.discInstances = {
      matricesArray,
      matrices,
      buffer: gl.createBuffer(),
    };

    gl.bindVertexArray(this.discVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.discInstances.matricesArray.byteLength,
      gl.DYNAMIC_DRAW
    );

    const mat4AttribSlotCount = 4;
    const bytesPerMatrix = 16 * 4; // 16 floats, 4 bytes each
    for (let j = 0; j < mat4AttribSlotCount; ++j) {
      const loc = this.discLocations.aInstanceMatrix + j;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(
        loc,
        4,
        gl.FLOAT,
        false,
        bytesPerMatrix,
        j * 4 * 4
      );
      gl.vertexAttribDivisor(loc, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  private animate(deltaTime: number): void {
    if (!this.gl) return;
    this.control.update(deltaTime, this.TARGET_FRAME_DURATION);

    const positions = this.instancePositions.map((p) =>
      vec3.transformQuat(vec3.create(), p, this.control.orientation)
    );
    const scale = 0.25;
    const SCALE_INTENSITY = 0.6;

    positions.forEach((p, ndx) => {
      const s =
        (Math.abs(p[2]) / this.SPHERE_RADIUS) * SCALE_INTENSITY +
        (1 - SCALE_INTENSITY);
      const finalScale = s * scale;
      const matrix = mat4.create();

      // translate disc so it faces outward
      mat4.multiply(
        matrix,
        matrix,
        mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), p))
      );
      mat4.multiply(
        matrix,
        matrix,
        mat4.targetTo(mat4.create(), [0, 0, 0], p, [0, 1, 0])
      );
      mat4.multiply(
        matrix,
        matrix,
        mat4.fromScaling(mat4.create(), [finalScale, finalScale, finalScale])
      );
      mat4.multiply(
        matrix,
        matrix,
        mat4.fromTranslation(mat4.create(), [0, 0, -this.SPHERE_RADIUS])
      );

      mat4.copy(this.discInstances.matrices[ndx], matrix);
    });

    // Update instance buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.discInstances.buffer);
    this.gl.bufferSubData(
      this.gl.ARRAY_BUFFER,
      0,
      this.discInstances.matricesArray
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    this.smoothRotationVelocity = this.control.rotationVelocity;
  }

  private render(): void {
    if (!this.gl || !this.discProgram) return;
    const gl = this.gl;

    gl.useProgram(this.discProgram);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Debug: Log render calls occasionally
    if (this._frames % 60 === 0) {
      console.log(`Render frame ${this._frames}, texture bound: ${!!this.tex}`);
      
      // Check for WebGL errors during render
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error('WebGL error during render:', error);
      }
    }

    gl.uniformMatrix4fv(
      this.discLocations.uWorldMatrix,
      false,
      this.worldMatrix
    );
    gl.uniformMatrix4fv(
      this.discLocations.uViewMatrix,
      false,
      this.camera.matrices.view
    );
    gl.uniformMatrix4fv(
      this.discLocations.uProjectionMatrix,
      false,
      this.camera.matrices.projection
    );
    gl.uniform3f(
      this.discLocations.uCameraPosition,
      this.camera.position[0],
      this.camera.position[1],
      this.camera.position[2]
    );
    gl.uniform4f(
      this.discLocations.uRotationAxisVelocity,
      this.control.rotationAxis[0],
      this.control.rotationAxis[1],
      this.control.rotationAxis[2],
      this.smoothRotationVelocity * 1.1
    );

    gl.uniform1i(this.discLocations.uItemCount, this.items.length);
    gl.uniform1i(this.discLocations.uAtlasSize, this.atlasSize);

    gl.uniform1f(this.discLocations.uFrames, this._frames);
    gl.uniform1f(this.discLocations.uScaleFactor, this.scaleFactor);

    gl.uniform1i(this.discLocations.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    gl.bindVertexArray(this.discVAO);
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      this.discBuffers.indices.length,
      gl.UNSIGNED_SHORT,
      0,
      this.DISC_INSTANCE_COUNT
    );
    gl.bindVertexArray(null);
  }

  private updateCameraMatrix(): void {
    mat4.targetTo(
      this.camera.matrix,
      this.camera.position,
      [0, 0, 0],
      this.camera.up
    );
    mat4.invert(this.camera.matrices.view, this.camera.matrix);
  }

  private updateProjectionMatrix(): void {
    if (!this.gl) return;
    const canvasEl = this.gl.canvas as HTMLCanvasElement;
    this.camera.aspect = canvasEl.clientWidth / canvasEl.clientHeight;
    const height = this.SPHERE_RADIUS * 0.35;
    const distance = this.camera.position[2];
    if (this.camera.aspect > 1) {
      this.camera.fov = 2 * Math.atan(height / distance);
    } else {
      this.camera.fov = 2 * Math.atan(height / this.camera.aspect / distance);
    }
    mat4.perspective(
      this.camera.matrices.projection,
      this.camera.fov,
      this.camera.aspect,
      this.camera.near,
      this.camera.far
    );
    mat4.invert(
      this.camera.matrices.inversProjection,
      this.camera.matrices.projection
    );
  }

  private onControlUpdate(deltaTime: number): void {
    const timeScale = deltaTime / this.TARGET_FRAME_DURATION + 0.0001;
    let damping = 5 / timeScale;
    let cameraTargetZ = 3;

    const isMoving =
      this.control.isPointerDown ||
      Math.abs(this.smoothRotationVelocity) > 0.01;

    if (isMoving !== this.movementActive) {
      this.movementActive = isMoving;
      this.onMovementChange(isMoving);
    }

    // handle snapping to nearest item if not dragging
    if (!this.control.isPointerDown) {
      const nearestVertexIndex = this.findNearestVertexIndex();
      const itemIndex = nearestVertexIndex % Math.max(1, this.items.length);
      this.onActiveItemChange(itemIndex);
      const snapDirection = vec3.normalize(
        vec3.create(),
        this.getVertexWorldPosition(nearestVertexIndex)
      );
      this.control.snapTargetDirection = snapDirection;
    } else {
      // push camera back if user is dragging quickly
      cameraTargetZ += this.control.rotationVelocity * 80 + 2.5;
      damping = 7 / timeScale;
    }

    this.camera.position[2] +=
      (cameraTargetZ - this.camera.position[2]) / damping;
    this.updateCameraMatrix();
  }

  private findNearestVertexIndex(): number {
    const n = this.control.snapDirection;
    const inversOrientation = quat.conjugate(
      quat.create(),
      this.control.orientation
    );
    const nt = vec3.transformQuat(vec3.create(), n, inversOrientation);

    let maxD = -1;
    let nearestVertexIndex = 0;
    for (let i = 0; i < this.instancePositions.length; ++i) {
      const d = vec3.dot(nt, this.instancePositions[i]);
      if (d > maxD) {
        maxD = d;
        nearestVertexIndex = i;
      }
    }
    return nearestVertexIndex;
  }

  private getVertexWorldPosition(index: number): vec3 {
    const nearestVertexPos = this.instancePositions[index];
    return vec3.transformQuat(
      vec3.create(),
      nearestVertexPos,
      this.control.orientation
    );
  }
}