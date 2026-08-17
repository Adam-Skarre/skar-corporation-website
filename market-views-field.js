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
    float cloudField(vec2 p){
      vec2 warp=vec2(fbm(p*.58+vec2(1.7,5.2)),fbm(p*.58-vec2(4.1,2.6)));
      return fbm(p+(warp-.5)*1.18);
    }
    vec3 cloudColor(float field,float dx,float dy,vec3 shadow){
      vec3 normal=normalize(vec3(-dx*5.2,-dy*5.2,.72));
      vec3 lightDirection=normalize(vec3(-.48,.62,.78));
      float light=.32+.68*max(0.,dot(normal,lightDirection));
      float crown=smoothstep(.58,.88,field);
      vec3 middle=mix(shadow,vec3(.82,.9,.98),light);
      return mix(middle,vec3(.985,.992,1.),crown*.74);
    }
    void main(){
      vec2 uv=gl_FragCoord.xy/r;
      vec2 aspect=vec2(r.x/r.y,1.);
      vec2 pointer=(m-.5)*vec2(.075,.045);
      float drift=t*.055;
      float epsilon=.08;

      // A deep blue sky corridor stays visible between the cloud banks.
      vec3 horizon=vec3(.63,.79,.94);
      vec3 zenith=vec3(.18,.43,.72);
      vec3 color=mix(horizon,zenith,smoothstep(.04,.96,uv.y));
      float corridor=exp(-8.5*distance(uv,vec2(.53,.54)));
      color+=vec3(.075,.11,.15)*corridor;

      // High, distant formations move slowly and retain a crisp silhouette.
      vec2 farP=(uv*aspect+pointer*.28)*vec2(1.42,1.72)+vec2(-drift*.24,2.1);
      float farField=cloudField(farP);
      float farDx=noise(farP*3.+vec2(epsilon,0.))-noise(farP*3.-vec2(epsilon,0.));
      float farDy=noise(farP*3.+vec2(0.,epsilon))-noise(farP*3.-vec2(0.,epsilon));
      float farGate=.015+abs(uv.x-.52)*.08;
      float farMask=smoothstep(.59,.69,farField+farGate);
      vec3 farCloud=cloudColor(farField,farDx,farDy,vec3(.43,.58,.74));
      color=mix(color,farCloud,farMask*.38);

      // An upper ceiling frames the opening instead of flooding the center.
      vec2 upperP=(uv*aspect-pointer*.44)*vec2(1.08,1.86)+vec2(drift*.38,5.35);
      float upperField=cloudField(upperP);
      float upperDx=noise(upperP*3.+vec2(epsilon,0.))-noise(upperP*3.-vec2(epsilon,0.));
      float upperDy=noise(upperP*3.+vec2(0.,epsilon))-noise(upperP*3.-vec2(0.,epsilon));
      float upperGate=(uv.y-.72)*1.38+abs(uv.x-.52)*.08;
      float upperMask=smoothstep(.53,.65,upperField+upperGate);
      vec3 upperCloud=cloudColor(upperField,upperDx,upperDy,vec3(.3,.46,.64));
      color=mix(color,upperCloud,upperMask*.9);

      // The near deck has larger billows, darker undersides, and faster upward drift.
      vec2 nearP=(uv*aspect+pointer)*vec2(1.02,1.48)+vec2(-drift*.92,7.15-drift*.48);
      float nearField=cloudField(nearP);
      float nearDx=noise(nearP*3.+vec2(epsilon,0.))-noise(nearP*3.-vec2(epsilon,0.));
      float nearDy=noise(nearP*3.+vec2(0.,epsilon))-noise(nearP*3.-vec2(0.,epsilon));
      float nearGate=(.43-uv.y)*1.34+abs(uv.x-.5)*.12;
      float nearMask=smoothstep(.5,.635,nearField+nearGate);
      vec3 nearCloud=cloudColor(nearField,nearDx,nearDy,vec3(.22,.38,.58));
      float underside=smoothstep(.1,.48,uv.y);
      nearCloud*=mix(.78,1.,underside);
      color=mix(color,nearCloud,nearMask*.98);

      // Restrained atmospheric depth without the white bloom that obscured the forms.
      float aerial=exp(-18.*distance(uv,vec2(.55,.5)));
      color+=vec3(.035,.055,.075)*aerial;
      float vignette=1.-.16*dot((uv-.5)*vec2(.72,1.),(uv-.5)*vec2(.72,1.));
      color*=vignette;
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
