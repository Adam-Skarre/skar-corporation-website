(() => {
  'use strict';

  const canvas = document.querySelector('[data-about-sunrise]');
  if (!canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  });

  if (!gl) {
    const fallback = canvas.getContext('2d', { alpha: false });
    if (fallback) {
      const gradient = fallback.createLinearGradient(0, 0, 0, canvas.height || 800);
      gradient.addColorStop(0, '#4f789d');
      gradient.addColorStop(.58, '#244b6c');
      gradient.addColorStop(1, '#183246');
      fallback.fillStyle = gradient;
      fallback.fillRect(0, 0, canvas.width || 1600, canvas.height || 800);
    }
    return;
  }

  const vertexSource = `
    attribute vec2 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uPointerX;

    #define PI 3.141592653589793

    mat2 rotate2D(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat2(c, -s, s, c);
    }

    vec3 hsv(float h, float s, float v) {
      vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
      rgb = rgb * rgb * (3.0 - 2.0 * rgb);
      return v * mix(vec3(1.0), rgb, s);
    }

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 frag = gl_FragCoord.xy;
      float r = min(uResolution.x, uResolution.y);
      vec2 u = (frag - 0.5 * uResolution) / r;

      // Keep the focal point clear of the About copy on wide screens.
      u.x -= mix(0.0, 0.22, smoothstep(1.25, 2.1, uResolution.x / uResolution.y));

      float g = 0.012;
      float e = 0.0;
      float skyHeight = smoothstep(-0.055, 0.38, u.y);
      float waterDepthBase = clamp(-u.y * 2.0, 0.0, 1.0);
      vec3 skyAmbient = mix(vec3(0.12, 0.25, 0.36), vec3(0.42, 0.66, 0.84), skyHeight);
      vec3 waterAmbient = mix(vec3(0.10, 0.23, 0.32), vec3(0.035, 0.10, 0.15), waterDepthBase);
      vec3 color = mix(waterAmbient, skyAmbient, smoothstep(-0.035, 0.035, u.y));

      // Faithful, resolution-independent interpretation of the supplied 89-step field.
      for (int iteration = 0; iteration < 89; iteration++) {
        vec3 p = vec3(u * g, g);
        e = p.y + 0.7;
        p.y = e;

        for (int octave = 0; octave < 9; octave++) {
          float scale = exp2(float(octave));
          p.xz = rotate2D(scale) * p.xz;
          e += abs(dot(sin(p.zx * scale + uTime), vec2(0.1))) / scale;
        }

        g += e * 1.4;
        float value = min(e * 256.0 - 0.05, 0.45 - e) / 63.0;
        color += hsv(u.y > 0.0 ? u.y : 0.57, 0.3, max(value, 0.0));
      }

      // Pointer-controlled light temperature: sunrise amber through cool moonlight.
      vec3 warmSun = vec3(1.2, 0.8, 0.5);
      vec3 coolSun = vec3(0.4, 0.7, 1.5);
      vec3 sunColor = mix(warmSun, coolSun, smoothstep(0.0, 1.0, uPointerX));
      vec3 warmBloom = vec3(1.0, 0.42, 0.08);
      vec3 coolBloom = vec3(0.2, 0.48, 1.0);
      vec3 bloomColor = mix(warmBloom, coolBloom, smoothstep(0.0, 1.0, uPointerX));

      // A physically legible solar core, bloom, and reflection at the horizon.
      float sunDistance = length(u * vec2(1.0, 1.08));
      color += sunColor * 0.068 / max(sunDistance, 0.0028);
      color += bloomColor * 0.011 / max(sunDistance * sunDistance, 0.00012);

      // Broken specular path: narrow at the horizon, wider across near-field waves.
      float waterMask = smoothstep(0.025, -0.035, u.y);
      float waterDepth = clamp(-u.y * 2.35, 0.0, 1.0);
      float reflectedWave = sin(u.y * 118.0 - uTime * 2.1) * 0.48;
      reflectedWave += sin(u.y * 247.0 + u.x * 34.0 + uTime * 1.35) * 0.28;
      reflectedWave += sin(u.y * 61.0 - u.x * 17.0 - uTime * 0.72) * 0.24;
      float reflectionWidth = mix(0.012, 0.19, pow(waterDepth, 0.78));
      float centerDrift = reflectedWave * mix(0.002, 0.032, waterDepth);
      float reflectionPath = exp(-pow(abs(u.x + centerDrift) / reflectionWidth, 1.35));
      float waveBreaks = smoothstep(-0.15, 0.72, reflectedWave);
      float fineGlints = smoothstep(0.35, 0.96, sin(u.y * 420.0 + u.x * 78.0 - uTime * 2.6));
      float horizonEnergy = mix(1.0, 0.24, waterDepth);
      float reflection = waterMask * reflectionPath * horizonEnergy * (0.24 + waveBreaks * 0.58 + fineGlints * 0.18);
      color += vec3(1.16, 0.62, 0.24) * reflection * 1.72;
      color += vec3(1.0, 0.88, 0.58) * reflectionPath * waterMask * waveBreaks * pow(1.0 - waterDepth, 2.2) * 0.92;

      // Fine film grain prevents banding on large displays without creating sparkle motion.
      float grain = hash21(frag) - 0.5;
      color += grain * 0.012;

      // Filmic compression preserves highlight detail at 4K and wide-gamut densities.
      color = color / (1.0 + color);
      color = pow(max(color, 0.0), vec3(0.78));

      float vignette = 1.0 - 0.24 * dot(u * vec2(0.78, 1.04), u * vec2(0.78, 1.04));
      color *= clamp(vignette, 0.72, 1.0);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('About hero shader unavailable:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('About hero shader could not be linked:', gl.getProgramInfoLog(program));
    return;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.useProgram(program);

  const position = gl.getAttribLocation(program, 'aPosition');
  const resolution = gl.getUniformLocation(program, 'uResolution');
  const time = gl.getUniformLocation(program, 'uTime');
  const pointerX = gl.getUniformLocation(program, 'uPointerX');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  let visible = true;
  let animationFrame = 0;
  let lastFrame = -Infinity;
  let targetPointerX = 0.18;
  let currentPointerX = targetPointerX;

  const resize = () => {
    const bounds = canvas.parentElement.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.round(bounds.width));
    const cssHeight = Math.max(1, Math.round(bounds.height));
    let ratio = Math.min(window.devicePixelRatio || 1, cssWidth > 900 ? 2.25 : 1.75);
    const pixelBudget = 6_000_000;
    ratio = Math.min(ratio, Math.sqrt(pixelBudget / (cssWidth * cssHeight)));
    const renderWidth = Math.max(1, Math.round(cssWidth * ratio));
    const renderHeight = Math.max(1, Math.round(cssHeight * ratio));
    if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
      canvas.width = renderWidth;
      canvas.height = renderHeight;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      gl.viewport(0, 0, renderWidth, renderHeight);
    }
    draw(reducedMotion ? 18.0 : performance.now());
  };

  const draw = timestamp => {
    gl.useProgram(program);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, timestamp * 0.00034);
    currentPointerX += (targetPointerX - currentPointerX) * (reducedMotion ? 1 : 0.075);
    gl.uniform1f(pointerX, currentPointerX);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const animate = timestamp => {
    if (visible && timestamp - lastFrame > 32) {
      draw(timestamp);
      lastFrame = timestamp;
    }
    animationFrame = requestAnimationFrame(animate);
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.02 }).observe(canvas);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas.parentElement);
  else window.addEventListener('resize', resize, { passive: true });

  const updateLightColor = event => {
    const bounds = canvas.getBoundingClientRect();
    targetPointerX = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    if (reducedMotion) draw(18.0);
  };

  const interactionSurface = canvas.parentElement;
  interactionSurface.addEventListener('pointermove', updateLightColor, { passive: true });
  interactionSurface.addEventListener('pointerdown', updateLightColor, { passive: true });

  canvas.addEventListener('webglcontextlost', event => event.preventDefault());
  resize();
  if (!reducedMotion) animationFrame = requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
})();
