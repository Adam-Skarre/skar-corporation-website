(() => {
  // SPDX-License-Identifier: MIT
  // Shader study adapted from an MIT-licensed fragment by Yohei Nishitsuji.
  // Responsive framing, edge treatment, renderer, and SKAR palette are original adaptations.
  const canvas = document.querySelector('[data-small-business-shader]');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    powerPreference: 'high-performance'
  });
  if (!gl) return;

  const vertexSource = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;
  const fragmentSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;

    vec3 skarPalette(float phase) {
      vec3 blue = vec3(0.16, 0.48, 0.88);
      vec3 cyan = vec3(0.25, 0.78, 0.78);
      vec3 ice = vec3(0.68, 0.86, 1.0);
      return mix(mix(blue, cyan, smoothstep(0.0, 1.0, phase)), ice, 0.16);
    }

    void main() {
      vec2 r = u_resolution;
      vec2 FC = gl_FragCoord.xy;
      float t = u_time;
      float e = 0.0;
      float R = 0.0;
      float s = 0.0;
      vec3 q = vec3(0.0);
      vec3 p = vec3(0.0);
      vec3 d = vec3(FC.xy / r * 0.4 + vec2(-0.2, 0.8), 1.0);
      vec3 color = vec3(0.0);
      q.zy -= 1.0;

      for (int stepIndex = 0; stepIndex < 130; stepIndex++) {
        s = 13.0;
        p = q += d * e * R * 0.1;
        R = max(length(p), 0.00001);
        p = vec3(log(R) - t * 0.3, exp(R - p.z * 0.5), atan(p.y, p.x) + t * 0.3);
        p.y -= 1.0;
        e = p.y;
        for (int octave = 0; octave < 7; octave++) {
          if (s >= 1000.0) break;
          e += dot(cos(p.xzz * s), sin(p.zzx * s + 0.5)) / s;
          s += s;
        }
        float energy = max(0.0, 0.007 - e) * 3.0;
        float phase = 0.5 + 0.5 * sin(R * 2.0 + q.y);
        color += skarPalette(phase) * energy;
      }

      vec2 centered = (FC - r * 0.5) / min(r.x, r.y);
      float edgeFade = 1.0 - smoothstep(0.35, 0.56, length(centered));
      float luminance = max(color.r, max(color.g, color.b));
      float alpha = clamp(luminance * 1.7, 0.0, 0.9) * edgeFade;
      gl_FragColor = vec4(color * edgeFade, alpha);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'u_resolution');
  const time = gl.getUniformLocation(program, 'u_time');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let frame = 0;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 0.9 : 1.2);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function draw(milliseconds) {
    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, reducedMotion ? 2.4 : milliseconds * 0.00055);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function animate(milliseconds) {
    if (visible) draw(milliseconds);
    if (!reducedMotion) frame = requestAnimationFrame(animate);
  }

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, {
    rootMargin: '100px'
  }).observe(canvas);
  window.addEventListener('resize', () => draw(performance.now()), { passive: true });
  draw(reducedMotion ? 2400 : performance.now());
  if (!reducedMotion) frame = requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
})();
