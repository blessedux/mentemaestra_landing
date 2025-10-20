// WebGL Shader Sources for Infinite Menu
// Vertex and Fragment shaders for the 3D disc rendering

export const discVertShaderSource = `#version 300 es

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix; 
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec3 aModelNormal; // not currently used, but reserved
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

#define PI 3.141593

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);

    // center of the disc in world space
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);

    // skip the center vertex of the disc geometry
    if (gl_VertexID > 0) {
        // stretch the disc according to the axis and velocity of the rotation
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        // the stretch direction is orthogonal to the rotation axis and the position
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        // the position of this vertex relative to the center position
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        // vertices more in line with the stretch direction get a larger offset
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        // apply the stretch distortion
        worldPosition.xyz += stretchDir * strength;
    }

    // move the vertex back to the overall sphere
    worldPosition.xyz = radius * normalize(worldPosition.xyz);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

export const discFragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    // Calculate which item to display based on instance ID
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    // Get texture dimensions and calculate aspect ratio
    ivec2 texSize = textureSize(uTex, 0);
    float imageAspect = float(texSize.x) / float(texSize.y);
    float containerAspect = 1.0; // Square container (circular disc)
    
    // Calculate scale to fill the entire circular container
    // Use "cover" scaling - scale up to fill the container completely
    float scale = max(imageAspect / containerAspect, 
                     containerAspect / imageAspect);
    
    // Apply scaling to fill the container
    // Scale UVs down to make the image appear larger (cover effect)
    vec2 st = (vUvs - 0.5) / scale + 0.5;
    
    // Clamp coordinates to prevent repeating
    st = clamp(st, 0.0, 1.0);
    
    // Map to the correct cell in the atlas
    st = st * cellSize + cellOffset;
    
    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`;
