// 洋红底精灵表抠图:去色溢 + 连通域切分,输出 sprites-<name>.json(每个物体的裁切框)和透明 PNG
// 用法:node key.mjs <输入png> <输出前缀>
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
const [, , input, prefix] = process.argv;
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
const src = 'data:image/png;base64,' + fs.readFileSync(input).toString('base64');
const r = await p.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode();
  const W = img.width, H = img.height;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const id = x.getImageData(0, 0, W, H), d = id.data;
  // 洋红距离:背景近似 (R 高, G 低, B 高)
  const a = new Float32Array(W * H);
  for (let k = 0; k < W * H; k++) {
    const R = d[k * 4], G = d[k * 4 + 1], B = d[k * 4 + 2];
    const mag = Math.min(R, B) - G;             // 洋红程度
    const t = Math.min(1, Math.max(0, (mag - 90) / 110)); // 1=背景
    a[k] = 1 - t;
    // 叶片与茎之间被画成洋红的阴影雾:B≈R 且 G 远低于两者
    const lo = Math.min(R, B);
    if (B > R * 0.8 && R > 120 && B > 120 && G < lo * 0.62) { const hz = Math.min(1, (lo * 0.62 - G) / 40); a[k] = Math.min(a[k], 1 - hz); }
  }
  // 去色溢:只处理离背景 4px 以内的边缘像素,避免把粉色花瓣变紫
  const near = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) if (a[k] < .5) { const x0 = k % W, y0 = (k - x0) / W; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const xx = x0 + dx, yy = y0 + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) near[yy * W + xx] = 1; } }
  for (let k = 0; k < W * H; k++) {
    if (!near[k]) continue;
    const R = d[k * 4], G = d[k * 4 + 1], B = d[k * 4 + 2], mag = Math.min(R, B) - G;
    if (mag > 15) { const m = Math.max(G, Math.min(R, B) - mag * 0.85); d[k * 4] = Math.min(R, m + (R - Math.min(R, B))); d[k * 4 + 2] = Math.min(B, m + (B - Math.min(R, B))); }
  }
  // 腐蚀 1px 去毛边
  const a2 = a.slice();
  for (let y = 1; y < H - 1; y++) for (let x2 = 1; x2 < W - 1; x2++) { const k = y * W + x2; a2[k] = Math.min(a[k], (a[k - 1] + a[k + 1] + a[k - W] + a[k + W]) / 4 + .25); }
  for (let k = 0; k < W * H; k++) d[k * 4 + 3] = Math.round(Math.max(0, Math.min(1, a2[k])) * 255);
  x.putImageData(id, 0, 0);
  // 连通域(alpha>0.5)
  const lab = new Int32Array(W * H); let n = 0; const boxes = [];
  for (let k = 0; k < W * H; k++) {
    if (lab[k] || a2[k] < .5) continue;
    n++; const st = [k]; lab[k] = n; let x0 = W, y0 = H, x1 = 0, y1 = 0, cnt = 0;
    while (st.length) { const q = st.pop(), qx = q % W, qy = (q - qx) / W; cnt++; if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
      for (const o of [1, -1, W, -W]) { const z = q + o; if (z < 0 || z >= W * H || lab[z] || a2[z] < .5) continue; if ((o === 1 && qx === W - 1) || (o === -1 && qx === 0)) continue; lab[z] = n; st.push(z); } }
    if (cnt > 3000) boxes.push({ x0, y0, x1, y1, cnt });
  }
  boxes.sort((p, q) => (Math.round(p.y0 / 300) - Math.round(q.y0 / 300)) || p.x0 - q.x0);
  const out = boxes.map((bb) => { const P = 3, X = Math.max(0, bb.x0 - P), Y = Math.max(0, bb.y0 - P), w = Math.min(W, bb.x1 + P + 1) - X, h = Math.min(H, bb.y1 + P + 1) - Y; const cc = document.createElement('canvas'); cc.width = w; cc.height = h; cc.getContext('2d').drawImage(c, X, Y, w, h, 0, 0, w, h); return { box: [X, Y, w, h], png: cc.toDataURL('image/png') }; });
  return out;
}, src);
r.forEach((s, i) => fs.writeFileSync(`${prefix}-${i}.png`, Buffer.from(s.png.split(',')[1], 'base64')));
fs.writeFileSync(`${prefix}.json`, JSON.stringify(r.map((s, i) => ({ i, box: s.box }))));
console.log(r.map((s, i) => `${i}: ${s.box.join(',')}`).join('\n'));
await b.close();
