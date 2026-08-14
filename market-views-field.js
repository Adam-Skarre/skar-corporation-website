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

    vec3 hsv(float h,float s,float v){
      vec3 q=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
      return v*mix(vec3(1.),q,s);
    }
    mat3 rotate3d(float angle,vec3 axis){
      axis=normalize(axis);
      float c=cos(angle),s=sin(angle),oc=1.-c;
      return mat3(
        oc*axis.x*axis.x+c,oc*axis.x*axis.y-axis.z*s,oc*axis.z*axis.x+axis.y*s,
        oc*axis.x*axis.y+axis.z*s,oc*axis.y*axis.y+c,oc*axis.y*axis.z-axis.x*s,
        oc*axis.z*axis.x-axis.y*s,oc*axis.y*axis.z+axis.x*s,oc*axis.z*axis.z+c
      );
    }
    void main(){
      vec2 fc=gl_FragCoord.xy;
      vec2 pointer=(m-.5)*vec2(.22,.14);
      vec2 view=(fc-.5*r)/r.y*5.35+vec2(pointer.x,9.+pointer.y);
      float travel=0.;
      vec3 color=vec3(0.);
      float camera=-1.15-cos(t*.2)*.05;
      mat3 rotation=rotate3d(camera,vec3(1.,11.+sin(t)*.2,-1.5));

      // The supplied study is a folded 3D density field. Keeping the full
      // view scale makes the horizon and surrounding sky legible.
      for(int ray=0;ray<84;ray++){
        vec3 p=rotation*vec3(view,travel);
        float scale=2.;
        float fold=1.;
        for(int detail=0;detail<17;detail++){
          p=vec3(.08,4.,-1.)-abs(abs(p)*fold-vec3(3.,4.,3.));
          fold=7.1/max(.0001,dot(p,p*.51));
          scale*=fold;
        }
        travel+=p.y/max(.0001,scale);
        float density=log2(max(scale,.0001))/exp(fold);
        color+=vec3(.01)-hsv(.1,travel*.016-fold*.3,density/200.);
      }
      color=pow(clamp(color,0.,1.),vec3(.96));
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

  const draw=now=>{currentX+=(targetX-currentX)*.035;currentY+=(targetY-currentY)*.035;gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,now*.001);gl.uniform2f(mouse,currentX,currentY);gl.drawArrays(gl.TRIANGLES,0,3);};
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
