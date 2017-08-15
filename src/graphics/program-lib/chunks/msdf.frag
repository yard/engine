uniform sampler2D texture_msdfMap;
uniform lowp float sdfEnabled;

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

vec4 applyMsdf(vec4 color) {
    color = vec4(material_emissive, material_opacity);
    
    //if (length(fwidth(vUv0)) < 1.) {
    // FIXME: temporary falling back to bitmap fonts all the time
    vec4 texColor = texture2D(texture_msdfMap, vUv0);
    return mix(color * texColor, color * texColor.a, sdfEnabled);
    

    vec3 sample = texture2D(texture_msdfMap, vUv0).rgb;
    float distance = median(sample.r, sample.g, sample.b) - 0.5;

    vec4 msdf;

    #ifdef GL_OES_standard_derivatives
    vec4 background = vec4(0.0);

    float opacity = clamp(distance/fwidth(distance) + 0.5, 0.0, 1.0);

    msdf = mix(background, color, opacity);
    if (msdf.a < 0.01) {
        discard;
    }
    #else
    msdf = color;
    if (distance < 0.1) {
        discard;
    }
    #endif

    return msdf;
}
