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

    vec3 hsv(float h,float s,float v){
      vec3 rgb=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
      return v*mix(vec3(1.),rgb,clamp(s,0.,1.));
    }
    mat3 rotate3D(float a,vec3 axis){
      axis=normalize(axis);float c=cos(a),s=sin(a),ic=1.-c;
      return mat3(
        c+axis.x*axis.x*ic,axis.x*axis.y*ic-axis.z*s,axis.x*axis.z*ic+axis.y*s,
        axis.y*axis.x*ic+axis.z*s,c+axis.y*axis.y*ic,axis.y*axis.z*ic-axis.x*s,
        axis.z*axis.x*ic-axis.y*s,axis.z*axis.y*ic+axis.x*s,c+axis.z*axis.z*ic
      );
    }
    void main(){
      vec2 FC=gl_FragCoord.xy;
      float g=0.,e=1.,s=2.;
      vec3 color=vec3(0.);
      for(int ray=0;ray<99;ray++){
        vec3 p=vec3((FC-.5*r)/r.y*5.+vec2(0.,9.),g);
        p=rotate3D(-1.15-cos(t*.2)*.05,vec3(1.,11.+sin(t)*.2,-1.5))*p;
        s=2.;
        for(int fold=0;fold<19;fold++){
          p=vec3(.08,4.,-1.)-abs(abs(p)*e-vec3(3.,4.,3.));
          e=7.1/max(dot(p,p*.51),.0001);
          s*=e;
        }
        g+=p.y/max(s,.0001);
        s=log2(max(s,.0001))/exp(min(e,12.));
        color+=.01-hsv(.1,g*.016-e*.3,s/200.);
      }
      color=clamp(color,0.,1.);
      color=mix(color,vec3(.78,.87,.98),.08);
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
  let visible=true,last=0,frame=0;

  const draw=now=>{gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,now*.00025);gl.drawArrays(gl.TRIANGLES,0,3);};
  const resize=()=>{
    const box=canvas.parentElement.getBoundingClientRect();
    const scale=Math.min(devicePixelRatio||1,.82,Math.sqrt(900000/Math.max(1,box.width*box.height)));
    canvas.width=Math.max(1,Math.round(box.width*scale));canvas.height=Math.max(1,Math.round(box.height*scale));
    gl.viewport(0,0,canvas.width,canvas.height);draw(reducedMotion?4200:performance.now());
  };
  const animate=now=>{if(visible&&now-last>40){draw(now);last=now;}frame=requestAnimationFrame(animate);};
  new ResizeObserver(resize).observe(canvas.parentElement);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{rootMargin:'100px'}).observe(canvas);
  resize();if(!reducedMotion)frame=requestAnimationFrame(animate);
  addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
})();
