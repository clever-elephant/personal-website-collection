// 生成海面遮罩 mask-day.png / mask-night.png(R=海面, G=离岸距离)。在本目录运行:node mask.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';
import { fileURLToPath } from 'url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--allow-file-access-from-files'] });
const p = await b.newPage();
await p.goto(`file://${ROOT}/img/scene-3.jpg`);
const out = {};
for (const [key, f] of [['day','scene-3'],['night','scene-3-night']]) {
  const r = await p.evaluate(async ({f, key, ROOT}) => {
    const W=1672,H=941, S=3, w=Math.round(W/S), h=Math.round(H/S);
    const img = new Image(); img.src = `${ROOT}/concepts/${f}.png`; await img.decode();
    const c = document.createElement('canvas'); c.width=W;c.height=H; const x=c.getContext('2d'); x.drawImage(img,0,0);
    const d=x.getImageData(0,0,W,H).data;
    const hz=(X)=>362;
    const isWater=(R,G,B)=> key==='day' ? (G>130 && B>130 && B>R+45 && G>R+35 && Math.abs(G-B)<70) : (B>G+30 && B>R+40 && R<100);
    // 全分辨率判定 -> 缩到 1/S
    const water=new Float32Array(w*h), land=new Float32Array(w*h);
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){
      let wa=0,la=0,n=0;
      for(let dy=0;dy<S;dy++)for(let dx=0;dx<S;dx++){
        const X=i*S+dx,Y=j*S+dy; if(X>=W||Y>=H)continue; n++;
        const k=(Y*W+X)*4, below=Y>hz(X)+4;
        const wt=below&&isWater(d[k],d[k+1],d[k+2]);
        if(wt)wa++; else if(Y>hz(X)+14)la++;
      }
      water[j*w+i]=wa/n; land[j*w+i]=la/n;
    }
    // 去掉零散噪点:3x3 中值近似(多数投票)
    const clean=new Float32Array(w*h);
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){let s=0,n=0;for(let a=-1;a<=1;a++)for(let bb=-1;bb<=1;bb++){const y=j+a,xx=i+bb;if(y<0||y>=h||xx<0||xx>=w)continue;s+=water[y*w+xx];n++;}clean[j*w+i]=s/n;}
    // 岛 = 与岛中心连通的非海面区域;其余地平线以下都算海
    const isl=new Uint8Array(w*h), q=[];
    const start=Math.round(600/S)*w+Math.round(836/S); isl[start]=1; q.push(start);
    while(q.length){const k=q.pop(),i=k%w,j=(k-i)/w;for(const [a,bb] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=i+a,y=j+bb;if(xx<0||xx>=w||y<0||y>=h)continue;const n=y*w+xx;if(isl[n])continue;if(clean[n]>0.5)continue;isl[n]=1;q.push(n);}}
    const sea=new Uint8Array(w*h); const q2=[];
    const seed=(i,j)=>{const k=j*w+i;if(!isl[k]&&!sea[k]&&j*S>hz(i*S)+3){sea[k]=1;q2.push(k);}};
    for(let i=0;i<w;i++)seed(i,h-1); for(let j=0;j<h;j++){seed(0,j);seed(w-1,j);}
    while(q2.length){const k=q2.pop(),i=k%w,j=(k-i)/w;for(const [a,bb] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=i+a,y=j+bb;if(xx<0||xx>=w||y<0||y>=h)continue;seed(xx,y);}}
    for(let k=0;k<w*h;k++){const i=k%w,j=(k-i)/w;const below=j*S>hz(i*S)+10;clean[k]=sea[k];land[k]=(!sea[k]&&below)?1:0;}
    // 羽化海面边缘
    { const t=clean.slice(); for(let j=1;j<h-1;j++)for(let i=1;i<w-1;i++){let s=0;for(let a=-1;a<=1;a++)for(let bb=-1;bb<=1;bb++)s+=t[(j+a)*w+i+bb];clean[j*w+i]=s/9;} }
    // 岸线距离:land 的多次盒模糊
    const blur=(src,r)=>{let a=src.slice();for(let pass=0;pass<3;pass++){const t=new Float32Array(w*h);for(let j=0;j<h;j++){let s=0;for(let i=-r;i<w+r;i++){const add=i+r<w?a[j*w+Math.min(w-1,Math.max(0,i+r))]:0;s+=add; if(i-r-1>=0)s-=a[j*w+i-r-1]; if(i>=0&&i<w)t[j*w+i]=s/(2*r+1);}}const u=new Float32Array(w*h);for(let i=0;i<w;i++){let s=0;for(let j=-r;j<h+r;j++){const add=j+r<h?t[Math.min(h-1,Math.max(0,j+r))*w+i]:0;s+=add;if(j-r-1>=0)s-=t[(j-r-1)*w+i];if(j>=0&&j<h)u[j*w+i]=s/(2*r+1);}}a=u;}return a;};
    const shore=blur(land,6);
    const oc=document.createElement('canvas'); oc.width=w; oc.height=h; const ox=oc.getContext('2d'); const id=ox.createImageData(w,h);
    for(let k=0;k<w*h;k++){ id.data[k*4]=Math.round(clean[k]*255); id.data[k*4+1]=Math.round(Math.min(1,shore[k]*1.6)*255); id.data[k*4+2]=0; id.data[k*4+3]=255; }
    ox.putImageData(id,0,0);
    return oc.toDataURL('image/png');
  }, {f, key, ROOT});
  out[key]=r;
  fs.writeFileSync(`mask-${key}.png`, Buffer.from(r.split(',')[1],'base64'));
}
await b.close();
