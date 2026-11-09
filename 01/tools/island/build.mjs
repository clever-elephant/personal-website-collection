// 由 sprites/*.png + layout.json + 空场景图 生成:img/island/{sprites.webp, plate-day.webp, plate-night.webp, scene.json}
// 顺序:node key.mjs <表> sprites/a|b  →  node build.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';
import { fileURLToPath } from 'url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const OUT = ROOT + '/img/island';
const L = JSON.parse(fs.readFileSync('layout.json', 'utf8'));
const names = Object.keys(L.sprites);
const data = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const sprites = Object.fromEntries(names.map((n) => [n, data(`sprites/${L.sprites[n]}.png`)]));
const plates = { day: data(ROOT + '/concepts/plate-day.png'), night: data(ROOT + '/concepts/plate-night.png') };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage();
const r = await p.evaluate(async ({ sprites, plates, L, water }) => {
  const load = async (src) => { const i = new Image(); i.src = src; await i.decode(); return i; };
  const px = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height); };
  // 每种精灵:根部锚点、花头中心/宽度
  const info = {};
  for (const [n, src] of Object.entries(sprites)) {
    const img = await load(src), d = px(img), W = img.width, H = img.height, D = d.data;
    let bottom = 0; for (let y = H - 1; y >= 0 && !bottom; y--) for (let x = 0; x < W; x++) if (D[(y * W + x) * 4 + 3] > 128) { bottom = y; break; }
    let sx = 0, sn = 0; for (let y = Math.max(0, bottom - Math.round(H * .04)); y <= bottom; y++) for (let x = 0; x < W; x++) if (D[(y * W + x) * 4 + 3] > 128) { sx += x; sn++; }
    // 花头:非绿色像素
    let hx0 = W, hx1 = 0, hy0 = H, hy1 = 0, cx = 0, cy = 0, cn = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (D[k + 3] < 128 || y > bottom * 0.58) continue; const R = D[k], G = D[k + 1], B = D[k + 2]; if (G > R + 12 && G > B + 12) continue; cx += x; cy += y; cn++; if (x < hx0) hx0 = x; if (x > hx1) hx1 = x; if (y < hy0) hy0 = y; if (y > hy1) hy1 = y; }
    info[n] = { img, W, H, ax: sx / sn, ay: bottom + 1, head: cn ? [cx / cn, cy / cn, hx1 - hx0 + 1] : null };
  }
  // 实例:计算缩放与锚点
  const items = L.items.map((it, i) => {
    const s = info[it.s];
    let kx, ky, at;
    if (it.kind === 'flower' && it.head) { const k = it.hw / s.head[2]; kx = ky = k; at = [it.head[0] + (s.ax - s.head[0]) * k * (it.flip ? -1 : 1), it.head[1] + (s.ay - s.head[1]) * k]; }
    else { ky = it.h ? it.h / s.H : it.w / s.W; kx = it.w ? it.w / s.W : ky; at = it.at; }
    return { ...it, kx, ky, at };
  });
  // 图集:每种精灵按所需最大分辨率(2 倍)缩放后打包
  const need = {}; items.forEach((it) => { need[it.s] = Math.min(1, Math.max(need[it.s] || 0, Math.max(it.kx, it.ky) * 2)); });
  const AW = 2048; let cx = 2, cy = 2, rowH = 0; const pack = {};
  const order = Object.keys(need).sort((a, c) => info[c].H * need[c] - info[a].H * need[a]);
  for (const n of order) { const w = Math.ceil(info[n].W * need[n]), h = Math.ceil(info[n].H * need[n]); if (cx + w + 2 > AW) { cx = 2; cy += rowH + 4; rowH = 0; } pack[n] = [cx, cy, w, h]; cx += w + 4; rowH = Math.max(rowH, h); }
  const AH = Math.pow(2, Math.ceil(Math.log2(cy + rowH + 2)));
  const ac = document.createElement('canvas'); ac.width = AW; ac.height = AH; const ax = ac.getContext('2d'); ax.imageSmoothingQuality = 'high';
  for (const n of order) { const [x, y, w, h] = pack[n]; ax.drawImage(info[n].img, x, y, w, h); }
  // 夜间色调:空场景草地区域 夜/日 均值之比
  const pd = px(await load(plates.day)), pn = px(await load(plates.night));
  const m = [0, 0, 0], q = [0, 0, 0]; let cnt = 0;
  for (let y = 480; y < 760; y += 3) for (let x = 300; x < 1200; x += 3) { const k = (y * 1672 + x) * 4; if (!(pd.data[k + 1] > pd.data[k] + 20)) continue; for (let c = 0; c < 3; c++) { m[c] += pd.data[k + c]; q[c] += pn.data[k + c]; } cnt++; }
  const grade = m.map((v, c) => +(q[c] / v).toFixed(3));
  const toWebp = (img, qq) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c.toDataURL('image/webp', qq); };
  const scene = {
    atlas: [AW, AH], grade,
    items: items.map((it) => { const s = info[it.s], [u, v, w, h] = pack[it.s]; return { s: it.s, kind: it.kind, occ: it.occ || [], flip: !!it.flip,
      at: it.at.map((n) => +n.toFixed(1)), size: [+(s.W * it.kx).toFixed(1), +(s.H * it.ky).toFixed(1)], anchor: [+(s.ax / s.W).toFixed(4), +(s.ay / s.H).toFixed(4)], uv: [u, v, w, h] }; }),
  };
  // 栅栏遮挡掩码:写入海面遮罩的 B 通道(栅栏区域内非草地像素)
  const wimg = await load(water), wc = document.createElement('canvas'); wc.width = wimg.width; wc.height = wimg.height; const wx = wc.getContext('2d'); wx.drawImage(wimg, 0, 0);
  const wd = wx.getImageData(0, 0, wc.width, wc.height), sc = 1672 / wc.width;
  const full = document.createElement('canvas'); full.width = wc.width * 3; full.height = wc.height * 3;
  for (let y = 0; y < wc.height; y++) for (let x = 0; x < wc.width; x++) {
    const X = Math.round((x + .5) * sc), Y = Math.round((y + .5) * sc), k = (Y * 1672 + X) * 4, o = (y * wc.width + x) * 4;
    let f = 0;
    if (X >= 230 && X <= 362 && Y >= 448 && Y <= 532) { const R = pd.data[k], G = pd.data[k + 1], B = pd.data[k + 2]; f = (G > R + 12 && G > B + 12) ? 0 : 255; }
    wd.data[o + 2] = f;
  }
  wx.putImageData(wd, 0, 0);
  return { water: wc.toDataURL('image/png'), atlas: ac.toDataURL('image/webp', 0.9), day: toWebp(await load(plates.day), 0.88), night: toWebp(await load(plates.night), 0.88), scene };
}, { sprites, plates, L, water: data(OUT + '/water.png') });
const save = (f, u) => fs.writeFileSync(`${OUT}/${f}`, Buffer.from(u.split(',')[1], 'base64'));
save('sprites.webp', r.atlas); save('water.png', r.water); save('plate-day.webp', r.day); save('plate-night.webp', r.night);
fs.writeFileSync(`${OUT}/scene.json`, JSON.stringify(r.scene));
console.log('atlas', r.scene.atlas, 'grade', r.scene.grade, 'items', r.scene.items.length);
await b.close();
