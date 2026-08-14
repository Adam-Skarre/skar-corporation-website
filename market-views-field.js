(() => {
  'use strict';
  const canvas = document.querySelector('[data-market-field]');
  if (!canvas) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  if (!gl) return;

  const vertex = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fragment = `
    precision highp float;
    uniform vec2 r;
    uniform float t;
    uniform vec2 m;

    float hash(vec2 p){
      p=fract(p*vec2(123.34,456.21));
      p+=dot(p,p+45.32);
      return fract(p.x*p.y);
    }
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
    }
    float fbm(vec2 p){
      float value=0.,amplitude=.52;
      mat2 turn=mat2(.8,-.6,.6,.8);
      for(int i=0;i<6;i++){
        value+=amplitude*noise(p);
        p=turn*p*2.03+vec2(4.7,8.3);
        amplitude*=.5;
      }
      return value;
    }
    void main(){
      vec2 uv=gl_FragCoord.xy/r;
      vec2 aspect=vec2(r.x/r.y,1.);
      vec2 pointer=(m-.5)*vec2(.11,.07);
      float drift=t*.018;

      vec3 zenith=vec3(.34,.57,.84);
      vec3 horizon=vec3(.78,.88,.98);
      vec3 color=mix(horizon,zenith,smoothstep(.12,.92,uv.y));
      color+=vec3(.14,.18,.22)*(1.-distance(uv,vec2(.54,.57)))*.16;

      // Distant veil: slow, soft, and slightly above the viewer.
      vec2 farP=(uv*aspect+pointer*.35)*vec2(1.25,2.2)+vec2(drift*.38,1.7);
      float farShape=fbm(farP)+.42*fbm(farP*1.8+3.1);
      float farMask=smoothstep(.58,.82,farShape+smoothstep(.18,.94,uv.y)*.18);
      vec3 farCloud=mix(vec3(.55,.68,.83),vec3(.96,.985,1.),smoothstep(.57,.9,farShape));
      color=mix(color,farCloud,farMask*.52);

      // Upper cloud ceiling leaves a central opening and establishes height.
      vec2 upperP=(uv*aspect-pointer*.6)*vec2(.92,2.65)+vec2(-drift*.65,4.8);
      float upper=fbm(upperP)+.3*fbm(upperP*2.25);
      float ceiling=smoothstep(.58,.79,upper+(uv.y-.58)*.72);
      float opening=smoothstep(.08,.46,distance(uv,vec2(.52,.57)));
      ceiling*=mix(.28,1.,opening);
      vec3 upperCloud=mix(vec3(.43,.57,.73),vec3(.98,.99,1.),smoothstep(.57,.86,upper));
      color=mix(color,upperCloud,ceiling*.82);

      // Near cloud deck moves fastest and rises into frame, creating levitation.
      vec2 nearP=(uv*aspect+pointer)*vec2(1.35,3.1)+vec2(drift,7.4);
      float nearField=fbm(nearP)+.36*fbm(nearP*2.05+7.2);
      float deck=smoothstep(.53,.73,nearField+(0.42-uv.y)*1.28);
      vec3 nearShadow=vec3(.28,.43,.62);
      vec3 nearLight=vec3(.98,.99,1.);
      vec3 nearCloud=mix(nearShadow,nearLight,smoothstep(.5,.84,nearField+.12*uv.y));
      color=mix(color,nearCloud,deck*.96);

      // Soft aerial perspective and edge shading, never film grain.
      float glow=exp(-9.*distance(uv,vec2(.53,.52)));
      color+=vec3(.22,.28,.34)*glow;
      float vignette=1.-.22*dot((uv-.5)*vec2(.72,1.),(uv-.5)*vec2(.72,1.));
      color*=vignette;
      color=pow(clamp(color,0.,1.),vec3(.94));
      gl_FragColor=vec4(color,1.);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs);gl.attachShader(program, fs);gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'p');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const resolution=gl.getUniformLocation(program,'r');
  const time=gl.getUniformLocation(program,'t');
  const mouse=gl.getUniformLocation(program,'m');
  let visible=true,last=0,frame=0;
  let targetX=.5,targetY=.5,currentX=.5,currentY=.5;

  const draw=now=>{currentX+=(targetX-currentX)*.035;currentY+=(targetY-currentY)*.035;gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,now*.00025);gl.uniform2f(mouse,currentX,currentY);gl.drawArrays(gl.TRIANGLES,0,3);};
  const resize=()=>{
    const box=canvas.parentElement.getBoundingClientRect();
    const scale=Math.min(devicePixelRatio||1,1.6,Math.sqrt(2800000/Math.max(1,box.width*box.height)));
    canvas.width=Math.max(1,Math.round(box.width*scale));canvas.height=Math.max(1,Math.round(box.height*scale));
    gl.viewport(0,0,canvas.width,canvas.height);draw(reducedMotion?4200:performance.now());
  };
  const animate=now=>{if(visible&&now-last>40){draw(now);last=now;}frame=requestAnimationFrame(animate);};
  new ResizeObserver(resize).observe(canvas.parentElement);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{rootMargin:'100px'}).observe(canvas);
  canvas.parentElement.addEventListener('pointermove',event=>{const box=canvas.getBoundingClientRect();targetX=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width));targetY=Math.max(0,Math.min(1,1-(event.clientY-box.top)/box.height));},{passive:true});
  resize();if(!reducedMotion)frame=requestAnimationFrame(animate);
  addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
})();
