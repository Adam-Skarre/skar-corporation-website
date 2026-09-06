(() => {
  'use strict';
  const canvas=document.querySelector('[data-solutions-particles]');
  if(!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 760px)');
  let points=[],width=1,height=1,dpr=1,raf=0,last=0,time=0,visible=true;
  const colors=['110,163,220','128,190,214','174,208,228'];
  const buckets=Array.from({length:18},()=>[]);
  function center(u){return [(1+0.34*Math.cos(3*u))*Math.cos(2*u),(1+0.34*Math.cos(3*u))*Math.sin(2*u),0.42*Math.sin(3*u)];}
  function build(){
    points=[];const rows=mobile.matches?230:380,columns=mobile.matches?18:26;
    for(let i=0;i<rows;i++){
      const u=i/rows*Math.PI*2,p=center(u),next=center(u+0.001);
      let t=next.map((v,j)=>v-p[j]),length=Math.hypot(...t);t=t.map(v=>v/length);
      let n=[-t[1],t[0],0];length=Math.hypot(...n);n=n.map(v=>v/length);
      const b=[t[1]*n[2]-t[2]*n[1],t[2]*n[0]-t[0]*n[2],t[0]*n[1]-t[1]*n[0]];
      for(let j=0;j<columns;j++){
        const v=j/columns*Math.PI*2,thickness=0.12;
        points.push({x:p[0]+thickness*(n[0]*Math.cos(v)+b[0]*Math.sin(v)),y:p[1]+thickness*(n[1]*Math.cos(v)+b[1]*Math.sin(v)),z:p[2]+thickness*(n[2]*Math.cos(v)+b[2]*Math.sin(v)),u,v,color:Math.floor(i/rows*3)%3});
      }
    }
  }
  function draw(){
    ctx.clearRect(0,0,width,height);buckets.forEach(b=>b.length=0);
    const ry=time*0.09+0.5,rx=0.58+Math.sin(time*0.08)*0.12,rz=-0.4;
    const cy=Math.cos(ry),sy=Math.sin(ry),cx=Math.cos(rx),sx=Math.sin(rx),cz=Math.cos(rz),sz=Math.sin(rz);
    const scale=Math.min(width,height)*0.30;
    for(const p of points){
      const x1=p.x*cy+p.z*sy,z1=-p.x*sy+p.z*cy;
      const y1=p.y*cx-z1*sx,z2=p.y*sx+z1*cx;
      const x=x1*cz-y1*sz,y=x1*sz+y1*cz,perspective=4.5/(4.5-z2*0.4);
      const depth=Math.max(0,Math.min(5,Math.floor((z2+1.6)/3.2*6)));
      const shimmer=0.85+0.15*Math.sin(p.u*3-time*0.6);
      buckets[depth*3+p.color].push(width*.5+x*scale*perspective,height*.5+y*scale*perspective,(0.65+depth*.06)*dpr*shimmer);
    }
    for(let depth=0;depth<6;depth++)for(let color=0;color<3;color++){
      const bucket=buckets[depth*3+color];ctx.fillStyle=`rgba(${colors[color]},${0.2+depth*0.115})`;ctx.beginPath();
      for(let i=0;i<bucket.length;i+=3){ctx.moveTo(bucket[i]+bucket[i+2],bucket[i+1]);ctx.arc(bucket[i],bucket[i+1],bucket[i+2],0,Math.PI*2);}
      ctx.fill();
    }
    canvas.parentElement.classList.add('solutions-particles-ready');
  }
  function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,1.75);width=canvas.width=Math.max(1,Math.round(r.width*dpr));height=canvas.height=Math.max(1,Math.round(r.height*dpr));draw();}
  function frame(now){raf=0;if(!visible||document.hidden||reduced.matches){last=0;return;}if(!last||now-last>=1000/30){time+=last?Math.min((now-last)/1000,0.08):0;last=now;draw();}raf=requestAnimationFrame(frame);}
  function schedule(){cancelAnimationFrame(raf);raf=0;last=0;if(visible&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(frame);}
  build();resize();schedule();
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);else addEventListener('resize',resize);
  if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();},{threshold:0.05}).observe(canvas);
  reduced.addEventListener('change',()=>{draw();schedule();});mobile.addEventListener('change',()=>{build();resize();});document.addEventListener('visibilitychange',schedule);
  addEventListener('pagehide',()=>cancelAnimationFrame(raf));addEventListener('pageshow',schedule);
})();
