(() => {
  'use strict';
  // Fractal cloud method adapted from work shared by Yohei Nishitsuji
  // (@YoheiNishitsuji) under the MIT License. See THIRD_PARTY_NOTICES.md.
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
      vec3 rgb=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
      rgb=rgb*rgb*(3.-2.*rgb);
      return v*mix(vec3(1.),rgb,s);
    }

    vec3 rotateAxisAngle(vec3 point,float angle,vec3 axis){
      axis=normalize(axis);
      float sine=sin(angle);
      float cosine=cos(angle);
      return point*cosine+cross(axis,point)*sine+axis*dot(axis,point)*(1.-cosine);
    }

    void main(){
      vec2 camera=(m-.5)*vec2(.12,.07);
      vec2 screen=(gl_FragCoord.xy-.5*r)/r.y*5.+vec2(0.,9.)+camera;
      vec3 color=vec3(0.);
      float depth=0.;
      float energy=0.;
      float scale=0.;

      // March forward through repeated folds. Each sample reveals another
      // illuminated layer, producing the billowing, fly-through cloudscape.
      for(int ray=0;ray<99;ray++){
        vec3 point=vec3(screen,depth);
        point=rotateAxisAngle(
          point,
          -1.1-cos(t*.15)*.1,
          vec3(1.,11.+sin(t)*.15,-1.5)
        );
        scale=2.;
        for(int fold=0;fold<19;fold++){
          energy=7.1/max(.0001,dot(point,point*.51));
          scale*=energy;
          point=vec3(.08,4.,-1.)-abs(abs(point)*energy-vec3(3.,4.,3.));
        }
        depth+=point.y/scale;
        scale=log2(max(scale,.0001))/exp(min(energy,20.));
        color+=vec3(.01)-hsv(.1,depth*.016-energy*.3,scale/200.);
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

  const draw=now=>{currentX+=(targetX-currentX)*.035;currentY+=(targetY-currentY)*.035;gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,now*.00025);gl.uniform2f(mouse,currentX,currentY);gl.drawArrays(gl.TRIANGLES,0,3);};
  const resize=()=>{
    const box=canvas.parentElement.getBoundingClientRect();
    const scale=Math.min(devicePixelRatio||1,1,Math.sqrt(1150000/Math.max(1,box.width*box.height)));
    canvas.width=Math.max(1,Math.round(box.width*scale));canvas.height=Math.max(1,Math.round(box.height*scale));
    gl.viewport(0,0,canvas.width,canvas.height);draw(reducedMotion?4200:performance.now());
  };
  const animate=now=>{if(visible&&now-last>50){draw(now);last=now;}frame=requestAnimationFrame(animate);};
  new ResizeObserver(resize).observe(canvas.parentElement);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{rootMargin:'100px'}).observe(canvas);
  canvas.parentElement.addEventListener('pointermove',event=>{const box=canvas.getBoundingClientRect();targetX=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width));targetY=Math.max(0,Math.min(1,1-(event.clientY-box.top)/box.height));},{passive:true});
  resize();if(!reducedMotion)frame=requestAnimationFrame(animate);
  addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
})();
