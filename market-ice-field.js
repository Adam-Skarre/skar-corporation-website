(() => {
  'use strict';
  const canvas = document.querySelector('[data-market-ice]');
  if (!canvas) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  if (!gl) return;

  const vertex = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fragment = `
    precision highp float;
    uniform vec2 r;
    uniform float t;
    vec3 hsv(float h,float s,float v){
      vec3 q=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
      return v*mix(vec3(1.),q,s);
    }
    void main(){
      vec2 view=(gl_FragCoord.xy-.5*r)/r;
      vec3 direction=vec3(view,.6);
      vec3 ray=direction;
      ray.z-=1.;
      float field=.12;
      float radius=1.;
      vec3 color=vec3(0.);
      for(int step=0;step<67;step++){
        float fi=float(step)+1.;
        if(step>36) color+=hsv(.58,field/fi*2.5,field/500.)+vec3(.008);
        vec3 point=ray+=direction*max(field,.03-field*5.)*radius*.2;
        radius=max(length(point),.0001);
        point=vec3(log(radius)-t,asin(clamp(-point.z/radius,-1.,1.))-1.3,atan(point.y,point.x)-t*.2);
        field=0.;
        float scale=1.;
        for(int detail=0;detail<10;detail++){
          field+=abs(dot(sin(point.yzx*scale),cos(point*scale)))/scale;
          scale+=scale;
        }
      }
      color=pow(clamp(color,0.,1.),vec3(.9));
      gl_FragColor=vec4(color,1.);
    }
  `;
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);return gl.getShaderParameter(shader,gl.COMPILE_STATUS)?shader:null;};
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  if(!vs||!fs) return;
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const resolution=gl.getUniformLocation(program,'r'),time=gl.getUniformLocation(program,'t');
  let visible=true,last=0,frame=0;
  const draw=now=>{gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,now*.00012);gl.drawArrays(gl.TRIANGLES,0,3);};
  const resize=()=>{const box=canvas.parentElement.getBoundingClientRect();const scale=Math.min(devicePixelRatio||1,1.45,Math.sqrt(1900000/Math.max(1,box.width*box.height)));canvas.width=Math.max(1,Math.round(box.width*scale));canvas.height=Math.max(1,Math.round(box.height*scale));gl.viewport(0,0,canvas.width,canvas.height);draw(reducedMotion?4500:performance.now());};
  const animate=now=>{if(visible&&now-last>42){draw(now);last=now;}frame=requestAnimationFrame(animate);};
  new ResizeObserver(resize).observe(canvas.parentElement);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{rootMargin:'100px'}).observe(canvas);
  resize();if(!reducedMotion)frame=requestAnimationFrame(animate);
  addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
})();
