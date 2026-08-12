const canvas = document.getElementById('skar-ai-tubes');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && !prefersReduced) {
  import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')
    .then(({ default: TubesCursor }) => {
      const experience = TubesCursor(canvas, {
        bloom: { threshold: 0, strength: 1.12, radius: 0.45 },
        tubes: {
          colors: ['#ff008a', '#8b5cf6', '#3b82f6', '#ffffff'],
          lights: {
            intensity: 50,
            colors: ['#ff008a', '#8b5cf6', '#3b82f6', '#ffffff']
          }
        },
        sleepRadiusX: 245,
        sleepRadiusY: 120,
        sleepTimeScale1: 0.32,
        sleepTimeScale2: 0.48
      });

      window.addEventListener('pagehide', () => experience.dispose(), { once: true });
    })
    .catch(() => canvas.classList.add('is-unavailable'));
}

const mountainCanvas = document.getElementById('skar-ai-mountain');

if (mountainCanvas) {
  const gl = mountainCanvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    preserveDrawingBuffer: false
  });

  if (!gl) {
    mountainCanvas.classList.add('is-unavailable');
  } else {
    const vertexSource = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;

    // SPDX-License-Identifier: MIT
    // Copyright (c) 2026 @YoheiNishitsuji
    const fragmentSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      vec3 hsv(float h,float s,float v){
        vec4 t=vec4(1.,2./3.,1./3.,3.);
        vec3 p=abs(fract(vec3(h)+t.xyz)*6.-vec3(t.w));
        return v*mix(vec3(t.x),clamp(p-vec3(t.x),0.,1.),s);
      }

      mat2 rotate2D(float a){ return mat2(cos(a),-sin(a),sin(a),cos(a)); }

      void main(){
        vec2 r=u_resolution;
        vec2 FC=gl_FragCoord.xy;
        float t=u_time;
        vec4 o=vec4(0,0,0,1);
        float i=0.,e=0.,R=0.,s=0.;
        vec3 q=vec3(0.),p=vec3(0.);
        vec3 d=vec3((FC.xy-.5*r)/r.x*.4+vec2(.0,.85),.5);
        q.zy-=1.;

        for(int rayStep=0;rayStep<67;rayStep++){
          i+=1.;
          o.rgb+=hsv(.1,e,min(e*s,1.)/64.);
          s=3.;
          p=q+=d*e*R*.5+1e-4;
          R=max(length(p),1e-5);
          p=vec3(log(R)-t*.3,exp(-p.z/R)+.2,atan(p.y,p.x));
          p.y-=1.;
          e=p.y;
          for(int octave=0;octave<9;octave++){
            if(s>=1e3) break;
            e+=sin(dot(cos(p.zyy*s),.5+cos(p.xxz*s)))/s*.3;
            s+=s;
          }
        }
        gl_FragColor=o;
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = vertex && fragment ? gl.createProgram() : null;

    if (program) {
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
    }

    if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      mountainCanvas.classList.add('is-unavailable');
    } else {
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const resolution = gl.getUniformLocation(program, 'u_resolution');
      const time = gl.getUniformLocation(program, 'u_time');
      let visible = true;
      let frame = 0;
      const started = performance.now();

      const resize = () => {
        const rect = mountainCanvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        const width = Math.max(1, Math.round(rect.width * ratio));
        const height = Math.max(1, Math.round(rect.height * ratio));
        if (mountainCanvas.width !== width || mountainCanvas.height !== height) {
          mountainCanvas.width = width;
          mountainCanvas.height = height;
        }
        gl.viewport(0, 0, width, height);
      };

      const draw = (now) => {
        resize();
        gl.uniform2f(resolution, mountainCanvas.width, mountainCanvas.height);
        gl.uniform1f(time, prefersReduced ? 1.8 : (now - started) * 0.00018);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };

      const animate = (now) => {
        if (visible) draw(now);
        frame = requestAnimationFrame(animate);
      };

      if (prefersReduced) {
        draw(performance.now());
      } else {
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
        observer.observe(mountainCanvas);
        frame = requestAnimationFrame(animate);
        window.addEventListener('pagehide', () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
        }, { once: true });
      }
    }
  }
}
