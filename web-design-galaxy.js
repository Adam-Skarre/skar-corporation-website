(() => {
  'use strict';
  const figure = document.querySelector('[data-web-galaxy]');
  if (!figure) return;
  const canvas = figure.querySelector('canvas');
  const stage = figure.querySelector('.web-galaxy-stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 760px)');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
  if (!gl) return; // The vector star field remains visible without WebGL.

  // One interleaved buffer, one draw call. Orbital movement stays on the GPU.
  const vertex = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aSeed;
    uniform float uTime;
    uniform float uAspect;
    uniform float uDpr;
    uniform float uScale;
    uniform vec2 uPointer;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vBright;
    void main() {
      float radius = length(aPosition.xy);
      float angle = uTime * (0.010 + 0.002 / (0.4 + radius));
      float c = cos(angle), s = sin(angle);
      vec3 p = vec3(c*aPosition.x-s*aPosition.y,s*aPosition.x+c*aPosition.y,aPosition.z);
      float tilt = 0.64 + uPointer.y * 0.018;
      p = vec3(p.x, p.y*cos(tilt)-p.z*sin(tilt), p.y*sin(tilt)+p.z*cos(tilt));
      float turn = -0.23 + uPointer.x*0.012;
      p.xy = mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*p.xy;
      float depth = 3.4 / (3.4-p.z*0.32);
      p.xy += uPointer*0.006*(1.0+p.z);
      gl_Position = vec4(p.x*uScale*depth/uAspect,p.y*uScale*depth,0.0,1.0);
      gl_PointSize = clamp(aSize*uDpr*depth,1.0,18.0);
      vColor = aColor;
      vAlpha = (0.73+0.20*sin(aSeed*83.0+uTime*(0.4+aSeed)))*(1.0-smoothstep(1.25,2.25,radius));
      vBright = step(3.2,aSize);
    }`;
  const fragment = `
    precision mediump float;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vBright;
    void main() {
      vec2 p = gl_PointCoord-0.5;
      float r = length(p);
      float core = exp(-r*r*38.0);
      float halo = exp(-r*r*10.0)*0.22;
      float rays = (exp(-abs(p.x)*85.0)*exp(-abs(p.y)*8.0)+exp(-abs(p.y)*85.0)*exp(-abs(p.x)*8.0))*vBright*0.38;
      float alpha = (core+halo+rays)*vAlpha*(1.0-smoothstep(0.38,0.5,r));
      if(alpha<0.008) discard;
      gl_FragColor = vec4(vColor,alpha);
    }`;
  let program, buffer, uniforms, count = 0, lost = false;
  let raf = 0, previous = 0, elapsed = 0, visible = true, paused = reduced.matches;
  const pointer = {x:0,y:0,tx:0,ty:0,vx:0,vy:0};
  let rng = 92741;
  const random = () => { rng = (1664525*rng+1013904223)>>>0; return rng/4294967296; };
  const gaussian = () => Math.sqrt(-2*Math.log(Math.max(0.00001,random())))*Math.cos(6.2831853*random());
  function particles(n) {
    rng = 92741;
    const data = new Float32Array(n*8);
    for(let i=0;i<n;i++) {
      const core = i < n*0.16, halo = i > n*0.96;
      const r = core ? Math.abs(gaussian())*0.10 : halo ? 0.4+random()*1.3 : 0.12+Math.pow(random(),0.68)*1.10;
      const arm = i%4;
      // Narrow logarithmic arms, a spherical central bulge, and sparse outer stars.
      const angle = core || halo ? random()*Math.PI*2 : arm*Math.PI/2+3.8*Math.log(r+0.24)+gaussian()*(0.095+0.055*r);
      const x = Math.cos(angle)*r, y = Math.sin(angle)*r;
      const z = gaussian()*(core?0.055:halo?0.16:0.018);
      const warmth = Math.exp(-r*r*15);
      const cool = [[0.20,0.35,0.67],[0.35,0.30,0.63],[0.16,0.43,0.57],[0.29,0.39,0.68]][arm];
      const color = cool.map((v,j)=>v*(1-warmth)+[0.66,0.48,0.29][j]*warmth);
      const bright = random()>0.993;
      data.set([x,y,z,...color,bright?4+random()*4:0.8+random()*1.65,random()],i*8);
    }
    return data;
  }
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Shader compilation failed');} return s;
  }
  function init() {
    try {
      const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
      program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader linking failed');
      gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      count=compact.matches?11000:28000;
      gl.bufferData(gl.ARRAY_BUFFER,particles(count),gl.STATIC_DRAW);
      [['aPosition',3,0],['aColor',3,12],['aSize',1,24],['aSeed',1,28]].forEach(([name,size,offset])=>{
        const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,32,offset);
      });
      uniforms=Object.fromEntries(['Time','Aspect','Dpr','Scale','Pointer'].map(name=>[name,gl.getUniformLocation(program,'u'+name)]));
      gl.clearColor(1,1,1,1);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);
      lost=false;resize();figure.classList.add('is-ready');schedule();
    } catch (_) { lost=true;figure.classList.remove('is-ready'); }
  }
  function draw() {
    if(lost||!uniforms)return;
    gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(uniforms.Time,elapsed);gl.uniform2f(uniforms.Pointer,pointer.x,pointer.y);gl.drawArrays(gl.POINTS,0,count);
  }
  function resize() {
    if(lost||!uniforms)return;
    const rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,1.75);
    canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(uniforms.Aspect,rect.width/rect.height);gl.uniform1f(uniforms.Dpr,dpr);
    gl.uniform1f(uniforms.Scale,Math.min(1.3,rect.width/rect.height*0.76));draw();
  }
  function frame(now) {
    raf=0;if(paused||!visible||document.hidden||lost){previous=0;return;}
    const dt=previous?Math.min((now-previous)/1000,0.05):0;previous=now;elapsed+=dt;
    // Substepped damped springs retain momentum without becoming frame-rate dependent.
    const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
    for(let i=0;i<steps;i++) {
      pointer.vx+=((pointer.tx-pointer.x)*100-pointer.vx*17)*h;
      pointer.vy+=((pointer.ty-pointer.y)*100-pointer.vy*17)*h;
      pointer.x+=pointer.vx*h;pointer.y+=pointer.vy*h;
    }
    draw();raf=requestAnimationFrame(frame);
  }
  function schedule() {cancelAnimationFrame(raf);raf=0;previous=0;if(!paused&&visible&&!document.hidden&&!lost)raf=requestAnimationFrame(frame);}
  reduced.addEventListener('change',()=>{paused=reduced.matches;pointer.tx=pointer.ty=pointer.x=pointer.y=pointer.vx=pointer.vy=0;draw();schedule();});
  // Restrained camera parallax only: the galaxy keeps its structure under the pointer.
  stage.addEventListener('pointermove',event=>{
    if(paused||event.pointerType==='touch')return;
    const r=stage.getBoundingClientRect();
    pointer.tx=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));
    pointer.ty=Math.max(-1,Math.min(1,1-(event.clientY-r.top)/r.height*2));
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{pointer.tx=pointer.ty=0;},{passive:true});
  stage.addEventListener('pointercancel',()=>{pointer.tx=pointer.ty=0;},{passive:true});
  document.addEventListener('visibilitychange',schedule);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:0.05}).observe(stage);
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(stage);else addEventListener('resize',resize,{passive:true});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;schedule();figure.classList.remove('is-ready');});
  canvas.addEventListener('webglcontextrestored',init);
  addEventListener('pagehide',()=>{cancelAnimationFrame(raf);pointer.tx=pointer.ty=0;previous=0;});addEventListener('pageshow',schedule);
  init();
})();
